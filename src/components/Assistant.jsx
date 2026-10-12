import { useEffect, useRef, useState } from 'react';
import notice from '../policy/assistant-notice.json';
import { createPersonalDirectSession } from '../lib/assistantDirect';
import './Assistant.css';
import VoiceMount from './VoiceMount';

export default function AssistantPage({ createSession = createPersonalDirectSession } = {}) {
  const [mode, setMode] = useState('text');
  const [voiceMode, setVoiceMode] = useState('listening');
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [phase, setPhase] = useState('unavailable');
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const bridge = useRef(null);
  const session = useRef(null);
  const pendingStart = useRef(null);
  const closing = useRef(Promise.resolve());
  const closingActive = useRef(false);
  const closeFailed = useRef(false);
  const generation = useRef(0);
  if (!bridge.current) bridge.current = createSession();

  async function stopOwned() {
    closingActive.current = true;
    const current = session.current;
    const pending = pendingStart.current;
    session.current = null;
    const previous = closing.current;
    const close = Promise.all([previous, current ? current.endSession() : Promise.resolve(),
      pending ? pending.catch(() => null).then(value => value?.endSession()) : Promise.resolve()]);
    closing.current = close;
    try {
      await close;
      if (closing.current === close) closingActive.current = false;
    } catch { closeFailed.current = true; throw new Error('assistant_disconnect_unavailable'); }
  }

  async function end() {
    const current = ++generation.current;
    setAgreed(false); setMuted(false); setPhase('closing');
    try {
      await stopOwned();
      if (current === generation.current) setPhase(ready ? 'ended' : 'unavailable');
    } catch { if (current === generation.current) { setReady(false); setPhase('error'); } }
  }

  async function start() {
    if (!ready || !agreed || phase === 'connecting' || session.current || pendingStart.current
        || closingActive.current || closeFailed.current) return;
    const current = ++generation.current;
    setPhase('connecting');
    setMessages([]);
    const opening = (async () => {
      return bridge.current.startSession({consent: {source: notice.source, mode}, textOnly: mode === 'text',
        isCurrent: () => current === generation.current,
        callbacks: {onConnect: () => { if (current === generation.current) setPhase('active'); },
          onModeChange: value => { if (current === generation.current && mode === 'voice') setVoiceMode(value?.mode === 'speaking' ? 'speaking' : 'listening'); },
          onDisconnect: () => { if (current === generation.current) { session.current = null; setPhase('ended'); setAgreed(false); } },
          onError: () => { if (current === generation.current) { end().then(() => { setReady(false); setPhase('error'); }); } },
          onGuardrailTriggered: () => { if (current === generation.current) end(); },
          onMessage: value => { if (current === generation.current && ['user','agent'].includes(value?.role) && typeof value.message === 'string')
            setMessages(previous => [...previous, {role: value.role, message: value.message.slice(0,10000)}].slice(-50)); }}});
    })();
    pendingStart.current = opening;
    try {
      const value = await opening;
      if (current !== generation.current) { await value.endSession(); return; }
      session.current = value;
    } catch { if (current === generation.current) { setPhase('error'); setAgreed(false); } }
    finally { if (pendingStart.current === opening) pendingStart.current = null; }
  }

  useEffect(() => {
    const generationRef = generation;
    const current = ++generation.current;
    setReady(false); setAgreed(false); setMuted(false); setVoiceMode('listening'); setPhase('unavailable');
    stopOwned().then(() => {
      if (closeFailed.current || current !== generation.current) throw new Error('assistant_unavailable');
      return bridge.current.prepare(mode);
    }).then(() => {
      if (current === generation.current) { setReady(true); setPhase('awaiting'); }
    }).catch(() => { if (current === generation.current) { setReady(false); setPhase('error'); } });
    return () => { generationRef.current++; bridge.current.clear(); stopOwned().catch(() => {}); };
  }, [mode]);

  const busy = ['connecting', 'active', 'closing'].includes(phase);
  const showTranscript = messages.length > 0 && ['active', 'closing', 'ended', 'error'].includes(phase);
  const labels = {unavailable: 'Unavailable', awaiting: 'Ready when you are', connecting: 'Connecting',
    active: 'Connected', closing: 'Ending', ended: 'Conversation ended', error: 'Connection unavailable'};
  const statusText = phase === 'active' ? 'Conversation connected.'
    : phase === 'connecting' ? 'Connecting your agreed conversation.'
    : phase === 'closing' ? 'Ending the conversation.'
    : phase === 'ended' ? 'Conversation ended. Review the notice and agree to start again.'
    : phase === 'error' ? 'The assistant is currently unavailable. You can contact Angel directly.'
    : ready ? 'Review the notice and agree before connecting.' : 'The assistant is currently unavailable.';
  const emptyTitle = phase === 'connecting' ? 'Opening your conversation'
    : phase === 'closing' ? 'Finishing up'
    : phase === 'ended' ? 'Thanks for the conversation'
    : phase === 'error' ? 'Let’s connect another way'
    : phase === 'active' ? (mode === 'voice' ? 'Your voice conversation is connected' : 'What would you like to explore?')
    : 'A little context goes a long way.';
  const emptyText = phase === 'connecting' || phase === 'closing' ? 'Please wait a moment.'
    : phase === 'error' ? 'Use the contact link for a direct conversation with Angel.'
    : phase === 'ended' ? 'You can start a new conversation with a fresh agreement.'
    : phase === 'active' ? (mode === 'voice' ? 'Speak naturally. Your transcript will appear here.' : 'Write your first message below.')
    : 'Choose text or voice, review the disclosures, and start when you’re ready. Nothing is sent before you agree.';

  return (
    <section className="assistant-page" aria-labelledby="assistant-page-title">
      <div className="shell assistant-layout">
        <aside className="assistant-intro">
          <p className="assistant-eyebrow">A direct line to the right context</p>
          <h1 id="assistant-page-title">A conversation<br />starts here.</h1>
          <p className="assistant-introduction">{notice.introduction}</p>
          <ol className="assistant-topics" aria-label="Useful conversation topics">
            <li><span aria-hidden="true">01</span><div><strong>Cloud &amp; AI architecture</strong><p>Explore an idea, a platform challenge, or a project’s direction.</p></div></li>
            <li><span aria-hidden="true">02</span><div><strong>Relevant experience</strong><p>Ask about Angel’s background and the work that connects to yours.</p></div></li>
            <li><span aria-hidden="true">03</span><div><strong>Ways to work together</strong><p>Share a little context for a professional inquiry and follow-up.</p></div></li>
          </ol>
          <nav className="assistant-privacy-links" aria-label="Assistant privacy and terms">
            {notice.links.map(link => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={`${link.label} (opens in a new tab)`}>{link.label}</a>)}
          </nav>
          <div className="assistant-direct-contact"><strong>Prefer a human reply?</strong><a href="/contact">Contact Angel directly <span aria-hidden="true">↗</span></a><p>{notice.alternative}</p></div>
        </aside>

        <article className="assistant-panel" data-phase={phase} aria-labelledby="assistant-panel-title">
          <header className="assistant-panel-header">
            <div className="assistant-identity"><img src="./ags-mark.svg" alt="" width="44" height="44" /><div><p>Professional inquiries</p><h2 id="assistant-panel-title">Angel’s AI assistant</h2></div></div>
            <span className="assistant-state-pill">{phase === 'active' && mode === 'voice' ? (muted ? 'Microphone muted' : voiceMode === 'speaking' ? 'Speaking' : 'Listening') : labels[phase]}</span>
          </header>
          <div className="assistant-toolbar">
            <fieldset className="assistant-mode-picker assistant-segmented">
              <legend className="assistant-sr-only">Choose a mode to review its notice</legend>
              {['text', 'voice'].map(value => <label key={value}>
                <input type="radio" name="assistant-mode" value={value} checked={mode === value} onChange={() => setMode(value)} />
                <span className={`assistant-mode-symbol assistant-mode-symbol-${value}`} aria-hidden="true">{value === 'text' ? 'Aa' : '◖◗'}</span>
                <span>{value === 'text' ? 'Text' : 'Voice'}</span>
              </label>)}
            </fieldset>
            {busy && mode === 'text' && <button className="assistant-end" type="button" disabled={phase === 'closing'} onClick={end}>End conversation</button>}
          </div>

          {mode === 'voice' && <VoiceMount phase={phase} voiceMode={voiceMode} muted={muted}
            getInputVolume={() => session.current?.getInputVolume?.() ?? 0}
            getOutputVolume={() => session.current?.getOutputVolume?.() ?? 0}
            onMute={value => { try { session.current?.setMicMuted(value); setMuted(value); } catch { end(); } }} onEnd={end}/>}
          <div className="assistant-review">
            <p className="assistant-mode-notice" key={mode} data-assistant-mode={mode}>{notice.modes[mode]}</p>
            <details className="assistant-disclosures">
              <summary>Read the full conversation disclosures</summary>
              <div className="assistant-disclosure-content" tabIndex={0} aria-label="Full conversation disclosures">
                <h3>Providers</h3><p>{notice.providers}</p>
                <h3>Retention and copies</h3><p>{notice.retention}</p><p>{notice.copies}</p>
                <h3>Before you share</h3><p>{notice.restrictions}</p>
              </div>
            </details>
          </div>

          <div className="assistant-consent-panel" hidden={phase === 'active'}>
            <label className="assistant-consent">
              <input type="checkbox" disabled={!ready || busy} checked={agreed} onChange={event => setAgreed(event.target.checked)} />
              <span>{notice.agreement[mode]}</span>
            </label>
            <p className="assistant-renewal">{notice.renewal}</p>
            <button className="button button-primary assistant-start" type="button" disabled={!ready || !agreed || busy} onClick={start}>Start {mode} conversation{ready ? '' : ' — unavailable'}</button>
          </div>

          <div className={`assistant-chat-stage${showTranscript ? ' has-messages' : ''}`} hidden={mode === 'voice' && !showTranscript}>
            <p className="assistant-session-status" role="status">{statusText}</p>
            {showTranscript ? <ol className="assistant-transcript" aria-label="Conversation transcript" aria-live="polite" role="log">
              {messages.map((value, index) => <li className={`assistant-message assistant-message-${value.role}`} key={index}>
                <span className="assistant-message-author">{value.role === 'user' ? 'You' : 'Assistant'}</span><p>{value.message}</p>
              </li>)}
            </ol> : <div className="assistant-empty-state">
              <span className="assistant-chat-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-3 3v-9.5A7.5 7.5 0 0 1 9.5 5h3A7.5 7.5 0 0 1 20 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 10h6M8 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
              <h3>{emptyTitle}</h3><p>{emptyText}</p>
            </div>}
          </div>

          {mode === 'text' && <form className="assistant-composer" onSubmit={event => { event.preventDefault(); if (session.current?.isOpen() && message.trim()) { session.current.sendUserMessage(message); setMessage(''); } }}>
            <label htmlFor="assistant-message-input">Your message</label>
            <div className="assistant-composer-row"><textarea id="assistant-message-input" value={message} maxLength={2000} disabled={phase !== 'active'} placeholder={phase === 'active' ? 'What would you like to explore?' : 'Agree and start to write a message.'} onChange={event => setMessage(event.target.value)} /><button type="submit" disabled={phase !== 'active' || !message.trim()}>Send <span aria-hidden="true">↑</span></button></div>
          </form>}
          <footer className="assistant-panel-footer"><span aria-hidden="true">✦</span> AI replies need human review.</footer>
        </article>
      </div>
    </section>
  );
}
