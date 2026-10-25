'use client';
import { useRef } from 'react';
import HalHeader from './components/hal-header';
import Conversation from './components/conversation';
import Composer from './components/composer';
import AccountDialogs from './components/account-dialogs';
import ElevenVoice from './components/eleven-voice';
import { useHal } from './hooks/use-hal';

// Page = layout and wiring. Each component owns one visible part of Hal.
export default function Home() {
  const hal = useHal();
  const touch = useRef<{ x: number; y: number } | null>(null);
  return (
    <main className="stage">
      <section
        data-restoring={!hal.ready}
        className={`app-shell${hal.upgraded ? ' is-premium' : ''}`}
        onTouchStart={(e) => {
          if ((e.target as HTMLElement).closest('textarea,input,button,a,.overlay')) return;
          touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={(e) => {
          if (!touch.current) return;
          const dx = e.changedTouches[0].clientX - touch.current.x,
            dy = e.changedTouches[0].clientY - touch.current.y;
          if (
            Math.abs(dx) > 75 &&
            Math.abs(dx) > Math.abs(dy) * 1.5 &&
            !hal.paywall &&
            !hal.settings &&
            !hal.callOpen
          )
            hal.change(dx < 0 ? 'plan' : 'chat');
          touch.current = null;
        }}
      >
        <HalHeader
          locale={hal.location.country}
          locating={hal.locating}
          chooseCountry={hal.chooseCountry}
          useDeviceLocation={hal.useDeviceLocation}
          onProfile={() => hal.setProfile('settings')}
          onNewConversation={hal.newConversation}
        />
        <Conversation
          mode={hal.mode}
          turns={hal.turns}
          busy={hal.busy}
          location={hal.location}
          activeQuery={hal.activeQuery}
          partial={hal.partial}
          chatStage={hal.chatStage}
          access={hal.access}
          speaking={hal.speaking}
          onSpeak={hal.speak}
          onStopSpeaking={hal.stopSpeaking}
          onSend={hal.send}
        />
        <Composer
          mode={hal.mode}
          busy={hal.busy}
          ready={hal.ready}
          drafts={hal.drafts}
          locale={hal.location.country}
          runs={hal.runs}
          upgraded={hal.upgraded}
          error={hal.error}
          toast={hal.toast}
          callButton={hal.callButton}
          onDraftChange={hal.setDraft}
          onSend={() => hal.send()}
          onStop={hal.stop}
          onModeChange={hal.change}
          onStartVoice={hal.startCall}
          onUpgrade={() => hal.setPaywall(true)}
        />
        {hal.callOpen && (
          <ElevenVoice
            premium={hal.upgraded}
            access={hal.access}
            location={hal.location}
            onClose={hal.endCall}
            onTurn={hal.onVoiceTurn}
          />
        )}
        <AccountDialogs
          ph={hal.location.country === 'PH'}
          profile={hal.profile}
          setProfile={hal.setProfile}
          paywall={hal.paywall}
          setPaywall={hal.setPaywall}
          settings={hal.settings}
          setSettings={hal.setSettings}
          upgraded={hal.upgraded}
          setUpgraded={hal.setUpgraded}
          runs={hal.runs}
          busy={hal.busy}
          access={hal.access}
          setAccess={hal.setAccess}
          accessError={hal.accessError}
          setToast={hal.setToast}
          onModeChange={hal.change}
          onReset={hal.resetDemo}
          onContinue={hal.continueWithCode}
        />
      </section>
    </main>
  );
}
