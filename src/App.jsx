import { useEffect, useState } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CloudCog,
  Download,
  FileText,
  Linkedin,
  Mail,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import './App.css';
import SelectedWork from './components/SelectedWork';

const RESUME_PDF = '/documents/Angel_Godd_Santana_Principal_Cloud_AI_Architect_Resume.pdf';
const RESUME_DOCX = '/documents/Angel_Godd_Santana_Principal_Cloud_AI_Architect_Resume.docx';
const LINKEDIN_URL = 'https://www.linkedin.com/in/angelgoddsantana/';
const EMAIL_URL = 'mailto:goddsantana@gmail.com';

const navigation = [
  { to: '/', label: 'Home', end: true },
  { to: '/selected-work', label: 'Selected Work' },
  { to: '/resume', label: 'Résumé' },
  { to: '/work-with-me', label: 'Work with me' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function Wordmark() {
  return (
    <Link className="wordmark" to="/" aria-label="Angel Godd-Santana home">
      <img src="/ags-mark.svg" alt="AGS monogram" width="48" height="48" />
      <span>
        <strong>Angel Godd-Santana</strong>
        <small>Cloud &amp; AI Platform Architecture</small>
      </span>
    </Link>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Wordmark />
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navigation.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              {label}
            </NavLink>
          ))}
          <Link className="button button-small" to="/contact">Start a conversation <ArrowUpRight size={15} /></Link>
        </nav>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
      {menuOpen && (
        <nav id="mobile-navigation" className="mobile-nav shell" aria-label="Mobile navigation">
          {navigation.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} onClick={closeMenu} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              {label}<ChevronRight size={17} aria-hidden="true" />
            </NavLink>
          ))}
          <Link className="button button-small" to="/contact" onClick={closeMenu}>Start a conversation <ArrowUpRight size={15} /></Link>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <Wordmark />
          <p>Independent cloud and AI architecture for secure, governable delivery.</p>
        </div>
        <div className="footer-links" aria-label="Contact links">
          <a href={EMAIL_URL}><Mail size={16} /> Email</a>
          <a href={LINKEDIN_URL} target="_blank" rel="noreferrer"><Linkedin size={16} /> LinkedIn</a>
          <Link to="/selected-work"><ShieldCheck size={16} /> Selected work</Link>
        </div>
        <p className="copyright">© {new Date().getFullYear()} Angel Godd-Santana. U.S. remote.</p>
      </div>
    </footer>
  );
}

function Eyebrow({ children }) {
  return <p className="eyebrow"><span />{children}</p>;
}

function SectionHeading({ eyebrow, title, children, align = 'left' }) {
  return (
    <div className={`section-heading ${align === 'center' ? 'centered' : ''}`}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}

function ButtonLink({ to, href, children, variant = 'primary', external = false }) {
  const classes = `button button-${variant}`;
  const contents = <>{children} {external ? <ArrowUpRight size={17} /> : <ArrowRight size={17} />}</>;

  if (href) {
    return <a className={classes} href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>{contents}</a>;
  }
  return <Link className={classes} to={to}>{contents}</Link>;
}

function HomePage() {
  const pillars = [
    {
      icon: <CloudCog />,
      title: 'Architecture that can operate',
      copy: 'Turn a cloud or AI initiative into a clear target architecture, migration path, and practical operating model.',
    },
    {
      icon: <ShieldCheck />,
      title: 'Identity and governance by design',
      copy: 'Bring Microsoft Entra ID, access patterns, guardrails, and regulated-environment realities into the work early.',
    },
    {
      icon: <Bot />,
      title: 'AI with a delivery plan',
      copy: 'Evaluate AI-enabled workflows against security, ownership, operational readiness, and measurable business needs.',
    },
  ];

  return (
    <>
      <section className="hero-section">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <Eyebrow>Career profile + independent practice</Eyebrow>
            <h1>Principal cloud and AI architecture for work that has to hold up.</h1>
            <p className="hero-lede">I help organizations design secure, governable cloud and AI platforms—from architecture and identity through production delivery.</p>
            <div className="button-row">
              <ButtonLink to="/resume">View résumé</ButtonLink>
              <ButtonLink to="/work-with-me" variant="secondary">Explore how I can help</ButtonLink>
            </div>
            <div className="availability-note"><span className="status-dot" /> Open to U.S.-remote principal-level opportunities and selected advisory engagements.</div>
          </div>
          <div className="architecture-card" aria-label="Angel Godd-Santana, Principal Cloud and AI Platform Architect">
            <img className="professional-portrait" src="/images/angel-godd-santana-headshot.png" alt="Angel Godd-Santana in a suit and tie" />
            <div className="portrait-overlay" />
            <div className="card-topline"><Sparkles size={17} /> Principal platform perspective</div>
            <div className="portrait-label"><img src="/ags-mark.svg" alt="" /><span><strong>Angel Godd-Santana</strong><small>Cloud &amp; AI Platform Architect</small></span></div>
            <div className="architecture-list">
              <span>Cloud architecture</span>
              <span>Identity &amp; governance</span>
              <span>Secure AI enablement</span>
            </div>
            <div className="architecture-stats">
              <div><strong>20+</strong><span>years in IT &amp; infrastructure</span></div>
              <div><strong>10+</strong><span>years with Azure environments</span></div>
              <div><strong>U.S.</strong><span>remote availability</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="shell trust-items" aria-label="Technology experience">
          <span>Microsoft Azure</span><i /> <span>Azure Government</span><i /> <span>Microsoft Entra ID</span><i /> <span>AWS</span><i /> <span>Google Cloud</span>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHeading eyebrow="What I bring" title="A technical leader who connects direction to delivery.">
            The work is not about adding more tools. It is about making the architecture, controls, and team practices reinforce each other.
          </SectionHeading>
          <div className="pillar-grid">
            {pillars.map((pillar) => (
              <article className="pillar" key={pillar.title}>
                <div className="icon-box">{pillar.icon}</div>
                <h3>{pillar.title}</h3>
                <p>{pillar.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section proof-preview-section">
        <div className="shell proof-preview">
          <div>
            <Eyebrow>Selected architecture evidence</Eyebrow>
            <h2>Show the judgment behind the implementation.</h2>
            <p>Explore redacted architecture references for cloud governance, cross-cloud identity, and secure AI platform delivery. The emphasis is on the controls, operating model, and decisions that make a system trustworthy.</p>
            <ButtonLink to="/selected-work" variant="secondary">Explore selected work</ButtonLink>
          </div>
          <div className="proof-preview-stack" aria-label="Architecture evidence themes">
            <span>Azure Lighthouse governance</span>
            <span>Cross-cloud identity boundaries</span>
            <span>Secure AI delivery controls</span>
          </div>
        </div>
      </section>

      <section className="section section-muted">
        <div className="shell outcomes-layout">
          <div>
            <SectionHeading eyebrow="Selected focus areas" title="The platform work I am built for.">
              Experience across enterprise and government-facing cloud environments, with a practical bias toward resilient, supportable systems.
            </SectionHeading>
          </div>
          <div className="outcome-list">
            <article><span>01</span><div><h3>Cloud governance and operating standards</h3><p>Azure Lighthouse, Entra ID, multi-tenant administration, and governance patterns that teams can follow.</p></div></article>
            <article><span>02</span><div><h3>Cross-cloud identity architecture</h3><p>Identity federation, SAML SSO, access design, and cloud-security considerations across Azure, AWS, GCP, and hybrid environments.</p></div></article>
            <article><span>03</span><div><h3>Regulated cloud delivery</h3><p>Architecture and operations experience that accounts for Azure Government and FedRAMP Moderate environment requirements.</p></div></article>
            <article><span>04</span><div><h3>AI-enabled modernization</h3><p>A disciplined route from AI workflow opportunity to a secure, governable, supportable implementation plan.</p></div></article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell pathway-grid">
          <article className="pathway-card pathway-career">
            <BriefcaseBusiness className="pathway-icon" />
            <p className="card-label">For hiring leaders</p>
            <h2>Looking for a principal-level cloud architect?</h2>
            <p>See the career profile, technical focus, and downloadable ATS-ready résumé.</p>
            <ButtonLink to="/resume" variant="dark">Review résumé</ButtonLink>
          </article>
          <article className="pathway-card pathway-consulting">
            <Sparkles className="pathway-icon" />
            <p className="card-label">For organizations</p>
            <h2>Need senior architectural direction on a focused initiative?</h2>
            <p>Explore scoped cloud, identity, governance, and AI readiness engagements.</p>
            <ButtonLink to="/work-with-me" variant="outline">View engagement options</ButtonLink>
          </article>
        </div>
      </section>

      <section className="section ai-roadmap-section">
        <div className="shell ai-roadmap-layout">
          <div>
            <Eyebrow>AI product roadmap</Eyebrow>
            <h2>AI capabilities, designed to earn trust before they automate anything.</h2>
            <p>Godd Technologies is developing a practical AI layer for this site: useful guidance, secure pre-interview preparation, and human-reviewed next steps—not an anonymous black box.</p>
          </div>
          <div className="ai-roadmap-cards">
            <article>
              <Bot aria-hidden="true" />
              <p className="card-label">Planned capability</p>
              <h3>Architecture guide</h3>
              <p>A future assistant that will help visitors frame a cloud or AI challenge and find relevant reference material before a confidential conversation.</p>
            </article>
            <article>
              <ShieldCheck aria-hidden="true" />
              <p className="card-label">Planned capability</p>
              <h3>Pre-interview workspace</h3>
              <p>A future, consent-based preparation flow for technical alignment. It will not make hiring decisions or collect sensitive information without clear permission.</p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}

const offers = [
  {
    number: '01',
    title: 'Architecture & AI readiness sprint',
    description: 'A structured assessment for a cloud or AI initiative that needs an informed path forward before more implementation spend.',
    items: ['Current-state and constraint review', 'Target architecture and guardrail recommendations', 'Prioritized delivery roadmap'],
  },
  {
    number: '02',
    title: 'Cloud governance & identity design',
    description: 'Define the operating patterns that let platforms scale without losing clarity, accountability, or security.',
    items: ['Azure and multi-cloud governance patterns', 'Microsoft Entra ID and access architecture', 'Federation and administrative-boundary review'],
  },
  {
    number: '03',
    title: 'Fractional platform leadership',
    description: 'Senior technical direction for teams that need architectural judgment, stakeholder alignment, and delivery discipline.',
    items: ['Architecture decision support', 'Modernization and migration planning', 'Team mentoring and operating standards'],
  },
];

function WorkWithMePage() {
  return (
    <>
      <section className="page-hero page-hero-work">
        <div className="shell narrow-copy">
          <Eyebrow>Independent engagements</Eyebrow>
          <h1>Make cloud and AI initiatives ready to operate.</h1>
          <p>I am available to help leaders who need a clear technical path—from cloud architecture and identity through governance, AI readiness, and delivery planning.</p>
          <ButtonLink to="/contact">Discuss an initiative</ButtonLink>
        </div>
      </section>
      <section className="section">
        <div className="shell">
          <SectionHeading eyebrow="Ways to engage" title="Focused senior help, shaped around an outcome.">
            Potential engagements start with the problem, context, and decision needed—not a pre-packaged technology sale.
          </SectionHeading>
          <div className="offer-grid">
            {offers.map((offer) => (
              <article className="offer-card" key={offer.number}>
                <span className="offer-number">{offer.number}</span>
                <h2>{offer.title}</h2>
                <p>{offer.description}</p>
                <ul>{offer.items.map((item) => <li key={item}><Check size={16} />{item}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="shell split-callout">
          <div><Eyebrow>Good fit</Eyebrow><h2>When a decision needs both architectural depth and operating realism.</h2></div>
          <p>Typical starting points include an unclear cloud direction, an AI use case without sufficient safeguards, identity complexity across platforms, or a delivery team that needs a technical operating model.</p>
        </div>
      </section>
      <section className="section evidence-callout-section">
        <div className="shell evidence-callout">
          <div><Eyebrow>How I work</Eyebrow><h2>Review the architecture evidence before we talk scope.</h2></div>
          <div><p>See how cloud governance, identity, and secure AI delivery decisions are translated into reusable operating patterns.</p><ButtonLink to="/selected-work" variant="secondary">View selected work</ButtonLink></div>
        </div>
      </section>
    </>
  );
}

const resumeExperience = [
  {
    title: 'Senior Cloud Governance & AI Operations Engineer',
    company: 'Cloud Software Group (formerly Citrix Systems)',
    period: 'Sep 2018 – Aug 2025 · Remote',
    bullets: [
      'Led multi-tenant Azure governance and Microsoft Entra ID security integration across commercial and government-facing cloud environments.',
      'Contributed to Azure Government and FedRAMP Moderate authorization work through identity, governance, and cloud-security patterns.',
      'Architected cross-cloud identity federation between Azure Government and AWS Gov using SAML SSO.',
      'Supported cloud-governance operating standards and mentored engineering teams on cloud operations and governance.',
    ],
  },
  {
    title: 'Founder & Principal',
    company: 'Godd Technologies LLC',
    period: 'Sep 2025 – Present · Independent practice',
    bullets: [
      'Re-established a dormant LLC after completing a full-time enterprise role; developing security-conscious cloud and AI platform architecture offerings for U.S.-remote engagements.',
      'Build and validate redacted reference architectures, proofs of concept, and delivery standards across Azure, GCP, identity, cloud governance, and AI-enabled workflow automation.',
      'Apply AI-assisted workflow techniques to accelerate research, solution design, documentation, prototype development, and delivery preparation—using human architecture, security, and quality gates before use.',
    ],
  },
  {
    title: 'Manager of IT & Cloud Operations',
    company: 'Vertice Technologies',
    period: 'Oct 2017 – Feb 2018',
    bullets: ['Directed distributed operations for Azure infrastructure optimization, information-security operations, and legacy-server migration.'],
  },
  {
    title: 'Senior Azure Cloud Systems Architect/Engineer',
    company: 'Campus Management Corporation',
    period: '2011 – Aug 2017 · Remote',
    bullets: ['Architected, deployed, and maintained Azure virtual-machine, on-premises, and private-cloud environments for critical internal and customer systems.'],
  },
];

function ResumePage() {
  return (
    <>
      <section className="page-hero page-hero-resume">
        <div className="shell resume-hero-layout">
          <div className="narrow-copy">
            <Eyebrow>Career profile</Eyebrow>
            <h1>Principal Cloud &amp; AI Platform Architect</h1>
            <p>Principal-level architecture, governance, identity, and platform-delivery experience for complex enterprise and government-facing cloud environments.</p>
          </div>
          <div className="download-card">
            <FileText aria-hidden="true" />
            <strong>ATS-ready résumé</strong>
            <span>Available in PDF and Word formats.</span>
            <div className="download-actions">
              <a href={RESUME_PDF} download><Download size={16} /> PDF</a>
              <a href={RESUME_DOCX} download><Download size={16} /> DOCX</a>
            </div>
          </div>
        </div>
      </section>
      <section className="section resume-section">
        <div className="shell resume-layout">
          <aside className="resume-sidebar">
            <div><p className="side-label">Based in</p><strong>Homestead, Florida, USA</strong><span>Remote only</span></div>
            <div><p className="side-label">Core platforms</p><span>Microsoft Azure<br />Azure Government<br />AWS · Google Cloud Platform</span></div>
            <div><p className="side-label">Focus</p><span>Cloud architecture<br />Identity &amp; governance<br />Secure AI enablement<br />Platform delivery</span></div>
            <a className="side-contact" href={EMAIL_URL}><Mail size={16} /> Contact Angel</a>
          </aside>
          <div className="resume-main">
            <section>
              <h2>Executive summary</h2>
            <p>Principal Cloud &amp; AI Platform Architect with 20+ years in IT and infrastructure and 10+ years designing and operating Azure environments. Designs secure, governable cloud platforms across Azure, Azure Government, AWS, GCP, hybrid infrastructure, identity, cloud governance, and modernization delivery—now complemented by AI-enabled solution design, proof-of-concept development, and disciplined human review.</p>
            </section>
            <section>
              <h2>Core competencies</h2>
              <div className="competency-grid">
                <p><strong>Cloud platforms</strong>Microsoft Azure, Azure Government, AWS, GCP, hybrid and multi-cloud architecture, IaaS</p>
                <p><strong>Governance &amp; identity</strong>Azure Lighthouse, Microsoft Entra ID, IAM, SAML SSO, Azure AD Connect, cloud security</p>
                <p><strong>Platform delivery</strong>Cloud migration, technical architecture, CI/CD, Azure DevOps, GitHub Actions, Terraform, Bicep, Python</p>
                <p><strong>AI-enabled solution delivery</strong>AI-assisted research, solution design, technical documentation, code review, workflow automation, and proof-of-concept development with human-in-the-loop security and quality validation</p>
              </div>
            </section>
            <section className="resume-evidence">
              <h2>Selected architecture work</h2>
              <p>Redacted architecture references cover Azure Lighthouse governance, cross-cloud identity, and security-first AI platform delivery. Private source and sensitive implementation details remain private by design.</p>
              <ButtonLink to="/selected-work" variant="ghost">Explore selected work</ButtonLink>
            </section>
            <section>
              <h2>Professional experience</h2>
              <div className="experience-list">
                {resumeExperience.map((role) => (
                  <article key={`${role.title}-${role.company}`}>
                    <p className="experience-period">{role.period}</p>
                    <h3>{role.title}</h3>
                    <h4>{role.company}</h4>
                    <ul>{role.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
                  </article>
                ))}
              </div>
            </section>
            <section className="education-row">
              <div><h2>Education</h2><p><strong>Master of Science, Computer/Information Systems</strong><br />University of Phoenix</p><p><strong>Bachelor of Science, Business/Information Systems</strong><br />University of Phoenix</p><p><strong>Doctoral coursework, Management of Information Systems</strong><br />University of Phoenix · 39 credits completed; dissertation not completed</p></div>
              <div><h2>Earlier experience</h2><p>Progressive systems administration, software architecture, SQL/.NET development, network operations, and IT leadership experience from 2000–2011.</p></div>
            </section>
          </div>
        </div>
      </section>
      <section className="section section-muted compact-section">
        <div className="shell resume-cta"><div><Eyebrow>Next step</Eyebrow><h2>Let’s talk about the platform challenge in front of you.</h2></div><ButtonLink to="/contact">Contact Angel</ButtonLink></div>
      </section>
    </>
  );
}

function AboutPage() {
  return (
    <>
      <section className="page-hero page-hero-about">
        <div className="shell narrow-copy">
          <Eyebrow>About Angel</Eyebrow>
          <h1>Architectural thinking grounded in operational experience.</h1>
          <p>I work at the intersection of cloud architecture, identity, governance, and modern delivery—where strong technical decisions need to survive contact with people, process, and production.</p>
        </div>
      </section>
      <section className="section">
        <div className="shell prose-layout">
          <div className="prose-statement"><p className="large-quote">“Good platform architecture gives teams a secure foundation to move with confidence—not a heavier system to work around.”</p></div>
          <div className="prose-copy">
            <p>My background spans enterprise cloud operations, Azure and Azure Government environments, Microsoft Entra ID, cross-cloud identity, and migration work. I bring the same systems perspective to AI enablement: start with the intended outcome, design the controls and operating model, then make delivery practical for the team that will own it.</p>
            <p>Selected work shows the redacted architecture evidence behind that approach: cloud governance, identity boundaries, and secure AI delivery patterns designed for real-world ownership.</p>
            <p>Today, I am open to U.S.-remote Principal Cloud Architect, AI Platform Architect, Cloud Governance, and Cloud/DevSecOps Architect opportunities. I am also available for focused independent engagements where senior technical direction can reduce risk and clarify the path to delivery.</p>
            <div className="about-links"><ButtonLink href={LINKEDIN_URL} external variant="secondary">Connect on LinkedIn</ButtonLink><ButtonLink to="/selected-work" variant="ghost">Explore selected work</ButtonLink><ButtonLink to="/resume" variant="ghost">Read full résumé</ButtonLink></div>
          </div>
        </div>
      </section>
    </>
  );
}

function ContactPage() {
  return (
    <section className="contact-page">
      <div className="shell contact-layout">
        <div>
          <Eyebrow>Contact</Eyebrow>
          <h1>Start with the real problem.</h1>
          <p>Whether you are hiring for a principal technical role or evaluating a focused cloud or AI initiative, send a concise note about the outcome you need.</p>
          <p className="contact-note">I work remotely from Homestead, Florida, USA and am available for U.S.-remote opportunities and selected engagements.</p>
        </div>
        <div className="contact-card">
          <a href={EMAIL_URL} className="contact-method"><span className="icon-box"><Mail /></span><span><small>Email</small><strong>goddsantana@gmail.com</strong></span><ArrowUpRight /></a>
          <a href={LINKEDIN_URL} className="contact-method" target="_blank" rel="noreferrer"><span className="icon-box"><Linkedin /></span><span><small>LinkedIn</small><strong>Angel Godd-Santana</strong></span><ArrowUpRight /></a>
          <a href={RESUME_PDF} className="contact-method" download><span className="icon-box"><Download /></span><span><small>Career profile</small><strong>Download résumé (PDF)</strong></span><ArrowUpRight /></a>
        </div>
      </div>
    </section>
  );
}

function NotFoundPage() {
  return (
    <section className="not-found">
      <div className="shell narrow-copy"><Eyebrow>404</Eyebrow><h1>That page is not here.</h1><p>The rest of the site is available from the home page.</p><ButtonLink to="/">Go home</ButtonLink></div>
    </section>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="site-shell">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/selected-work" element={<SelectedWork />} />
            <Route path="/work-with-me" element={<WorkWithMePage />} />
            <Route path="/resume" element={<ResumePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
