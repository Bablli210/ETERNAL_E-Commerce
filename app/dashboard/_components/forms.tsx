"use client";

import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import {
  acceptInvite,
  applyResetLink,
  changePassword,
  completeSetup,
  createInvite,
  createResetLink,
  managePerson,
  refreshFigures,
  signIn,
  type FormState,
  type LinkState,
} from "../actions";
import type { Role } from "@/lib/dashboard/types";

/**
 * The dashboard's forms. Each posts to a Server Action and shows its answer
 * in place (useActionState), so a mistake never loses what was typed or, on
 * the invite and reset pages, the one-time link.
 */

/**
 * React clears a form once its action finishes, which would wipe the name and
 * username after a mistake. With JavaScript, the form is sent from onSubmit
 * instead (no reset); the action prop stays for the rare visit without it.
 */
function useKeepFields(action: (fd: FormData) => void, prepare?: (fd: FormData) => void) {
  const [, startTransition] = useTransition();
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    prepare?.(fd);
    startTransition(() => action(fd));
  };
}

function Message({ state }: { state: FormState | LinkState }) {
  if (state?.error)
    return (
      <p className="dash-error" role="alert">
        {state.error}
      </p>
    );
  if (state && "ok" in state && state.ok)
    return (
      <p className="dash-ok" role="status">
        {state.ok}
      </p>
    );
  return null;
}

function Field({
  label,
  name,
  type = "text",
  hint,
  autoComplete,
  required = true,
  defaultValue,
  minLength,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  hint?: string;
  autoComplete?: string;
  required?: boolean;
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div className="dash-field">
      <label className="dash-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="dash-input"
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        autoCapitalize={type === "text" ? "none" : undefined}
        spellCheck={false}
        defaultValue={defaultValue}
        minLength={minLength}
        maxLength={maxLength}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      {hint && (
        <p className="dash-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}

const USERNAME_HINT = "3 to 32 lower-case letters, numbers, dots or dashes. Not an email address.";
const PASSWORD_HINT = "At least 15 characters. A short sentence you will remember works well.";

function Submit({ pending, children, tone }: { pending: boolean; children: React.ReactNode; tone?: "secondary" | "danger" }) {
  return (
    <button type="submit" className={`dash-btn${tone ? ` ${tone}` : ""}`} disabled={pending} aria-busy={pending || undefined}>
      {pending ? "One moment…" : children}
    </button>
  );
}

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, null);
  const onSubmit = useKeepFields(action);
  return (
    <form action={action} onSubmit={onSubmit} className="dash-form">
      <Field label="Username" name="username" autoComplete="username" maxLength={64} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" maxLength={128} />
      <Message state={state} />
      <Submit pending={pending}>Sign in</Submit>
    </form>
  );
}

export function SetupForm() {
  const [state, action, pending] = useActionState(completeSetup, null);
  const onSubmit = useKeepFields(action);
  return (
    <form action={action} onSubmit={onSubmit} className="dash-form">
      <Field label="Setup code" name="code" type="password" autoComplete="off" hint="The one-time code you were given. It works once." />
      <Field label="Your name" name="name" autoComplete="given-name" maxLength={60} hint="How the team sees you, e.g. Seif." />
      <Field label="Username" name="username" autoComplete="username" maxLength={32} hint={USERNAME_HINT} />
      <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={15} maxLength={128} hint={PASSWORD_HINT} />
      <Field label="Password again" name="confirm" type="password" autoComplete="new-password" minLength={15} maxLength={128} />
      <Message state={state} />
      <Submit pending={pending}>Create the owner account</Submit>
    </form>
  );
}

/**
 * The one-time token arrives after # in the link (never sent to a server,
 * so it stays out of logs and link previews). It is read once, taken out of
 * the address bar, and added to the form only when it is sent.
 */
function useLinkToken() {
  const token = useRef("");
  useEffect(() => {
    // Development runs effects twice; the second run finds no hash and must not wipe the token.
    if (window.location.hash.length > 1) {
      token.current = window.location.hash.slice(1);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);
  return token;
}

export function JoinForm() {
  const [state, action, pending] = useActionState(acceptInvite, null);
  const token = useLinkToken();
  const onSubmit = useKeepFields(action, (fd) => fd.set("token", token.current));
  return (
    <form action={action} onSubmit={onSubmit} className="dash-form">
      <Field label="Your name" name="name" autoComplete="given-name" maxLength={60} hint="How the team sees you, e.g. Nour." />
      <Field label="Choose a username" name="username" autoComplete="username" maxLength={32} hint={USERNAME_HINT} />
      <Field label="Choose a password" name="password" type="password" autoComplete="new-password" minLength={15} maxLength={128} hint={PASSWORD_HINT} />
      <Field label="Password again" name="confirm" type="password" autoComplete="new-password" minLength={15} maxLength={128} />
      <Message state={state} />
      <Submit pending={pending}>Create my account</Submit>
    </form>
  );
}

export function ResetForm() {
  const [state, action, pending] = useActionState(applyResetLink, null);
  const token = useLinkToken();
  const onSubmit = useKeepFields(action, (fd) => fd.set("token", token.current));
  return (
    <form action={action} onSubmit={onSubmit} className="dash-form">
      <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={15} maxLength={128} hint={PASSWORD_HINT} />
      <Field label="New password again" name="confirm" type="password" autoComplete="new-password" minLength={15} maxLength={128} />
      <Message state={state} />
      <Submit pending={pending}>Set my password</Submit>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, null);
  const onSubmit = useKeepFields(action);
  return (
    <form action={action} onSubmit={onSubmit} className="dash-form">
      <Field label="Current password" name="current" type="password" autoComplete="current-password" maxLength={128} />
      <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={15} maxLength={128} hint={PASSWORD_HINT} />
      <Field label="New password again" name="confirm" type="password" autoComplete="new-password" minLength={15} maxLength={128} />
      <Message state={state} />
      <Submit pending={pending}>Change password</Submit>
    </form>
  );
}

/** A link shown once, with Copy and a WhatsApp share (the owner sends it by hand). */
function OneTimeLink({ link }: { link: NonNullable<NonNullable<LinkState>["link"]> }) {
  const [copied, setCopied] = useState(false);
  const id = useId();
  const message = link.role
    ? `Hi ${link.name}, here is your invitation to the eternal performance dashboard. It works once, until ${link.expires}: ${link.url}`
    : `Hi ${link.name}, here is a link to set a new password for the eternal dashboard. It works once, until ${link.expires}: ${link.url}`;
  return (
    <div className="dash-form" aria-live="polite">
      <p className="dash-ok" role="status">
        Link for {link.name} ready. It works once, until {link.expires}, and is shown only now: send it privately.
      </p>
      <div className="dash-copy">
        <label className="sr-only" htmlFor={id}>
          One-time link
        </label>
        <input id={id} className="dash-input" readOnly value={link.url} onFocus={(e) => e.currentTarget.select()} />
        <button
          type="button"
          className="dash-btn secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link.url);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <a className="dash-btn secondary" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
        Send on WhatsApp
      </a>
    </div>
  );
}

export function InviteForm() {
  const [state, action, pending] = useActionState(createInvite, null);
  const onSubmit = useKeepFields(action);
  const nameId = useId();
  const roleId = useId();
  return (
    <div className="dash-form">
      <form action={action} onSubmit={onSubmit} className="dash-form">
        <div className="dash-field">
          <label className="dash-label" htmlFor={nameId}>
            Their first name
          </label>
          <input id={nameId} className="dash-input" name="name" required maxLength={60} autoComplete="off" />
          <p className="dash-hint">Only a name. The link itself is what lets them in.</p>
        </div>
        <div className="dash-field">
          <label className="dash-label" htmlFor={roleId}>
            What they can do
          </label>
          <select id={roleId} className="dash-input" name="role" defaultValue="client">
            <option value="client">Client: sees the figures</option>
            <option value="team">Team: sees the figures and can refresh them</option>
            <option value="owner">Owner: everything, including people</option>
          </select>
        </div>
        <Message state={state?.error ? state : null} />
        <Submit pending={pending}>Make an invite link</Submit>
      </form>
      {state?.link && <OneTimeLink link={state.link} />}
    </div>
  );
}

export function ResetLinkForm({ userId, name }: { userId: string; name: string }) {
  const [state, action, pending] = useActionState(createResetLink, null);
  return (
    <div>
      <form action={action}>
        <input type="hidden" name="userId" value={userId} />
        <Submit pending={pending} tone="secondary">
          Make a reset link<span className="sr-only"> for {name}</span>
        </Submit>
      </form>
      <Message state={state?.error ? state : null} />
      {state?.link && <OneTimeLink link={state.link} />}
    </div>
  );
}

/** Role, pause or resume, sign out everywhere, remove: one small form per change. */
export function PersonControls({ id, name, role, disabled, self }: { id: string; name: string; role: Role; disabled: boolean; self: boolean }) {
  const [state, action, pending] = useActionState(managePerson, null);
  const roleId = useId();
  return (
    <div className="dash-form">
      <form action={action} className="dash-copy">
        <input type="hidden" name="what" value="role" />
        <input type="hidden" name="id" value={id} />
        <label className="sr-only" htmlFor={roleId}>
          Role for {name}
        </label>
        <select id={roleId} className="dash-input" name="role" defaultValue={role}>
          <option value="client">Client</option>
          <option value="team">Team</option>
          <option value="owner">Owner</option>
        </select>
        <Submit pending={pending} tone="secondary">
          Save role
        </Submit>
      </form>
      <div className="dash-copy">
        {!self && (
          <form action={action}>
            <input type="hidden" name="what" value={disabled ? "resume" : "pause"} />
            <input type="hidden" name="id" value={id} />
            <Submit pending={pending} tone="secondary">
              {disabled ? "Let them sign in again" : "Pause access"}
            </Submit>
          </form>
        )}
        <form action={action}>
          <input type="hidden" name="what" value="signout" />
          <input type="hidden" name="id" value={id} />
          <Submit pending={pending} tone="secondary">
            Sign out everywhere
          </Submit>
        </form>
        {!self && (
          <form
            action={(fd) => {
              if (window.confirm(`Remove ${name}'s account? They will need a new invite to come back.`)) action(fd);
            }}
          >
            <input type="hidden" name="what" value="remove" />
            <input type="hidden" name="id" value={id} />
            <Submit pending={pending} tone="danger">
              Remove
            </Submit>
          </form>
        )}
      </div>
      <Message state={state} />
    </div>
  );
}

export function RevokeLink({ id, label }: { id: string; label: string }) {
  const [state, action, pending] = useActionState(managePerson, null);
  return (
    <form action={action}>
      <input type="hidden" name="what" value="revoke" />
      <input type="hidden" name="id" value={id} />
      <Submit pending={pending} tone="secondary">
        Revoke<span className="sr-only"> {label}</span>
      </Submit>
      <Message state={state} />
    </form>
  );
}

export function RefreshButton() {
  const [state, action, pending] = useActionState(refreshFigures, null);
  return (
    <form action={action} className="dash-inline">
      <button type="submit" className="dash-btn secondary small" disabled={pending}>
        {pending ? "Refreshing…" : "Refresh"}
      </button>
      {(state?.error || state?.ok) && (
        <span className={state.error ? "dash-error inline" : "dash-ok inline"} role="status">
          {state.error ?? state.ok}
        </span>
      )}
    </form>
  );
}
