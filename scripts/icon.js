// Rasterize src/logo.svg -> build/icon.png (512px) using Electron itself. `npm run icon`
import { app, BrowserWindow } from "electron";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
const svg = readFileSync(new URL("../src/logo.svg", import.meta.url), "utf8");
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, width: 512, height: 512, transparent: true, frame: false, webPreferences: { offscreen: true } });
  await w.loadURL("data:text/html," + encodeURIComponent(`<body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}" width="512" height="512"></body>`));
  await new Promise(r => setTimeout(r, 300));
  const img = await w.webContents.capturePage({ x: 0, y: 0, width: 512, height: 512 });
  mkdirSync(new URL("../build", import.meta.url), { recursive: true });
  writeFileSync(new URL("../build/icon.png", import.meta.url), img.toPNG());
  console.log("build/icon.png", img.getSize());
  app.quit();
});
