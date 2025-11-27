import { Component, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="chat-container">
      <div *ngFor="let msg of messages" [ngClass]="msg.role">
        <strong>{{ msg.role === 'user' ? 'You' : 'Assistant' }}:</strong> {{ msg.content }}
      </div>
      <form (ngSubmit)="sendMessage()" class="chat-form">
        <input [(ngModel)]="userInput" name="userInput" required placeholder="Type your question..." />
        <button type="submit">Send</button>
      </form>
    </div>
  `,
  styles: [`
    .chat-container { max-width: 600px; margin: 40px auto; border: 1px solid #ccc; border-radius: 8px; padding: 16px; background: #fafafa; }
    .user { text-align: right; color: #1976d2; margin: 8px 0; }
    .assistant { text-align: left; color: #388e3c; margin: 8px 0; }
    .chat-form { display: flex; gap: 8px; margin-top: 16px; }
    input { flex: 1; padding: 8px; border-radius: 4px; border: 1px solid #ccc; }
    button { padding: 8px 16px; border-radius: 4px; border: none; background: #1976d2; color: #fff; cursor: pointer; }
    button:hover { background: #1565c0; }
  `]
})
export class ChatComponent {
  messages: Message[] = [];
  userInput = '';
  sessionId: string | null = '68f8fe8b73eb2f94a1565191';

  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}

  sendMessage() {
    if (!this.userInput.trim()) return;
    const userMsg: Message = { role: 'user', content: this.userInput };
    this.messages.push(userMsg);
    const payload: any = { message: this.userInput };
    if (this.sessionId) payload.sessionId = this.sessionId;
    this.userInput = '';
    this.http.post<any>('http://localhost:3000/conversation', payload).subscribe({
      next: (res) => {
        console.log('Backend response:', res);
        if (res.sessionId) this.sessionId = res.sessionId;
        // Handle string, object, or array responses
        let content = '';
        if (typeof res === 'string') {
          content = res;
        } else if (Array.isArray(res)) {
          content = res.join('\n');
        } else if (res.content) {
          content = res.content;
        } else if (res.message) {
          content = res.message;
        } else {
          content = JSON.stringify(res);
        }
        this.messages.push({ role: 'assistant', content });
        this.cd.detectChanges();
      },
      error: (err) => {
        this.messages.push({ role: 'assistant', content: 'Error: ' + (err.error?.message || 'Failed to get response') });
      }
    });
  }
}
