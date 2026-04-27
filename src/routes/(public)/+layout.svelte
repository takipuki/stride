<script lang="ts">
  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import { locales, localizeHref } from '$lib/paraglide/runtime';
  import { loadSession, session } from '$lib/session';

  let { children } = $props();

  onMount(() => {
    loadSession();
    const unsub = session.subscribe((s) => {
      if (s) goto('/dashboard');
    });
    return unsub;
  });
</script>

{@render children()}

<div style="display:none">
  {#each locales as locale (locale)}
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    <a href={localizeHref(page.url.pathname, { locale })}>{locale}</a>
  {/each}
</div>
