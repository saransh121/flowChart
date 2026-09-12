// Offline LLM: loads the largest .gguf in the models dir, emits grammar-constrained compact JSON diagrams.
import { getLlama, LlamaChatSession, QwenChatWrapper } from "node-llama-cpp";
import { getGbnfGrammarForGbnfJsonSchema } from "../node_modules/node-llama-cpp/dist/utils/gbnfJson/getGbnfGrammarForGbnfJsonSchema.js";
import { readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";

const str = { type: "string" };
const mindmap = { type: "object", properties: { type: { const: "mindmap" }, title: str,
  nodes: { type: "array", items: { type: "object", properties: { id: str, label: str, parent: str }, required: ["id", "label", "parent"] } } },
  required: ["type", "title", "nodes"] };
const flowchart = { type: "object", properties: { type: { const: "flowchart" }, title: str,
  nodes: { type: "array", items: { type: "object", properties: { id: str, label: str, shape: { enum: ["start", "end", "process", "decision"] } }, required: ["id", "label", "shape"] } },
  edges: { type: "array", items: { type: "object", properties: { from: str, to: str, label: str }, required: ["from", "to"] } } },
  required: ["type", "title", "nodes", "edges"] };
export const schemas = { auto: { oneOf: [mindmap, flowchart] }, mindmap, flowchart };

export const system = `You convert the user's request into a diagram as compact JSON.
First decide the type: "flowchart" for anything that is a process, procedure, algorithm, pipeline, workflow, steps, or decisions. "mindmap" for topics, ideas, concepts, plans, brainstorms, hierarchies. If the user names a type, use it.
mindmap: one root node with parent "", 3-6 branches under the root, 2-4 children under each branch. No other structure.
flowchart: one "start" and one "end" node, "process" steps, "decision" nodes phrased as questions with two outgoing edges labeled "yes" and "no". 6-15 nodes. Every node must be connected. Edge labels only on decision edges.
ids: n1, n2, ... Labels: 1-5 words. Output JSON only.

Example request: How to make tea
{"type":"flowchart","title":"Making Tea","nodes":[{"id":"n1","label":"Start","shape":"start"},{"id":"n2","label":"Boil water","shape":"process"},{"id":"n3","label":"Put tea bag in cup","shape":"process"},{"id":"n4","label":"Pour water","shape":"process"},{"id":"n5","label":"Want milk?","shape":"decision"},{"id":"n6","label":"Add milk","shape":"process"},{"id":"n7","label":"End","shape":"end"}],"edges":[{"from":"n1","to":"n2"},{"from":"n2","to":"n3"},{"from":"n3","to":"n4"},{"from":"n4","to":"n5"},{"from":"n5","to":"n6","label":"yes"},{"from":"n5","to":"n7","label":"no"},{"from":"n6","to":"n7"}]}

Example request: Things to consider when buying a laptop
{"type":"mindmap","title":"Buying a Laptop","nodes":[{"id":"n1","label":"Buying a Laptop","parent":""},{"id":"n2","label":"Budget","parent":"n1"},{"id":"n3","label":"Under $500","parent":"n2"},{"id":"n4","label":"Premium","parent":"n2"},{"id":"n5","label":"Performance","parent":"n1"},{"id":"n6","label":"CPU","parent":"n5"},{"id":"n7","label":"RAM","parent":"n5"},{"id":"n8","label":"Portability","parent":"n1"},{"id":"n9","label":"Weight","parent":"n8"},{"id":"n10","label":"Battery life","parent":"n8"}]}`;

let llama, model, ctx, session, current;
const grammars = {};

export function findModel(dirs) {
  const files = dirs.flatMap(d => { try { return readdirSync(d).filter(f => f.endsWith(".gguf")).map(f => join(d, f)); } catch { return []; } });
  return files.sort((a, b) => statSync(b).size - statSync(a).size)[0]; // ponytail: biggest gguf wins, add a picker when there are flavors
}

export async function load(modelPath, onProgress) {
  llama ??= await getLlama();
  model = await llama.loadModel({ modelPath, onLoadProgress: onProgress });
  ctx = await model.createContext({ contextSize: 2048 });
  for (const [k, s] of Object.entries(schemas)) {
    // compact JSON (no indent/newlines) and strip the lib's trailing newline rule that small models loop on
    const gbnf = getGbnfGrammarForGbnfJsonSchema(s, { allowNewLines: false, scopePadSpaces: 0 }).replace(/ "\\n\\n\\n\\n" \[\\n\]\*/, "");
    if (/\\n\\n\\n\\n/.test(gbnf)) throw new Error("grammar tail not stripped, node-llama-cpp output changed");
    grammars[k] = await llama.createGrammar({ grammar: gbnf });
  }
  session = new LlamaChatSession({ contextSequence: ctx.getSequence(), systemPrompt: system,
    ...(/qwen/i.test(basename(modelPath)) ? { chatWrapper: new QwenChatWrapper({ thoughts: "discourage" }) } : {}) });
  return { name: basename(modelPath), gpu: llama.gpu };
}

export const ready = () => !!session;

export async function generate(prompt, { type = "auto", onChunk } = {}) {
  if (!session) throw new Error("No local model loaded");
  cancel();
  const ac = current = new AbortController();
  session.resetChatHistory();
  const p = type === "auto" ? prompt : `Diagram type: ${type}.\n\n${prompt}`;
  const text = await session.prompt(p, { grammar: grammars[type] || grammars.auto, maxTokens: 1500, temperature: 0.2, signal: ac.signal, stopOnAbortSignal: true, onTextChunk: onChunk });
  return JSON.parse(text);
}

export function cancel() { current?.abort(); current = null; }
