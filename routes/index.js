var express = require('express');
var router = express.Router();
const mongodb = require('mongodb');

/* GET home page. */
router.get('/', async function(req, res, next) {
  //res.render('index', { title: 'Express' });
  //console.log(process.env);
  try {
  const connection = await mongodb.MongoClient.connect(process.env.DB);
  const db = connection.db('rag_docs'); // Database name
  console.log("DB Connection Success");
  const collection = db.collection('docs'); // Collection name which is similar to table in SQL
  await collection.insertOne({key: "Third"});
  console.log("Document Inserted");
  await connection.close();
  res.json({title: 'DB Connection Success' });
  } catch (error) {
    console.error("Error connecting to the database", error);
    return res.status(500).json({ error: "Database connection failed" });
  }
  //res.json({title: 'HRs Express Project (FLOW - from npm start -> goes to bin/www checks for port and starts server -> goes to app.js which uses routes/index.js)'});
});

module.exports = router;
