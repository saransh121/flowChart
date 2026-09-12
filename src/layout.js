import ELK from "elkjs/lib/elk.bundled.js";
const elk = new ELK();

// diagram JSON (possibly partial) -> React Flow nodes/edges with elk positions
export async function layout(d) {
  const mm = d.type === "mindmap";
  const seen = new Set();
  const nodes = (d.nodes || []).filter(n => n.id && n.label && !seen.has(n.id) && seen.add(n.id));
  const ids = new Set(nodes.map(n => n.id));
  const edges = mm
    ? nodes.filter(n => n.parent && ids.has(n.parent) && n.parent !== n.id).map(n => ({ id: `e-${n.parent}-${n.id}`, source: n.parent, target: n.id, sourceHandle: "r", targetHandle: "l" }))
    : (d.edges || []).filter(e => ids.has(e.from) && ids.has(e.to)).map((e, i) => ({ id: `e${i}`, source: e.from, target: e.to, label: e.label, markerEnd: { type: "arrowclosed" } }));
  const size = n => ({ width: Math.max(110, Math.min(260, n.label.length * 8 + 40)), height: n.shape === "decision" ? 90 : 46 });
  const g = await elk.layout({
    id: "root",
    layoutOptions: { "elk.algorithm": mm ? "mrtree" : "layered", "elk.direction": mm ? "RIGHT" : "DOWN", "elk.spacing.nodeNode": "28", "elk.layered.spacing.nodeNodeBetweenLayers": "70", "elk.mrtree.spacing.nodeNode": "40" },
    children: nodes.map(n => ({ id: n.id, ...size(n) })),
    edges: edges.map(e => ({ id: e.id, sources: [e.source], targets: [e.target] })),
  });
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  return {
    nodes: g.children.map(c => ({ id: c.id, type: "editable", position: { x: c.x, y: c.y }, style: { width: c.width, height: c.height },
      data: { label: byId[c.id].label, shape: mm ? (byId[c.id].parent ? "branch" : "root") : byId[c.id].shape } })),
    edges: edges.map(e => ({ ...e, type: "smoothstep" })),
  };
}
