import { error, json } from '@sveltejs/kit';

import {
  buildSubmissionPayload,
  decodeSubmissionResult,
  judge0Fetch,
  SUBMISSION_FIELDS,
  type SubmissionInput,
} from '$lib/server/judge0';

import type { RequestHandler } from './$types';

/** POST /api/judge0/submissions/batch — create batch submissions */
export const POST: RequestHandler = async ({ request, url }) => {
  let body: { submissions: SubmissionInput[] };
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON body');
  }

  if (!Array.isArray(body.submissions) || body.submissions.length === 0) {
    throw error(400, 'submissions array is required and must not be empty');
  }

  const payload = {
    submissions: body.submissions.map(buildSubmissionPayload),
  };

  const wait = url.searchParams.get('wait');
  const res = await judge0Fetch(`/submissions/batch?base64_encoded=true`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw error(res.status, JSON.stringify(data));

  if (wait === 'true') {
    const tokens = (data as { token: string }[]).map((d) => d.token).join(',');
    let attempts = 0;

    while (attempts < 15) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;

      const pollRes = await judge0Fetch(
        `/submissions/batch?tokens=${encodeURIComponent(tokens)}&base64_encoded=true&fields=${SUBMISSION_FIELDS}`,
      );

      if (!pollRes.ok) throw error(pollRes.status, await pollRes.text());
      const pollDataRaw = (await pollRes.json()) as {
        submissions: (Record<string, unknown> & {
          status?: { id: number };
          status_id?: number;
        })[];
      };

      const allDone = pollDataRaw.submissions.every((sub) => (sub.status?.id ?? 0) >= 3 || (sub.status_id ?? 0) >= 3);

      if (allDone || attempts === 15) {
        return json(
          { submissions: pollDataRaw.submissions.map((sub) => decodeSubmissionResult(sub)) },
          { status: 200 },
        );
      }
    }
  }

  return json(data, { status: res.status });
};

/** GET /api/judge0/submissions/batch?tokens=a,b,c — poll batch results */
export const GET: RequestHandler = async ({ url }) => {
  const tokens = url.searchParams.get('tokens');
  if (!tokens) throw error(400, 'tokens query param is required');

  const res = await judge0Fetch(
    `/submissions/batch?tokens=${encodeURIComponent(tokens)}&base64_encoded=true&fields=${SUBMISSION_FIELDS}`,
  );

  if (!res.ok) throw error(res.status, await res.text());

  const raw: { submissions: Record<string, unknown>[] } = await res.json();
  const decoded = { submissions: raw.submissions.map(decodeSubmissionResult) };
  return json(decoded);
};
