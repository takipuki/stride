import { error, json } from '@sveltejs/kit';

import { decodeSubmissionResult, judge0Fetch, SUBMISSION_FIELDS } from '$lib/server/judge0';

import type { RequestHandler } from './$types';

/** GET /api/judge0/submissions/[token] — poll submission status */
export const GET: RequestHandler = async ({ params }) => {
  const { token } = params;
  const res = await judge0Fetch(`/submissions/${token}?base64_encoded=true&fields=${SUBMISSION_FIELDS}`);

  if (res.status === 404) throw error(404, 'Submission not found');
  if (!res.ok) throw error(res.status, await res.text());

  const raw = await res.json();
  const decoded = decodeSubmissionResult(raw);
  return json(decoded);
};

/** DELETE /api/judge0/submissions/[token] — delete a submission */
export const DELETE: RequestHandler = async ({ params }) => {
  const { token } = params;
  const res = await judge0Fetch(`/submissions/${token}`, { method: 'DELETE' });

  if (res.status === 404) throw error(404, 'Submission not found');
  if (!res.ok) throw error(res.status, await res.text());

  return new Response(null, { status: 204 });
};
