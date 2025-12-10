"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processContentHandler = processContentHandler;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const embeddings_1 = require("../embeddings");
const dbUtil_1 = require("./dbUtil");
const FAILED_EMBEDDINGS_PATH = path_1.default.join(__dirname, '../../../../docs/failed_embeddings.json');
function loadFailedEmbeddings() {
    if (fs_1.default.existsSync(FAILED_EMBEDDINGS_PATH)) {
        const data = fs_1.default.readFileSync(FAILED_EMBEDDINGS_PATH, 'utf-8');
        return JSON.parse(data);
    }
    return [];
}
function saveFailedEmbeddings(failed) {
    fs_1.default.writeFileSync(FAILED_EMBEDDINGS_PATH, JSON.stringify(failed, null, 2), 'utf-8');
}
async function processContentHandler(req, res, getMongoCollection = dbUtil_1.getMongoCollection) {
    try {
        console.log('[processContentHandler] Start processing request:', req.method, req.originalUrl);
        let failedEmbeddings = loadFailedEmbeddings();
        if (failedEmbeddings.length > 0) {
            console.log(`[processContentHandler] Retrying ${failedEmbeddings.length} failed embeddings from previous runs.`);
            const { connection, collection } = await getMongoCollection();
            const stillFailed = [];
            for (const item of failedEmbeddings) {
                try {
                    await collection.insertOne(item);
                }
                catch (err) {
                    console.error('[processContentHandler] Failed to insert previously failed embedding:', err);
                    stillFailed.push(item);
                }
            }
            await connection.close();
            saveFailedEmbeddings(stillFailed);
            console.log(`[processContentHandler] Retried failed embeddings. Still failed: ${stillFailed.length}`);
        }
        let textForEmbedding = null;
        if (req.query.pdf) {
            const pdfPath = path_1.default.join(__dirname, '../../../../docs/', String(req.query.pdf));
            console.log(`[processContentHandler] PDF mode. Looking for file: ${pdfPath}`);
            if (!fs_1.default.existsSync(pdfPath)) {
                console.error('[processContentHandler] PDF file not found:', pdfPath);
                return res.status(400).json({ message: 'PDF file not found' });
            }
            const PDFParser = require('pdf2json');
            const parser = new PDFParser();
            const pdfBase = path_1.default.basename(pdfPath, path_1.default.extname(pdfPath));
            const extractedPath = path_1.default.join(__dirname, '../../../../docs/', pdfBase + '.txt');
            textForEmbedding = await new Promise((resolve, reject) => {
                parser.on('pdfParser_dataError', (errData) => {
                    console.error('[processContentHandler] PDF parse error:', errData.parserError);
                    reject(errData.parserError);
                });
                parser.on('pdfParser_dataReady', (pdfData) => {
                    let rawText = parser.getRawTextContent();
                    if (!rawText.trim()) {
                        console.warn('[processContentHandler] WARNING: pdf2json extracted text is empty for PDF:', pdfPath);
                        try {
                            const { execSync } = require('child_process');
                            rawText = execSync(`pdftotext "${pdfPath}" -`, { encoding: 'utf-8' });
                            console.log('[processContentHandler] pdftotext fallback extracted text preview:', rawText.slice(0, 200));
                        }
                        catch (err) {
                            console.error('[processContentHandler] pdftotext fallback extraction failed:', err?.message || err);
                        }
                    }
                    else {
                        console.log('[processContentHandler] pdf2json extracted text preview:', rawText.slice(0, 200));
                    }
                    fs_1.default.writeFileSync(extractedPath, rawText);
                    console.log('[processContentHandler] PDF parsed and text extracted to:', extractedPath);
                    resolve(rawText);
                });
                parser.loadPDF(pdfPath);
            });
            try {
                const { execSync } = require('child_process');
                const pdftotextOutput = execSync(`pdftotext "${pdfPath}" -`, { encoding: 'utf-8' });
                console.log('[processContentHandler] pdftotext extracted text preview:', pdftotextOutput.slice(0, 200));
            }
            catch (err) {
                console.error('[processContentHandler] pdftotext extraction failed:', err?.message || err);
            }
        }
        else {
            const filePath = path_1.default.join(__dirname, '../../../../docs/content.txt');
            console.log('[processContentHandler] Text mode. Reading file:', filePath);
            const fileContent = fs_1.default.readFileSync(filePath);
            textForEmbedding = fileContent.toString('utf-8');
        }
        if (textForEmbedding === null) {
            return res.status(200).json({ message: 'No content to embed. Extraction may have failed or file is empty.', failedCount: 0 });
        }
        const chunks = textForEmbedding
            .split('\n')
            .map(chunk => chunk.trim())
            .filter(chunk => chunk.length > 0);
        console.log('[processContentHandler] Total chunks to embed:', chunks.length);
        if (chunks.length === 0) {
            console.warn('[processContentHandler] No chunks to embed. Skipping embedding and DB operations.');
            return res.status(200).json({ message: 'No content to embed. Extraction may have failed or file is empty.', failedCount: 0 });
        }
        const { connection, collection } = await getMongoCollection();
        const newFailed = [];
        for (const [i, chunk] of chunks.entries()) {
            try {
                const preview = chunk.length > 120 ? chunk.slice(0, 120) + '...' : chunk;
                console.log(`[processContentHandler] [${i + 1}/${chunks.length}] Processing chunk:`, preview);
                console.log(`[processContentHandler] [${i + 1}/${chunks.length}] Creating embedding for chunk (length: ${chunk.length})`);
                const embeddings = await (0, embeddings_1.createEmbeddings)(chunk);
                try {
                    const embedVec = embeddings?.data?.[0]?.embedding;
                    await collection.insertOne({ text: chunk, embeddings: embedVec });
                    console.log(`[processContentHandler] [${i + 1}/${chunks.length}] Inserted chunk into MongoDB.`);
                }
                catch (err) {
                    console.error(`[processContentHandler] [${i + 1}/${chunks.length}] Failed to insert chunk into MongoDB:`, err);
                    newFailed.push({ text: chunk, embeddings: embeddings?.data?.[0]?.embedding });
                }
            }
            catch (embedErr) {
                console.error(`[processContentHandler] [${i + 1}/${chunks.length}] Failed to create embedding:`, embedErr);
            }
        }
        await connection.close();
        saveFailedEmbeddings(newFailed);
        console.log(`[processContentHandler] Done. Success: ${chunks.length - newFailed.length}, Failed: ${newFailed.length}`);
        res.json({ message: 'Embeddings stored successfully in DB (with retry logic)', failedCount: newFailed.length });
    }
    catch (error) {
        console.error('[processContentHandler] Fatal error:', error);
        res.status(500).json({ message: 'Failed to process PDF or text file' });
    }
}
