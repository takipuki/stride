<script>
  import { onMount } from "svelte";

  import { useConvexClient, useQuery } from 'convex-svelte';
  import { toggleMode } from 'mode-watcher';

  import { api } from '$convex/_generated/api.js';

  const client = useConvexClient();
  const query = useQuery(api.test_j0.get, {});

  let code = $state("");
  let stdin = $state("");
  let output = $state("");
  let loading = $state(false);

  let language = $state("c");

  const languages = {
    c: 50,        // C (GCC)
    python: 71,   // Python 3
    java: 62      // Java
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
    output = "";

    try {
      const res = await fetch("http://localhost:2358/submissions?wait=true", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          source_code: btoa(code),
          stdin: btoa(stdin),
          language_id: languages[language]
        })
      });

      const data = await res.json();

      saveToken(data.token);

      const decode = (str) => {
        const escaped = escape(atob(str || ""));
        try {
          return decodeURIComponent(escaped);
        } catch {
          return unescape(escaped);
        }
      };

      output =
        decode(data.stdout) ||
        decode(data.stderr) ||
        decode(data.compile_output) ||
        "No output";
    } catch (e) {
      output = "Error connecting to Judge0";
    }

    loading = false;
  }
</script>

<div class="p-6 space-y-4">
  <h1 class="text-2xl font-bold">Judge0 Runner</h1>

  <!-- Language Select -->
  <select bind:value={language} class="border rounded p-2">
    <option value="c">C</option>
    <option value="python">Python</option>
    <option value="java">Java</option>
  </select>

  <!-- Code Editor -->
  <textarea
    bind:value={code}
    placeholder="Write your code..."
    class="w-full h-64 border rounded p-2 font-mono"
  />

  <!-- stdin -->
  <textarea
    bind:value={stdin}
    placeholder="stdin input..."
    class="w-full h-24 border rounded p-2 font-mono"
  />

  <!-- Button -->
  <button
    on:click={runCode}
    class="px-4 py-2 bg-black text-white rounded cursor-pointer"
    disabled={loading}
  >
    {loading ? "Running..." : "Run"}
  </button>

  <!-- Output -->
  <textarea
    readonly
    value={output}
    class="w-full h-40 border rounded p-2 font-mono bg-gray-100"
  />
</div>
