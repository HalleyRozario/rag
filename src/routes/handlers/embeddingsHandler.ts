import { Request, Response } from 'express';
import { createEmbeddings } from '../embeddings';

async function getEmbeddingsHandler(req: Request, res: Response) {
  try {
    const sampleText = 'Hello World';
    const embeddings = await createEmbeddings(sampleText);
    res.json({ embeddings });
  } catch (error) {
    console.error('Error generating embeddings', error);
    res.status(500).json({ error: 'Failed to generate embeddings' });
  }
}

export { getEmbeddingsHandler };
