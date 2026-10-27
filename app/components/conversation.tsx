import { useEffect, useRef } from 'react';
import {
  MapPin,
  Utensils,
  CookingPot,
  Luggage,
  Smartphone,
  House,
  ChevronRight,
  Volume2,
  LoaderCircle,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import AnswerMarkdown from './answer-markdown';
import { safeUrl } from '@/lib/logic.mjs';
import { localCopy } from '@/lib/locale-copy';
import type { Mode, Turn, HalLocation, PartialAnswer, ChatStage } from '@/lib/hal-types';
import AnswerFeedback from './answer-feedback';
import { AnswerTimings } from './answer-actions';
import MapShortcuts from './map-shortcuts';
import PlanSearchFact from './plan-search-fact';
type Props = {
  mode: Mode;
  turns: Record<Mode, Turn[]>;
  busy: Mode | null;
  location: HalLocation;
  activeQuery: string;
  partial: PartialAnswer | null;
  chatStage: ChatStage;
  access: string;
  speaking: boolean;
  onSpeak: (text: string) => void;
  onStopSpeaking: () => void;
  onSend: (text: string) => void;
};
function UserMessage({ text }: { text: string }) {
  return (
    <div className="user-message-row">
      <div className="user-message">
        <span className="message-author">Daisy</span>
        <p>{text}</p>
      </div>
      <img className="message-avatar" src="/daisy.jpg" alt="Daisy" width={32} height={32} />
    </div>
  );
}
// Display answers, sources and loading states; no provider calls happen here.
export default function Conversation({
  mode,
  turns,
  busy,
  location,
  activeQuery,
  partial,
  chatStage,
  access,
  speaking,
  onSpeak,
  onStopSpeaking,
  onSend,
}: Props) {
  const scroll = useRef<HTMLDivElement>(null),
    followStream = useRef(true);
  const ph = location.country === 'PH';
  const copy = localCopy[location.country || 'SG'] || localCopy.SG;
  const icons = mode === 'chat' ? [Utensils, CookingPot, MapPin] : [Luggage, Smartphone, House];
  const prompts = mode === 'plan' ? copy.plan : copy.chat;
  useEffect(() => {
    if (busy === mode) followStream.current = true;
  }, [busy, mode]);
  useEffect(() => {
    const container = scroll.current;
    if (!container) return;
    const latest = container.querySelector<HTMLElement>('.turn:last-child');
    const top =
      busy === mode || !latest
        ? container.scrollHeight
        : latest.getBoundingClientRect().top -
          container.getBoundingClientRect().top +
          container.scrollTop;
    container.scrollTo({ top, behavior: busy === mode ? 'auto' : 'smooth' });
  }, [turns, busy, mode]);
  useEffect(() => {
    const container = scroll.current;
    if (partial?.answer && container && followStream.current)
      container.scrollTo({ top: container.scrollHeight, behavior: 'auto' });
  }, [partial]);
  return (
    <div
      className="conversation"
      ref={scroll}
      onScroll={(e) => {
        const el = e.currentTarget;
        followStream.current = el.scrollHeight - el.clientHeight - el.scrollTop < 100;
      }}
      lang={location.speech}
    >
      {turns[mode].length === 0 && busy !== mode ? (
        <div className="welcome">
          <h1>{mode === 'plan' ? copy.planHeading : copy.heading}</h1>
          <div className="suggestions">
            {prompts.map((p, i) => {
              const Icon = ph && i === 0 ? BookOpen : icons[i];
              return (
                <button disabled={!!busy} key={p} onClick={() => onSend(p)}>
                  <Icon size={27} strokeWidth={1.6} />
                  <span>
                    {p}
                    {ph && i === 0 && (
                      <small className="suggestion-subtitle" lang="en">
                        Japan tourist visa for a Filipino
                      </small>
                    )}
                  </span>
                  <ChevronRight size={18} strokeWidth={1.4} />
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="messages">
          {turns[mode].map((t) => (
            <article className="turn" key={t.id}>
              <UserMessage text={t.query} />
              <div className="answer-label">
                <span className="mini-brand">h</span>hal
                {t.result.sample && <span className="sample-tag">Sample response</span>}
              </div>
              {t.result.title && <h2>{t.result.title}</h2>}
              {t.result.searchResults ? (
                <div className="lite-results">
                  {t.result.searchResults.map((r) => (
                    <a key={r.url} href={safeUrl(r.url) || '#'} target="_blank" rel="noreferrer">
                      <strong>
                        {r.title}
                        <ExternalLink size={13} />
                      </strong>
                      <span>{new URL(r.url).hostname}</span>
                      <p>{r.excerpt || 'Open source to read more.'}</p>
                    </a>
                  ))}
                </div>
              ) : (
                <AnswerMarkdown>{t.result.answer}</AnswerMarkdown>
              )}
              <MapShortcuts answer={t.result.answer} places={t.result.places} query={t.query} />
              {t.result.metrics?.generationMs != null && (
                <button
                  className="listen-answer"
                  onClick={() => {
                    if (speaking) {
                      onStopSpeaking();
                    } else onSpeak(t.result.answer);
                  }}
                >
                  <Volume2 size={15} />
                  {speaking ? 'Stop audio' : 'Listen'}
                </button>
              )}
              {t.result.sources.length > 0 && (
                <details className="sources">
                  <summary>
                    <BookOpen size={15} />
                    Sources · {t.result.sources.length}
                    <span
                      className="source-tokens"
                      title="Returned search highlights, estimated at 4 characters per token; not model usage"
                    >
                      Search tokens (est.){' '}
                      <strong>
                        {t.result.metrics?.estimatedHighlightTokens
                          ? t.result.metrics.estimatedHighlightTokens.toLocaleString()
                          : 'Not recorded'}
                      </strong>
                    </span>
                  </summary>
                  {t.result.sources.map(
                    (s, i) =>
                      safeUrl(s.url) && (
                        <a href={s.url} key={s.url} target="_blank" rel="noreferrer">
                          <span>
                            {i + 1}. {s.title}
                          </span>
                          <ExternalLink size={13} />
                        </a>
                      ),
                  )}
                </details>
              )}
              <div className="answer-footer">
                <AnswerFeedback
                  responseId={t.id}
                  mode={t.channel || mode}
                  access={access}
                  sources={t.result.sources}
                  metrics={t.result.metrics}
                />
                <AnswerTimings
                  planMs={
                    mode === 'plan' && !t.result.sample && t.result.elapsedMs > 0
                      ? t.result.elapsedMs
                      : undefined
                  }
                  searchMs={
                    mode === 'plan' ||
                    t.result.sample ||
                    (t.result.metrics?.searchType === 'deep' &&
                      t.result.metrics?.searchTimingSource !== 'exa')
                      ? undefined
                      : t.result.metrics?.searchMs
                  }
                  voiceMs={t.result.sample ? undefined : t.result.metrics?.voiceMs}
                />
              </div>
            </article>
          ))}
        </div>
      )}
      {busy === mode && <UserMessage text={activeQuery} />}
      {busy === mode && partial?.answer && (
        <div className="streaming-plan">
          <div className="answer-label">
            <span className="mini-brand">h</span>hal
          </div>
          {partial.title && <h2>{partial.title}</h2>}
          <AnswerMarkdown>{partial.answer}</AnswerMarkdown>
        </div>
      )}
      {busy === mode && (
        <div className="thinking" role="status">
          <LoaderCircle className="spin" size={20} />
          <div>
            <strong>
              {mode === 'plan'
                ? ph
                  ? 'Binubuo ang plano mo…'
                  : 'Putting your plan together…'
                : chatStage === 'connecting'
                  ? 'Connecting to Hal…'
                  : chatStage === 'searching'
                    ? 'Searching the web…'
                    : 'Writing your answer…'}
            </strong>
            {mode === 'plan' && !partial?.answer ? (
              <PlanSearchFact key={activeQuery} country={location.country} query={activeQuery} />
            ) : <span>
              {partial?.answer
                ? 'Answer arriving live…'
                : chatStage === 'connecting'
                    ? 'Getting ready…'
                    : chatStage === 'searching'
                      ? 'Looking for relevant sources'
                      : 'Preparing your reply…'}
            </span>}
            {mode === 'plan' && (
              <div className="progress">
                <i />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
