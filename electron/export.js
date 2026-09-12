// Export the rendered diagram PNG (from the renderer) as PNG / PDF / PPTX / DOCX.
import { BrowserWindow, dialog } from "electron";
import { writeFile } from "node:fs/promises";
import PptxGenJS from "pptxgenjs";
import { Document, HeadingLevel, ImageRun, Packer, Paragraph } from "docx";

const filters = { png: ["png"], pdf: ["pdf"], pptx: ["pptx"], docx: ["docx"] };

// png: data URL, width/height: css px of the captured image
export async function exportDiagram(win, format, { png, width, height, title }) {
  const { filePath } = await dialog.showSaveDialog(win, { defaultPath: `${(title || "diagram").replace(/[\\/:*?"<>|]/g, "")}.${format}`, filters: [{ name: format.toUpperCase(), extensions: filters[format] }] });
  if (!filePath) return null;
  const buf = Buffer.from(png.split(",")[1], "base64");
  if (format === "png") await writeFile(filePath, buf);
  else if (format === "pdf") await writeFile(filePath, await toPdf(png, width, height, title));
  else if (format === "pptx") await toPptx(filePath, png, width, height, title);
  else if (format === "docx") await writeFile(filePath, await toDocx(buf, width, height, title));
  return filePath;
}

async function toPdf(png, width, height, title) {
  const w = new BrowserWindow({ show: false });
  const html = `<body style="margin:0;font-family:system-ui"><h2 style="margin:16px 24px 8px">${esc(title)}</h2><img src="${png}" style="display:block;margin:0 auto;max-width:96%;max-height:85vh"></body>`;
  await w.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));
  try { return await w.webContents.printToPDF({ landscape: width > height, pageSize: "A4", printBackground: true }); }
  finally { w.destroy(); }
}

async function toPptx(filePath, png, width, height, title) {
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
  const s = pres.addSlide();
  s.addText(title || "", { x: 0.4, y: 0.2, w: 12.5, h: 0.6, fontSize: 20, bold: true });
  s.addImage({ data: png, x: 0.4, y: 0.9, w: 12.5, h: 6.3, sizing: { type: "contain", w: 12.5, h: 6.3 } });
  await pres.writeFile({ fileName: filePath });
}

async function toDocx(buf, width, height, title) {
  const w = Math.min(600, width), h = Math.round(height * (w / width));
  const doc = new Document({ sections: [{ children: [
    new Paragraph({ text: title || "", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ children: [new ImageRun({ type: "png", data: buf, transformation: { width: w, height: h } })] }),
  ] }] });
  return Packer.toBuffer(doc);
}

const esc = s => String(s || "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
