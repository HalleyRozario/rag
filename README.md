# RAG Project

This project is a Retrieval-Augmented Generation (RAG) system with:

- **Node.js/Express backend**: Handles PDF/text ingestion, chunking, embedding (OpenAI), and chat-based retrieval.
- **MongoDB Atlas**: Stores vector embeddings and session/conversation data.
- **Angular UI**: Wizard-style workflow for document upload, processing, and chat.
- **React UI**: Alternative chat interface for learning and comparison.

## Main Features
- Upload and process PDF/text documents.
- Chunk, embed, and store content in MongoDB.
- Chat interface retrieves relevant chunks and uses OpenAI for answers.
- Modular, extensible, and easy to debug.

## Endpoints
- `/upload-pdf`: Upload PDF to backend/docs.
- `/process-content`: Chunk, embed, and store content.
- `/conversation`: Chat with retrieval-augmented context.



## How to Run
	- **After running `npm run start:all`, open [http://localhost:3000](http://localhost:3000) in your browser to check backend and project status (root endpoint).**
	- Angular UI will be available at [http://localhost:4200](http://localhost:4200)
	- `npm run start:all` (uses concurrently to run both backend and Angular UI)
	- Or use two terminals, one for each service.
	- Or use two terminals, one for each service.

## MongoDB Collections
- **docs**: Stores document chunks and their vector embeddings (`text`, `embeddings`).
- **sessions**: Stores chat session metadata (session creation, etc).
- **conversations**: Stores user messages, assistant responses, and their embeddings, linked to sessions.

Each collection serves a specific part of the RAG workflow: document storage, session tracking, and chat history.

## Author
Halley Rozario
