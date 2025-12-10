import { OpenAI } from 'openai';

export async function createEmbeddings(text: string) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const embeddings = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text });
    console.log('Embeddings created successfully:', embeddings);
    return embeddings;
  } catch (err) {
    console.error('Error creating embeddings', err);
  }
}
