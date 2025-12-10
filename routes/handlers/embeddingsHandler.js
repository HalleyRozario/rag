const { createEmbeddings } = require('../embeddings');

async function getEmbeddingsHandler(req, res) {
  try {
    const sampleText = "Hello World";
    const embeddings = await createEmbeddings(sampleText);
    res.json({ embeddings });
  } catch (error) {
    console.error("Error generating embeddings", error);
    res.status(500).json({ error: "Failed to generate embeddings" });
  }
}

// Superseded by src/routes/handlers/embeddingsHandler.ts
module.exports = require('../../src/routes/handlers/embeddingsHandler');
