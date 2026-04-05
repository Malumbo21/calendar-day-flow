import { TimeZone, TimeZoneValue } from '@/types/timezone';

const timeZoneCache = new Map<string, string>();

function canonicalizeTimeZoneCandidate(timeZone: string): string | undefined {
  try {
    return new Intl.DateTimeFormat('en', {
      timeZone,
    }).resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

export function normalizeTimeZoneValue(
  timeZone?: TimeZoneValue
): string | undefined {
  if (!timeZone || typeof timeZone !== 'string') {
    return undefined;
  }

  const trimmed = timeZone.trim();
  if (!trimmed) {
    return undefined;
  }

  const cached = timeZoneCache.get(trimmed);
  if (cached) {
    return cached;
  }

  const canonical = canonicalizeTimeZoneCandidate(trimmed);
  if (canonical) {
    timeZoneCache.set(trimmed, canonical);
    return canonical;
  }

  const enumMatch = Object.values(TimeZone).find(
    value => value.toLowerCase() === trimmed.toLowerCase()
  );
  if (enumMatch) {
    const canonicalEnumMatch = canonicalizeTimeZoneCandidate(enumMatch);
    if (canonicalEnumMatch) {
      timeZoneCache.set(trimmed, canonicalEnumMatch);
      return canonicalEnumMatch;
    }
    timeZoneCache.set(trimmed, enumMatch);
    return enumMatch;
  }

  if (typeof Intl.supportedValuesOf === 'function') {
    const intlMatch = Intl.supportedValuesOf('timeZone').find(
      value => value.toLowerCase() === trimmed.toLowerCase()
    );
    if (intlMatch) {
      timeZoneCache.set(trimmed, intlMatch);
      return intlMatch;
    }
  }

  const slashNormalized = trimmed
    .split('/')
    .map(segment =>
      segment
        .split('_')
        .map(part =>
          part
            ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            : part
        )
        .join('_')
    )
    .join('/');
  const canonicalSlashNormalized =
    canonicalizeTimeZoneCandidate(slashNormalized);
  if (canonicalSlashNormalized) {
    timeZoneCache.set(trimmed, canonicalSlashNormalized);
    return canonicalSlashNormalized;
  }

  const upperPrefixNormalized = trimmed
    .split('/')
    .map((segment, index) =>
      index === 0
        ? segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
        : segment
    )
    .join('/');
  const canonicalUpperPrefixNormalized = canonicalizeTimeZoneCandidate(
    upperPrefixNormalized
  );
  if (canonicalUpperPrefixNormalized) {
    timeZoneCache.set(trimmed, canonicalUpperPrefixNormalized);
    return canonicalUpperPrefixNormalized;
  }

  return trimmed;
}
