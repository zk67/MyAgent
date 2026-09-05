'use client';
import '../styles/chat.css';
import { FormEvent, useEffect, useRef, useState } from 'react';
import '@/styles/chat.css';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatProps = {
  onEventCreated?: () => void;
};

export function Chat({ onEventCreated }: ChatProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Bonjour ! Que souhaitez-vous faire avec votre calendrier ?',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    setMessages((current) => [...current, { role: 'user', content: message }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: data.message ?? 'Réponse reçue.' },
      ]);

      if (data.action === 'create_event') {
        onEventCreated?.();
      }
    } catch {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: "Une erreur est survenue, réessayez dans un instant." },
      ]);
    } finally {
      setLoading(false);
    }
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
          <span>{message.role === 'user' ? 'Vous' : 'lilIA'}</span>
          <p>{message.content}</p>
        </div>
      ))}
      {loading && <div className="typing">lilIA réfléchit…</div>}
    </div>

    <div className="quick-actions">
      <button className="quick-action">📅 Schedule a meeting</button>
      <button className="quick-action">✉️ Check my emails</button>
      <button className="quick-action">📋 Summarize my day</button>
    </div>

    <form className="chat-form" onSubmit={handleSubmit}>
      <input
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Ask something..."
        aria-label="Message"
      />
      <button type="submit" disabled={loading || !input.trim()} aria-label="Envoyer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 2 15 22l-4-9-9-4 20-7Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>

    <div className="disclaimer">AI responses may be inaccurate</div>
  </section>
  );
}