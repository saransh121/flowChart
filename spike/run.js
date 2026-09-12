// Phase 1 spike: Qwen3 0.6B vs 1.7B, JSON-schema constrained diagram generation on CPU/iGPU.
// usage: [GPU=off] node spike/run.js models/Qwen3-1.7B-Q4_K_M.gguf [maxPrompts]
import { getLlama, LlamaChatSession, QwenChatWrapper } from "node-llama-cpp";
import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { getGbnfGrammarForGbnfJsonSchema } from "../node_modules/node-llama-cpp/dist/utils/gbnfJson/getGbnfGrammarForGbnfJsonSchema.js";

const [modelPath, limit = "20"] = process.argv.slice(2);
const prompts = JSON.parse(readFileSync(new URL("./prompts.json", import.meta.url))).slice(0, +limit);

const schema = {
  type: "object",
  properties: {
    type: { enum: ["mindmap", "flowchart"] },
    title: { type: "string" },
    nodes: { type: "array", items: { type: "object", properties: {
      id: { type: "string" }, label: { type: "string" },
      parent: { type: "string" },                       // mindmap: parent id ("" for root)
      shape: { enum: ["process", "decision", "start", "end"] } // flowchart
    }, required: ["id", "label"] } },
    edges: { type: "array", items: { type: "object", properties: {
      from: { type: "string" }, to: { type: "string" }, label: { type: "string" }
    }, required: ["from", "to"] } }
  },
  required: ["type", "title", "nodes", "edges"]
};

const system = `You convert the user's request into a diagram as JSON.
Pick type "mindmap" for topics/ideas/hierarchies, "flowchart" for processes/steps/decisions.
mindmap: every node has "parent" (the root has parent ""), edges is []. 3-6 top-level branches, 2-4 children each.
flowchart: nodes have "shape" (start/end/process/decision); edges connect ids; decision edges are labeled "yes"/"no". 6-15 nodes.
ids are short like n1, n2. Labels are short (1-5 words). Output JSON only.`;

function validate(d) {
  const ids = new Set(d.nodes.map(n => n.id));
  if (ids.size !== d.nodes.length || ids.size < 3) return "dup/few ids";
  if (d.type === "mindmap") {
    const roots = d.nodes.filter(n => !n.parent);
    if (roots.length !== 1) return `roots=${roots.length}`;
    if (d.nodes.some(n => n.parent && !ids.has(n.parent))) return "orphan parent";
    if (d.nodes.some(n => n.parent === n.id)) return "self parent";
  } else {
    if (d.edges.length < 2) return "few edges";
    if (d.edges.some(e => !ids.has(e.from) || !ids.has(e.to))) return "dangling edge";
    const touched = new Set(d.edges.flatMap(e => [e.from, e.to]));
    if (d.nodes.some(n => !touched.has(n.id))) return "isolated node";
  }
  return "ok";
}

const llama = await getLlama({ gpu: process.env.GPU === "off" ? false : "auto" });
let t = performance.now();
const model = await llama.loadModel({ modelPath });
const ctx = await model.createContext({ contextSize: 2048 });
// compact JSON: no newlines/indent, ~2x fewer tokens than the default pretty-printed grammar
// also strip the trailing "\n\n\n\n" [\n]* the lib appends: small models loop on newlines until maxTokens
const gbnf = getGbnfGrammarForGbnfJsonSchema(schema, { allowNewLines: false, scopePadSpaces: 0 }).replace(/ "\\n\\n\\n\\n" \[\\n\]\*/, "");
if (/\\n\\n\\n\\n/.test(gbnf)) throw new Error("grammar tail not stripped");
const grammar = await llama.createGrammar({ grammar: gbnf });
const session = new LlamaChatSession({ contextSequence: ctx.getSequence(), systemPrompt: system,
  chatWrapper: new QwenChatWrapper({ thoughts: "discourage" }) });
const loadMs = Math.round(performance.now() - t);
console.log(`${basename(modelPath)} gpu=${llama.gpu} load=${loadMs}ms`);

const results = [];
for (const p of prompts) {
  session.resetChatHistory();
  let first = 0, tokens = 0; t = performance.now();
  const text = await session.prompt(p, { grammar, maxTokens: 1200, temperature: 0,
    onTextChunk: () => { tokens++; if (!first) first = performance.now() - t; } });
  const total = performance.now() - t;
  let status, out = null;
  try { out = JSON.parse(text); status = validate(out); }
  catch (e) { status = "parse: " + e.message.slice(0, 40); console.log("RAW>", text.slice(0, 300), "...", text.slice(-150)); }
  const r = { prompt: p, status, type: out?.type, nodes: out?.nodes.length, edges: out?.edges.length,
    firstMs: Math.round(first), tokPerSec: +(tokens / (total / 1000)).toFixed(1), totalS: +(total / 1000).toFixed(1), out, chars: text.length, tokens, raw: out ? undefined : text };
  results.push(r);
  console.log(`${status.padEnd(14)} ${String(r.type).padEnd(9)} n=${String(r.nodes).padEnd(3)} e=${String(r.edges).padEnd(3)} ttft=${r.firstMs}ms ${r.tokPerSec}tok/s ${r.totalS}s | ${p.slice(0, 50)}`);
}
const ok = results.filter(r => r.status === "ok").length;
const avg = k => (results.reduce((s, r) => s + r[k], 0) / results.length).toFixed(1);
console.log(`\nSUMMARY ${basename(modelPath)} gpu=${llama.gpu}: valid ${ok}/${results.length}, avg ${avg("tokPerSec")} tok/s, avg ${avg("totalS")}s, avg ttft ${avg("firstMs")}ms`);
writeFileSync(`spike/results-${basename(modelPath, ".gguf")}${llama.gpu ? "" : "-cpu"}.json`, JSON.stringify(results, null, 1));
