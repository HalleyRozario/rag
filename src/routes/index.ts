import express from 'express';
import path from 'path';
import fs from 'fs';
import { upload, uploadPdfHandler } from './handlers/uploadHandler';
import { getEmbeddingsHandler } from './handlers/embeddingsHandler';
import { processContentHandler } from './handlers/processContentHandler';
import { conversationHandler } from './handlers/conversationHandler';
import { getMongoCollection } from './handlers/dbUtil';
import whereUsedRouter from './whereUsed';

const router = express.Router();

// Upload PDF
router.post('/upload-pdf', upload.single('pdf'), uploadPdfHandler);

// Home
router.get('/', async function (req, res, next) {
  const services = {
    backend: 'http://localhost:3000',
    angularui: 'http://localhost:4200',
    reactui: 'http://localhost:3001'
  };
  let dbStatus = 'unknown';
  try {
    const { connection, collection } = await getMongoCollection();
    try {
      if (typeof (collection as any).stats === 'function') {
        await (collection as any).stats();
      } else {
        const db = connection.db('rag_docs');
        await db.command({ collStats: collection.collectionName || 'docs' });
      }
      dbStatus = 'connected';
    } finally {
      await connection.close();
    }
  } catch (e) {
    dbStatus = 'error';
  }
  let readme = '';
  try {
    readme = fs.readFileSync(path.join(__dirname, '../../README.md'), 'utf-8');
  } catch (e) {
    readme = 'README.md not found.';
  }
  res.json({ status: 'ok', services, dbStatus, readme });
});

// Embeddings
router.get('/embeddings', getEmbeddingsHandler);

// Process Content
router.post('/process-content', (req, res, next) => processContentHandler(req, res, getMongoCollection));

// Conversation
router.post('/conversation', (req, res, next) => conversationHandler(req, res, getMongoCollection));

// DB test endpoint
router.get('/db-test', async (req, res) => {
  try {
    const { connection, collection } = await getMongoCollection();
    try {
      if (typeof (collection as any).stats === 'function') {
        await (collection as any).stats();
      } else {
        const db = connection.db('rag_docs');
        await db.command({ collStats: collection.collectionName || 'docs' });
      }
      res.json({ ok: true, message: 'MongoDB reachable', collection: collection.collectionName });
    } finally {
      await connection.close();
    }
  } catch (err: any) {
    res.status(500).json({ ok: false, message: 'MongoDB connection failed', error: String(err.message || err) });
  }
});

// Where-Used lookup
router.use('/where-used', whereUsedRouter);

export default router;
