// smoke: electron/llm.js outside Electron on the prompts the spike misclassified. node spike/llmcheck.js
import { findModel, load, generate } from "../electron/llm.js";
const prompts = [
  "Order fulfillment process for an ecommerce store, including out of stock handling",
  "CI/CD pipeline: commit, test, build, deploy to staging, manual approval, deploy to prod, with failure paths",
  "Process for handling a customer support ticket from creation to closure",
  "How does a bill become law in the United States",
  "Mind map of renewable energy sources and their pros/cons",
  "Brainstorm features for a habit tracking mobile app",
];
const p = findModel(["models"]);
console.log(await load(p));
for (const q of prompts) {
  let n = 0; const t = performance.now();
  const out = await generate(q, () => n++);
  const s = ((performance.now() - t) / 1000).toFixed(1);
  const tree = out.type === "mindmap" ? ` depth=${Math.max(...out.nodes.map(x => { let d = 0, c = x; while (c?.parent) { d++; c = out.nodes.find(y => y.id === c.parent); if (d > 20) break; } return d; }))}` : ` edges=${out.edges.length} decisions=${out.nodes.filter(x => x.shape === "decision").length}`;
  console.log(`${out.type.padEnd(9)} n=${out.nodes.length}${tree} ${n}tok ${s}s | ${q.slice(0, 55)}`);
  console.log("   " + out.nodes.map(x => x.label).join(" / ").slice(0, 220));
}
process.exit(0);
