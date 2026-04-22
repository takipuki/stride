<script>
  import { onMount } from "svelte";

  import { useConvexClient, useQuery } from 'convex-svelte';
  import { api } from '$convex/_generated/api.js';

  let submissions = $state([]);
  const query = useQuery(api.test_j0.get, {});
  let selected = $state(null);
  let details = $state(null);
  let loading = $state(false);

  function loadTokens() {
    submissions = JSON.parse(localStorage.getItem("judge0_tokens") || "[]");
  }

  async function fetchDetails(token) {
    loading = true;
    selected = token;
    details = null;

    try {
      const res = await fetch(
        `http://localhost:2358/submissions/${token}?base64_encoded=true&fields=source_code,stdout,token,compile_output,message,status`
      );
      const data = await res.json();

      console.log(data.stdout);
      console.log(data.compile_output);

      const decode = (str) => {
        const escaped = escape(atob(str || ""));
        try {
          return decodeURIComponent(escaped);
        } catch {
          return unescape(escaped);
        }
      };

      details = {
        source_code: decode(data.source_code),
        stdout: decode(data.stdout),
        compile_output: decode(data.compile_output),
        status: data.status?.description
      };
    } catch (e) {
      details = { error: "Failed to fetch details" };
    }

    loading = false;
  }

  onMount(loadTokens);
</script>

<div class="p-6 space-y-4">
  <h1 class="text-2xl font-bold">Submissions</h1>

  <div class="grid grid-cols-2 gap-4 h-screen">
    <!-- List -->
    <div class="border rounded p-2 space-y-2 overflow-y-auto">
      {#if query.isLoading}
        <div class="p-4 text-center text-muted-foreground">Loading...</div>
      {:else if query.error}
        <div class="p-4 text-center text-destructive">Failed to load: {query.error.toString()}</div>
      {:else if query.data.length === 0}
        <div class="p-4 text-center text-muted-foreground">No submissions found.</div>
      {:else}
        {#each query.data as sub (sub._id)}
          <div
            class="p-2 border rounded cursor-pointer hover:bg-gray-100"
            on:click={() => fetchDetails(sub.token)}
          >
            <div class="text-sm font-mono">{sub.token}</div>
            <div class="text-xs text-gray-500">
              {new Date(sub._creationTime).toLocaleString()}
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Details -->
    <div class="border rounded p-4">
      {#if loading}
        <p>Loading...</p>
      {:else if details}
        <p><b>Status:</b> {details.status}</p>

        <div class="mt-2">
          <p class="font-semibold">Code:</p>
          <pre class="bg-gray-100 p-2 rounded">{details.source_code}</pre>
        </div>

        <div class="mt-2">
          <p class="font-semibold">Stdout:</p>
          <pre class="bg-gray-100 p-2 rounded">{details.stdout}</pre>
        </div>

        <div class="mt-2">
          <p class="font-semibold">Compile Output:</p>
          <pre class="bg-gray-100 p-2 rounded">{details.compile_output}</pre>
        </div>
      {:else}
        <p>Select a submission</p>
      {/if}
    </div>
  </div>
</div>
