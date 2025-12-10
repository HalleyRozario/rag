"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmbeddings = createEmbeddings;
const openai_1 = require("openai");
async function createEmbeddings(text) {
    try {
        const openai = new openai_1.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const embeddings = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text });
        console.log('Embeddings created successfully:', embeddings);
        return embeddings;
    }
    catch (err) {
        console.error('Error creating embeddings', err);
    }
}
