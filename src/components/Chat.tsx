'use client';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import '@/styles/chat.css';
import { respondToDeletion, sendChatMessage } from '@/lib/api/chatClient';
import { ChatMessage } from '@/types/types';
import { ArrowUp, Paperclip } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

const MAX_PDF_SIZE = 10 * 1024 * 1024;

type ChatProps = {
  onEventCreated?: () => void;
};

export function Chat({ onEventCreated }: ChatProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! What would you like to do with your calendar?',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<{ id: string; events: { id: string; title: string }[] } | null>(null);
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

    if (file && file.size > MAX_PDF_SIZE) {
      setSelectedFile(null);
      setFileError('PDF files must be 10 MB or smaller.');
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

    const userMessage: ChatMessage = {
      role: 'user',
      content: message || 'PDF attached.',
    };
    const conversation = [...messages, userMessage];
    setMessages(conversation);
    
    setInput('');
    // Remove the attachment from the composer as soon as it is submitted.
    // Keep using the captured `file` below so the upload can finish normally.
    clearSelectedFile();
    setLoading(true);

    try {
      const data = await sendChatMessage(conversation, file);
      setMessages(data.messages);
      setPendingDeletion(data.pendingDeletion || null);
      if (data.calendarModified) {
        onEventCreated?.();
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: error instanceof Error
            ? error.message
            : 'Something went wrong. Please try again in a moment.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletionResponse(confirm: boolean) {
    if (!pendingDeletion || loading) return;
    setLoading(true);
    try {
      await respondToDeletion(pendingDeletion.id, confirm);
      setPendingDeletion(null);
      setMessages((current) => [...current, {
        role: 'assistant',
        content: confirm ? 'The selected events were deleted.' : 'Deletion cancelled.',
      }]);
      if (confirm) onEventCreated?.();
    } catch (error) {
      setMessages((current) => [...current, {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Unable to process confirmation.',
      }]);
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
      <h2 className="assistant-name">Ask MyAgent</h2>
    </div>

    <div className="messages" ref={scrollRef}>
      <AnimatePresence initial={false}>
      {messages.map((message, index) => (
        <motion.div layout initial={{ opacity: 0, y: 8, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} key={`${message.role}-${index}`} className={`message ${message.role}`}>
          <span>{message.role === 'user' ? 'You' : 'MyAgent'}</span>
          <p>{message.content}</p>
          {message.fileName && <span className="message-file">PDF: {message.fileName}</span>}
        </motion.div>
      ))}
      </AnimatePresence>
      {loading && <div className="typing">Thinking...</div>}
    </div>

    {pendingDeletion ? (
      <div className="deletion-confirm" role="group" aria-label="Confirm event deletion">
        <p>Delete {pendingDeletion.events.map((event) => event.title).join(', ')}?</p>
        <div>
          <button type="button" className="button-quiet" disabled={loading} onClick={() => handleDeletionResponse(false)}>Keep</button>
          <button type="button" className="button-danger" disabled={loading} onClick={() => handleDeletionResponse(true)}>Delete</button>
        </div>
      </div>
    ) : (
      <div className="quick-actions">
        <button type="button" className="quick-action" onClick={() => handleQuickAction('What do I have this week?')}>My week</button>
        <button type="button" className="quick-action" onClick={() => handleQuickAction('What is my next exam or deadline?')}>Next deadline</button>
        <button type="button" className="quick-action" onClick={() => handleQuickAction('Summarize my day')}>My day</button>
      </div>
    )}

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
        className="chat-attach-button"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Attach a PDF"
        title="Attach a PDF"
      >
        <Paperclip size={17} />
      </button>
      <input
        value={input}
        maxLength={2000}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Ask about your schedule, or attach a PDF"
        aria-label="Message"
      />
      <button type="submit" className="chat-send-button" disabled={loading || (!input.trim() && !selectedFile)} aria-label="Send">
        <ArrowUp size={17} />
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
