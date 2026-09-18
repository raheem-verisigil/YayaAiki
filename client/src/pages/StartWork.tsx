import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Check, ClipboardCheck, LockKeyhole, MessageCircle, ShieldCheck } from "lucide-react";

type Intake = {
  category: string;
  title: string;
  description: string;
  output: string;
  quantity: string;
  deadline: string;
  acceptance: string;
  evidence: string;
  dataClass: string;
  frequency: string;
  budget: string;
  name: string;
  organization: string;
  email: string;
  phone: string;
};

const blank: Intake = {
  category: "Data operations", title: "", description: "", output: "", quantity: "", deadline: "",
  acceptance: "", evidence: "", dataClass: "Business information", frequency: "One-time", budget: "",
  name: "", organization: "", email: "", phone: "",
};

const categories = ["Data operations", "AI evaluation", "Research support", "Transcription", "Translation", "Quality assurance", "Catalogue operations", "Document processing", "Other"];
const stages = ["Work", "Requirements", "Evidence & data", "Commercial", "Review"];

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="intake-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export default function StartWork() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Intake>(blank);
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState("");
  const update = (key: keyof Intake, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(form.category && form.title && form.description && form.output && form.quantity);
    if (step === 1) return Boolean(form.deadline && form.acceptance);
    if (step === 2) return Boolean(form.evidence && form.dataClass);
    if (step === 3) return Boolean(form.frequency && form.budget);
    return Boolean(form.name && form.organization && form.email && form.phone && consent);
  }, [form, step]);

  const next = () => {
    setError("");
    if (!canContinue) { setError("Complete the highlighted requirements before continuing."); return; }
    if (step < stages.length - 1) setStep((value) => value + 1);
  };

  const submit = () => {
    if (!canContinue) { setError("Complete your contact details before submitting."); return; }
    const id = `INT-NG-${String(Math.floor(100000 + Math.random() * 899999))}`;
    sessionStorage.setItem(`yayaaiki-intake-${id}`, JSON.stringify({ ...form, id, status: "RECEIVED" }));
    setSubmitted(id);
  };

  if (submitted) return <main className="intake-shell"><header className="intake-nav container"><Link href="/" className="intake-brand"><img src="/yayaaiki-logo.png" alt="YayaAiki — Work, Verified, Valued" /></Link><a href="https://wa.me/2348112051880?text=Hello%20YayaAiki%2C%20I%20need%20help%20with%20my%20work%20request." className="intake-help"><MessageCircle size={15} /> Need help?</a></header><section className="intake-success container"><div className="success-mark"><Check size={30} /></div><p className="intake-eyebrow">WORK INTAKE RECEIVED</p><h1>Your requirement is in the queue.</h1><p className="success-lede">We’ll review the brief and either ask for clarification or prepare a structured Work Order and quote. No capacity, price, verification, or payment is confirmed yet.</p><div className="intake-id-card"><span>INTAKE ID</span><strong>{submitted}</strong><small>Keep this ID to reference your request.</small></div><div className="success-actions"><button className="intake-primary" onClick={() => navigate(`/intake/${submitted}`)}>Track request <ArrowRight size={16} /></button><Link className="intake-secondary" href="/">Back to YayaAiki</Link></div></section></main>;

  return <main className="intake-shell"><header className="intake-nav container"><Link href="/" className="intake-brand"><img src="/yayaaiki-logo.png" alt="YayaAiki — Work, Verified, Valued" /></Link><div className="intake-nav-right"><span className="intake-secure"><LockKeyhole size={14} /> Secure intake</span><a href="https://wa.me/2348112051880?text=Hello%20YayaAiki%2C%20I%20need%20help%20starting%20a%20work%20order." className="intake-help"><MessageCircle size={15} /> Talk to us</a></div></header><div className="intake-layout container"><aside className="intake-aside"><p className="intake-eyebrow">START A WORK ORDER</p><h1>Give us the work. We organize the delivery.</h1><p>Tell us what needs to be done. Complete the request asynchronously — no meeting required.</p><div className="intake-assurance"><ShieldCheck size={20} /><span><strong>Built for accountable work</strong><small>Brief → evidence → acceptance → record</small></span></div><div className="intake-aside-note"><ClipboardCheck size={17} /><span>Your request starts a review, not an automatic assignment. We’ll confirm scope and capacity before any commitment.</span></div></aside><section className="intake-card" aria-label="Work Order intake form"><div className="intake-progress"><div className="intake-progress-top"><span>STEP {step + 1} OF {stages.length}</span><strong>{stages[step]}</strong></div><div className="intake-progress-bar"><span style={{ width: `${((step + 1) / stages.length) * 100}%` }} /></div><div className="intake-steps">{stages.map((item, index) => <button type="button" key={item} className={index <= step ? "active" : ""} onClick={() => index < step && setStep(index)}><i>{index < step ? <Check size={11} /> : index + 1}</i>{item}</button>)}</div></div><div className="intake-form-body">
      {step === 0 && <div className="intake-step"><h2>What needs to get done?</h2><p className="intake-step-lede">Start with the work and the outcome. We’ll help structure the rest.</p><Field label="Work category"><select value={form.category} onChange={(event) => update("category", event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Work title" hint="Example: Clean and classify 5,000 product records"><input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="What should the team work on?" /></Field><Field label="Describe the work"><textarea value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="What should happen, and what context should the delivery team know?" rows={4} /></Field><div className="intake-grid-2"><Field label="Expected output"><input value={form.output} onChange={(event) => update("output", event.target.value)} placeholder="Verified product data" /></Field><Field label="Quantity or batch size"><input value={form.quantity} onChange={(event) => update("quantity", event.target.value)} placeholder="5,000 records" /></Field></div></div>}
      {step === 1 && <div className="intake-step"><h2>Define a clear finish line.</h2><p className="intake-step-lede">Good work is easier to deliver when the requirements are visible before anyone starts.</p><Field label="Required delivery date"><input type="date" value={form.deadline} onChange={(event) => update("deadline", event.target.value)} /></Field><Field label="Acceptance criteria" hint="Use measurable requirements where possible, such as accuracy, completeness, or review thresholds."><textarea value={form.acceptance} onChange={(event) => update("acceptance", event.target.value)} placeholder="Example: 98% accuracy, all required fields complete, human review of a sample" rows={5} /></Field><div className="criteria-hint"><Check size={15} /> Make the result easy for a buyer to accept.</div></div>}
      {step === 2 && <div className="intake-step"><h2>How should completion be demonstrated?</h2><p className="intake-step-lede">Evidence is tied to the requirements so everyone can see what was delivered and checked.</p><Field label="Evidence you expect"><select value={form.evidence} onChange={(event) => update("evidence", event.target.value)}><option value="">Select evidence type</option><option>Completed file or dataset</option><option>QA report and sample review</option><option>Structured output</option><option>Screenshot or activity record</option><option>Human sign-off</option><option>Other evidence</option></select></Field><Field label="What type of information will the work contain?" hint="This helps us determine appropriate handling and processing controls."><select value={form.dataClass} onChange={(event) => update("dataClass", event.target.value)}><option>Public</option><option>Business information</option><option>Personal information</option><option>Sensitive personal information</option><option>Restricted economic information</option><option>Strategic/restricted information</option></select></Field><div className="privacy-callout"><ShieldCheck size={18} /><span>Do not upload private samples, identity documents, passwords, or payment details here. We’ll provide a controlled path if they are needed later.</span></div></div>}
      {step === 3 && <div className="intake-step"><h2>Make the request commercial.</h2><p className="intake-step-lede">Recurring work helps us design a better delivery plan and measure the value created.</p><Field label="Is this one-time or repeat work?"><div className="choice-row"><button type="button" className={form.frequency === "One-time" ? "choice active" : "choice"} onClick={() => update("frequency", "One-time")}>One-time</button><button type="button" className={form.frequency === "Repeat work" ? "choice active" : "choice"} onClick={() => update("frequency", "Repeat work")}>Repeat work</button></div></Field>{form.frequency === "Repeat work" && <Field label="Expected frequency"><select value={form.frequency === "Repeat work" ? "Monthly" : form.frequency} onChange={(event) => update("frequency", `Repeat work · ${event.target.value}`)}><option>Weekly</option><option>Monthly</option><option>Quarterly</option></select></Field>}<Field label="Budget range" hint="This is for qualification only. A final quote follows review."><select value={form.budget} onChange={(event) => update("budget", event.target.value)}><option value="">Select a range</option><option>Under ₦100,000</option><option>₦100,000 – ₦500,000</option><option>₦500,000 – ₦1,000,000</option><option>Over ₦1,000,000</option><option>Not sure yet</option></select></Field></div>}
      {step === 4 && <div className="intake-step"><h2>Where should we send the next step?</h2><p className="intake-step-lede">We’ll send your intake ID and contact you only about this requirement.</p><div className="intake-review"><span>REQUEST SUMMARY</span><strong>{form.title || "Untitled work request"}</strong><small>{form.quantity || "Quantity pending"} · {form.dataClass}</small></div><div className="intake-grid-2"><Field label="Your name"><input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Full name" /></Field><Field label="Organization"><input value={form.organization} onChange={(event) => update("organization", event.target.value)} placeholder="Company or organization" /></Field></div><Field label="Work email"><input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="you@company.com" /></Field><Field label="Phone number"><input type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+234 ..." /></Field><label className="consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> <span>I agree that YayaAiki may use these details to review and respond to this work request. See our privacy notice.</span></label></div>}
      {error && <p className="intake-error" role="alert">{error}</p>}<div className="intake-actions">{step > 0 ? <button className="intake-secondary" onClick={() => { setError(""); setStep((value) => value - 1); }}><ArrowLeft size={16} /> Back</button> : <Link className="intake-secondary" href="/"><ArrowLeft size={16} /> Exit</Link>}{step < stages.length - 1 ? <button className="intake-primary" onClick={next}>Continue <ArrowRight size={16} /></button> : <button className="intake-primary" onClick={submit}>Submit Work Order <ArrowRight size={16} /></button>}</div></div></section></div></main>;
}
