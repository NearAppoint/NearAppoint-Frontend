/**
 * Phone formatting for INPUT ONLY.
 *
 * The canonical E.164 normalisation lives in the BACKEND. This is a UX
 * affordance so the user sees "0300 1234567" as they type. The backend
 * re-validates everything it receives and never trusts this.
 */
export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, '').replace(/^0092/, '').replace(/^92/, '').replace(/^0/, '').slice(0, 10);
}

export function isValidPkMobile(raw: string): boolean {
  return /^3\d{9}$/.test(digitsOnly(raw));
}

export function toE164(raw: string): string {
  return `+92${digitsOnly(raw)}`;
}

/** As-you-type: "300 1234567" */
export function formatAsTyped(raw: string): string {
  const d = digitsOnly(raw);
  return d.length > 3 ? `${d.slice(0, 3)} ${d.slice(3)}` : d;
}

/** "0300 1234567" — how a Pakistani reads their own number back. */
export function toLocalDisplay(e164: string): string {
  const d = e164.replace(/^\+92/, '');
  return `0${d.slice(0, 3)} ${d.slice(3)}`;
}
