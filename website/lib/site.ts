const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const BASE_PATH =
  rawBasePath.length > 1 && rawBasePath.endsWith('/')
    ? rawBasePath.slice(0, -1)
    : rawBasePath;

const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (BASE_PATH
    ? `https://dayflow-js.github.io${BASE_PATH}`
    : 'http://localhost:3000');

export const SITE_URL = rawSiteUrl.endsWith('/')
  ? rawSiteUrl.slice(0, -1)
  : rawSiteUrl;

export const SITE_METADATA_BASE = new URL(SITE_URL);

const PRO_BASE_URL = 'https://pro.dayflow.studio';
const SCHEDULER_BASE_URL = 'https://scheduler.dayflow.studio';

function ecosystemUrl(baseUrl: string, content: string): string {
  const params = new URLSearchParams({
    utm_source: 'calendar.dayflow.studio',
    utm_medium: 'referral',
    utm_content: content,
  });
  return `${baseUrl}/?${params.toString()}`;
}

export function proUrl(content: string): string {
  return ecosystemUrl(PRO_BASE_URL, content);
}

export function schedulerUrl(content: string): string {
  return ecosystemUrl(SCHEDULER_BASE_URL, content);
}
