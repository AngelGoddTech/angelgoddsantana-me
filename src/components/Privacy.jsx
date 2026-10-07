import { Link } from 'react-router-dom';
import notice from '../policy/assistant-notice.json';
import policyMarkdown from '../policy/ai-assistant-retention-policy.md?raw';

function LegalLinks() {
  return (
    <p>
      <Link to="/privacy">Assistant privacy</Link>{' · '}
      <Link to="/terms">Assistant terms</Link>{' · '}
      <Link to="/ai-retention-policy">Full adopted retention policy</Link>{' · '}
      <Link to="/assistant">Review the conversation notice</Link>
    </p>
  );
}

export default function PrivacyPage() {
  return (
    <section className="section">
      <div className="shell narrow-copy legal-copy">
        <h1>AI assistant privacy</h1>
        <p role="status">The assistant is currently unavailable. No conversation starts from this page.</p>
        <p>{notice.introduction}</p>
        <h2>Text and voice</h2>
        <p>{notice.modes.text}</p>
        <p>{notice.modes.voice}</p>
        <h2>Providers and data use</h2>
        <p>{notice.providers}</p>
        <p>These are Company accounts used for the assistant workflow. This notice makes no claim about training use, geographical restrictions or deletion of every provider backup. The workflow does not convert every activity on Angel’s professional site into a Company service.</p>
        <h2>Retention and Keep</h2>
        <p>{notice.retention}</p>
        <p>{notice.copies}</p>
        <p>Archive and Restore change inbox placement. They do not delete content or create, extend or end Keep. Missing evidence blocks disposition for reconciliation; it does not create an indefinite-retention policy.</p>
        <h2>Information boundaries and requests</h2>
        <p>{notice.restrictions}</p>
        <p>{notice.alternative}</p>
        <p>Identity, authority, applicable exceptions and response handling follow the <a href="https://goddtechnologies.com/privacy">Company Privacy Policy</a>. This assistant notice creates no additional waiver or request deadline.</p>
        <LegalLinks />
        <p><Link to="/contact">Use Angel’s professional contact links</Link>.</p>
      </div>
    </section>
  );
}

export function AssistantTermsPage() {
  return (
    <section className="section">
      <div className="shell narrow-copy legal-copy">
        <h1>AI assistant terms</h1>
        <p>These terms cover only the Company-operated AI assistant on this professional site. The assistant is currently unavailable.</p>
        <p>This assistant is for ordinary professional inquiries. Starting a conversation does not purchase a service, accept an order, book work or a meeting, confirm employment availability, quote rates or create an engagement. Any actual engagement requires separate human agreement.</p>
        <p>{notice.restrictions}</p>
        <p>Before each connection, review the actual privacy, provider and retention disclosures and expressly agree to the selected conversation mode. Text agreement does not authorize voice recording or microphone access. A changed mode, language or material notice requires renewed agreement.</p>
        <p>{notice.retention}</p>
        <p>{notice.copies}</p>
        <p>{notice.alternative}</p>
        <LegalLinks />
      </div>
    </section>
  );
}

export function RetentionPolicyPage() {
  return (
    <section className="section">
      <div className="shell narrow-copy legal-copy">
        <h1>Website AI assistant retention policy</h1>
        <p>The Company Owner adopted this policy effective October 7, 2026. Policy adoption is separate from verified operating readiness; the assistant remains unavailable.</p>
        <p>The policy supplements the <a href="https://goddtechnologies.com/privacy">Company Privacy Policy</a> and <a href="https://goddtechnologies.com/terms">Terms of Use and Service</a> for this specific workflow.</p>
        <pre className="policy-document" aria-label="Full adopted policy text">{policyMarkdown}</pre>
        <LegalLinks />
      </div>
    </section>
  );
}
