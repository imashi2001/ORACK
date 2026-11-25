"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";

const input =
  "h-12 w-full border-[1.5px] border-[#3a3a3a] bg-transparent px-3.5 text-[15px] text-white outline-none transition-colors placeholder:text-[#6b6b6b] focus:border-white";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="redirectTo" value={next} />
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-[13px] font-semibold text-[#d4d4d4]">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required defaultValue={state.email} className={input} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-[13px] font-semibold text-[#d4d4d4]">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={input} />
      </div>
      {state.error && (
        <p role="alert" className="text-sm font-medium text-[#ff8a80]">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-13 border-[1.5px] border-white bg-white text-[13px] font-semibold tracking-[0.14em] text-ink uppercase transition-colors hover:bg-[#d6d6d4] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
