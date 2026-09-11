import { useState, type FormEvent } from "react";
import { supabase } from "../supabase";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) {
      setError(
        signInError.message.toLowerCase().includes("invalid")
          ? "That email and password don't match. Check both and try again."
          : signInError.message,
      );
      setBusy(false);
    }
    // On success the auth listener in App swaps this screen out.
  }

  return (
    <form className="login" onSubmit={submit}>
      <div className="mark">
        AHMAD
        <br />
        <span>ASSOCIATES</span>
      </div>
      <p>Sign in to open the expense book.</p>
      <div className="field">
        <label className="lbl" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label className="lbl" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <div className="errline">{error}</div>}
      <button className="primary" type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="hint">
        Accounts are set up by hand — there is no public sign-up.
      </p>
    </form>
  );
}
