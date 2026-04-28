import { error, json } from '@sveltejs/kit';

import { judge0Fetch } from '$lib/server/judge0';

import type { RequestHandler } from './$types';

/** GET /api/judge0/system — system info */
export const GET: RequestHandler = async () => {
  const res = await judge0Fetch('/system_info');
  if (!res.ok) throw error(res.status, await res.text());
  return json(await res.json());
};
