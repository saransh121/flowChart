import { useEffect, useState } from "react";
import { cleanErr } from "./App.jsx";
const llm = window.llm;

// IntelliJ-style settings dialog: label column, inputs, inline test result, Cancel / Apply / OK
export default function CloudModal({ onClose }) {
  const [providers, setProviders] = useState({});
  const [s, setS] = useState(null);       // settings being edited
  const [key, setKey] = useState("");     // new key typed this session ("" = keep stored)
  const [showKey, setShowKey] = useState(false);
  const [test, setTest] = useState(null); // { ok, msg } | "busy"
  const [models, setModels] = useState(null); // live list from provider, null = use static suggestions
  const [listing, setListing] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { Promise.all([llm.providers(), llm.getSettings()]).then(([p, st]) => { setProviders(p); setS(st); }); }, []);
  useEffect(() => { const h = e => e.key === "Escape" && onClose(false); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);
  if (!s) return null;

  const set = patch => { setS(x => ({ ...x, ...patch })); setDirty(true); setTest(null); };
  const pick = provider => { set({ provider, model: providers[provider]?.models[0] || "" }); setModels(null); };
  const payload = () => ({ engine: s.engine, provider: s.provider, model: s.model, baseUrl: s.baseUrl || "", ...(key ? { apiKey: key } : {}) });
  const hasCreds = s.engine === "cloud" && (key || s.hasKey) && (s.provider !== "custom" || s.baseUrl);
  const suggestions = models || providers[s.provider]?.models || [];
  const runTest = async () => {
    setTest("busy");
    try { setTest({ ok: true, msg: `Connected · replied "${await llm.testCloud(payload())}"` }); }
    catch (e) { setTest({ ok: false, msg: cleanErr(e) }); }
  };
  const fetchModels = async () => {
    setListing(true);
    try { const list = await llm.listModels(payload()); setModels(list); setTest({ ok: true, msg: `${list.length} models available` }); if (list.length && !list.includes(s.model)) set({ model: list.find(m => /pro|opus|gpt-5|sonnet/.test(m)) || list[0] }); }
    catch (e) { setTest({ ok: false, msg: cleanErr(e) }); }
    finally { setListing(false); }
  };
  const apply = async () => { const st = await llm.setSettings(payload()); setS(st); setKey(""); setDirty(false); return st; };

  return (
    <div className="backdrop" onMouseDown={e => e.target === e.currentTarget && onClose(false)}>
      <div className="dialog" role="dialog" aria-label="Model settings">
        <header>Build better with your own model</header>
        <p className="muted small">Cloud models produce richer, more accurate diagrams. Your key is stored encrypted on this machine and only sent to the provider you pick.</p>
        <div className="form">
          <label>Engine</label>
          <div className="radios">
            <label><input type="radio" checked={s.engine !== "cloud"} onChange={() => set({ engine: "local" })} /> Offline model (bundled, private)</label>
            <label><input type="radio" checked={s.engine === "cloud"} onChange={() => set({ engine: "cloud" })} /> Cloud model with my API key</label>
          </div>
          <fieldset disabled={s.engine !== "cloud"}>
            <label>Provider</label>
            <select value={s.provider} onChange={e => pick(e.target.value)}>
              {Object.entries(providers).map(([k, p]) => <option key={k} value={k}>{p.name}</option>)}
            </select>
            {s.provider === "custom" && <>
              <label>Base URL</label>
              <input value={s.baseUrl || ""} placeholder="https://host/v1" onChange={e => set({ baseUrl: e.target.value })} />
            </>}
            <label>API key</label>
            <div className="keyrow">
              <input type={showKey ? "text" : "password"} value={key} onChange={e => { setKey(e.target.value); setDirty(true); setTest(null); }}
                placeholder={s.hasKey ? `•••••••••••• saved (…${s.keyHint})` : "paste your API key"} autoComplete="off" spellCheck={false} />
              <button type="button" className="ghost icon" title={showKey ? "Hide" : "Show"} onClick={() => setShowKey(v => !v)}>{showKey ? "🙈" : "👁"}</button>
            </div>
            <label>Model</label>
            <div className="keyrow">
              <input list="models" value={s.model || ""} onChange={e => set({ model: e.target.value })} placeholder="model id" />
              <button type="button" className="ghost" disabled={!hasCreds || listing} title="Fetch the current model list from the provider" onClick={fetchModels}>{listing ? "…" : "↻ List"}</button>
              <button type="button" className="ghost" disabled={!hasCreds || !s.model || test === "busy"} onClick={runTest}>{test === "busy" ? "Testing…" : "Test"}</button>
            </div>
            <datalist id="models">{suggestions.map(m => <option key={m} value={m} />)}</datalist>
            <span />
            <div className={`testmsg ${test && test !== "busy" ? (test.ok ? "ok" : "bad") : ""}`}>{test && test !== "busy" ? (test.ok ? "✓ " : "✕ ") + test.msg : ""}</div>
          </fieldset>
        </div>
        <footer>
          <button className="ghost" onClick={() => onClose(false)}>Cancel</button>
          <button className="ghost" disabled={!dirty} onClick={apply}>Apply</button>
          <button className="primary" onClick={async () => { await apply(); onClose(true); }}>OK</button>
        </footer>
      </div>
    </div>
  );
}
