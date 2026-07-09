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

export function getTeacherDerivedPin(classroomId: string | null, studentId: string): string {
  const key = classroomId ? classroomId.split('@')[0] : (studentId || "GURO_TEACHER_SALT");
  let sum = 0;
  for (let i = 0; i < key.length; i++) {
    sum += key.charCodeAt(i) * (i + 3);
  }
  // Ensure exactly 4 digits
  return (1000 + (sum % 9000)).toString();
}
