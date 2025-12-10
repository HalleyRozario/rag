import { MongoClient, Db, Collection } from 'mongodb';

export async function getMongoCollection(collectionName: string = 'docs') {
  const connection = await MongoClient.connect(process.env.DB as string);
  const db: Db = connection.db('rag_docs');
  const collection: Collection = db.collection(collectionName);
  return { connection, collection };
}
