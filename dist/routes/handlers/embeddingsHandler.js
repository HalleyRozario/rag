"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmbeddingsHandler = getEmbeddingsHandler;
const embeddings_1 = require("../embeddings");
async function getEmbeddingsHandler(req, res) {
    try {
        const sampleText = 'Hello World';
        const embeddings = await (0, embeddings_1.createEmbeddings)(sampleText);
        res.json({ embeddings });
    }
    catch (error) {
        console.error('Error generating embeddings', error);
        res.status(500).json({ error: 'Failed to generate embeddings' });
    }
}
