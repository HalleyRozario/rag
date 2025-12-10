import { Request, Response } from 'express';
import { OpenAI } from 'openai';
import { ObjectId } from 'mongodb';
import { createEmbeddings } from '../embeddings';

export async function conversationHandler(req: Request, res: Response, getMongoCollection: any) {
  try {
    let sessionId = req.body.sessionId;
    const connection = await (await import('mongodb')).MongoClient.connect(process.env.DB as string);
    const db = connection.db('rag_docs');
    const sessionCollection = db.collection('sessions');
    const conversationCollection = db.collection('conversations');

    if (!sessionId) {
      const sessionData = await sessionCollection.insertOne({ createdAt: new Date() });
      sessionId = sessionData.insertedId;
    } else if (sessionId) {
      const sessionData = await sessionCollection.findOne({ _id: new ObjectId(sessionId) });
      if (sessionData) {
        sessionId = sessionData._id;
      } else {
        return res.status(404).json({ message: 'Session not found' });
      }
    }
    const message = req.body.message;
    let messageEmbedding: any;
    let existingMessage = await conversationCollection.findOne({ sessionId: sessionId, message: message });
    if (existingMessage && existingMessage.embeddings) {
      messageEmbedding = existingMessage.embeddings;
    } else {
      const messageVector: any = await createEmbeddings(message);
      messageEmbedding = messageVector?.data?.[0]?.embedding;
      await conversationCollection.insertOne({
        sessionId: sessionId,
        message: message,
        role: 'user',
        createdAt: new Date(),
        embeddings: messageEmbedding
      });
    }
    const docsCollection = db.collection('docs');
    const relevantDocs = await docsCollection.aggregate([
      {
        $vectorSearch: {
          index: 'default',
          path: 'embeddings',
          queryVector: messageEmbedding,
          numCandidates: 150,
          limit: 10
        }
      },
      {
        $project: {
          _id: 0,
          text: 1,
          score: {
            $meta: 'vectorSearchScore'
          }
        }
      }
    ]).toArray();
    let finalResult: string[] = [];
    for await (let doc of relevantDocs) {
      finalResult.push(doc.text);
    }
    await connection.close();

    const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const chat = await ai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant who can answer from given context' },
        {
          role: 'user',
          content: `${finalResult.join('\n')}
\nFrom the above context, answer the following question: ${message}`
        }
      ]
    });
    return res.json(chat.choices[0].message);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process conversation' });
  }
}
