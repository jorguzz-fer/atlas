/**
 * The visitor's IP behind Coolify's proxy (Traefik), which appends the real address to X-Forwarded-For.
 * Only the right-most entry is trusted: anything to its left was sent by the client and can be forged.
 */
export function clientIp(headers: Headers, remote: string): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const last = forwarded.split(',').map(s => s.trim()).filter(Boolean).pop();
    if (last) return last;
  }
  return remote || 'desconhecido';
}
