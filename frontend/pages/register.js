import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { AppShell } from "@/components/layout/app-shell";
import { getDeviceId, getStoredToken, setStoredToken } from "@/lib/auth";
import { registerUser, verifyRegistrationOtp } from "@/lib/api";

const initialValues = {
  name: "",
  email: "",
  password: ""
};

export default function RegisterPage() {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
    setMessage("");

    try {
      const deviceId = getDeviceId();

      if (otpStep) {
        const payload = await verifyRegistrationOtp({
          challengeId: otpStep.challengeId,
          otpCode,
          deviceId
        });

        setStoredToken(payload.token);
        router.push("/dashboard");
        return;
      }

      const payload = await registerUser({
        ...values,
        deviceId
      });

      setOtpStep(payload);
      setMessage(`We sent a 6-digit registration code to ${payload.maskedEmail}. Enter it below to finish creating the account.`);
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
            badge={otpStep ? "Verify email" : "Quick signup"}
            title={otpStep ? "Verify your email" : "Create your account"}
            description={
              otpStep
                ? "Enter the one-time code sent to your email to activate your NoteVault account safely."
                : "Register to buy premium notes, keep your purchases safe, and access protected PDFs inside NoteVault."
            }
            fields={
              otpStep
                ? [
                    {
                      name: "otpCode",
                      label: "Email OTP",
                      placeholder: "Enter 6-digit code"
                    }
                  ]
                : [
                    { name: "name", label: "Full name", placeholder: "Harsh Kumar" },
                    { name: "email", label: "Email address", type: "email", placeholder: "you@example.com" },
                    { name: "password", label: "Password", type: "password", placeholder: "Use at least 8 characters" }
                  ]
            }
            values={otpStep ? { otpCode } : values}
            error={error}
            message={message}
            loading={loading}
            submitLabel={otpStep ? "Verify and create account" : "Send registration OTP"}
            footerText="Already have an account?"
            footerHref="/login"
            footerLinkLabel="Login"
            sideNote={
              otpStep
                ? "Your account will be created only after OTP verification. This protects buyers from fake signups and confirms email ownership before purchases start."
                : "Registration now uses email verification before the account is created, so the same email can safely receive OTPs, receipts, and future purchase updates."
            }
            onChange={otpStep ? (event) => setOtpCode(event.target.value) : handleChange}
            onSubmit={handleSubmit}
            extraContent={
              otpStep ? (
                <button
                  type="button"
                  className="w-full rounded-2xl border border-[#171511]/10 px-4 py-3 text-sm font-medium text-[#3f3a31] transition hover:bg-[#f7f2ea]"
                  onClick={() => {
                    setOtpStep(null);
                    setOtpCode("");
                    setError("");
                    setMessage("");
                  }}
                >
                  Change email or start over
                </button>
              ) : null
            }
          />
        </section>
      </AppShell>
    </>
  );
}
