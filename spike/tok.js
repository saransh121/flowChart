import { getLlama, LlamaChatSession, QwenChatWrapper } from "node-llama-cpp";
import { getGbnfGrammarForGbnfJsonSchema } from "../node_modules/node-llama-cpp/dist/utils/gbnfJson/getGbnfGrammarForGbnfJsonSchema.js";
const llama = await getLlama(); const model = await llama.loadModel({ modelPath: "models/Qwen3-0.6B-Q4_K_M.gguf" });
const ctx = await model.createContext({ contextSize: 2048 });
const grammar = await llama.createGrammar({ grammar: getGbnfGrammarForGbnfJsonSchema({type:"object",properties:{a:{type:"string"}},required:["a"]}, { allowNewLines: false, scopePadSpaces: 0 }) });
const session = new LlamaChatSession({ contextSequence: ctx.getSequence(), chatWrapper: new QwenChatWrapper({ thoughts: "discourage" }) });
let chunks=[]; const t=performance.now();
const text = await session.prompt("say hi as json", { grammar, maxTokens: 100, temperature: 0, onTextChunk: c => chunks.push(c) });
console.log("chunks", chunks.length, "ms", Math.round(performance.now()-t), JSON.stringify(text), JSON.stringify(chunks.slice(-5)));
