import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="status-block">
      <h2>Project Status</h2>
      <ul>
        <li><strong>Angular UI:</strong> <span class="ok">running</span></li>
        <li><strong>Backend:</strong> <span>See backend status page</span></li>
        <li><strong>React UI:</strong> <span>See project documentation</span></li>
      </ul>
      <h3>About This Project</h3>
      <div class="about">
        <p><strong>RAG Project</strong></p>
        <p>This project is a Retrieval-Augmented Generation (RAG) system with:</p>
        <ul>
          <li><strong>Node.js/Express backend</strong>: Handles PDF/text ingestion, chunking, embedding (OpenAI), and chat-based retrieval.</li>
          <li><strong>MongoDB Atlas</strong>: Stores vector embeddings and session/conversation data.</li>
          <li><strong>Angular UI</strong>: Wizard-style workflow for document upload, processing, and chat.</li>
          <li><strong>React UI</strong>: Alternative chat interface for learning and comparison.</li>
        </ul>
        <h4>Main Features</h4>
        <ul>
          <li>Upload and process PDF/text documents.</li>
          <li>Chunk, embed, and store content in MongoDB.</li>
          <li>Chat interface retrieves relevant chunks and uses OpenAI for answers.</li>
          <li>Modular, extensible, and easy to debug.</li>
        </ul>
        <h4>How to Run</h4>
        <ul>
          <li><strong>After running <code>npm run start:all</code></strong>, open <a href="http://localhost:3000" target="_blank">http://localhost:3000</a> in your browser to check backend and project status (root endpoint).</li>
          <li>Angular UI will be available at <a href="http://localhost:4200" target="_blank">http://localhost:4200</a></li>
          <li><code>npm run start:all</code> (uses concurrently to run both backend and Angular UI)</li>
          <li>Or use two terminals, one for each service.</li>
        </ul>
        <h4>Author</h4>
        <p>Halley Rozario</p>
      </div>
    </div>
  `,
  styles: [`
    .status-block { background: #f5f5f5; border-radius: 8px; padding: 1rem; margin-bottom: 2rem; }
    .ok { color: #388e3c; font-weight: bold; }
    .error { color: #d32f2f; font-weight: bold; }
    .readme { background: #fff; border: 1px solid #ccc; border-radius: 4px; padding: 1rem; max-height: 300px; overflow: auto; }
    ul { list-style: none; padding: 0; }
    li { margin-bottom: 0.5rem; }
    .about { background: #e8f4fa; border-radius: 4px; padding: 1em; margin-bottom: 1em; }
    .about ul { margin: 0.5em 0 0 1.5em; list-style: disc; }
  `]
})
export class StatusComponent implements OnInit {
  constructor() {}
  ngOnInit() {}
}
