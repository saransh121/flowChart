import { useCallback, useEffect, useRef, useState } from "react";
import { ReactFlow, ReactFlowProvider, Background, Controls, MiniMap, useNodesState, useEdgesState, useReactFlow, addEdge, getNodesBounds, getViewportForBounds } from "@xyflow/react";
import { toPng } from "html-to-image";
import "@xyflow/react/dist/style.css";
import EditableNode from "./EditableNode.jsx";
import CloudModal from "./CloudModal.jsx";
import { layout } from "./layout.js";
import { parsePartial } from "./partialJson.js";
import logo from "./logo.svg";

const nodeTypes = { editable: EditableNode };
const llm = window.llm;
export const cleanErr = e => String(e?.message || e).replace(/^Error invoking remote method '[^']+': /, "").replace(/^Error: /, "");
const MODES = [["auto", "Auto"], ["mindmap", "Mind map"], ["flowchart", "Flowchart"]];
const EXPORTS = [["png", "PNG image"], ["pdf", "PDF"], ["pptx", "PowerPoint"], ["docx", "Word"]];
const LEGEND = [["start", "Start / End"], ["process", "Step"], ["decision", "Decision"], ["root", "Root"], ["branch", "Branch"]];

function Editor() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("auto");
  const [status, setStatus] = useState({ loading: true, engine: "local" });
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [diagramType, setDiagramType] = useState("");
  const [showCloud, setShowCloud] = useState(false);
  const [exporting, setExporting] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { getNodes, screenToFlowPosition } = useReactFlow();
  const stream = useRef({ text: "", laidOut: 0, pending: false });

  useEffect(() => llm?.onStatus(s => setStatus(prev => ({ ...prev, ...s }))), []);

  const render = useCallback(async d => {
    setTitle(d.title || ""); setDiagramType(d.type);
    const l = await layout(d);
    setNodes(l.nodes); setEdges(l.edges);
  }, [setNodes, setEdges]);

  // progressive render: relayout whenever a new complete node arrived, one layout in flight at a time
  useEffect(() => llm?.onChunk(async t => {
    const s = stream.current; s.text += t;
    if (s.pending) return;
    const d = parsePartial(s.text);
    const n = d?.nodes?.length || 0;
    if (!d || n === s.laidOut) return;
    s.pending = true; s.laidOut = n;
    try { await render(d); } finally { s.pending = false; }
  }), [render]);

  const generate = useCallback(async (type = mode) => {
    if (!prompt.trim() || busy) return;
    setBusy(true); setStatus(s => ({ ...s, error: "" })); stream.current = { text: "", laidOut: 0, pending: false };
    try { await render(await llm.generate(prompt, type)); }
    catch (e) { if (!/abort/i.test(String(e))) setStatus(s => ({ ...s, error: cleanErr(e) })); }
    finally { setBusy(false); }
  }, [prompt, busy, mode, render]);

  const switchMode = m => { setMode(m); if (m !== "auto" && nodes.length && m !== diagramType) generate(m); };

  const addNode = () => {
    const id = `n${Date.now().toString(36)}`;
    const position = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const shape = diagramType === "mindmap" ? "branch" : "process";
    setNodes(ns => [...ns, { id, type: "editable", position, style: { width: 140, height: 46 }, data: { label: "New node", shape }, selected: true }]);
  };

  const exportAs = async format => {
    const ns = getNodes(); if (!ns.length) return;
    setExporting(format);
    try {
      const b = getNodesBounds(ns), width = Math.ceil(b.width + 80), height = Math.ceil(b.height + 80);
      const vp = getViewportForBounds(b, width, height, 0.5, 2, 40);
      const png = await toPng(document.querySelector(".react-flow__viewport"), { backgroundColor: "#111318", width, height, pixelRatio: 2,
        style: { width: `${width}px`, height: `${height}px`, transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})` } });
      await llm.export(format, { png, width, height, title });
    } catch (e) { setStatus(s => ({ ...s, error: "Export failed: " + cleanErr(e) })); }
    finally { setExporting(""); }
  };

  const onConnect = useCallback(c => setEdges(es => addEdge({ ...c, type: "smoothstep", markerEnd: { type: "arrowclosed" } }, es)), [setEdges]);
  const isCloud = status.engine === "cloud";
  const ready = isCloud || status.localReady;
  const engineText = isCloud ? `☁ ${status.cloudName}` : status.localError ? status.localError : status.localReady ? `${status.name} · ${status.gpu || "cpu"} · offline` : status.downloading ? `downloading offline model ${Math.round(status.progress * 100)}% (1.1 GB, one time)` : status.progress ? `loading local model ${Math.round(status.progress * 100)}%` : "loading local model…";

  return (
    <div className="app">
      <aside>
        <h1><img src={logo} alt="" className="logo" /> flowChart</h1>
        <div className="seg">{MODES.map(([k, l]) => <button key={k} className={mode === k ? "on" : ""} onClick={() => switchMode(k)}>{l}</button>)}</div>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe a process or a topic…"
          onKeyDown={e => e.key === "Enter" && (e.ctrlKey || e.metaKey) && generate()} />
        {busy ? <button className="primary" onClick={() => llm.cancel()}>Stop</button>
              : <button className="primary" onClick={() => generate()} disabled={!ready || !prompt.trim()}>Generate (Ctrl+Enter)</button>}
        <p className={status.localError && !isCloud ? "err" : "muted"}>{engineText}</p>
        <button className="ghost" onClick={() => setShowCloud(true)}>✨ Build better with your own model</button>
        {status.error && <p className="err">{status.error}</p>}
        {title && <h2>{title}</h2>}
        <div className="row">
          <button className="ghost" onClick={addNode} disabled={!nodes.length}>+ Add node</button>
          <select className="ghost" value="" disabled={!nodes.length || !!exporting} onChange={e => e.target.value && exportAs(e.target.value)}>
            <option value="">{exporting ? "Exporting…" : "Export as…"}</option>
            {EXPORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div className="legend">{LEGEND.map(([k, l]) => <span key={k}><i className={`node ${k}`} />{l}</span>)}</div>
        <p className="muted small">Select a node to change its shape · double-click to rename · drag from a handle to connect · Delete removes selection</p>
      </aside>
      <main>
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
          fitView colorMode="dark" deleteKeyCode={["Delete", "Backspace"]} proOptions={{ hideAttribution: true }}>
          <Background /><Controls /><MiniMap pannable />
        </ReactFlow>
      </main>
      {showCloud && <CloudModal onClose={saved => { setShowCloud(false); if (saved && prompt.trim()) generate(); }} />}
    </div>
  );
}

export default function App() { return <ReactFlowProvider><Editor /></ReactFlowProvider>; }
