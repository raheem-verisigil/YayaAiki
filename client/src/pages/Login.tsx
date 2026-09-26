import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, LockKeyhole, MessageCircle } from "lucide-react";
import { signInWithPassword, signUpWithPassword } from "@/lib/supabase";

export default function Login() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (!email || !password) { setError("Enter both email and password."); return; }
    setError(""); setInfo(""); setPending(true);
    try {
      if (mode === "signin") {
        await signInWithPassword(email, password);
        navigate("/ops");
      } else {
        await signUpWithPassword(email, password);
        setInfo("Account created. If email confirmation is required, check your inbox, then sign in.");
        setMode("signin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="intake-shell">
      <header className="intake-nav container">
        <Link href="/" className="intake-brand"><img src="/yayaaiki-logo.png" alt="YayaAiki — Work, Verified, Valued" /></Link>
        <div className="intake-nav-right">
          <span className="intake-secure"><LockKeyhole size={14} /> Staff sign-in</span>
          <a href="https://wa.me/2348112051880?text=Hello%20YayaAiki%2C%20I%20need%20help%20signing%20in.">
            <MessageCircle size={15} /> Talk to us
          </a>
        </div>
      </header>
      <div className="intake-layout container">
        <aside className="intake-aside">
          <p className="intake-eyebrow">OPERATIONS ACCESS</p>
          <h1>{mode === "signin" ? "Sign in to the workspace." : "Create a staff account."}</h1>
          <p>Internal access for YayaAiki staff and verified team members only.</p>
        </aside>
        <section className="intake-card" aria-label="Sign in form">
          <div className="intake-form-body">
            <div className="intake-step">
              <label className="intake-field"><span>Email</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@yayaaiki.com" /></label>
              <label className="intake-field"><span>Password</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></label>
            </div>
            {error && <p className="intake-error" role="alert">{error}</p>}
            {info && <p className="intake-error" style={{ color: "inherit" }}>{info}</p>}
            <div className="intake-actions">
              <button className="intake-secondary" type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setInfo(""); }}>
                {mode === "signin" ? "Need an account?" : "Have an account? Sign in"}
              </button>
              <button className="intake-primary" onClick={submit} disabled={pending}>
                {pending ? "..." : mode === "signin" ? "Sign in" : "Create account"} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
