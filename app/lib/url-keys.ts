const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type UrlKeyRecord = {
  id: string
  url_key?: string | null
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

export function getUrlKey(record: UrlKeyRecord): string {
  const key = record.url_key?.trim()
  return key ? key : record.id
}
