import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { getDeviceId, getStoredToken, setStoredToken } from "@/lib/auth";
import { loginUser, verifyLoginOtp } from "@/lib/api";

const initialValues = {
  email: "",
  password: "",
  otpCode: ""
};

export default function LoginPage() {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [otpChallenge, setOtpChallenge] = useState(null);

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

      if (!otpChallenge) {
        const payload = await loginUser({
          email: values.email,
          password: values.password,
          deviceId
        });

        setOtpChallenge(payload);
        setMessage(`We sent a 6-digit OTP to ${payload.maskedEmail}. Enter it below to finish signing in.`);
        return;
      }

      const payload = await verifyLoginOtp({
        challengeId: otpChallenge.challengeId,
        otpCode: values.otpCode,
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

  async function handleResendOtp() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const payload = await loginUser({
        email: values.email,
        password: values.password,
        deviceId: getDeviceId()
      });

      setOtpChallenge(payload);
      setMessage(`A fresh OTP has been sent to ${payload.maskedEmail}.`);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  const formFields = otpChallenge
    ? [{ name: "otpCode", label: "Email OTP", placeholder: "Enter the 6-digit code" }]
    : [
        { name: "email", label: "Email address", type: "email", placeholder: "you@example.com" },
        { name: "password", label: "Password", type: "password", placeholder: "Enter your password" }
      ];

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
              Every login now requires your password plus an email OTP, and successful verification invalidates older device sessions automatically.
            </div>
          </div>

          <AuthForm
            badge={otpChallenge ? "OTP verification" : "Student login"}
            title={otpChallenge ? "Check your email" : "Welcome back"}
            description={
              otpChallenge
                ? "Your password is correct. Enter the one-time code from your email to finish this login on the current device."
                : "Sign in to access your purchases, protected files, and secure NoteVault session."
            }
            fields={formFields}
            values={values}
            error={error}
            message={message}
            loading={loading}
            submitLabel={otpChallenge ? "Verify OTP" : "Send OTP"}
            footerText="Need an account?"
            footerHref="/register"
            footerLinkLabel="Register"
            sideNote={
              otpChallenge
                ? "For security, NoteVault now requires both your password and an email OTP before a session is created. Older device sessions are invalidated after a new verified login."
                : "For stronger account protection, NoteVault sends a one-time code to your email after password verification before allowing a login."
            }
            extraContent={
              otpChallenge ? (
                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="ghost" onClick={handleResendOtp} disabled={loading}>
                    Resend OTP
                  </Button>
                  <Button
                    type="button"
                    variant="soft"
                    onClick={() => {
                      setOtpChallenge(null);
                      setValues((current) => ({ ...current, otpCode: "" }));
                      setMessage("");
                      setError("");
                    }}
                    disabled={loading}
                  >
                    Use different credentials
                  </Button>
                </div>
              ) : null
            }
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
        </section>
      </AppShell>
    </>
  );
}
