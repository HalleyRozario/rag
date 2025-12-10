"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationHandler = conversationHandler;
const openai_1 = require("openai");
const mongodb_1 = require("mongodb");
const embeddings_1 = require("../embeddings");
async function conversationHandler(req, res, getMongoCollection) {
    try {
        let sessionId = req.body.sessionId;
        const connection = await (await Promise.resolve().then(() => __importStar(require('mongodb')))).MongoClient.connect(process.env.DB);
        const db = connection.db('rag_docs');
        const sessionCollection = db.collection('sessions');
        const conversationCollection = db.collection('conversations');
        if (!sessionId) {
            const sessionData = await sessionCollection.insertOne({ createdAt: new Date() });
            sessionId = sessionData.insertedId;
        }
        else if (sessionId) {
            const sessionData = await sessionCollection.findOne({ _id: new mongodb_1.ObjectId(sessionId) });
            if (sessionData) {
                sessionId = sessionData._id;
            }
            else {
                return res.status(404).json({ message: 'Session not found' });
            }
        }
        const message = req.body.message;
        let messageEmbedding;
        let existingMessage = await conversationCollection.findOne({ sessionId: sessionId, message: message });
        if (existingMessage && existingMessage.embeddings) {
            messageEmbedding = existingMessage.embeddings;
        }
        else {
            const messageVector = await (0, embeddings_1.createEmbeddings)(message);
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
        let finalResult = [];
        for await (let doc of relevantDocs) {
            finalResult.push(doc.text);
        }
        await connection.close();
        const ai = new openai_1.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to process conversation' });
    }
}
