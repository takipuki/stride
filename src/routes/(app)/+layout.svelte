<script lang="ts">
  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import AppSidebar from '$lib/components/app-sidebar.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { loadSession, session } from '$lib/session';
  import { cn } from '$lib/utils';

  const { children } = $props();

  onMount(() => {
    loadSession();
    const unsub = session.subscribe((s) => {
      if (!s) goto('/login');
    });
    return unsub;
  });

  const isPlayback = $derived(page.url.pathname.includes('/playback/'));
</script>

<Sidebar.Provider>
  <AppSidebar />
  <Sidebar.Inset>
    <div class={cn('flex flex-1 flex-col', !isPlayback)}>
      {@render children()}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
