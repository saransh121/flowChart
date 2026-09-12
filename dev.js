// dev: vite + electron together. `npm run dev`
import { spawn } from "node:child_process";
const run = cmd => spawn(cmd, { shell: true, stdio: "inherit" });
const vite = run("npx vite");
const wait = async () => { try { await fetch("http://localhost:5173"); } catch { return setTimeout(wait, 300); } run("npx electron .").on("exit", () => { vite.kill(); process.exit(); }); };
wait();
