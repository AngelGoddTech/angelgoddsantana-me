import { useEffect, useRef, useState } from 'react';
import notice from '../policy/assistant-notice.json';
import { NOTICE_SHA256 } from '../policy/notice-hash';
import { createPersonalAssistantBridge } from '../lib/assistantSession';

export default function AssistantPage() {
  const [mode, setMode] = useState('text');
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
  if (!bridge.current) bridge.current = createPersonalAssistantBridge(notice, NOTICE_SHA256);

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
    setAgreed(false); setPhase('closing');
    try {
      await stopOwned();
      if (current === generation.current) setPhase(ready ? 'awaiting' : 'unavailable');
    } catch { if (current === generation.current) { setReady(false); setPhase('unavailable'); } }
  }

  async function start() {
    if (!ready || !agreed || phase === 'connecting' || session.current || pendingStart.current
        || closingActive.current || closeFailed.current) return;
    const current = ++generation.current;
    setPhase('connecting');
    setMessages([]);
    const opening = (async () => {
      const authorization = await bridge.current.authorizeConsent({source: notice.source, mode, language: notice.language,
        policyVersion: notice.policyVersion, noticeVersion: notice.noticeVersion, noticeSha256: NOTICE_SHA256});
      return bridge.current.startAuthorizedSession({authorization: authorization.authorization, textOnly: mode === 'text',
        isCurrent: () => current === generation.current,
        callbacks: {onConnect: () => { if (current === generation.current) setPhase('active'); },
          onDisconnect: () => { if (current === generation.current) { session.current = null; setPhase('awaiting'); setAgreed(false); } },
          onError: () => { if (current === generation.current) { end().then(() => { setReady(false); setPhase('unavailable'); }); } },
          onGuardrailTriggered: () => { if (current === generation.current) end(); },
          onMessage: value => { if (current === generation.current && ['user','agent'].includes(value?.role) && typeof value.message === 'string')
            setMessages(previous => [...previous, {role: value.role, message: value.message.slice(0,10000)}].slice(-50)); }}});
    })();
    pendingStart.current = opening;
    try {
      const value = await opening;
      if (current !== generation.current) { await value.endSession(); return; }
      session.current = value;
    } catch { if (current === generation.current) { setPhase('unavailable'); setAgreed(false); } }
    finally { if (pendingStart.current === opening) pendingStart.current = null; }
  }

  useEffect(() => {
    const generationRef = generation;
    const current = ++generation.current;
    setReady(false); setAgreed(false); setPhase('unavailable');
    stopOwned().then(() => {
      if (closeFailed.current || current !== generation.current) throw new Error('assistant_unavailable');
      return bridge.current.prepare(mode);
    }).then(() => {
      if (current === generation.current) { setReady(true); setPhase('awaiting'); }
    }).catch(() => { if (current === generation.current) setReady(false); });
    return () => { generationRef.current++; bridge.current.clear(); stopOwned().catch(() => {}); };
  }, [mode]);

  return (
    <section className="section">
      <div className="shell narrow-copy legal-copy">
        <h1>AI assistant</h1>
        <p role="status">{phase === 'active' ? 'Conversation connected.' : phase === 'connecting' ? 'Connecting your agreed conversation.' : phase === 'closing' ? 'Ending the conversation.' : ready ? 'Review the notice and agree before connecting.' : 'The assistant is currently unavailable.'} You can <a href="/contact">contact Angel directly</a>.</p>
        <p>{notice.introduction}</p>
        <fieldset className="assistant-mode-picker">
          <legend>Choose a mode to review its notice</legend>
          {['text', 'voice'].map((value) => (
            <label key={value}>
              <input type="radio" name="assistant-mode" value={value} checked={mode === value} onChange={() => setMode(value)} />
              {value === 'text' ? 'Text' : 'Voice'}
            </label>
          ))}
        </fieldset>
        <p key={mode} data-assistant-mode={mode}>{notice.modes[mode]}</p>
        <p>{notice.providers}</p>
        <p>{notice.retention}</p>
        <p>{notice.copies}</p>
        <p>{notice.restrictions}</p>
        <p>{notice.links.map((link, index) => <span key={link.href}>{index ? ' · ' : ''}<a href={link.href} target="_blank" rel="noopener noreferrer" aria-label={`${link.label} (opens in a new tab)`}>{link.label}</a></span>)}</p>
        <label className="assistant-consent">
          <input type="checkbox" disabled={!ready || ['connecting','active','closing'].includes(phase)} checked={agreed} onChange={event => setAgreed(event.target.checked)} />
          {notice.agreement[mode]}
        </label>
        <p>{notice.renewal}</p>
        <button className="button button-primary" type="button" disabled={!ready || !agreed || ['connecting','active','closing'].includes(phase)} onClick={start}>Start {mode} conversation{ready ? '' : ' — unavailable'}</button>
        {['connecting','active'].includes(phase) && <button className="button" type="button" onClick={end}>End conversation</button>}
        {phase === 'active' && <ol aria-label="Conversation transcript" aria-live="polite">{messages.map((value,index) => <li key={index}>{value.role === 'user' ? 'You' : 'Assistant'}: {value.message}</li>)}</ol>}
        {phase === 'active' && mode === 'text' && <form onSubmit={event => { event.preventDefault(); if (session.current?.isOpen() && message.trim()) { session.current.sendUserMessage(message); setMessage(''); } }}>
          <label>Your message<textarea value={message} maxLength={2000} onChange={event => setMessage(event.target.value)} /></label><button type="submit">Send</button>
        </form>}
        <p>{notice.alternative}</p>
        <span className="sr-only">{ready ? 'The assistant is ready for your agreement.' : 'The assistant is unavailable.'}</span>
      </div>
    </section>
  );
}
