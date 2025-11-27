import React, { useState } from 'react';
import './Chat.css';

const SESSION_ID = '68f8fe8b73eb2f94a1565191';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    const userMsg = { role: 'user', content: userInput };
    setMessages((msgs) => [...msgs, userMsg]);
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput, sessionId: SESSION_ID })
      });
      const data = await res.json();
      let content = '';
      if (typeof data === 'string') content = data;
      else if (Array.isArray(data)) content = data.join('\n');
      else if (data.content) content = data.content;
      else if (data.message) content = data.message;
      else content = JSON.stringify(data);
      setMessages((msgs) => [...msgs, { role: 'assistant', content }]);
    } catch (err) {
      setMessages((msgs) => [...msgs, { role: 'assistant', content: 'Error: ' + err.message }]);
    }
    setUserInput('');
    setLoading(false);
  };

  return (
    <div className="chat-container">
      {messages.map((msg, idx) => (
        <div key={idx} className={msg.role}>
          <strong>{msg.role === 'user' ? 'You' : 'Assistant'}:</strong> {msg.content}
        </div>
      ))}
      <form onSubmit={sendMessage} className="chat-form">
        <input
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          placeholder="Type your question..."
          required
        />
        <button type="submit" disabled={loading}>Send</button>
      </form>
    </div>
  );
}

export default Chat;
