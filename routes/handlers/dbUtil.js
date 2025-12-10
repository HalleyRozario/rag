const mongodb = require('mongodb');

async function getMongoCollection(collectionName = 'docs') {
  const connection = await mongodb.MongoClient.connect(process.env.DB);
  const db = connection.db('rag_docs');
  const collection = db.collection(collectionName);
  return { connection, collection };
}

// Superseded by src/routes/handlers/dbUtil.ts
module.exports = require('../../src/routes/handlers/dbUtil');
