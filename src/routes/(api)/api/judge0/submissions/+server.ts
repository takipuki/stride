import { error, json } from '@sveltejs/kit';

import {
  buildSubmissionPayload,
  decodeSubmissionResult,
  judge0Fetch,
  SUBMISSION_FIELDS,
  type SubmissionInput,
} from '$lib/server/judge0';

import type { RequestHandler } from './$types';

/** POST /api/judge0/submissions — create a new submission */
export const POST: RequestHandler = async ({ request, url }) => {
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

  const wait = url.searchParams.get('wait');
  const queryString =
    wait === 'true' ? `?base64_encoded=true&wait=true&fields=${SUBMISSION_FIELDS}` : '?base64_encoded=true';

  const res = await judge0Fetch(`/submissions${queryString}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw error(res.status, JSON.stringify(data));
  }

  if (wait === 'true') {
    return json(decodeSubmissionResult(data), { status: res.status });
  }

  return json(data, { status: res.status });
};
