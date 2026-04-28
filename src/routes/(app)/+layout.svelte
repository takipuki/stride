<script lang="ts">
  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';

  import AppSidebar from '$lib/components/app-sidebar.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { loadSession, session } from '$lib/session';

  const { children } = $props();

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
