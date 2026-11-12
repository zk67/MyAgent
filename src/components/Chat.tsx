'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowUp, Paperclip } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { respondToDeletion, sendChatMessage } from '@/lib/api/chatClient';
import { ChatMessage } from '@/types/types';
import '@/styles/chat.css';

const MAX_PDF_SIZE = 10 * 1024 * 1024;

const GREETING: ChatMessage = { role: 'assistant', content: 'Hello! What would you like to do with your calendar?' };

// Suggestions shown above the input: the button label and the message it sends.
const QUICK_ACTIONS = [
  { label: 'My week', prompt: 'What do I have this week?' },
  { label: 'Next deadline', prompt: 'What is my next exam or deadline?' },
  { label: 'My day', prompt: 'Summarize my day' },
];

type PendingDeletion = { id: string; events: { id: string; title: string }[] };

type ChatProps = {
  onEventCreated?: () => void;
};

export function Chat({ onEventCreated }: ChatProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep the latest message in view.
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

    const userMessage: ChatMessage = { role: 'user', content: message || 'PDF attached.' };
    const conversation = [...messages, userMessage];
    setMessages(conversation);
    setInput('');
    // Remove the attachment from the input as soon as it is sent.
    // `file` still holds it, so the upload below finishes normally.
    clearSelectedFile();
    setLoading(true);

    try {
      const data = await sendChatMessage(conversation, file);
      setMessages(data.messages);
      setPendingDeletion(data.pendingDeletion || null);
      if (data.calendarModified) onEventCreated?.();
    } catch (error) {
      const content = error instanceof Error ? error.message : 'Something went wrong. Please try again in a moment.';
      setMessages((current) => [...current, { role: 'assistant', content }]);
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
      const content = confirm ? 'The selected events were deleted.' : 'Deletion cancelled.';
      setMessages((current) => [...current, { role: 'assistant', content }]);
      if (confirm) onEventCreated?.();
    } catch (error) {
      const content = error instanceof Error ? error.message : 'Unable to process confirmation.';
      setMessages((current) => [...current, { role: 'assistant', content }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(input.trim());
  }

  return (
    <section className="panel chat-panel">
      <div className="panel-header">
        <h2 className="assistant-name">Ask MyAgent</h2>
      </div>

      <div className="messages" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={`${message.role}-${index}`}
              className={`message ${message.role}`}
              layout
              initial={{ opacity: 0, y: 8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
            >
              <span>{message.role === 'user' ? 'You' : 'MyAgent'}</span>
              <p>{message.content}</p>
              {message.fileName && <span className="message-file">PDF: {message.fileName}</span>}
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && <div className="typing">Thinking...</div>}
      </div>

      {/* Either the deletion question, or the suggestions */}
      {pendingDeletion ? (
        <div className="deletion-confirm" role="group" aria-label="Confirm event deletion">
          <p>Delete {pendingDeletion.events.map((event) => event.title).join(', ')}?</p>
          <div>
            <button type="button" className="button-quiet" disabled={loading} onClick={() => handleDeletionResponse(false)}>
              Keep
            </button>
            <button type="button" className="button-danger" disabled={loading} onClick={() => handleDeletionResponse(true)}>
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="quick-actions">
          {QUICK_ACTIONS.map(({ label, prompt }) => (
            <button key={label} type="button" className="quick-action" onClick={() => sendMessage(prompt, null)}>
              {label}
            </button>
          ))}
        </div>
      )}

      <form className="chat-form" onSubmit={handleSubmit}>
        {/* Hidden: opened by the paperclip button */}
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
        <button
          type="submit"
          className="chat-send-button"
          disabled={loading || (!input.trim() && !selectedFile)}
          aria-label="Send"
        >
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
