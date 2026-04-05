"use client";

import Image from "next/image";
import { useState } from "react";
import { useSignUp, useSignIn, AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";

/* ─── Constants ──────────────────────────────────────────────────────────── */

const REDIRECT_AFTER_AUTH = "/proposer-votre-van/inscription";
const SSO_CALLBACK_URL    = "/proposer-votre-van/connexion/sso-callback";

const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 focus:bg-white transition-all";

/* ─── Icons ──────────────────────────────────────────────────────────────── */

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] flex-shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] flex-shrink-0" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.39.07 2.34.74 3.15.8 1.17-.24 2.28-.91 3.53-.84 1.5.1 2.63.6 3.37 1.55-3.05 1.85-2.3 5.55.31 6.64-.62 1.64-1.42 3.25-2.36 4.71zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] flex-shrink-0" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

/* ─── Social button ──────────────────────────────────────────────────────── */

function SocialBtn({
  icon,
  label,
  onClick,
  loading = false,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="w-full flex items-center justify-center gap-2.5 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin flex-shrink-0" />
      ) : icon}
      {label}
    </button>
  );
}

/* ─── Verification form ──────────────────────────────────────────────────── */

function VerifyForm({
  email,
  code,
  setCode,
  error,
  loading,
  onSubmit,
}: {
  email: string;
  code: string;
  setCode: (v: string) => void;
  error: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">
          Code envoyé à{" "}
          <span className="font-semibold text-slate-800">{email}</span>
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="text"
          inputMode="numeric"
          placeholder="_ _ _ _ _ _"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className={inputCls + " text-center tracking-[0.4em] text-lg font-bold"}
          autoFocus
          required
        />
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <SubmitBtn loading={loading} label="Vérifier le code" />
      </form>
    </div>
  );
}

/* ─── Submit button ──────────────────────────────────────────────────────── */

function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-sky-400 hover:from-blue-600 hover:to-sky-500 active:scale-[.98] transition-all disabled:opacity-55 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          Chargement…
        </span>
      ) : label}
    </button>
  );
}

/* ─── Auth form ──────────────────────────────────────────────────────────── */

function AuthForm() {
  const [mode, setMode]           = useState<"signup" | "signin" | "verify">("signup");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [code, setCode]           = useState("");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [oauthLoading, setOAuthLoading] = useState<string | null>(null);

  const { isLoaded: suLoaded, signUp, setActive: setActiveSU } = useSignUp();
  const { isLoaded: siLoaded, signIn, setActive: setActiveSI } = useSignIn();
  const clerkReady = suLoaded && siLoaded;
  const router = useRouter();

  const reset = () => { setError(""); };

  /* OAuth — utilise signIn qui gère aussi bien les nouveaux que les existants */
  async function handleOAuth(strategy: "oauth_google" | "oauth_apple" | "oauth_facebook") {
    if (!clerkReady || !signIn) return;
    reset();
    setOAuthLoading(strategy);
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: SSO_CALLBACK_URL,
        redirectUrlComplete: REDIRECT_AFTER_AUTH,
      });
    } catch (err: unknown) {
      const e = err as { errors?: { longMessage?: string; message?: string }[] };
      setError(
        e.errors?.[0]?.longMessage ||
        e.errors?.[0]?.message ||
        "Connexion impossible. Vérifiez la configuration dans le Clerk Dashboard."
      );
      setOAuthLoading(null);
    }
  }

  /* Email sign-up / sign-in */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    reset();
    try {
      if (mode === "signup") {
        const res = await signUp!.create({
          emailAddress: email,
          password,
          firstName,
          lastName,
        });
        if (res.status === "complete") {
          await setActiveSU!({ session: res.createdSessionId });
          router.push(REDIRECT_AFTER_AUTH);
        } else {
          await signUp!.prepareEmailAddressVerification({ strategy: "email_code" });
          setMode("verify");
        }
      } else {
        const res = await signIn!.create({ identifier: email, password });
        if (res.status === "complete") {
          await setActiveSI!({ session: res.createdSessionId });
          router.push(REDIRECT_AFTER_AUTH);
        }
      }
    } catch (err: unknown) {
      const e = err as { errors?: { longMessage?: string }[] };
      setError(e.errors?.[0]?.longMessage ?? "Vérifiez vos informations et réessayez.");
    } finally {
      setLoading(false);
    }
  }

  /* Verify OTP */
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    reset();
    try {
      const res = await signUp!.attemptEmailAddressVerification({ code });
      if (res.status === "complete") {
        await setActiveSU!({ session: res.createdSessionId });
        router.push(REDIRECT_AFTER_AUTH);
      }
    } catch (err: unknown) {
      const e = err as { errors?: { longMessage?: string }[] };
      setError(e.errors?.[0]?.longMessage ?? "Code invalide. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  /* Verification screen */
  if (mode === "verify") {
    return (
      <VerifyForm
        email={email}
        code={code}
        setCode={setCode}
        error={error}
        loading={loading}
        onSubmit={handleVerify}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Social buttons */}
      <div className="space-y-2.5">
        <SocialBtn icon={<GoogleIcon />}   label="Continuer avec Google"   onClick={() => handleOAuth("oauth_google")}   loading={oauthLoading === "oauth_google"}   disabled={!clerkReady || oauthLoading !== null} />
        <SocialBtn icon={<AppleIcon />}    label="Continuer avec Apple"    onClick={() => handleOAuth("oauth_apple")}    loading={oauthLoading === "oauth_apple"}    disabled={!clerkReady || oauthLoading !== null} />
        <SocialBtn icon={<FacebookIcon />} label="Continuer avec Facebook" onClick={() => handleOAuth("oauth_facebook")} loading={oauthLoading === "oauth_facebook"} disabled={!clerkReady || oauthLoading !== null} />
      </div>
      {error && oauthLoading === null && (
        <p className="text-red-500 text-[13px] text-center leading-snug">{error}</p>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 font-medium select-none">ou</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "signup" && (
          <div className="grid grid-cols-2 gap-2.5">
            <input
              type="text"
              placeholder="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputCls}
              autoComplete="given-name"
              required
            />
            <input
              type="text"
              placeholder="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputCls}
              autoComplete="family-name"
              required
            />
          </div>
        )}

        <input
          type="email"
          placeholder="Adresse e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          autoComplete="email"
          required
        />

        <input
          type="password"
          placeholder={mode === "signup" ? "Mot de passe (8 caractères min.)" : "Mot de passe"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          minLength={8}
          required
        />

        {error && (
          <p className="text-red-500 text-[13px] leading-snug">{error}</p>
        )}

        <SubmitBtn
          loading={loading}
          label={mode === "signup" ? "Créer mon compte" : "Se connecter"}
        />
      </form>

      {/* Toggle sign-up / sign-in */}
      <p className="text-center text-[13px] text-slate-500">
        {mode === "signup" ? (
          <>
            Déjà un compte ?{" "}
            <button
              type="button"
              onClick={() => { setMode("signin"); reset(); }}
              className="text-blue-500 font-semibold hover:text-blue-600 transition-colors"
            >
              Se connecter
            </button>
          </>
        ) : (
          <>
            Pas encore de compte ?{" "}
            <button
              type="button"
              onClick={() => { setMode("signup"); reset(); }}
              className="text-blue-500 font-semibold hover:text-blue-600 transition-colors"
            >
              S&apos;inscrire
            </button>
          </>
        )}
      </p>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function ConnexionPage() {
  const pathname = usePathname();

  /* SSO callback after OAuth redirect */
  if (pathname?.endsWith("/sso-callback")) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Connexion en cours…</p>
          <AuthenticateWithRedirectCallback />
        </div>
      </div>
    );
  }

  return (
    <section
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4"
      style={{ background: "linear-gradient(160deg, #F1F5F9 0%, #EFF6FF 60%, #F0FDFF 100%)" }}
    >
      <div className="w-full max-w-[400px]">
        {/* Header — inchangé */}
        <div className="text-center mb-7">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/1f483103ef15ee3549eab14ba2801d11b32a9055-313x313.png"
            alt="Vanzon Explorer"
            width={52}
            height={52}
            className="mx-auto mb-4"
            unoptimized
          />
          <h1 className="text-[22px] font-black text-slate-900 leading-tight">
            Bienvenue sur Vanzon Explorer
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">
            Créez votre compte pour déposer votre annonce.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 px-6 py-6">
          <AuthForm />
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          En créant un compte, vous acceptez nos{" "}
          <a
            href="/mentions-legales"
            className="underline underline-offset-2 hover:text-slate-600 transition-colors"
          >
            conditions d&apos;utilisation
          </a>
          .
        </p>
      </div>
    </section>
  );
}
