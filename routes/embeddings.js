const { OpenAI } = require("openai");
async function createEmbeddings(text) {
    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        const embeddings = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text
        });
        console.log("Embeddings created successfully:", embeddings);
        return embeddings;
    } catch (err) {
        console.error("Error creating embeddings", err);
    }
}

module.exports = { createEmbeddings };