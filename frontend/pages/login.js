import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { AppShell } from "@/components/layout/app-shell";
import { getDeviceId, getStoredToken, setStoredToken } from "@/lib/auth";
import { loginUser } from "@/lib/api";

const initialValues = { email: "", password: "" };

export default function LoginPage() {
  const router = useRouter();
  const [values,  setValues]  = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (getStoredToken()) router.replace("/dashboard");
  }, [router]);

  function handleChange(e) {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = await loginUser({ ...values, deviceId: getDeviceId() });
      setStoredToken(payload.token);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head><title>Login | NoteVault</title></Head>
      <AppShell>
        <section className="py-6 sm:py-10 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            {/* Left description — desktop only */}
            <div className="hidden space-y-6 lg:block">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7a7368]">Welcome back</div>
              <h1 className="font-heading text-5xl text-[#171511]">
                Return to your purchased notes and secure reading dashboard.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-[#5a5449]">
                Sign in to continue browsing products, open purchased notes, and manage your NoteVault account from one place.
              </p>
              <div className="rounded-[1.8rem] border border-[#171511]/8 bg-white/65 p-5 text-[#5a5449]">
                Sign in with your email and password to access your NoteVault dashboard and purchased notes.
              </div>
            </div>

            {/* Auth form */}
            <AuthForm
              badge="Student login"
              title="Welcome back"
              description="Sign in to access your purchases, protected files, and secure NoteVault session."
              fields={[
                { name: "email",    label: "Email address", type: "email",    placeholder: "you@example.com" },
                { name: "password", label: "Password",      type: "password", placeholder: "Enter your password" },
              ]}
              values={values}
              error={error}
              message=""
              loading={loading}
              submitLabel="Sign in"
              footerText="Need an account?"
              footerHref="/register"
              footerLinkLabel="Register"
              onChange={handleChange}
              onSubmit={handleSubmit}
            />
          </div>
        </section>
      </AppShell>
    </>
  );
}
