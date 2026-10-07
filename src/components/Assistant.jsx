import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import notice from '../policy/assistant-notice.json';
import { NOTICE_SHA256 } from '../policy/notice-hash';
import { readAssistantReadiness } from '../lib/assistantReadiness';

export default function AssistantPage() {
  const [mode, setMode] = useState('text');
  const [readinessChecked, setReadinessChecked] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    readAssistantReadiness({ ...notice, noticeSha256: NOTICE_SHA256 }, { signal: controller.signal })
      .then(() => setReadinessChecked(true))
      .catch(() => { if (!controller.signal.aborted) setReadinessChecked(false); });
    return () => controller.abort();
  }, []);

  return (
    <section className="section">
      <div className="shell narrow-copy legal-copy">
        <h1>AI assistant</h1>
        <p role="status">The assistant is currently unavailable. You can read the notices below or <Link to="/contact">contact Angel directly</Link>.</p>
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
        <p><Link to="/privacy">Privacy and provider disclosures</Link>{' · '}<Link to="/terms">Assistant terms</Link>{' · '}<Link to="/ai-retention-policy">Full adopted policy</Link></p>
        <label className="assistant-consent">
          <input type="checkbox" disabled checked={false} readOnly />
          I agree to start a {mode} conversation under these disclosures.
        </label>
        <p>Agreement and connection stay disabled while the assistant is unavailable. Changing mode or a material notice will require new agreement before a future connection.</p>
        <button className="button button-primary" type="button" disabled>Start {mode} conversation — unavailable</button>
        <p>{notice.alternative}</p>
        <span className="sr-only">{readinessChecked ? 'Server confirmed that the assistant bridge is unavailable.' : 'No verified assistant readiness.'}</span>
      </div>
    </section>
  );
}
