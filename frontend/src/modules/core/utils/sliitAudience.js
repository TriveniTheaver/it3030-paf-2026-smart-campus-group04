/**
 * Infer campus audience label from SLIIT email (same domains as login copy).
 * @returns {'Student' | 'Staff' | null}
 */
export function sliitAudienceFromEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const e = email.trim().toLowerCase();
  if (e.endsWith('@my.sliit.lk')) return 'Student';
  if (e.endsWith('@sliit.lk')) return 'Staff';
  return null;
}
