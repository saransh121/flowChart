const { contextBridge, ipcRenderer } = require("electron");
const on = ch => cb => { const h = (_, v) => cb(v); ipcRenderer.on(ch, h); return () => ipcRenderer.off(ch, h); };
contextBridge.exposeInMainWorld("llm", {
  generate: (prompt, type) => ipcRenderer.invoke("generate", prompt, type),
  cancel: () => ipcRenderer.invoke("cancel"),
  export: (format, payload) => ipcRenderer.invoke("export", format, payload),
  providers: () => ipcRenderer.invoke("providers"),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  setSettings: s => ipcRenderer.invoke("settings:set", s),
  testCloud: cfg => ipcRenderer.invoke("cloud:test", cfg),
  listModels: cfg => ipcRenderer.invoke("cloud:models", cfg),
  onChunk: on("chunk"),
  onStatus: on("status"),
});
