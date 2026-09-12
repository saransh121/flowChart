// node src/partialJson.test.js
import { parsePartial } from "./partialJson.js";
const full = { type: "mindmap", title: "T", nodes: [{ id: "n1", label: "Root", parent: "" }, { id: "n2", label: "A", parent: "n1" }] };
const s = JSON.stringify(full);
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) { console.error("FAIL", m, a); process.exit(1); } };
eq(parsePartial(s), full, "full");
eq(parsePartial(s.slice(0, 60))?.nodes?.length, 1, "one complete node");
eq(parsePartial(s.slice(0, s.indexOf('"A"') + 2))?.nodes?.[1]?.label, "A", "node with open string");
eq(parsePartial(s.slice(0, s.indexOf('"A"') + 3))?.nodes?.[1]?.label, "A", "node with closed string, open object");
eq(parsePartial('{"type":"flowchart","nodes":[{"id":"n1","label":"S","shape":"st')?.nodes?.[0]?.id, "n1", "enum prefix");
eq(parsePartial(""), null, "empty");
eq(parsePartial("{"), {}, "lone brace");
eq(parsePartial('{"a":"x\\"y'), { a: 'x"y' }, "escaped quote");
console.log("partialJson ok");
