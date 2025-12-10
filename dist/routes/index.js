"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadHandler_1 = require("./handlers/uploadHandler");
const embeddingsHandler_1 = require("./handlers/embeddingsHandler");
const processContentHandler_1 = require("./handlers/processContentHandler");
const conversationHandler_1 = require("./handlers/conversationHandler");
const dbUtil_1 = require("./handlers/dbUtil");
const whereUsed_1 = __importDefault(require("./whereUsed"));
const router = express_1.default.Router();
// Upload PDF
router.post('/upload-pdf', uploadHandler_1.upload.single('pdf'), uploadHandler_1.uploadPdfHandler);
// Home
router.get('/', async function (req, res, next) {
    const services = {
        backend: 'http://localhost:3000',
        angularui: 'http://localhost:4200',
        reactui: 'http://localhost:3001'
    };
    let dbStatus = 'unknown';
    try {
        const { connection, collection } = await (0, dbUtil_1.getMongoCollection)();
        await collection.stats();
        dbStatus = 'connected';
        await connection.close();
    }
    catch (e) {
        dbStatus = 'error';
    }
    let readme = '';
    try {
        readme = fs_1.default.readFileSync(path_1.default.join(__dirname, '../../README.md'), 'utf-8');
    }
    catch (e) {
        readme = 'README.md not found.';
    }
    res.json({ status: 'ok', services, dbStatus, readme });
});
// Embeddings
router.get('/embeddings', embeddingsHandler_1.getEmbeddingsHandler);
// Process Content
router.post('/process-content', (req, res, next) => (0, processContentHandler_1.processContentHandler)(req, res, dbUtil_1.getMongoCollection));
// Conversation
router.post('/conversation', (req, res, next) => (0, conversationHandler_1.conversationHandler)(req, res, dbUtil_1.getMongoCollection));
// Where-Used lookup
router.use('/where-used', whereUsed_1.default);
exports.default = router;
