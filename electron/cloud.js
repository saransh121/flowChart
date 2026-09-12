// Cloud engines: same system prompt as the local model, JSON parsed from the streamed text.
import Anthropic from "@anthropic-ai/sdk";
import { system } from "./llm.js";

export const providers = {
  anthropic: { name: "Anthropic", models: ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5"] },
  openai: { name: "OpenAI", url: "https://api.openai.com/v1", models: ["gpt-5", "gpt-5-mini", "gpt-4.1"] },
  gemini: { name: "Google Gemini", url: "https://generativelanguage.googleapis.com/v1beta", models: ["gemini-3.1-pro-preview", "gemini-2.5-flash"] },
  openrouter: { name: "OpenRouter", url: "https://openrouter.ai/api/v1", models: ["anthropic/claude-sonnet-5", "openai/gpt-5", "google/gemini-2.5-flash", "qwen/qwen3-32b"] },
  custom: { name: "OpenAI-compatible (custom URL)", url: "", models: [] },
};

async function* sse(body) {
  let buf = "";
  for await (const chunk of body.pipeThrough(new TextDecoderStream())) {
    buf += chunk;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (line.startsWith("data:")) yield line.slice(5).trim();
    }
  }
}

async function get(url, headers, signal) {
  const res = await fetch(url, { headers, signal });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

async function post(url, headers, body, signal) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body), signal });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);
  return res.body;
}

// cfg: { provider, model, apiKey, baseUrl }. Streams text via onChunk, returns full text.
export async function chat(cfg, prompt, { maxTokens = 8000, onChunk = () => {}, signal } = {}) {
  const emit = t => { if (t) onChunk(t); return t; };
  let text = "";
  if (cfg.provider === "anthropic") {
    const client = new Anthropic({ apiKey: cfg.apiKey });
    const stream = client.messages.stream({ model: cfg.model, max_tokens: maxTokens, system, messages: [{ role: "user", content: prompt }] }, { signal });
    for await (const ev of stream) if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") text += emit(ev.delta.text);
    return text;
  }
  if (cfg.provider === "gemini") {
    const body = await post(`${providers.gemini.url}/models/${cfg.model}:streamGenerateContent?alt=sse`, { "x-goog-api-key": cfg.apiKey },
      { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: maxTokens, responseMimeType: "application/json" } }, signal);
    for await (const d of sse(body)) text += emit(JSON.parse(d).candidates?.[0]?.content?.parts?.[0]?.text);
    return text;
  }
  const base = (cfg.provider === "custom" ? cfg.baseUrl : providers[cfg.provider].url).replace(/\/$/, "");
  const body = await post(`${base}/chat/completions`, { authorization: `Bearer ${cfg.apiKey}` },
    { model: cfg.model, stream: true, max_tokens: maxTokens, messages: [{ role: "system", content: system }, { role: "user", content: prompt }] }, signal);
  for await (const d of sse(body)) { if (d === "[DONE]") break; text += emit(JSON.parse(d).choices?.[0]?.delta?.content); }
  return text;
}

export function parseDiagram(text) {
  const m = text.match(/\{[\s\S]*\}/);
  const d = JSON.parse(m ? m[0] : text);
  if (!["mindmap", "flowchart"].includes(d.type) || !Array.isArray(d.nodes)) throw new Error("Model did not return a diagram");
  return d;
}

export async function generate(cfg, prompt, type, onChunk, signal) {
  const p = type === "auto" ? prompt : `Diagram type must be "${type}".\n\n${prompt}`;
  return parseDiagram(await chat(cfg, p, { onChunk, signal }));
}

export async function test(cfg) {
  const t = await chat(cfg, "Reply with the single word OK.", { maxTokens: 20 });
  if (!t.trim()) throw new Error("Empty reply");
  return t.trim().slice(0, 40);
}

// Live model ids from the provider, so the suggestion list never goes stale.
export async function listModels(cfg) {
  if (cfg.provider === "anthropic") { const out = []; for await (const m of new Anthropic({ apiKey: cfg.apiKey }).models.list()) out.push(m.id); return out; }
  if (cfg.provider === "gemini") {
    const r = await get(`${providers.gemini.url}/models?pageSize=200`, { "x-goog-api-key": cfg.apiKey });
    return (r.models || []).filter(m => m.supportedGenerationMethods?.includes("generateContent")).map(m => m.name.replace(/^models\//, "")).sort();
  }
  const base = (cfg.provider === "custom" ? cfg.baseUrl : providers[cfg.provider].url).replace(/\/$/, "");
  const r = await get(`${base}/models`, { authorization: `Bearer ${cfg.apiKey}` });
  return (r.data || []).map(m => m.id).sort();
}
