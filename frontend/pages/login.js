import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { AppShell } from "@/components/layout/app-shell";
import { getDeviceId, getStoredToken, setStoredToken } from "@/lib/auth";
import { loginUser } from "@/lib/api";

const initialValues = {
  email: "",
  password: ""
};

export default function LoginPage() {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getStoredToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  function handleChange(event) {
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = await loginUser({
        ...values,
        deviceId: getDeviceId()
      });

      setStoredToken(payload.token);
      router.push("/dashboard");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Login | NoteVault</title>
      </Head>
      <AppShell>
        <section className="grid gap-8 py-8 sm:py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-6">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7a7368]">Welcome back</div>
            <h1 className="font-heading text-4xl text-[#171511] sm:text-5xl">Return to your purchased notes and secure reading dashboard.</h1>
            <p className="max-w-xl text-lg leading-8 text-[#5a5449]">
              Sign in to continue browsing products, open purchased notes, and manage your NoteVault account from one place.
            </p>
            <div className="rounded-[1.8rem] border border-[#171511]/8 bg-white/65 p-5 text-[#5a5449]">
              Use the same account you registered with. Your session is tied to your current device for added account protection.
            </div>
          </div>

          <AuthForm
            badge="Student login"
            title="Welcome back"
            description="Sign in to access your purchases, protected files, and secure NoteVault session."
            fields={[
              { name: "email", label: "Email address", type: "email", placeholder: "you@example.com" },
              { name: "password", label: "Password", type: "password", placeholder: "Enter your password" }
            ]}
            values={values}
            error={error}
            loading={loading}
            submitLabel="Login"
            footerText="Need an account?"
            footerHref="/register"
            footerLinkLabel="Register"
            sideNote="If login does not work yet, check that your backend server, PostgreSQL connection, and environment variables are running correctly."
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
        </section>
      </AppShell>
    </>
  );
}
