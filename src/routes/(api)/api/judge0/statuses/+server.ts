import { error, json } from '@sveltejs/kit';

import { judge0Fetch } from '$lib/server/judge0';

import type { RequestHandler } from './$types';

/** GET /api/judge0/statuses — get all execution statuses */
export const GET: RequestHandler = async () => {
  const res = await judge0Fetch('/statuses');
  if (!res.ok) throw error(res.status, await res.text());
  return json(await res.json());
};
