// Spike 2: models emit Mermaid directly (no grammar). usage: node spike/mermaid.js models/X.gguf [maxPrompts]
import { getLlama, LlamaChatSession, QwenChatWrapper } from "node-llama-cpp";
import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const [modelPath, limit = "20"] = process.argv.slice(2);
const prompts = JSON.parse(readFileSync(new URL("./prompts.json", import.meta.url))).slice(0, +limit);
const isQwen = /qwen/i.test(modelPath);

const system = `Convert the user's request into a Mermaid diagram. Use "mindmap" for topics/ideas/hierarchies (indented outline, one root, 3-6 branches with 2-4 children each). Use "flowchart TD" for processes/steps/decisions (6-15 nodes, decisions as {text} with |yes|/|no| edges, start/end as ([text])). Short labels. Output only the Mermaid code, no fences, no prose.`;

// ponytail: regex subset check, not a real Mermaid parser. Enough to score validity in the spike.
function validate(txt) {
  const t = txt.replace(/```(mermaid)?/g, "").trim();
  const lines = t.split("\n").map(l => l.trimEnd().replace(/;$/, "")).filter(Boolean);
  const head = (lines[0] || "").trim();
  if (/^mindmap$/i.test(head)) {
    const nodes = lines.slice(1);
    const roots = nodes.filter(l => /^\s{0,2}\S/.test(l));
    return { type: "mindmap", nodes: nodes.length, edges: 0, status: nodes.length < 3 ? "few nodes" : roots.length !== 1 ? `roots=${roots.length}` : "ok" };
  }
  if (/^(flowchart|graph)\s+(TD|TB|LR|RL|BT)$/i.test(head)) {
    const edges = lines.slice(1).filter(l => /-->|---|-\.->|==>/.test(l));
    const ids = new Set(lines.slice(1).flatMap(l => l.match(/\b[A-Za-z_][A-Za-z0-9_]*(?=\s*(\[|\(|\{|-->|$))/g) || []));
    const bad = lines.slice(1).some(l => /^\s*\w+\s*(-->|---)\s*$/.test(l));
    return { type: "flowchart", nodes: ids.size, edges: edges.length, status: edges.length < 2 ? "few edges" : bad ? "dangling edge" : "ok" };
  }
  return { type: head.slice(0, 15), nodes: 0, edges: 0, status: "bad header" };
}

const llama = await getLlama();
let t = performance.now();
const model = await llama.loadModel({ modelPath });
const ctx = await model.createContext({ contextSize: 2048 });
const session = new LlamaChatSession({ contextSequence: ctx.getSequence(), systemPrompt: system,
  ...(isQwen ? { chatWrapper: new QwenChatWrapper({ thoughts: "discourage" }) } : {}) });
console.log(`${basename(modelPath)} gpu=${llama.gpu} load=${Math.round(performance.now() - t)}ms`);

const results = [];
for (const p of prompts) {
  session.resetChatHistory();
  let first = 0, tokens = 0; t = performance.now();
  const text = await session.prompt(p, { maxTokens: 600, temperature: 0,
    onTextChunk: () => { tokens++; if (!first) first = performance.now() - t; } });
  const total = performance.now() - t;
  const v = validate(text);
  const r = { prompt: p, ...v, firstMs: Math.round(first), tokPerSec: +(tokens / (total / 1000)).toFixed(1), totalS: +(total / 1000).toFixed(1), tokens, text };
  results.push(r);
  console.log(`${v.status.padEnd(14)} ${String(v.type).padEnd(9)} n=${String(v.nodes).padEnd(3)} e=${String(v.edges).padEnd(3)} ttft=${r.firstMs}ms ${r.tokPerSec}tok/s ${r.totalS}s | ${p.slice(0, 50)}`);
}
const ok = results.filter(r => r.status === "ok").length;
const avg = k => (results.reduce((s, r) => s + r[k], 0) / results.length).toFixed(1);
console.log(`\nSUMMARY mermaid ${basename(modelPath)} gpu=${llama.gpu}: valid ${ok}/${results.length}, avg ${avg("tokPerSec")} tok/s, avg ${avg("totalS")}s, avg ttft ${avg("firstMs")}ms`);
writeFileSync(`spike/results-mermaid-${basename(modelPath, ".gguf")}.json`, JSON.stringify(results, null, 1));
