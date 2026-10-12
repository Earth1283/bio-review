export function withBase(sitePath = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${sitePath.replace(/^\//, '')}`;
}
