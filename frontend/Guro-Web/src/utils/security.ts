/**
 * Security utilities for pairing codes.
 */
export function getParentAccessCode(studentId: string): string {
  const normalized = (studentId || '').trim().replace(/\s+/g, '-').toUpperCase();
  const salt = "GURO_PARENT_SALT";
  const combined = normalized + salt;
  let sum = 0;
  for (let i = 0; i < combined.length; i++) {
    sum += combined.charCodeAt(i) * (i + 1);
  }
  return (100000 + (sum % 900000)).toString();
}
