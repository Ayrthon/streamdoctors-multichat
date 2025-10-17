export function generatePublicToken() {
  // Browser-safe: use Web Crypto if available
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(24)
    crypto.getRandomValues(bytes)
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  }

  // Node fallback (for Nitro server)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { randomBytes } = require('crypto')
  return randomBytes(24).toString('base64url')
}
