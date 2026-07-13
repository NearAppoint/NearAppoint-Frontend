/** Display helpers. No business logic — the backend owns that. */
export function toE164(digits: string): string {
  return `+92${digits}`;
}

/** "0300 1234567" — how a Pakistani reads their own number back. */
export function toLocalDisplayFromDigits(d: string): string {
  return d.length >= 4 ? `0${d.slice(0, 3)} ${d.slice(3)}` : `0${d}`;
}
