import { useEffect, useRef } from 'react';
import {
  Luggage,
  ClipboardList,
  X,
  Sparkles,
  ChevronRight,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import { remaining } from '@/lib/logic.mjs';
import type { Mode, Profile } from '@/lib/hal-types';
type Props = {
  ph: boolean;
  profile: Profile;
  setProfile: (profile: Profile) => void;
  paywall: boolean;
  setPaywall: (open: boolean) => void;
  settings: boolean;
  setSettings: (open: boolean) => void;
  upgraded: boolean;
  setUpgraded: (value: boolean) => void;
  runs: number;
  busy: Mode | null;
  access: string;
  setAccess: (value: string) => void;
  accessError: string;
  setToast: (message: string) => void;
  onModeChange: (mode: Mode) => void;
  onReset: () => void;
  onContinue: (code: string) => void;
};
// Membership and access dialogs share focus trapping and Escape handling.
export default function AccountDialogs({
  ph,
  profile,
  setProfile,
  paywall,
  setPaywall,
  settings,
  setSettings,
  upgraded,
  setUpgraded,
  runs,
  busy,
  access,
  setAccess,
  accessError,
  setToast,
  onModeChange,
  onReset,
  onContinue,
}: Props) {
  const dialog = useRef<HTMLDivElement>(null),
    opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!paywall && !settings && !profile) return;
    opener.current = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.querySelector<HTMLElement>('button')?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setPaywall(false);
        setSettings(false);
        setProfile(null);
      }
      if (e.key === 'Tab') {
        const els = dialog.current?.querySelectorAll<HTMLElement>('button,input,select,a[href]');
        if (!els?.length) return;
        const first = els[0],
          last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener('keydown', key);
      opener.current?.focus();
    };
  }, [paywall, settings, profile]);
  return (
    <>
      {' '}
      {paywall && (
        <div className="overlay" onClick={() => setPaywall(false)}>
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="paywall-title"
            ref={dialog}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="handle" />
            <button
              className="close circle subtle"
              aria-label="Close upgrade"
              onClick={() => setPaywall(false)}
            >
              <X size={21} />
            </button>
            <h2 id="paywall-title">
              {ph ? 'Ipagpatuloy ang pagplano.' : 'Go a little further with Hal+.'}
            </h2>
            <p className="muted">
              {runs >= 3
                ? ph
                  ? 'Nagamit mo na ang 3 libreng plano.'
                  : 'You’ve used your 3 free plan runs.'
                : ph
                  ? 'Mas maraming plano, mas maraming posibilidad.'
                  : 'Make room for your bigger questions.'}
            </p>
            <ul className="benefits">
              <li>
                <Luggage size={22} />
                {ph ? 'Mga itinerary ayon sa budget mo' : 'Itineraries that fit your budget'}
              </li>
              <li>
                <ClipboardList size={22} />
                {ph ? 'Mas madaling paghahambing' : 'Clearer comparisons, easier decisions'}
              </li>
            </ul>
            <div className="price">
              <strong>Hal+ Monthly</strong>
              <span>
                <b>S$9.90</b> / {ph ? 'buwan' : 'month'}
              </span>
            </div>
            <button
              className="upgrade"
              onClick={() => {
                setUpgraded(true);
                setPaywall(false);
              }}
            >
              {ph ? 'Mag-subscribe sa Hal+' : 'Get Hal+'}
            </button>
            <button
              className="back-chat"
              onClick={() => {
                setPaywall(false);
                onModeChange('chat');
              }}
            >
              {ph ? 'Bumalik sa Chat' : 'Back to Chat'}
            </button>
            {runs > 0 && (
              <p className="fine">
                {ph
                  ? `Available pa rin ang iyong ${runs} plano.`
                  : 'Your existing plans are still yours.'}
              </p>
            )}
          </div>
        </div>
      )}
      {profile && (
        <div className="overlay" onClick={() => setProfile(null)}>
          <div
            className="sheet account-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-title"
            ref={dialog}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close circle subtle"
              aria-label="Close profile settings"
              onClick={() => setProfile(null)}
            >
              <X size={21} />
            </button>
            {profile === 'settings' ? (
              <>
                <div className="profile-summary">
                  <img src="/daisy.jpg" alt="" />
                  <div>
                    <h2 id="account-title">Daisy</h2>
                    <p className="muted">{upgraded ? 'Hal+ member' : 'Free Hal'}</p>
                  </div>
                </div>
                <h3 className="account-section-title">Settings</h3>
                <button className="account-row" onClick={() => setProfile('subscription')}>
                  <Sparkles size={20} />
                  <span>
                    Manage Hal+
                    <small>
                      {upgraded
                        ? 'Your membership and subscription'
                        : 'Explore your membership options'}
                    </small>
                  </span>
                  <ChevronRight size={17} />
                </button>
                <button
                  className="account-row"
                  disabled={!!busy}
                  onClick={() => {
                    onReset();
                  }}
                >
                  <RotateCcw size={20} />
                  <span>
                    Reset demo<small>Start fresh with 3 plan runs</small>
                  </span>
                  <ChevronRight size={17} />
                </button>
              </>
            ) : profile === 'subscription' ? (
              <>
                <button
                  className="sheet-back"
                  aria-label="Back to settings"
                  onClick={() => setProfile('settings')}
                >
                  <ArrowLeft size={21} />
                </button>
                <h2 id="account-title">Your membership</h2>
                <div className="membership-card">
                  <span>{upgraded ? 'Hal+ Monthly' : 'Free Hal'}</span>
                  <strong>
                    {upgraded
                      ? 'S$9.90 / month'
                      : `${remaining(runs)} plan ${remaining(runs) === 1 ? 'run' : 'runs'} left`}
                  </strong>
                  <p>
                    {upgraded
                      ? 'More room for your bigger questions.'
                      : 'Everyday chat, with a taste of Plan.'}
                  </p>
                </div>
                <p className="account-note">This is a demo membership. No payment is collected.</p>
                {upgraded ? (
                  <button
                    className="cancel-membership"
                    disabled={!!busy}
                    onClick={() => setProfile('cancel')}
                  >
                    Cancel subscription
                  </button>
                ) : (
                  <button
                    className="upgrade"
                    onClick={() => {
                      setProfile(null);
                      setPaywall(true);
                    }}
                  >
                    Explore Hal+
                  </button>
                )}
              </>
            ) : (
              <>
                <h2 id="account-title">Cancel Hal+?</h2>
                <p className="muted">
                  You’ll return to free Hal immediately in this demo. Your conversations and
                  completed plans stay available. Your used plan runs won’t reset.
                </p>
                <button
                  className="upgrade keep-membership"
                  onClick={() => setProfile('subscription')}
                >
                  Keep Hal+
                </button>
                <button
                  className="cancel-membership"
                  disabled={!!busy}
                  onClick={() => {
                    setUpgraded(false);
                    setProfile('subscription');
                    setToast('Hal+ cancelled. Your conversations and plans are still here.');
                  }}
                >
                  Confirm cancellation
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {settings && (
        <div className="overlay" onClick={() => setSettings(false)}>
          <div
            className="sheet settings"
            role="dialog"
            aria-modal="true"
            aria-labelledby="access-title"
            ref={dialog}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close circle subtle"
              aria-label="Close access prompt"
              onClick={() => setSettings(false)}
            >
              <X size={21} />
            </button>
            <h2 id="access-title">Enter access code</h2>
            <p className="muted">Required for Chat and Voice. Plan needs no code.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!access.trim()) return;
                setSettings(false);
                onContinue(access.trim());
              }}
            >
              <label>
                Access code
                <input
                  autoFocus
                  required
                  type="password"
                  autoComplete="off"
                  value={access}
                  onChange={(e) => setAccess(e.target.value)}
                  placeholder="Your demo access code"
                />
              </label>
              {accessError && (
                <p role="alert" className="muted">
                  {accessError}
                </p>
              )}
              <button className="upgrade" type="submit" disabled={!!busy || !access.trim()}>
                Continue
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
