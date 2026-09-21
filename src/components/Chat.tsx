'use client';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import '@/styles/chat.css';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  fileName?: string;
};

type ChatProps = {
  onEventCreated?: () => void;
};

export function Chat({ onEventCreated }: ChatProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! What would you like to do with your calendar?',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setFileError(null);

    if (file && file.type !== 'application/pdf') {
      setSelectedFile(null);
      setFileError('Only PDF files are accepted.');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
  }

  function clearSelectedFile() {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function sendMessage(message: string, file: File | null = selectedFile) {
    if ((!message && !file) || loading) return;

    setMessages((current) => [...current, {
      role: 'user',
      content: message || 'PDF attached.',
      fileName: file?.name,
    }]);
    setInput('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', message);
      if (file) formData.append('file', file);

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: data.message ?? 'Response received.' },
      ]);

      if (data.action === 'create_event') {
        onEventCreated?.();
      }
      clearSelectedFile();
    } catch {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: 'Something went wrong. Please try again in a moment.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(input.trim());
  }

  async function handleQuickAction(prompt: string) {
    await sendMessage(prompt, null);
  }

  return (
  <section className="panel chat-panel">
    <div className="panel-header">
      <div className="assistant-header">
        <div className="assistant-avatar">🤖</div>
        <div>
          <div className="assistant-name">AI Secretary</div>
          <div className="assistant-status">
            <span className="status-dot" />
            Online
          </div>
        </div>
      </div>
      <button className="overview-menu-button" aria-label="Options">⋮</button>
    </div>

    <div className="messages" ref={scrollRef}>
      {messages.map((message, index) => (
        <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
          <span>{message.role === 'user' ? 'You' : 'lilIA'}</span>
          <p>{message.content}</p>
          {message.fileName && <span className="message-file">PDF: {message.fileName}</span>}
        </div>
      ))}
      {loading && <div className="typing">lilIA is thinking...</div>}
    </div>

    <div className="quick-actions">
      <button type="button" className="quick-action" onClick={() => handleQuickAction('Schedule a meeting')}>Schedule a meeting</button>
      <button type="button" className="quick-action" onClick={() => handleQuickAction('Check my emails')}>Check my emails</button>
      <button type="button" className="quick-action" onClick={() => handleQuickAction('Summarize my day')}>Summarize my day</button>
    </div>

    <form className="chat-form" onSubmit={handleSubmit}>
      <input
        ref={fileInputRef}
        className="chat-file-input"
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleFileChange}
        aria-label="Attach a PDF"
      />
      <button
        type="button"
        className="chat-file-button"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Attach a PDF"
        title="Attach a PDF"
      >
        + PDF
      </button>
      <input
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Ask something..."
        aria-label="Message"
      />
      <button type="submit" disabled={loading || (!input.trim() && !selectedFile)} aria-label="Send">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 2 15 22l-4-9-9-4 20-7Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>

    {(selectedFile || fileError) && (
      <div className="chat-file-status" role={fileError ? 'alert' : undefined}>
        {selectedFile && (
          <button type="button" className="chat-file-preview" onClick={clearSelectedFile} title="Remove PDF">
            <span aria-hidden="true">PDF</span>
            <span>{selectedFile.name}</span>
            <strong aria-hidden="true">×</strong>
          </button>
        )}
        {fileError && <span className="chat-file-error">{fileError}</span>}
      </div>
    )}

    <div className="disclaimer">AI responses may be inaccurate</div>
  </section>
  );
}