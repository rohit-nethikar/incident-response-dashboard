"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-plane px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-text-primary">Incident Response Dashboard</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Sign in with your Google account to view live incidents across Cloud
          Logging, Monitoring, Run, Functions, Data Fusion, BigQuery, and
          Tableau Server.
        </p>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-border bg-surface-raised px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-plane"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.85A11 11 0 0 0 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.85 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.35-2.1V7.05H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.95z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05L5.85 9.9C6.71 7.31 9.14 5.38 12 5.38z"
            />
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
