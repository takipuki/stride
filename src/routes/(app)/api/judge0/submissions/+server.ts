import { error, json } from '@sveltejs/kit';

import { buildSubmissionPayload, judge0Fetch, type SubmissionInput } from '$lib/server/judge0';

import type { RequestHandler } from './$types';

/** POST /api/judge0/submissions — create a new submission */
export const POST: RequestHandler = async ({ request }) => {
  let body: SubmissionInput;
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON body');
  }

  if (!body.source_code || !body.language_id) {
    throw error(400, 'source_code and language_id are required');
  }

  const payload = buildSubmissionPayload(body);

  const res = await judge0Fetch('/submissions?base64_encoded=true', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw error(res.status, JSON.stringify(data));
  }

  return json(data, { status: res.status });
};
