"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMongoCollection = getMongoCollection;
const mongodb_1 = require("mongodb");
async function getMongoCollection(collectionName = 'docs') {
    const connection = await mongodb_1.MongoClient.connect(process.env.DB);
    const db = connection.db('rag_docs');
    const collection = db.collection(collectionName);
    return { connection, collection };
}
