import type { Language } from '$lib/server/judge0';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  const [langsRes, configRes, workersRes, systemRes, statsRes, statusesRes] = await Promise.allSettled([
    fetch('/api/judge0/languages'),
    fetch('/api/judge0/config'),
    fetch('/api/judge0/workers'),
    fetch('/api/judge0/system'),
    fetch('/api/judge0/statistics'),
    fetch('/api/judge0/statuses'),
  ]);

  let languages: Language[] = [];
  let config: Record<string, unknown> = {};
  let workers: unknown = null;
  let system: unknown = null;
  let stats: unknown = null;
  let statuses: unknown = null;

  if (langsRes.status === 'fulfilled' && langsRes.value.ok) languages = await langsRes.value.json();
  if (configRes.status === 'fulfilled' && configRes.value.ok) config = await configRes.value.json();
  if (workersRes.status === 'fulfilled' && workersRes.value.ok) workers = await workersRes.value.json();
  if (systemRes.status === 'fulfilled' && systemRes.value.ok) system = await systemRes.value.json();
  if (statsRes.status === 'fulfilled' && statsRes.value.ok) stats = await statsRes.value.json();
  if (statusesRes.status === 'fulfilled' && statusesRes.value.ok) statuses = await statusesRes.value.json();

  return { languages, config, workers, system, stats, statuses };
};
