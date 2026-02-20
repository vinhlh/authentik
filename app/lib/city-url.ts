function normalizePath(pathname: string): string {
  if (!pathname) return '/'
  if (pathname === '/') return '/'
  return pathname.startsWith('/') ? pathname : `/${pathname}`
}

export function getCityIdFromPathname(pathname?: string | null): string | null {
  if (!pathname) return null
  const match = pathname.match(/^\/city\/([^/]+)(?:\/|$)/)
  if (!match) return null
  return decodeURIComponent(match[1])
}

export function stripCityPrefix(pathname: string): string {
  const normalized = normalizePath(pathname)
  const match = normalized.match(/^\/city\/[^/]+(\/.*)?$/)
  if (!match) return normalized
  return match[1] || '/'
}

export function withCityParam(href: string, cityId?: string | null): string {
  if (!cityId) return href

  const [rawPathname, queryString = ''] = href.split('?', 2)
  const pathname = normalizePath(rawPathname)
  const cityEncoded = encodeURIComponent(cityId)
  const params = new URLSearchParams(queryString)
  params.delete('city')
  const cleanedQuery = params.toString()

  if (pathname === '/') {
    return cleanedQuery ? `/city/${cityEncoded}?${cleanedQuery}` : `/city/${cityEncoded}`
  }

  const withoutCity = stripCityPrefix(pathname)
  const withCityPath = `/city/${cityEncoded}${withoutCity === '/' ? '' : withoutCity}`
  return cleanedQuery ? `${withCityPath}?${cleanedQuery}` : withCityPath
}
