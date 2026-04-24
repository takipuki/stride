import { judge0Fetch } from '$lib/server/judge0';
import type { Language } from '$lib/server/judge0';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const [langsRes] = await Promise.allSettled([judge0Fetch('/languages')]);

  let languages: Language[] = [];
  if (langsRes.status === 'fulfilled' && langsRes.value.ok) {
    languages = await langsRes.value.json();
  }

  return { languages };
};
