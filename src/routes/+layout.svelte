<script lang="ts">
  import { setupConvex } from 'convex-svelte';
  import { ModeWatcher } from 'mode-watcher';

  import { page } from '$app/state';
  import { PUBLIC_CONVEX_URL } from '$env/static/public';

  import { locales, localizeHref } from '$lib/paraglide/runtime';


  import './layout.css';

  import favicon from '$lib/assets/favicon.svg';
  

  let { children } = $props();
  setupConvex(PUBLIC_CONVEX_URL);
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>Stride</title>
</svelte:head>

<ModeWatcher />

{@render children()}




<div style="display:none">
  {#each locales as locale}
    <a href={localizeHref(page.url.pathname, { locale })}>{locale}</a>
  {/each}
</div>
