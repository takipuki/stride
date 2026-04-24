import { error, json } from '@sveltejs/kit';

import { judge0Fetch } from '$lib/server/judge0';

import type { RequestHandler } from './$types';

/** GET /api/judge0/languages/[id] — get a specific language by id */
export const GET: RequestHandler = async ({ params }) => {
  const res = await judge0Fetch(`/languages/${params.id}`);
  if (res.status === 404) throw error(404, 'Language not found');
  if (!res.ok) throw error(res.status, await res.text());
  return json(await res.json());
};
