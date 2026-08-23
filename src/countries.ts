export const COUNTRY_CODES = [
  'BR', 'PT', 'AR', 'CO', 'UY', 'CL', 'PY', 'BO', 'PE', 'VE', 'EC', 'MX',
  'US', 'CA', 'GB', 'ES', 'FR', 'IT', 'DE', 'CH', 'AT', 'BE', 'NL', 'IE',
  'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'RO', 'HR', 'GR', 'IL', 'IN', 'JP',
  'CN', 'KR', 'PH', 'TH', 'VN', 'AU', 'NZ', 'ZA', 'NG', 'KE', 'EG', 'MA',
] as const

export function isCountryCode(value: string): boolean {
  return /^[A-Za-z]{2}$/.test(value)
}

export function countryName(code: string, locale: string = 'pt-BR'): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code.toUpperCase()) ?? code.toUpperCase()
  } catch {
    return code.toUpperCase()
  }
}

export function flagEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)))
}

export function flagUrl(code: string): string {
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`
}
