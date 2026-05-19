<script lang="ts">
  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';

  import AppSidebar from '$lib/components/app-sidebar.svelte';
  import ScreenShareManager from '$lib/components/screen-share-manager.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { loadSession, session } from '$lib/session';

  const { children } = $props();
  const currentSession = $derived($session);

  onMount(() => {
    loadSession();
    const unsub = session.subscribe((s) => {
      if (!s) goto('/login');
    });
    return unsub;
  });
</script>

<Sidebar.Provider>
  <AppSidebar />
  <Sidebar.Inset>
    <div class="flex flex-1 flex-col p-2">
      {@render children()}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>

{#if currentSession?.role === 'student'}
  <ScreenShareManager />
{/if}
