import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Check, LockKeyhole, MessageCircle, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function JoinAsWorker() {
  const [, navigate] = useLocation();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [workTypes, setWorkTypes] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [availability, setAvailability] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const mutation = trpc.workerInterest.submit.useMutation();

  const canSubmit = Boolean(fullName && phone && location && workTypes);

  const submit = () => {
    if (!canSubmit) {
      setError("Please fill in your name, phone, location, and the type of work you do.");
      return;
    }
    setError("");
    mutation.mutate(
      { fullName, phone, email: email || undefined, location, workTypes, experienceLevel: experienceLevel || undefined, availability: availability || undefined, whatsappOptIn },
      {
        onSuccess: (result) => setSubmitted(result.publicId),
        onError: (err) => setError(err.message || "Something went wrong. Please try again."),
      }
    );
  };

  if (submitted) {
    return (
      <main className="intake-shell">
        <header className="intake-nav container">
          <Link href="/" className="intake-brand"><img src="/yayaaiki-logo.png" alt="YayaAiki — Work, Verified, Valued" /></Link>
        </header>
        <section className="intake-success container">
          <div className="success-mark"><Check size={30} /></div>
          <p className="intake-eyebrow">APPLICATION RECEIVED</p>
          <h1>You're on the list.</h1>
          <p className="success-lede">We review new worker applications regularly and will reach out on WhatsApp or phone once there's verified work matching what you do.</p>
          <div className="intake-id-card">
            <span>APPLICATION ID</span>
            <strong>{submitted}</strong>
            <small>Keep this ID to reference your application.</small>
          </div>
          <div className="success-actions">
            <Link className="intake-secondary" href="/">Back to YayaAiki</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="intake-shell">
      <header className="intake-nav container">
        <Link href="/" className="intake-brand"><img src="/yayaaiki-logo.png" alt="YayaAiki — Work, Verified, Valued" /></Link>
        <div className="intake-nav-right">
          <span className="intake-secure"><LockKeyhole size={14} /> Secure application</span>
          <a href="https://wa.me/2348112051880?text=Hello%20YayaAiki%2C%20I%27d%20like%20to%20join%20as%20a%20worker." className="intake-help"><MessageCircle size={15} /> Talk to us</a>
        </div>
      </header>
      <div className="intake-layout container">
        <aside className="intake-aside">
          <p className="intake-eyebrow">JOIN AS A WORKER</p>
          <h1>Do the work. Get paid, verified.</h1>
          <p>Tell us who you are and what you do. We'll reach out once there's verified work that fits.</p>
          <div className="intake-assurance">
            <ShieldCheck size={20} />
            <span><strong>Built for accountable work</strong><small>No fees to apply. We contact you directly.</small></span>
          </div>
        </aside>
        <section className="intake-card" aria-label="Worker application form">
          <div className="intake-form-body">
            <div className="intake-step">
              <h2>Tell us about yourself</h2>
              <label className="intake-field"><span>Full name</span><input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" /></label>
              <div className="intake-grid-2">
                <label className="intake-field"><span>Phone number</span><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 ..." /></label>
                <label className="intake-field"><span>Email (optional)</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
              </div>
              <label className="intake-field"><span>Location</span><input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Lagos, Nigeria" /></label>
              <label className="intake-field"><span>What kind of work do you do?</span><textarea value={workTypes} onChange={e => setWorkTypes(e.target.value)} placeholder="e.g. data entry, transcription, delivery, customer support" rows={3} /></label>
              <div className="intake-grid-2">
                <label className="intake-field"><span>Experience level (optional)</span><input value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)} placeholder="e.g. 2 years" /></label>
                <label className="intake-field"><span>Availability (optional)</span><input value={availability} onChange={e => setAvailability(e.target.value)} placeholder="e.g. weekdays, full-time" /></label>
              </div>
              <label className="consent">
                <input type="checkbox" checked={whatsappOptIn} onChange={e => setWhatsappOptIn(e.target.checked)} />
                <span>Contact me on WhatsApp with relevant work opportunities.</span>
              </label>
            </div>
            {error && <p className="intake-error" role="alert">{error}</p>}
            <div className="intake-actions">
              <Link className="intake-secondary" href="/"><ArrowLeft size={16} /> Exit</Link>
              <button className="intake-primary" onClick={submit} disabled={mutation.isPending}>
                {mutation.isPending ? "Submitting..." : "Submit application"} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
