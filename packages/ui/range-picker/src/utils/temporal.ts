import { Temporal } from 'temporal-polyfill';

export function isPlainDate(temporal: unknown): temporal is Temporal.PlainDate {
  return (
    temporal !== null &&
    typeof temporal === 'object' &&
    !('hour' in temporal) &&
    'year' in temporal &&
    'month' in temporal &&
    'day' in temporal &&
    !(temporal instanceof Date)
  );
}
