<script lang="ts">
 import * as Sidebar from "$lib/components/ui/sidebar/index.js";
 import AppSidebar from "$lib/components/app-sidebar.svelte";
 
 let { children } = $props();
</script>
 
<Sidebar.Provider>
 <AppSidebar />

 <main class="main-layout">
  <Sidebar.Trigger />

  <div class="page-container">
    {@render children?.()}
  </div>

 </main>
</Sidebar.Provider>


<style>
  .main-layout {
    flex: 1;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .page-container {
    flex: 1;
    display: flex;
    min-height: 0; /* IMPORTANT for resizable layouts */
    overflow: hidden;
  }
</style>


