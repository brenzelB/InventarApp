"use client";

import { useState } from "react";

// ──────────────────────────────────────────────────────────────
// Passwort-Stärke berechnen
// ──────────────────────────────────────────────────────────────
export function getPasswordStrength(password: string): {
  score: number;        // 0–4
  label: string;
  color: string;
  bgColor: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Zu kurz",    color: "text-slate-400",   bgColor: "bg-slate-300" },
    { label: "Schwach",    color: "text-red-500",      bgColor: "bg-red-500" },
    { label: "Mittel",     color: "text-orange-500",   bgColor: "bg-orange-500" },
    { label: "Stark",      color: "text-yellow-500",   bgColor: "bg-yellow-500" },
    { label: "Sehr stark", color: "text-green-500",    bgColor: "bg-green-500" },
  ];

  return { score, ...levels[score] };
}

// ──────────────────────────────────────────────────────────────
// PasswordStrengthBar
// ──────────────────────────────────────────────────────────────
function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const { score, label, color, bgColor } = getPasswordStrength(password);

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? bgColor : "bg-slate-200 dark:bg-slate-700"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${color}`}>{label}</p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// EyeIcon / EyeOffIcon
// ──────────────────────────────────────────────────────────────
function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────
// PasswordInput – Haupt-Komponente
// ──────────────────────────────────────────────────────────────
interface PasswordInputProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
  showStrength?: boolean;
  placeholder?: string;
}

export function PasswordInput({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete = "current-password",
  disabled = false,
  required = false,
  showStrength = false,
  placeholder,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200"
      >
        {label}
      </label>
      <div className="mt-2 relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          className="block w-full rounded-3xl border-0 py-1.5 pr-10 pl-3 text-slate-900 dark:text-white dark:bg-widget shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
          aria-label={visible ? "Passwort verbergen" : "Passwort anzeigen"}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {showStrength && <PasswordStrengthBar password={value} />}
    </div>
  );
}
