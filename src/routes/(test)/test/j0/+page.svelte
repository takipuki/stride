<script>
  import { useConvexClient, useQuery } from 'convex-svelte';
  import { toggleMode } from 'mode-watcher';
  import { onMount } from 'svelte';

  import { api } from '$convex/_generated/api.js';

  const client = useConvexClient();
  const query = useQuery(api.test_j0.get, {});

  let code = $state('');
  let stdin = $state('');
  let output = $state('');
  let loading = $state(false);

  let language = $state('c');

  const languages = {
    c: 50, // C (GCC)
    python: 71, // Python 3
    java: 62, // Java
  };

  async function saveToken(token) {
    try {
      await client.mutation(api.test_j0.add, { token });
    } catch (e) {
      console.log(e);
    }
  }

  async function runCode() {
    loading = true;
    output = '';

    try {
      const res = await fetch('http://localhost:2358/submissions?wait=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_code: btoa(code),
          stdin: btoa(stdin),
          language_id: languages[language],
        }),
      });

      const data = await res.json();

      saveToken(data.token);

      const decode = (str) => {
        const escaped = escape(atob(str || ''));
        try {
          return decodeURIComponent(escaped);
        } catch {
          return unescape(escaped);
        }
      };

      output = decode(data.stdout) || decode(data.stderr) || decode(data.compile_output) || 'No output';
    } catch (e) {
      output = 'Error connecting to Judge0';
    }

    loading = false;
  }
</script>

<div class="space-y-4 p-6">
  <h1 class="text-2xl font-bold">Judge0 Runner</h1>

  <!-- Language Select -->
  <select bind:value={language} class="rounded border p-2">
    <option value="c">C</option>
    <option value="python">Python</option>
    <option value="java">Java</option>
  </select>

  <!-- Code Editor -->
  <textarea bind:value={code} placeholder="Write your code..." class="h-64 w-full rounded border p-2 font-mono" />

  <!-- stdin -->
  <textarea bind:value={stdin} placeholder="stdin input..." class="h-24 w-full rounded border p-2 font-mono" />

  <!-- Button -->
  <button on:click={runCode} class="cursor-pointer rounded bg-black px-4 py-2 text-white" disabled={loading}>
    {loading ? 'Running...' : 'Run'}
  </button>

  <!-- Output -->
  <textarea readonly value={output} class="h-40 w-full rounded border bg-gray-100 p-2 font-mono" />
</div>
