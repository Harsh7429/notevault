import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { AppShell } from "@/components/layout/app-shell";
import { getDeviceId, getStoredToken, setStoredToken } from "@/lib/auth";
import { registerUser } from "@/lib/api";

const initialValues = { name: "", email: "", password: "" };

export default function RegisterPage() {
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
      const payload = await registerUser({ ...values, deviceId: getDeviceId() });
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
      <Head><title>Register | NoteVault</title></Head>
      <AppShell>
        <section className="py-6 sm:py-10 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            {/* Left description — desktop only */}
            <div className="hidden space-y-6 lg:block">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7a7368]">Create account</div>
              <h1 className="font-heading text-5xl text-[#171511]">
                Create your NoteVault account to buy and access notes securely.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-[#5a5449]">
                Register once to unlock your student dashboard, secure note access, and future purchases across the platform.
              </p>
              <div className="rounded-[1.8rem] border border-[#171511]/8 bg-white/65 p-5 text-[#5a5449]">
                New registrations create a normal student account. Admin privileges can be assigned later.
              </div>
            </div>

            {/* Auth form */}
            <AuthForm
              badge="Quick signup"
              title="Create your account"
              description="Register to buy premium notes and access protected PDFs inside NoteVault."
              fields={[
                { name: "name",     label: "Full name",     placeholder: "Harsh Kumar" },
                { name: "email",    label: "Email address", type: "email",    placeholder: "you@example.com" },
                { name: "password", label: "Password",      type: "password", placeholder: "Use at least 8 characters" },
              ]}
              values={values}
              error={error}
              message=""
              loading={loading}
              submitLabel="Create account"
              footerText="Already have an account?"
              footerHref="/login"
              footerLinkLabel="Login"
              onChange={handleChange}
              onSubmit={handleSubmit}
            />
          </div>
        </section>
      </AppShell>
    </>
  );
}
