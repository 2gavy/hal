import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, MapPin } from 'lucide-react';
import { countries } from '@/lib/locale-copy';
type Props = {
  locale: string | null;
  locating: boolean;
  chooseCountry: (country: string) => void;
  useDeviceLocation: () => Promise<void>;
  onProfile: () => void;
  onNewConversation: () => void;
};
// Header owns only the country menu and its keyboard/outside-click behaviour.
export default function HalHeader({
  locale,
  locating,
  chooseCountry,
  useDeviceLocation,
  onProfile,
  onNewConversation,
}: Props) {
  const [countryOpen, setCountryOpen] = useState(false);
  const countryMenu = useRef<HTMLDivElement>(null);
  const countryTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!countryOpen) return;
    function outside(e: PointerEvent) {
      if (!countryMenu.current?.contains(e.target as Node)) setCountryOpen(false);
    }
    function escape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setCountryOpen(false);
        countryTrigger.current?.focus();
      }
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [countryOpen]);
  return (
    <header className="header">
      <div className="brand-row">
        <button
          className="wordmark"
          onClick={() => {
            onNewConversation();
          }}
          aria-label="Start a new conversation"
        >
          hal<span className="wordmark-plus">+</span>
        </button>
        <div className="header-actions">
          <div
            className="country-picker"
            ref={countryMenu}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setCountryOpen(false);
            }}
          >
            <button
              ref={countryTrigger}
              className="country-trigger"
              aria-label="Choose country"
              aria-expanded={countryOpen}
              aria-controls="country-options"
              onClick={() => setCountryOpen((v) => !v)}
            >
              <span aria-hidden="true">
                {countries.find((c) => c.code === locale)?.flag || '🌐'}
              </span>
              <ChevronDown size={12} />
            </button>
            {countryOpen && (
              <div
                id="country-options"
                className="country-popover"
                role="group"
                aria-label="Country"
              >
                {countries.map((c) => (
                  <button
                    key={c.code}
                    aria-pressed={locale === c.code}
                    onClick={() => {
                      chooseCountry(c.code);
                      setCountryOpen(false);
                      countryTrigger.current?.focus();
                    }}
                  >
                    <span aria-hidden="true">{c.flag}</span>
                    <span>{c.name}</span>
                    {locale === c.code && <Check size={15} />}
                  </button>
                ))}
                <button
                  disabled={locating}
                  onClick={() => {
                    setCountryOpen(false);
                    void useDeviceLocation();
                  }}
                >
                  <MapPin size={15} />
                  <span>{locating ? 'Locating…' : 'Use my location'}</span>
                </button>
              </div>
            )}
          </div>
          <button className="avatar" aria-label="Open profile settings" onClick={() => onProfile()}>
            <img src="/daisy.jpg" alt="Daisy" width={56} height={56} />
          </button>
        </div>
      </div>
    </header>
  );
}
