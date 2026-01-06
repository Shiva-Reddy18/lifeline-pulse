export function maskPatientId(id: string) {
  if (!id) return '';
  return `${id.slice(0, 3)}***${id.slice(-2)}`;
}
