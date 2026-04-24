import { error, json } from '@sveltejs/kit';

import { judge0Fetch } from '$lib/server/judge0';

import type { RequestHandler } from './$types';

/** GET /api/judge0/statistics — submission statistics */
export const GET: RequestHandler = async () => {
  const res = await judge0Fetch('/statistics');
  if (!res.ok) throw error(res.status, await res.text());
  return json(await res.json());
};
