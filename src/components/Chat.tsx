'use client';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import '@/styles/chat.css';
import { respondToDeletion, sendChatMessageStream } from '@/lib/api/chatClient';
import { ChatMessage } from '@/types/types';
import { t, type Locale } from '@/lib/i18n';

const MAX_PDF_SIZE = 10 * 1024 * 1024;

type PendingDeletion = {
  id: string;
  events: { id: string; title: string }[];
};

type ChatProps = {
  hidden: boolean;
  locale: Locale;
  onCalendarChanged: () => void;
};

export function Chat({ hidden, locale, onCalendarChanged }: ChatProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: t('chatGreeting', locale) },
  ]);
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quickActions = [
    t('scheduleMeeting', locale),
    t('whatThisWeek', locale),
    t('summarizeDay', locale),
  ];

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, error, streamingText]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setFileError(null);

    if (file && file.type !== 'application/pdf') {
      setSelectedFile(null);
      setFileError(t('onlyPdf', locale));
      event.target.value = '';
      return;
    }

    if (file && file.size > MAX_PDF_SIZE) {
      setSelectedFile(null);
      setFileError(t('pdfTooLarge', locale));
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

  async function sendMessage(text: string, file: File | null) {
    if ((!text && !file) || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: text || t('pdfAttached', locale),
      fileName: file?.name,
    };
    const conversation = [...messages, userMessage];

    setMessages(conversation);
    setInput('');
    setError(null);
    clearSelectedFile();
    setLoading(true);
    setStreamingText('');

    try {
      await sendChatMessageStream(conversation, file, {
        onToken(chunk) {
          setStreamingText((prev) => prev + chunk);
        },
        onDone(data) {
          setMessages(data.messages);
          setPendingDeletion((data.pendingDeletion as PendingDeletion) || null);
          if (data.calendarModified) onCalendarChanged();
          setStreamingText('');
        },
        onError(errorMsg) {
          setError(errorMsg);
          setStreamingText('');
        },
      });
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : t('somethingWentWrong', locale));
    } finally {
      setLoading(false);
      setStreamingText('');
    }
  }

  async function answerDeletion(confirm: boolean) {
    if (!pendingDeletion || loading) return;

    setLoading(true);
    setError(null);
    try {
      await respondToDeletion(pendingDeletion.id, confirm);
      setPendingDeletion(null);
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: confirm ? t('eventsDeleted', locale) : t('deletionCancelled', locale) },
      ]);
      if (confirm) onCalendarChanged();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t('somethingWentWrong', locale));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(input.trim(), selectedFile);
  }

  return (
    <section className="panel chat-panel" hidden={hidden}>
      <div className="panel-header">
        <div className="assistant-header">
          <div className="assistant-avatar" aria-hidden="true">🤖</div>
          <div>
            <div className="assistant-name">MyAgent</div>
            <div className="assistant-status">
              <span className="status-dot" />
              {t('online', locale)}
            </div>
          </div>
        </div>
      </div>

      <div className="messages" ref={messagesRef} aria-live="polite">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <span>{message.role === 'user' ? 'You' : 'MyAgent'}</span>
            <p>{message.content}</p>
            {message.fileName && <span className="message-file">PDF: {message.fileName}</span>}
          </div>
        ))}
        {streamingText && (
          <div className="message assistant">
            <span>MyAgent</span>
            <p>{streamingText}</p>
          </div>
        )}
        {error && (
          <div className="message assistant" role="alert">
            <span>MyAgent</span>
            <p>{error}</p>
          </div>
        )}
        {loading && !streamingText && <div className="typing">{t('thinking', locale)}</div>}
      </div>

      <div className="quick-actions">
        <button
          type="button"
          className="quick-action chat-attach-quick-button"
          onClick={() => fileInputRef.current?.click()}
        >
          + PDF
        </button>
        {quickActions.map((action) => (
          <button key={action} type="button" className="quick-action" onClick={() => sendMessage(action, null)}>
            {action}
          </button>
        ))}
      </div>

      {pendingDeletion && (
        <div className="quick-actions" role="group" aria-label={t('confirmDeletion', locale)}>
          <span>{t('eventsToDelete', locale)} {pendingDeletion.events.map((e) => e.title).join(', ')}</span>
          <button type="button" className="quick-action" disabled={loading} onClick={() => answerDeletion(true)}>
            {t('confirmDeletion', locale)}
          </button>
          <button type="button" className="quick-action" disabled={loading} onClick={() => answerDeletion(false)}>
            {t('cancelDeletion', locale)}
          </button>
        </div>
      )}

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          className="chat-file-input"
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
          aria-label={t('attachPdf', locale)}
        />
        <input
          value={input}
          maxLength={2000}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t('askSomething', locale)}
          aria-label="Message"
        />
        <button type="submit" disabled={loading || (!input.trim() && !selectedFile)} aria-label={t('send', locale)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 2 15 22l-4-9-9-4 20-7Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>

      {(selectedFile || fileError) && (
        <div className="chat-file-status" role={fileError ? 'alert' : undefined}>
          {selectedFile && (
            <button type="button" className="chat-file-preview" onClick={clearSelectedFile} title={t('removePdf', locale)}>
              <span aria-hidden="true">PDF</span>
              <span>{selectedFile.name}</span>
              <strong aria-hidden="true">×</strong>
            </button>
          )}
          {fileError && <span className="chat-file-error">{fileError}</span>}
        </div>
      )}

      <div className="disclaimer">{t('disclaimer', locale)}</div>
    </section>
  );
}
