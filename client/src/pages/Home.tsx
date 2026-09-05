import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Fingerprint,
  Globe2,
  Menu,
  MessageCircle,
  Network,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const whatsapp = "https://wa.me/2348112051880?text=Hello%20YayaAiki%2C%20I%27d%20like%20to%20start%20a%20verified%20work%20request.";

function Logo() {
  return (
    <Link href="/" className="brand-lockup" aria-label="YayaAiki home">
      <img className="brand-full-logo" src="/manus-storage/yayaaiki-logo_873472fe.png" alt="YayaAiki — Work, Verified, Valued" />
    </Link>
  );
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<"business" | "professional" | "ops">("business");

  const roleCopy = {
    business: {
      eyebrow: "For teams buying outcomes",
      title: "Brief work. See the proof. Release with confidence.",
      body: "Turn a business need into a scoped work order, a verified delivery, and a payment trail your finance team can stand behind.",
      href: "/for-business",
      cta: "Open business portal",
    },
    professional: {
      eyebrow: "For professionals doing the work",
      title: "Your work deserves a clear path to trust.",
      body: "See the brief, submit evidence, respond to rework, and build a reputation from outcomes — not noise.",
      href: "/for-professionals",
      cta: "Open professional portal",
    },
    ops: {
      eyebrow: "For the people keeping promises",
      title: "One operational view from brief to paid.",
      body: "Give your team the control plane for verification, exceptions, payment authorization, and an audit-ready event history.",
      href: "/ops",
      cta: "Open operations view",
    },
  };

  const current = roleCopy[activeRole];

  return (
    <main className="site-shell">
      <div className="announcement">
        <span className="announcement-dot" />
        YayaAiki is building a better way to get African work done <span className="announcement-separator">/</span> <a href={whatsapp}>Talk to us on WhatsApp <ArrowUpRight size={14} /></a>
      </div>

      <nav className="site-nav container">
        <Logo />
        <div className={`nav-links ${mobileOpen ? "is-open" : ""}`}>
          <a href="#how-it-works" onClick={() => setMobileOpen(false)}>How it works</a>
          <a href="#for-who" onClick={() => setMobileOpen(false)}>For who</a>
          <a href="#trust" onClick={() => setMobileOpen(false)}>Trust layer</a>
          <a href="#contact" onClick={() => setMobileOpen(false)}>Contact</a>
        </div>
        <div className="nav-actions">
          <a className="button button-dark button-small" href={whatsapp}>Start a work order <ArrowUpRight size={15} /></a>
          <button className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </nav>

      <section className="hero container">
        <div className="hero-copy reveal-up">
          <div className="kicker"><span className="kicker-line" /> VERIFIED WORK INFRASTRUCTURE</div>
          <h1>Good work should be <em>provable.</em></h1>
          <p className="hero-lede">YayaAiki connects the brief, the person, the proof, and the payment — so every completed job can move with more trust.</p>
          <div className="hero-actions">
            <a className="button button-accent" href={whatsapp}>Start a verified work order <ArrowUpRight size={17} /></a>
            <a className="text-link" href="#how-it-works">See how it works <ChevronRight size={16} /></a>
          </div>
          <div className="hero-note"><ShieldCheck size={15} /> Built for accountable work across Africa</div>
        </div>

        <div className="proof-board reveal-up delay-1" aria-label="Live proof thread preview">
          <div className="board-topline"><span className="status-live"><span /> LIVE PROOF THREAD</span><span className="mono">WO-2048 · Lagos</span></div>
          <div className="board-title-row"><div><span className="tiny-label">WORK ORDER</span><h3>Retail inventory audit</h3></div><span className="tag tag-gold">₦ 180,000 reserved</span></div>
          <div className="thread">
            <div className="thread-item done"><div className="thread-icon"><Check size={14} /></div><div><strong>Work order created</strong><span>Brief approved by Kora Retail</span></div><time>09:14</time></div>
            <div className="thread-item done"><div className="thread-icon"><Fingerprint size={14} /></div><div><strong>Actor assigned</strong><span>Amaka Okafor · field professional</span></div><time>09:28</time></div>
            <div className="thread-item done"><div className="thread-icon"><ClipboardCheck size={14} /></div><div><strong>Evidence submitted</strong><span>18 files · sha256 verified</span></div><time>13:42</time></div>
            <div className="thread-item current"><div className="thread-icon"><ShieldCheck size={14} /></div><div><strong>Independent verification</strong><span>Verifier review in progress</span></div><time>NOW</time></div>
            <div className="thread-item pending"><div className="thread-icon"><WalletCards size={14} /></div><div><strong>Payment authorization</strong><span>Released after pass</span></div><time>—</time></div>
          </div>
          <div className="board-footer"><span><span className="pulse-dot" /> Append-only event history</span><span>View trace <ArrowUpRight size={13} /></span></div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="container trust-strip-inner">
          <span className="trust-strip-label">THE CORE PROMISE</span>
          <div className="trust-stat"><span className="stat-number">01</span><span>one work order<br />one source of truth</span></div>
          <div className="trust-stat"><span className="stat-number">02</span><span>evidence before<br />payment release</span></div>
          <div className="trust-stat"><span className="stat-number">03</span><span>reputation earned<br />from verified outcomes</span></div>
          <span className="trust-stamp"><BadgeCheck size={21} /> Built for the long game</span>
        </div>
      </section>

      <section id="how-it-works" className="section container flow-section">
        <div className="section-intro"><div className="kicker"><span className="kicker-line" /> THE YAYAAIKI LOOP</div><h2>Not a marketplace.<br /><span>A trust layer for work.</span></h2><p>The public website is only the front door. Behind it is a simple, rigorous loop that makes delivery legible to everyone involved.</p></div>
        <div className="flow-rail">
          <div className="flow-step"><span className="flow-number">01</span><div className="flow-icon icon-coral"><BriefcaseBusiness size={22} /></div><h3>Brief</h3><p>A clear work order with scope, acceptance criteria, and funds reserved.</p></div>
          <div className="flow-connector" />
          <div className="flow-step"><span className="flow-number">02</span><div className="flow-icon icon-olive"><Network size={22} /></div><h3>Do</h3><p>The right professional works against the brief, with context — not guesswork.</p></div>
          <div className="flow-connector" />
          <div className="flow-step"><span className="flow-number">03</span><div className="flow-icon icon-blue"><ClipboardCheck size={22} /></div><h3>Prove</h3><p>Evidence is captured, hashed, reviewed, and tied to the exact work order.</p></div>
          <div className="flow-connector" />
          <div className="flow-step"><span className="flow-number">04</span><div className="flow-icon icon-gold"><CircleDollarSign size={22} /></div><h3>Release</h3><p>Payment authorization follows a verified outcome — then reputation updates.</p></div>
        </div>
      </section>

      <section id="for-who" className="section role-section">
        <div className="container">
          <div className="section-intro split-intro"><div><div className="kicker"><span className="kicker-line" /> ONE ENGINE, THREE DOORS</div><h2>Start where<br /><span>you stand.</span></h2></div><p>WhatsApp sits beside the engine for notifications, support, and simple actions. The system of record stays clear, structured, and ready for scale.</p></div>
          <div className="role-layout">
            <div className="role-tabs" role="tablist" aria-label="YayaAiki audiences">
              {(Object.keys(roleCopy) as Array<keyof typeof roleCopy>).map((role) => <button key={role} className={`role-tab ${activeRole === role ? "active" : ""}`} onClick={() => setActiveRole(role)}><span>{role === "business" ? "I buy work" : role === "professional" ? "I do work" : "I run ops"}</span><ChevronRight size={17} /></button>)}
              <div className="role-tab-detail"><Sparkles size={15} /> Built around the same accountable workflow.</div>
            </div>
            <div className="role-feature">
              <div className="role-feature-orb"><Globe2 size={39} /></div>
              <div className="kicker">{current.eyebrow}</div>
              <h3>{current.title}</h3>
              <p>{current.body}</p>
              <Link className="button button-dark" href={current.href}>{current.cta} <ArrowUpRight size={16} /></Link>
              <div className="role-feature-footer"><span><Check size={14} /> Easy to navigate</span><span><Check size={14} /> Human-friendly</span><span><Check size={14} /> Audit-ready</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="trust" className="section container trust-section">
        <div className="trust-card"><div className="trust-card-top"><div><div className="kicker"><span className="kicker-line" /> THE TRUST LAYER</div><h2>Security is not<br /><span>a later feature.</span></h2></div><ShieldCheck className="trust-big-icon" size={56} strokeWidth={1.2} /></div><div className="trust-grid"><div><Fingerprint size={20} /><strong>Identity stays contextual</strong><p>People, actors, and tenants stay distinct — so access follows purpose.</p></div><div><ClipboardCheck size={20} /><strong>Evidence keeps its history</strong><p>Versions, hashes, and verification decisions are never silently overwritten.</p></div><div><WalletCards size={20} /><strong>Payment is a separate fact</strong><p>Authorization is recorded inside YayaAiki; money moves with a licensed provider.</p></div><div><Network size={20} /><strong>Events tell the whole story</strong><p>An append-only event history lets an auditor reconstruct the outcome end to end.</p></div></div><div className="trust-card-bottom"><span>Designed in Africa. Built for accountable scale.</span><span className="mono">schema v1.0 · event log online</span></div></div>
      </section>

      <section className="cta-section" id="contact"><div className="container cta-inner"><div><div className="kicker light"><span className="kicker-line" /> READY WHEN YOU ARE</div><h2>Make your next<br /><em>good job</em> easier to trust.</h2></div><div className="cta-side"><p>Tell us what needs to get done. We’ll help you turn the first brief into a work order with a clear path to proof.</p><a className="button button-light" href={whatsapp}><MessageCircle size={17} /> Start on WhatsApp</a><a className="cta-email" href="mailto:hello@yayaaiki.com">hello@yayaaiki.com <ArrowUpRight size={14} /></a></div></div></section>

      <footer className="site-footer"><div className="container footer-grid"><div><Logo /><p>A clearer way to get<br />work done.</p></div><div className="footer-column"><span className="footer-label">EXPLORE</span><a href="#how-it-works">How it works</a><a href="#for-who">For who</a><a href="#trust">Trust layer</a></div><div className="footer-column"><span className="footer-label">PORTALS</span><Link href="/for-business">Business</Link><Link href="/for-professionals">Professionals</Link><Link href="/ops">Operations</Link></div><div className="footer-column"><span className="footer-label">CONTACT</span><a href="mailto:business@yayaaiki.com">business@yayaaiki.com</a><a href="mailto:work@yayaaiki.com">work@yayaaiki.com</a><a href={whatsapp}>+234 811 205 1880</a></div></div><div className="container footer-bottom"><span>© 2026 YayaAiki.com</span><span>Built for proof, not promises.</span><span><a href="https://hpanel.hostinger.com/" target="_blank" rel="noreferrer">Hostinger handoff <ArrowUpRight size={13} /></a></span></div></footer>
    </main>
  );
}
