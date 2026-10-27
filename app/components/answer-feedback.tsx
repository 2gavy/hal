'use client';
import { useEffect, useRef, useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

type Rating = 'up' | 'down' | null;
type Props = {
  responseId: string;
  mode: 'chat' | 'voice' | 'plan';
  access: string;
  sources: { url: string }[];
  metrics?: { searchType: string; requestId?: string; searchMs?: number; voiceMs?: number; estimatedHighlightTokens?: number };
};

// Ratings and optional explanations share the response ID for observability.
export default function AnswerFeedback({ responseId, mode, access, sources, metrics }: Props) {
  const [rating, setRating] = useState<Rating>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState('');
  const [needsAccess, setNeedsAccess] = useState(false);
  const [code, setCode] = useState('');
  const retry = useRef<{ rating: Rating; reason?: string } | null>(null);
  const lock = useRef(false);
  const downButton = useRef<HTMLButtonElement>(null);
  const reasonInput = useRef<HTMLTextAreaElement>(null);
  const storageKey = `hal-feedback:${responseId}`;
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setRating(saved === 'up' || saved === 'down' ? saved : null);
    } catch {}
  }, [storageKey]);
  useEffect(() => {
    if (showReason) reasonInput.current?.focus();
  }, [showReason]);

  function closeReason() {
    setShowReason(false);
    downButton.current?.focus();
  }
  async function save(next: Rating, explanation?: string, enteredCode?: string) {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setMessage('');
    try {
      // Voice may have refreshed the code since this answer was rendered.
      let currentAccess = enteredCode ?? access;
      if (enteredCode === undefined) {
        try { currentAccess = sessionStorage.getItem('hal-access') || access; } catch {}
      }
      const sourceDomains = sources.flatMap(s => {
        try { return [new URL(s.url).hostname]; } catch { return []; }
      });
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-hal-access': currentAccess },
        body: JSON.stringify({ responseId, mode, rating: next, reason: explanation, sourceDomains, searchType: metrics?.searchType, requestId: metrics?.requestId, metrics }),
        signal: AbortSignal.timeout(10000),
      });
      if (response.status === 401) {
        retry.current = { rating: next, reason: explanation };
        setNeedsAccess(true);
        setMessage('Enter your access code to save this feedback.');
        return;
      }
      if (!response.ok) {
        setMessage(response.status === 429
          ? 'Too many attempts. Please wait a minute and try again.'
          : response.status === 403
            ? 'Please reopen Hal and try again.'
            : 'Couldn’t save feedback. Please try again.');
        return;
      }
      if (enteredCode !== undefined) {
        try { sessionStorage.setItem('hal-access', enteredCode); } catch {}
      }
      setNeedsAccess(false);
      setCode('');
      retry.current = null;
      setRating(next);
      try {
        if (next) localStorage.setItem(storageKey, next);
        else localStorage.removeItem(storageKey);
      } catch {}
      setMessage(next ? 'Thanks for your feedback' : 'Feedback removed');
      if (next === 'down' && explanation === undefined) setShowReason(true);
      else {
        if (showReason) closeReason();
        setReason('');
      }
    } catch {
      setMessage('Couldn’t save feedback. Please try again.');
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  return <div className="feedback-container">
    <div className="answer-feedback" role="group" aria-label="Rate this answer">
      <button type="button" title="Helpful" aria-label="Helpful answer" aria-pressed={rating === 'up'} disabled={pending} onClick={() => void save(rating === 'up' ? null : 'up')}><ThumbsUp size={15} /></button>
      <button ref={downButton} type="button" title="Not helpful" aria-label="Unhelpful answer" aria-pressed={rating === 'down'} disabled={pending} onClick={() => void save(rating === 'down' ? null : 'down')}><ThumbsDown size={15} /></button>
      <span className="feedback-message" role="status">{message}</span>
    </div>
    {needsAccess && <form className="feedback-reason" onSubmit={e => {
      e.preventDefault();
      if (retry.current && code.trim()) void save(retry.current.rating, retry.current.reason, code.trim());
    }}>
      <label htmlFor={`feedback-access-${responseId}`}>Access code</label>
      <input id={`feedback-access-${responseId}`} type="password" autoComplete="off" value={code} onChange={e => setCode(e.target.value)} disabled={pending} />
      <div className="feedback-reason-actions"><button type="submit" disabled={pending || !code.trim()}>{pending ? 'Saving…' : 'Save feedback'}</button></div>
    </form>}
    {showReason && <form className="feedback-reason" onSubmit={e => { e.preventDefault(); if (reason.trim()) void save('down', reason.trim()); }}>
      <label htmlFor={`reason-${responseId}`}>What went wrong? <span>(optional)</span></label>
      <textarea ref={reasonInput} id={`reason-${responseId}`} rows={3} maxLength={1000} value={reason} disabled={pending} placeholder="Wrong citation, incomplete answer, or something else…" onChange={e => setReason(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); closeReason(); } }} />
      <div className="feedback-reason-actions">
        <button type="button" disabled={pending} onClick={closeReason}>Skip</button>
        <button type="submit" disabled={pending || !reason.trim()}>{pending ? 'Saving…' : 'Send feedback'}</button>
      </div>
    </form>}
  </div>;
}
