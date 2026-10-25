import { useEffect, useRef, type RefObject } from 'react';
import { ArrowUp, ArrowRight, Phone, Sparkles, Square, Check } from 'lucide-react';
import { remaining } from '@/lib/logic.mjs';
import { localCopy } from '@/lib/locale-copy';
import type { Mode } from '@/lib/hal-types';
type Props = {
  mode: Mode;
  busy: Mode | null;
  ready: boolean;
  drafts: Record<Mode, string>;
  locale: string | null;
  runs: number;
  upgraded: boolean;
  error: string;
  toast: string;
  callButton: RefObject<HTMLButtonElement | null>;
  onDraftChange: (text: string) => void;
  onSend: () => void;
  onStop: () => void;
  onModeChange: (mode: Mode) => void;
  onStartVoice: () => void;
  onUpgrade: () => void;
};
// Input, mode switch and Stop button. Request state is owned by useHal.
export default function Composer({
  mode,
  busy,
  ready,
  drafts,
  locale,
  runs,
  upgraded,
  error,
  toast,
  callButton,
  onDraftChange,
  onSend,
  onStop,
  onModeChange,
  onStartVoice,
  onUpgrade,
}: Props) {
  const composerInput = useRef<HTMLTextAreaElement>(null);
  const copy = localCopy[locale || 'SG'] || localCopy.SG;
  useEffect(() => {
    const input = composerInput.current;
    if (!input) return;
    const resize = () => {
      input.style.height = '0px';
      const lineHeight = parseFloat(getComputedStyle(input).lineHeight) || 24;
      const maxHeight = lineHeight * 5 + 20;
      input.style.height = `${Math.min(input.scrollHeight, maxHeight)}px`;
      input.style.overflowY = input.scrollHeight > maxHeight ? 'auto' : 'hidden';
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [drafts, mode]);
  return (
    <div className="bottom">
      <div aria-live="polite">
        {error && <div className="error">{error}</div>}
        {toast && <div className="toast">{toast}</div>}
      </div>
      {mode === 'plan' && !upgraded && (
        <button className="quota" onClick={() => !upgraded && onUpgrade()}>
          <span>
            {upgraded
              ? 'Hal+ activated'
              : `${remaining(runs)} plan ${remaining(runs) === 1 ? 'run' : 'runs'} left`}
          </span>
          <strong>
            {upgraded ? (
              <Check size={17} />
            ) : (
              <>
                Hal+ <ArrowRight size={18} />
              </>
            )}
          </strong>
        </button>
      )}
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
      >
        <div className="input-row">
          <textarea
            ref={composerInput}
            rows={1}
            maxLength={2000}
            aria-label={mode === 'plan' ? 'Plan request' : 'Message Hal'}
            placeholder={mode === 'plan' ? copy.planPlaceholder : copy.placeholder}
            value={drafts[mode]}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          {busy ? (
            <button
              className="circle send"
              type="button"
              aria-label="Stop response"
              title="Stop response"
              onClick={() => onStop()}
            >
              <Square className="send-stop" size={17} />
            </button>
          ) : (
            <button className="circle send" disabled={!ready} aria-label="Send message">
              <ArrowUp size={25} />
            </button>
          )}
        </div>
        <div className="switch voice-dock" role="group" aria-label="Assistant mode">
          <button
            type="button"
            aria-pressed={mode === 'chat'}
            className={mode === 'chat' ? 'selected' : ''}
            onClick={() => onModeChange('chat')}
          >
            Chat
          </button>
          <button
            ref={callButton}
            type="button"
            className="call-launch"
            disabled={!!busy}
            aria-label="Start voice conversation"
            onClick={() => {
              onStartVoice();
            }}
          >
            <Phone size={22} fill="currentColor" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-pressed={mode === 'plan'}
            className={mode === 'plan' ? 'selected' : ''}
            onClick={() => onModeChange('plan')}
          >
            Plan {upgraded && <Sparkles size={13} />}
          </button>
        </div>
      </form>
    </div>
  );
}
