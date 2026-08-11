import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  CloudCog,
  Database,
  Eye,
  GitBranch,
  Github,
  KeyRound,
  LockKeyhole,
  Network,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { createElement } from 'react';
import './SelectedWork.css';

const proofPoints = [
  'Architecture decisions and controls, not client implementation details',
  'Security-reviewed public releases planned before any GitHub showcase links',
  'Redacted briefs and walkthroughs available for qualified conversations',
];

function DiagramNode({ icon: Icon, label, detail, tone = 'blue', className = '' }) {
  return (
    <div className={`work-diagram-node work-diagram-node-${tone} ${className}`.trim()}>
      <span className="work-diagram-icon" aria-hidden="true">{createElement(Icon, { size: 17, strokeWidth: 2.2 })}</span>
      <span className="work-diagram-copy">
        <strong>{label}</strong>
        {detail && <small>{detail}</small>}
      </span>
    </div>
  );
}

function AzureLighthouseDiagram() {
  return (
    <div className="work-diagram lighthouse-diagram" role="img" aria-label="Conceptual Azure Lighthouse governance diagram: a managing tenant applies scoped access, approval and oversight controls across customer Azure subscriptions.">
      <div className="work-diagram-label lighthouse-label-top">Managing tenant</div>
      <DiagramNode icon={Building2} label="Service provider" detail="Delegated operations" tone="navy" className="lighthouse-provider" />
      <div className="work-diagram-link link-provider-governance" aria-hidden="true"><i /></div>
      <div className="work-diagram-control-plane">
        <span className="control-plane-badge"><ShieldCheck size={14} aria-hidden="true" /> Governance plane</span>
        <DiagramNode icon={CloudCog} label="Azure Lighthouse" detail="Scoped delegation" tone="azure" />
        <div className="control-plane-controls" aria-label="Governance controls">
          <span><KeyRound size={13} aria-hidden="true" /> Least privilege</span>
          <span><Eye size={13} aria-hidden="true" /> Audit trail</span>
        </div>
      </div>
      <div className="work-diagram-link link-governance-scope" aria-hidden="true"><i /></div>
      <div className="lighthouse-scopes">
        <div className="work-diagram-label">Customer scopes</div>
        <DiagramNode icon={Network} label="Subscription A" detail="Defined role scope" tone="cyan" />
        <DiagramNode icon={Network} label="Subscription B" detail="Defined role scope" tone="cyan" />
        <DiagramNode icon={Network} label="Subscription C" detail="Defined role scope" tone="cyan" />
      </div>
      <div className="work-diagram-link link-approval" aria-hidden="true"><i /></div>
      <div className="lighthouse-approval"><LockKeyhole size={14} aria-hidden="true" /><span>Approval + offboarding controls</span></div>
    </div>
  );
}

function CrossCloudDiagram() {
  return (
    <div className="work-diagram cross-cloud-diagram" role="img" aria-label="Conceptual cross-cloud identity architecture diagram: a central identity plane provides federation, conditional access, and lifecycle governance to Azure Government, AWS Gov, and other cloud or hybrid environments.">
      <div className="cross-cloud-orbit orbit-one" aria-hidden="true" />
      <div className="cross-cloud-orbit orbit-two" aria-hidden="true" />
      <div className="cross-cloud-center">
        <span className="cross-cloud-center-icon"><KeyRound size={22} aria-hidden="true" /></span>
        <strong>Identity control plane</strong>
        <small>Federation · lifecycle · access context</small>
      </div>
      <DiagramNode icon={CloudCog} label="Azure Gov" detail="Entra-backed access" tone="azure" className="cloud-node cloud-node-azure" />
      <DiagramNode icon={CloudCog} label="AWS Gov" detail="Federated roles" tone="orange" className="cloud-node cloud-node-aws" />
      <DiagramNode icon={CloudCog} label="Extension" detail="Other cloud patterns" tone="mint" className="cloud-node cloud-node-gcp" />
      <DiagramNode icon={Users} label="People + services" detail="Lifecycle-aware identity" tone="navy" className="cloud-node cloud-node-users" />
      <div className="cross-cloud-signal signal-one" aria-hidden="true" />
      <div className="cross-cloud-signal signal-two" aria-hidden="true" />
      <div className="cross-cloud-controls" aria-label="Cross-cloud security controls">
        <span><ShieldCheck size={13} aria-hidden="true" /> Policy</span>
        <span><GitBranch size={13} aria-hidden="true" /> Federation</span>
        <span><Eye size={13} aria-hidden="true" /> Visibility</span>
      </div>
    </div>
  );
}

function SecureAiDiagram() {
  return (
    <div className="work-diagram secure-ai-diagram" role="img" aria-label="Conceptual secure AI platform reference diagram: approved users and applications enter through identity and policy controls, then use a governed AI orchestration layer connected to approved data and model services with observability.">
      <div className="secure-ai-lane secure-ai-inputs">
        <div className="work-diagram-label">Approved inputs</div>
        <DiagramNode icon={Users} label="Teams" detail="Human-in-the-loop" tone="navy" />
        <DiagramNode icon={Bot} label="Applications" detail="Service identity" tone="navy" />
      </div>
      <div className="secure-ai-arrow secure-ai-arrow-in" aria-hidden="true"><i /></div>
      <div className="secure-ai-core">
        <div className="secure-ai-core-top"><Sparkles size={16} aria-hidden="true" /><span>Governed AI control plane</span></div>
        <div className="secure-ai-core-grid">
          <span><KeyRound size={15} aria-hidden="true" /> Identity</span>
          <span><ShieldCheck size={15} aria-hidden="true" /> Policy</span>
          <span><LockKeyhole size={15} aria-hidden="true" /> Secrets</span>
          <span><Eye size={15} aria-hidden="true" /> Observability</span>
        </div>
        <div className="secure-ai-orchestrator"><CloudCog size={17} aria-hidden="true" /><strong>AI orchestration + review gates</strong></div>
      </div>
      <div className="secure-ai-arrow secure-ai-arrow-out" aria-hidden="true"><i /></div>
      <div className="secure-ai-lane secure-ai-services">
        <div className="work-diagram-label">Approved services</div>
        <DiagramNode icon={Bot} label="Models" detail="Model routing" tone="purple" />
        <DiagramNode icon={Database} label="Knowledge" detail="Governed data" tone="cyan" />
      </div>
      <div className="secure-ai-observability"><Eye size={14} aria-hidden="true" /><span>Traceable evaluation, monitoring, and human review</span></div>
    </div>
  );
}

const workItems = [
  {
    id: 'lighthouse',
    eyebrow: 'Private implementation · redacted reference',
    title: 'Azure Lighthouse Governance Reference',
    summary: 'A reusable governance approach for delegated Azure subscription operations across tenant boundaries—built around scoped roles, repeatable onboarding, oversight, and clean offboarding.',
    highlights: ['Role-and-permission mapping', 'Onboarding and validation sequence', 'Delegated-access guardrails'],
    diagram: <AzureLighthouseDiagram />,
    accent: 'azure',
  },
  {
    id: 'identity',
    eyebrow: 'Architecture evidence · cross-cloud focus',
    title: 'Cross-Cloud Identity Architecture',
    summary: 'A practical identity pattern rooted in Azure Government and AWS Gov federation, extensible to multi-cloud and hybrid environments where access policy and auditability must remain clear.',
    highlights: ['SAML federation and access boundaries', 'Lifecycle-aware operations', 'Policy and observability model'],
    diagram: <CrossCloudDiagram />,
    accent: 'identity',
  },
  {
    id: 'ai-platform',
    eyebrow: 'Emerging capability · reference architecture',
    title: 'Secure AI Platform Reference',
    summary: 'A vendor-neutral blueprint for taking an AI use case from experiment to governed delivery, with identity, secrets, policy, evaluation, observability, and human review designed in from the start.',
    highlights: ['Governed AI workflow design', 'Data and model boundaries', 'Evaluation and review controls'],
    diagram: <SecureAiDiagram />,
    accent: 'ai',
  },
];

export function SelectedWork() {
  return (
    <div className="selected-work-page">
      <section className="selected-work-hero">
        <div className="selected-work-shell">
          <div className="selected-work-hero-copy">
            <p className="selected-work-kicker"><span /> Selected work</p>
            <h1>Architecture evidence for work that needs to be trusted.</h1>
            <p className="selected-work-intro">These reference briefs show how I approach complex cloud, identity, and AI-platform problems—without exposing client information, private code, credentials, or production configuration.</p>
          </div>
          <aside className="selected-work-trust-card" aria-label="Evidence and publication note">
            <span className="selected-work-trust-icon"><ShieldCheck size={21} aria-hidden="true" /></span>
            <div>
              <strong>Private by design</strong>
              <p>Implementation repositories remain private. Any public GitHub release is pending a security review and will be purpose-built for sharing.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="selected-work-proof-strip" aria-label="How to read these references">
        <div className="selected-work-shell selected-work-proof-grid">
          {proofPoints.map((point) => <p key={point}><CheckCircle2 size={17} aria-hidden="true" />{point}</p>)}
        </div>
      </section>

      <section className="selected-work-gallery" aria-labelledby="reference-architectures-title">
        <div className="selected-work-shell">
          <div className="selected-work-heading">
            <p className="selected-work-kicker"><span /> Reference architectures</p>
            <h2 id="reference-architectures-title">The decisions behind the diagram matter.</h2>
            <p>Each brief is deliberately concrete about the operating model, controls, and delivery sequence—while keeping proprietary and security-sensitive implementation details private.</p>
          </div>

          <div className="selected-work-list">
            {workItems.map((item, index) => (
              <article className={`selected-work-card selected-work-card-${item.accent}`} key={item.id}>
                <div className="selected-work-card-copy">
                  <div className="selected-work-card-meta"><span>0{index + 1}</span><p>{item.eyebrow}</p></div>
                  <h3>{item.title}</h3>
                  <p className="selected-work-summary">{item.summary}</p>
                  <ul className="selected-work-highlights">
                    {item.highlights.map((highlight) => <li key={highlight}><CheckCircle2 size={16} aria-hidden="true" />{highlight}</li>)}
                  </ul>
                  <p className="selected-work-availability"><LockKeyhole size={15} aria-hidden="true" /> Redacted brief and guided walkthrough available in a qualified conversation.</p>
                </div>
                <div className="selected-work-card-visual">{item.diagram}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="selected-work-github">
        <div className="selected-work-shell selected-work-github-inner">
          <div>
            <p className="selected-work-kicker"><span /> GitHub, carefully curated</p>
            <h2>Public proof should be useful—and safe to share.</h2>
          </div>
          <div className="selected-work-github-copy">
            <p>Three purpose-built showcase repositories are planned: a sanitized Azure Lighthouse governance reference, a security-reviewed Azure AI platform reference, and this career site. They will be linked here only after security review—not by exposing private delivery repositories.</p>
            <span className="selected-work-github-status"><Github size={17} aria-hidden="true" /> GitHub releases pending security review</span>
          </div>
        </div>
      </section>

      <section className="selected-work-next">
        <div className="selected-work-shell selected-work-next-inner">
          <div><p className="selected-work-kicker"><span /> Start a conversation</p><h2>Need an architecture that is both ambitious and governable?</h2></div>
          <a className="selected-work-contact-link" href="mailto:goddsantana@gmail.com">Discuss your initiative <ArrowRight size={18} aria-hidden="true" /></a>
        </div>
      </section>
    </div>
  );
}

export default SelectedWork;
