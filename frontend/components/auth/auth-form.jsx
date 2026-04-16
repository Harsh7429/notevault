import Link from "next/link";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AuthForm({
  title,
  description,
  fields,
  values,
  error,
  message,
  loading,
  submitLabel,
  footerText,
  footerHref,
  footerLinkLabel,
  onChange,
  onSubmit,
  badge,
  sideNote,
  extraContent
}) {
  return (
    <Card className="mx-auto w-full max-w-xl rounded-[2.4rem]">
      <CardContent className="space-y-7 p-8 sm:p-10">
        <div className="space-y-4 text-center">
          {badge ? <div className="inline-flex rounded-full border border-[#171511]/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#6d675c]">{badge}</div> : null}
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-[#171511]">{title}</h1>
          <p className="mx-auto max-w-lg text-[#5a5449]">{description}</p>
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          {fields.map((field) => (
            <label key={field.name} className="block space-y-2">
              <span className="text-sm font-medium text-[#3f3a31]">{field.label}</span>
              <input
                required={field.required !== false}
                type={field.type || "text"}
                name={field.name}
                value={values[field.name] || ""}
                onChange={onChange}
                placeholder={field.placeholder}
                className="w-full rounded-2xl border border-[#171511]/10 bg-white px-4 py-3 text-base text-[#171511] outline-none transition placeholder:text-[#9a9489] focus:border-[#5f6f52]/45 focus:bg-[#fffdf9]"
              />
            </label>
          ))}

          {message ? <div className="rounded-2xl border border-[#5f6f52]/25 bg-[#edf4eb] px-4 py-3 text-sm text-[#486245]">{message}</div> : null}
          {error ? <div className="rounded-2xl border border-[#c98773]/35 bg-[#f6e7e2] px-4 py-3 text-sm text-[#8f4d3c]">{error}</div> : null}

          <Button size="lg" className="w-full" type="submit" disabled={loading}>
            {loading ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}
            {submitLabel}
          </Button>

          {extraContent}
        </form>

        {sideNote ? <div className="rounded-[1.6rem] border border-[#171511]/8 bg-[#f8f2e9] px-4 py-4 text-sm leading-7 text-[#5e574b]">{sideNote}</div> : null}

        <p className="text-center text-sm text-[#7a7368]">
          {footerText}{" "}
          <Link href={footerHref} className="font-semibold text-[#171511] hover:text-[#5f6f52]">
            {footerLinkLabel}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
