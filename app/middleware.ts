import { NextRequest, NextResponse } from 'next/server'
import { MARKET_CITIES } from './lib/market-cities'

const CITY_IDS = new Set(MARKET_CITIES.map(city => city.id))

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/city/')) {
    return NextResponse.next()
  }

  const parts = pathname.split('/').filter(Boolean)
  const cityId = parts[1]

  if (!cityId || !CITY_IDS.has(cityId as (typeof MARKET_CITIES)[number]['id'])) {
    return NextResponse.next()
  }

  const targetPath = parts.length > 2 ? `/${parts.slice(2).join('/')}` : '/'
  const rewriteUrl = request.nextUrl.clone()
  rewriteUrl.pathname = targetPath
  rewriteUrl.searchParams.set('city', cityId)

  return NextResponse.rewrite(rewriteUrl)
}

export const config = {
  matcher: ['/city/:path*'],
}
