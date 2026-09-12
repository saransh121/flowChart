import { useState } from "react";
import { Handle, NodeToolbar, Position, useReactFlow } from "@xyflow/react";

const FLOW = [["start", "Start"], ["process", "Step"], ["decision", "Decision"], ["end", "End"]];
const MIND = [["root", "Root"], ["branch", "Branch"]];

export default function EditableNode({ id, data, selected }) {
  const [editing, setEditing] = useState(false);
  const { updateNodeData } = useReactFlow();
  const commit = e => { updateNodeData(id, { label: e.target.value }); setEditing(false); };
  const shapes = data.shape === "root" || data.shape === "branch" ? MIND : FLOW;
  return (
    <div className={`node ${data.shape || ""}`} onDoubleClick={() => setEditing(true)}>
      <NodeToolbar isVisible={selected && !editing} position={Position.Top} className="toolbar">
        {shapes.map(([k, l]) => <button key={k} className={data.shape === k ? "on" : ""} onClick={() => updateNodeData(id, { shape: k })}>{l}</button>)}
        <button onClick={() => setEditing(true)}>Rename</button>
      </NodeToolbar>
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} id="l" />
      {editing
        ? <input className="nodrag" autoFocus defaultValue={data.label} onBlur={commit} onKeyDown={e => e.key === "Enter" && commit(e)} />
        : <span>{data.label}</span>}
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="r" />
    </div>
  );
}
