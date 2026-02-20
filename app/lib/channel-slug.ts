const CHANNEL_ID_SUFFIX_LENGTH = 8

function slugifyText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeChannelId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Build a deterministic, human-readable slug for channel pages.
 * We append a short channel-id suffix when available for better stability/uniqueness.
 */
export function getChannelSlug(
  sourceChannelName?: string | null,
  sourceChannelId?: string | null
): string | null {
  const base = slugifyText((sourceChannelName || '').trim())
  const normalizedId = normalizeChannelId((sourceChannelId || '').trim())
  const idSuffix = normalizedId
    ? normalizedId.slice(-CHANNEL_ID_SUFFIX_LENGTH)
    : ''

  if (base && idSuffix) return `${base}-${idSuffix}`
  if (base) return base
  if (idSuffix) return `channel-${idSuffix}`

  const idFallback = (sourceChannelId || '').trim()
  return idFallback || null
}
