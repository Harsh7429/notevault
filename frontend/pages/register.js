import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { AppShell } from "@/components/layout/app-shell";
import { getDeviceId, getStoredToken, setStoredToken } from "@/lib/auth";
import { registerUser } from "@/lib/api";

const initialValues = {
  name: "",
  email: "",
  password: ""
};

export default function RegisterPage() {
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
      const deviceId = getDeviceId();

      const payload = await registerUser({
        ...values,
        deviceId
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
        <title>Register | NoteVault</title>
      </Head>
      <AppShell>
        <section className="grid gap-8 py-8 sm:py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-6">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7a7368]">Create account</div>
            <h1 className="font-heading text-4xl text-[#171511] sm:text-5xl">Create your NoteVault account to buy and access notes securely.</h1>
            <p className="max-w-xl text-lg leading-8 text-[#5a5449]">
              Register once to unlock your student dashboard, secure note access, and future purchases across the platform.
            </p>
            <div className="rounded-[1.8rem] border border-[#171511]/8 bg-white/65 p-5 text-[#5a5449]">
              New registrations create a normal student account. Admin privileges can be assigned later from the database or management layer.
            </div>
          </div>

          <AuthForm
            badge="Quick signup"
            title="Create your account"
            description="Register to buy premium notes, keep your purchases safe, and access protected PDFs inside NoteVault."
            fields={[
              { name: "name", label: "Full name", placeholder: "Harsh Kumar" },
              { name: "email", label: "Email address", type: "email", placeholder: "you@example.com" },
              { name: "password", label: "Password", type: "password", placeholder: "Use at least 8 characters" }
            ]}
            values={values}
            error={error}
            message=""
            loading={loading}
            submitLabel="Create account"
            footerText="Already have an account?"
            footerHref="/login"
            footerLinkLabel="Login"
            sideNote="Fill in your details to create your NoteVault account instantly."
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
        </section>
      </AppShell>
    </>
  );
}