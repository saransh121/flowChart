// Parse a JSON prefix while it streams: close open strings/brackets, backing off to the last complete value.
export function parsePartial(s) {
  for (let end = s.length; end > 0; end = Math.max(s.lastIndexOf("}", end - 2), s.lastIndexOf("]", end - 2)) + 1) {
    const cut = s.slice(0, end);
    try { return JSON.parse(cut + closers(cut)); } catch {}
  }
  return null;
}
function closers(s) {
  const stack = []; let inStr = false, esc = false;
  for (const c of s) {
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true; else if (c === "{") stack.push("}"); else if (c === "[") stack.push("]"); else if (c === "}" || c === "]") stack.pop();
  }
  return (inStr ? '"' : "") + stack.reverse().join("");
}
