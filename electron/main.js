import { app, BrowserWindow, ipcMain, safeStorage, shell } from "electron";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { open } from "node:fs/promises";
import * as llm from "./llm.js";
import * as cloud from "./cloud.js";
import { exportDiagram } from "./export.js";

const here = dirname(fileURLToPath(import.meta.url));
const modelDirs = [process.env.FLOWCHART_MODELS, join(app.getPath("userData"), "models"), join(app.isPackaged ? process.resourcesPath : app.getAppPath(), "models")].filter(Boolean);
const settingsPath = join(app.getPath("userData"), "settings.json");

// settings: { engine: "local"|"cloud", provider, model, baseUrl, apiKey (encrypted, base64) }
const readSettings = () => { try { return JSON.parse(readFileSync(settingsPath, "utf8")); } catch { return { engine: "local", provider: "anthropic", model: "claude-opus-5" }; } };
const decrypt = s => s.apiKey && safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(Buffer.from(s.apiKey, "base64")) : "";
const publicSettings = s => ({ ...s, apiKey: undefined, hasKey: !!s.apiKey, keyHint: s.keyHint || "" });
let cloudAbort;

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1280, height: 820, backgroundColor: "#111318", icon: join(here, "../build/icon.png"), webPreferences: { preload: join(here, "preload.cjs") } });
  const send = (ch, v) => { if (ch === "status" && !v.progress) console.log("[status]", v); if (!win.isDestroyed()) win.webContents.send(ch, v); };
  if (app.isPackaged) win.loadFile(join(here, "../dist/index.html"));
  else { win.loadURL("http://localhost:5173"); win.webContents.on("console-message", e => e.level !== "info" && console.log("[renderer]", e.message)); }
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });

  ipcMain.handle("generate", (e, prompt, type) => {
    const s = readSettings();
    if (s.engine !== "cloud") return llm.generate(prompt, { type, onChunk: t => send("chunk", t) });
    cloudAbort?.abort(); cloudAbort = new AbortController();
    return cloud.generate({ ...s, apiKey: decrypt(s) }, prompt, type, t => send("chunk", t), cloudAbort.signal);
  });
  ipcMain.handle("cancel", () => { llm.cancel(); cloudAbort?.abort(); });
  ipcMain.handle("export", (e, format, payload) => exportDiagram(win, format, payload));
  ipcMain.handle("providers", () => cloud.providers);
  ipcMain.handle("settings:get", () => publicSettings(readSettings()));
  ipcMain.handle("settings:set", (e, next) => {
    const prev = readSettings();
    const s = { ...prev, ...next };
    if (typeof next.apiKey === "string") { // new key typed: encrypt; empty string clears
      s.apiKey = next.apiKey && safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(next.apiKey).toString("base64") : "";
      s.keyHint = next.apiKey ? next.apiKey.slice(-4) : "";
    }
    writeFileSync(settingsPath, JSON.stringify(s));
    send("status", { engine: s.engine, cloudName: `${cloud.providers[s.provider]?.name} · ${s.model}` });
    return publicSettings(s);
  });
  const withKey = cfg => ({ ...cfg, apiKey: typeof cfg.apiKey === "string" && cfg.apiKey ? cfg.apiKey : decrypt(readSettings()) });
  ipcMain.handle("cloud:test", (e, cfg) => cloud.test(withKey(cfg)));
  ipcMain.handle("cloud:models", (e, cfg) => cloud.listModels(withKey(cfg)));

  const s = readSettings();
  send("status", { engine: s.engine, cloudName: `${cloud.providers[s.provider]?.name} · ${s.model}` });
  try {
    // first run: fetch the default model once into userData/models (installer stays small; drop any .gguf there to override)
    const modelPath = llm.findModel(modelDirs) || await downloadModel(modelDirs[modelDirs.length - 2], p => send("status", { downloading: true, progress: p }));
    send("status", { loading: true, downloading: false });
    send("status", { localReady: true, ...(await llm.load(modelPath, p => send("status", { loading: true, progress: p }))) });
  } catch (err) { send("status", { downloading: false, localError: `${err.message || err}. Or put a .gguf model in ${modelDirs[modelDirs.length - 2]}` }); }
});

const MODEL_URL = "https://huggingface.co/unsloth/Qwen3-1.7B-GGUF/resolve/main/Qwen3-1.7B-Q4_K_M.gguf";
async function downloadModel(dir, onProgress) {
  mkdirSync(dir, { recursive: true });
  const dest = join(dir, MODEL_URL.split("/").pop()), part = dest + ".part";
  const res = await fetch(MODEL_URL);
  if (!res.ok) throw new Error(`Model download failed (${res.status})`);
  const total = +res.headers.get("content-length") || 0;
  let done = 0, last = 0;
  const fh = await open(part, "w");
  try { for await (const chunk of res.body) { await fh.write(chunk); done += chunk.length; if (done - last > 5e6) { last = done; onProgress(total ? done / total : 0); } } }
  finally { await fh.close(); }
  renameSync(part, dest);
  return dest;
}
app.on("window-all-closed", () => app.quit());
