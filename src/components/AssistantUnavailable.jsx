export default function AssistantUnavailable() {
  return (
    <section className="section section-muted">
      <div className="shell narrow-copy">
        <p className="eyebrow">Personal contact</p>
        <h1>Let’s connect directly.</h1>
        <p role="status">The AI assistant is temporarily unavailable.</p>
        <p>For project inquiries, questions about my experience, or next steps, please contact me directly.</p>
        <div className="button-row">
          <a className="button button-primary" href="/contact">Contact Angel</a>
          <a className="button button-secondary" href="/privacy">Privacy and provider disclosures</a>
          <a className="button button-secondary" href="/terms">Assistant terms</a>
        </div>
      </div>
    </section>
  );
}
