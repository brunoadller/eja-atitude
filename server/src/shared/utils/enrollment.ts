export function generateEnrollment(year = new Date().getFullYear()): string {
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `EJA${year}${rand}`;
}
