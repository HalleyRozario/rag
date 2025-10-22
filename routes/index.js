var express = require('express');
var router = express.Router();
const mongodb = require('mongodb');
const { createEmbeddings } = require('./embeddings');
const { OpenAI } = require("openai");

var PDFParse = require('pdf2json');
const parser = new PDFParse(this, 1);
const fs = require('fs');  // File System module
const path = require('path');
const { connect } = require('http2');

// Utility function to get MongoDB collection (generic)
async function getMongoCollection(collectionName = 'docs') {
  const connection = await mongodb.MongoClient.connect(process.env.DB);
  const db = connection.db('rag_docs');
  const collection = db.collection(collectionName);
  return { connection, collection };
}

/* GET home page. */
router.get('/', async function (req, res, next) {
  //res.render('index', { title: 'Express' });
  //console.log(process.env);
  try {
    // Use the utility function to get MongoDB connection and collection
    const { connection, collection } = await getMongoCollection();
    console.log("DB Connection Success");
    const now = new Date().toISOString();
    await collection.insertOne({
      key: now
    });
    console.log("Document Inserted successfully into MongoDB with key:", now);
    await connection.close();
    res.json({ title: 'DB Connection Success' });
  } catch (error) {
    console.error("Error connecting to the database", error);
    return res.status(500).json({ error: "Database connection failed" });
  }
  //res.json({title: 'HRs Express Project (FLOW - from npm start -> goes to bin/www checks for port and starts server -> goes to app.js which uses routes/index.js)'});
});

// GET for Embeddings
router.get('/embeddings', async function (req, res, next) {
  try {
    const sampleText = "Hello World";
    const embeddings = await createEmbeddings(sampleText);
    res.json({ embeddings });
  } catch (error) {
    console.error("Error generating embeddings", error);
    res.status(500).json({ error: "Failed to generate embeddings" });
  }
});
const FAILED_EMBEDDINGS_PATH = path.join(__dirname, '../docs/failed_embeddings.json');

// Helper to load failed embeddings from file
function loadFailedEmbeddings() {
  if (fs.existsSync(FAILED_EMBEDDINGS_PATH)) {
    const data = fs.readFileSync(FAILED_EMBEDDINGS_PATH, 'utf-8');
    return JSON.parse(data);
  }
  return [];
}

// Helper to save failed embeddings to file
function saveFailedEmbeddings(failed) {
  fs.writeFileSync(FAILED_EMBEDDINGS_PATH, JSON.stringify(failed, null, 2), 'utf-8');
}

router.post('/process-content', async function (req, res, next) {
  try {
    // 1. Attempt to store any previously failed embeddings first (from failed_embeddings.json)
    let failedEmbeddings = loadFailedEmbeddings();
    if (failedEmbeddings.length > 0) {
      const { connection, collection } = await getMongoCollection();
      const stillFailed = [];
      for (const item of failedEmbeddings) {
        try {
          await collection.insertOne(item);
        } catch (err) {
          stillFailed.push(item); // If still fails, keep for next time
        }
      }
      await connection.close();
      saveFailedEmbeddings(stillFailed); // Update the failed list
    }

    // 2. PDF to Text processing if pdf query param is provided
    // If a PDF filename is provided as a query parameter, extract its text
    let textForEmbedding = null;
    //http://localhost:3000/process-content?pdf=yourfile.pdf - if you want to process a specific PDF else directly /process-content will process the TXT file
    if (req.query.pdf) {
      const pdfPath = path.join(__dirname, '../docs/', req.query.pdf);
      if (!fs.existsSync(pdfPath)) {
        // If the PDF file does not exist, return an error
        return res.status(400).json({ message: 'PDF file not found' });
      }
      const PDFParser = require('pdf2json');
      const parser = new PDFParser();
      // Wrap PDF parsing in a promise for async/await
      textForEmbedding = await new Promise((resolve, reject) => {
        parser.on('pdfParser_dataError', errData => reject(errData.parserError));
        parser.on('pdfParser_dataReady', pdfData => {
          const rawText = parser.getRawTextContent();
          // Save the extracted text for reference
          fs.writeFileSync(path.join(__dirname, '../docs/extracted.txt'), rawText);
          resolve(rawText);
        });
        parser.loadPDF(pdfPath);
      });
    } else {
      // If no PDF is provided, use the content.txt file
      const filePath = path.join(__dirname, '../docs/content.txt');
      const fileContent = fs.readFileSync(filePath);
      console.log('Read content.txt for embedding is successful');
      textForEmbedding = fileContent.toString('utf-8');
    }

    // 3. Chunk the content by delimiter (---)
    // Each chunk will be embedded separately
    const chunks = textForEmbedding
      .split('---')
      .map(chunk => chunk.trim())
      .filter(chunk => chunk.length > 0);

    // 4. Get MongoDB collection and connection
    const { connection, collection } = await getMongoCollection();
    const newFailed = [];

    // 5. For each chunk, create embeddings and store in MongoDB
    for (const chunk of chunks) {
      try {
        const embeddings = await createEmbeddings(chunk); // Call OpenAI API only once
        console.log('Embedding successful for chunk:', chunk.substring(0, 50) + (chunk.length > 50 ? '...' : ''));
        try {
          await collection.insertOne({
            text: chunk,
            embeddings: embeddings.data[0].embedding
          });
          console.log('DB insert successful for chunk:', chunk.substring(0, 50) + (chunk.length > 50 ? '...' : ''));
        } catch (err) {
          // If DB insert fails, save the chunk and embeddings for retry (do NOT call OpenAI again)
          newFailed.push({
            text: chunk,
            embeddings: embeddings.data[0].embedding
          });
          console.error('DB insert failed for chunk, added to newFailed array:', chunk.substring(0, 50) + (chunk.length > 50 ? '...' : ''));
        }
      } catch (embedErr) {
        // If embedding also fails, skip (or log)
        console.error('Embedding failed for chunk:', chunk.substring(0, 50) + (chunk.length > 50 ? '...' : ''));
      }
    }

    // 6. Close the DB connection and save any new failed embeddings
    await connection.close();
    saveFailedEmbeddings(newFailed);
    res.json({ message: "Embeddings stored successfully in DB (with retry logic)", failedCount: newFailed.length });
  } catch (error) {
    console.error("Error processing File", error);
    res.status(500).json({ message: "Failed to process PDF or text file" });
  }
});
// POST for Conversation

router.post('/conversation', async function (req, res, next) {
  try {
    let sessionId = req.body.sessionId;
    const connection = await mongodb.MongoClient.connect(process.env.DB);
    const db = connection.db('rag_docs');
    const sessionCollection = db.collection('sessions');
    const conversationCollection = db.collection('conversations');

    //FIRST time sessionID would be empty in request body
    if (!sessionId) {
      // Create new session
      const sessionData = await sessionCollection.insertOne({ createdAt: new Date() });
      sessionId = sessionData.insertedId;
      console.log({ message: "New session created", sessionId });
    } else if (sessionId) {
      const sessionData = await sessionCollection.findOne({ _id: new mongodb.ObjectId(sessionId) });
      if (sessionData) {
        sessionId = sessionData._id;
        console.log({ message: "Existing session found", sessionId });
      } else {
        return res.status(404).json({ message: "Session not found" });
      }
    }
    // Further conversation handling (i.e) reading messages and generating responses
    const message = req.body.message;
    // Check if the message already exists for this session and has an embedding
    let messageEmbedding;
    let existingMessage = await conversationCollection.findOne({ sessionId: sessionId, message: message });
    if (existingMessage && existingMessage.embeddings) {
      // Use existing embedding
      messageEmbedding = existingMessage.embeddings;
      console.log('Reusing existing embedding for message');
    } else {
      // Create embedding and store it
      const messageVector = await createEmbeddings(message);
      messageEmbedding = messageVector.data[0].embedding;
      await conversationCollection.insertOne({
        sessionId: sessionId,
        message: message,
        role: 'user',
        createdAt: new Date(),
        embeddings: messageEmbedding
      });
      console.log('Created and stored new embedding for message');
    }
    // Retrieve relevant docs based on vector similarity - AGGREGATION
    const docsCollection = db.collection('docs');
    const relevantDocs = await docsCollection.aggregate([
      {
        $vectorSearch: {
          index: "default",
          path: "embeddings",
          queryVector: messageEmbedding,
          numCandidates: 150,
          limit: 10,
        },
      },
      {
        $project: {
          _id: 0,
          text: 1,
          score: {
            $meta: "vectorSearchScore"
          },
        },
      }
    ]).toArray();
    let finalResult = [];
    for await (let doc of relevantDocs) {
      finalResult.push(doc.text);
    }
    console.log("Relevant Docs Retrieved:", relevantDocs.length);
    await connection.close();

    const ai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    const chat = await ai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant who can answer from given context" },
        {
          role: "user",
          content: `${finalResult.join('\n')}
\nFrom the above context, answer the following question: ${message}`
        }
      ]
    });
    return res.json(chat.choices[0].message);
    //return res.json(finalResult);
  } catch (error) {
    console.error("Error processing conversation", error);
    return res.status(500).json({ message: "Failed to process conversation" });
  }
});
module.exports = router;
