<script lang="ts">
  import Activity from '@lucide/svelte/icons/activity';
  import AlertCircle from '@lucide/svelte/icons/alert-circle';
  import BarChart3 from '@lucide/svelte/icons/bar-chart-3';
  import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
  import Globe from '@lucide/svelte/icons/globe';
  import Info from '@lucide/svelte/icons/info';
  import Loader2 from '@lucide/svelte/icons/loader-2';
  import Play from '@lucide/svelte/icons/play';
  import Server from '@lucide/svelte/icons/server';
  import Settings2 from '@lucide/svelte/icons/settings-2';
  import Trash2 from '@lucide/svelte/icons/trash-2';

  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Tabs from '$lib/components/ui/tabs';
  import { Textarea } from '$lib/components/ui/textarea';
  import type {
    ConfigInfo,
    Language,
    Statistics,
    SubmissionInput,
    SubmissionResult,
    SystemInfo,
  } from '$lib/server/judge0';

  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let allLanguages = $state<Language[] | null>(null);
  let languages = $derived(allLanguages ?? data.languages);

  let workers = $derived(data.workers as Array<unknown> | null);
  let system = $derived(data.system as SystemInfo | null);
  let stats = $derived(data.stats as Statistics | null);
  let config = $derived(data.config as ConfigInfo | null);

  // Derived stats
  let submissionsCount = $derived(stats?.submissions_count ?? 0);
  let acceptedCount = $derived(stats?.statuses.find((s) => s.status.id === 3)?.count ?? 0);
  let acceptedPercentage = $derived(submissionsCount > 0 ? (acceptedCount / submissionsCount) * 100 : 0);

  let selectedLanguageId = $state<number>(50); // C (GCC 9.2.0)
  let sourceCode = $state<string>(`#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    for (int i = 0; i < n; i++) {
        int a, b;
        if (scanf("%d %d", &a, &b) != 2) break;
        printf("%d\\n", a + b);
    }
    return 0;
}`);
  let stdin = $state<string>('2\n10 20\n5 7');
  let expectedOutput = $state<string>('30\n12');

  let inputTab = $state<'stdin' | 'expected'>('stdin');

  let running = $state(false);
  let result = $state<SubmissionResult | null>(null);
  let activeTab = $state<'stdout' | 'stderr' | 'compile' | 'json'>('stdout');
  let errorMsg = $state<string | null>(null);

  // Advanced options
  let showAdvanced = $state(false);
  let cpuTimeLimit = $state<number | null>(null);
  let memoryLimit = $state<number | null>(null);

  async function runCode() {
    if (!sourceCode.trim()) return;

    running = true;
    result = null;
    errorMsg = null;
    activeTab = 'stdout';

    const payload: SubmissionInput = {
      source_code: sourceCode,
      language_id: selectedLanguageId,
      stdin: stdin || undefined,
      expected_output: expectedOutput || undefined,
      ...(cpuTimeLimit ? { cpu_time_limit: cpuTimeLimit } : {}),
      ...(memoryLimit ? { memory_limit: memoryLimit } : {}),
    };

    try {
      const createRes = await fetch('/api/judge0/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        throw new Error(`Failed to create submission: ${createRes.status} ${errText}`);
      }

      const { token } = await createRes.json();
      await pollSubmission(token);
    } catch (e: unknown) {
      if (e instanceof Error) {
        errorMsg = e.message;
      } else {
        errorMsg = 'An unknown error occurred';
      }
    } finally {
      running = false;
    }
  }

  async function pollSubmission(token: string) {
    let attempts = 0;
    while (attempts < 20) {
      const pollRes = await fetch(`/api/judge0/submissions/${token}`);

      if (!pollRes.ok) {
        const errText = await pollRes.text();
        throw new Error(`Failed to fetch submission status: ${pollRes.status} ${errText}`);
      }

      const data: SubmissionResult = await pollRes.json();

      if (data.status.id > 2) {
        result = data;
        if (data.stderr && !data.stdout) activeTab = 'stderr';
        if (data.compile_output) activeTab = 'compile';
        return;
      }

      await new Promise((r) => setTimeout(r, 1000));
      attempts++;
    }
    throw new Error('Polling timed out.');
  }

  async function deleteSubmission() {
    if (!result?.token) return;
    try {
      const res = await fetch(`/api/judge0/submissions/${result.token}`, { method: 'DELETE' });
      if (res.ok) {
        result = null;
        activeTab = 'stdout';
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchAllLanguages() {
    try {
      const res = await fetch('/api/judge0/languages/all');
      if (res.ok) {
        allLanguages = await res.json();
      }
    } catch (e) {
      console.error(e);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runCode();
    }
  }

  let langSearch = $state('');
  let filteredLanguages = $derived(languages.filter((l) => l.name.toLowerCase().includes(langSearch.toLowerCase())));
</script>

<svelte:head>
  <title>Judge0 Playground</title>
</svelte:head>

<div class="container mx-auto flex h-screen max-w-7xl flex-col space-y-6 px-4 py-8">
  <!-- Header -->
  <div class="flex shrink-0 flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold tracking-tight">Judge0 Playground</h1>
      <p class="text-sm text-muted-foreground">Interactive code execution environment</p>
    </div>

    <Badge
      variant={workers && workers.length > 0 ? 'default' : 'destructive'}
      class="flex items-center gap-1.5 px-3 py-1"
    >
      <Activity class="h-4 w-4" />
      {workers && workers.length > 0 ? 'Systems Operational' : 'Systems Offline'}
    </Badge>
  </div>

  <div class="grid min-h-0 flex-1 grid-cols-1 gap-6 pb-4 lg:grid-cols-2">
    <!-- Left Column: Editor & Controls -->
    <div class="flex min-h-0 flex-col gap-4">
      <!-- Controls Card -->
      <Card.Root class="shrink-0 shadow-sm">
        <Card.Content class="flex flex-col gap-4 p-4">
          <div class="flex flex-col items-end justify-between gap-4 sm:flex-row">
            <div class="w-full flex-1 space-y-2">
              <Label for="language">Language</Label>
              <div class="flex gap-2">
                <!-- Using native select with standard shadcn styles applied -->
                <select
                  id="language"
                  bind:value={selectedLanguageId}
                  class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {#each filteredLanguages as lang (lang.id)}
                    <option value={lang.id}>{lang.name}</option>
                  {/each}
                </select>
              </div>
            </div>

            <div class="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onclick={fetchAllLanguages}
                title="Fetch All Languages (including archived)"
              >
                <Globe class="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onclick={() => (showAdvanced = !showAdvanced)}
                title="Advanced Settings"
              >
                <Settings2 class="h-4 w-4" />
              </Button>
              <Button onclick={runCode} disabled={running} class="min-w-[120px] font-semibold shadow-sm transition-all">
                {#if running}
                  <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                  Running
                {:else}
                  <Play class="mr-2 h-4 w-4 fill-current" />
                  Run Code
                {/if}
              </Button>
            </div>
          </div>

          {#if showAdvanced}
            <div class="grid animate-in grid-cols-2 gap-4 border-t border-border/40 pt-4 slide-in-from-top-2">
              <div class="space-y-2">
                <Label for="cpu">CPU Time Limit (s)</Label>
                <Input id="cpu" type="number" step="0.1" bind:value={cpuTimeLimit} placeholder="Default" />
              </div>
              <div class="space-y-2">
                <Label for="mem">Memory Limit (KB)</Label>
                <Input id="mem" type="number" step="1024" bind:value={memoryLimit} placeholder="Default" />
              </div>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Code Editor Card -->
      <Card.Root class="flex flex-1 flex-col overflow-hidden shadow-sm">
        <Card.Header class="shrink-0 px-4 py-3">
          <div class="flex items-center justify-between">
            <Card.Title class="flex items-center gap-2 text-sm font-medium">Source Code</Card.Title>
            <span class="text-xs text-muted-foreground">Cmd/Ctrl + Enter to run</span>
          </div>
        </Card.Header>
        <Card.Content class="flex flex-1 p-0">
          <Textarea
            bind:value={sourceCode}
            onkeydown={handleKeydown}
            class="min-h-full resize-none rounded-none border-0 bg-transparent font-mono text-sm focus-visible:ring-0"
            placeholder="Write your code here..."
            spellcheck="false"
          />
        </Card.Content>
      </Card.Root>

      <!-- Stdin and Expected Output Card -->
      <Card.Root class="shrink-0 shadow-sm">
        <Tabs.Root value={inputTab} onValueChange={(v) => (inputTab = v as 'stdin' | 'expected')}>
          <Card.Header class="px-4 py-2">
            <div class="flex items-center justify-between">
              <Tabs.List class="h-8 bg-transparent p-0">
                <Tabs.Trigger
                  value="stdin"
                  class="rounded-none border-b-2 border-transparent px-4 py-1.5 text-xs tracking-wider uppercase data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >Stdin</Tabs.Trigger
                >
                <Tabs.Trigger
                  value="expected"
                  class="rounded-none border-b-2 border-transparent px-4 py-1.5 text-xs tracking-wider uppercase data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >Expected Output</Tabs.Trigger
                >
              </Tabs.List>
            </div>
          </Card.Header>
          <Card.Content class="p-0">
            <Tabs.Content value="stdin" class="m-0 border-0 p-0 outline-none">
              <Textarea
                bind:value={stdin}
                class="min-h-[100px] resize-y rounded-none border-0 bg-transparent font-mono text-sm focus-visible:ring-0"
                placeholder="Input data goes here..."
                spellcheck="false"
              />
            </Tabs.Content>
            <Tabs.Content value="expected" class="m-0 border-0 p-0 outline-none">
              <Textarea
                bind:value={expectedOutput}
                class="min-h-[100px] resize-y rounded-none border-0 bg-transparent font-mono text-sm focus-visible:ring-0"
                placeholder="Expected output goes here..."
                spellcheck="false"
              />
            </Tabs.Content>
          </Card.Content>
        </Tabs.Root>
      </Card.Root>
    </div>

    <!-- Right Column: Output -->
    <Card.Root class="flex min-h-0 flex-col shadow-sm">
      <Card.Header class="shrink-0 px-6 py-4">
        <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <Card.Title>Execution Result</Card.Title>
          <div class="flex items-center gap-2">
            {#if result}
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8 text-destructive"
                onclick={deleteSubmission}
                title="Delete Submission"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
              <div class="flex flex-wrap items-center gap-2">
                <Badge variant={result.status.id === 3 ? 'default' : 'destructive'} class="font-mono">
                  {result.status.description}
                </Badge>
                {#if result.time}
                  <Badge variant="secondary" class="bg-muted font-mono">⏱️ {result.time}s</Badge>
                {/if}
                {#if result.memory}
                  <Badge variant="secondary" class="bg-muted font-mono">💾 {result.memory} KB</Badge>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      </Card.Header>

      <Card.Content class="flex flex-1 flex-col overflow-hidden p-0">
        {#if errorMsg}
          <div
            class="m-4 flex shrink-0 items-start gap-3 rounded-md border-l-4 border-destructive bg-destructive/10 p-4 text-destructive"
          >
            <AlertCircle class="mt-0.5 h-5 w-5 shrink-0" />
            <div class="text-sm font-medium">{errorMsg}</div>
          </div>
        {/if}

        <Tabs.Root
          value={activeTab}
          onValueChange={(v) => (activeTab = v as 'stdout' | 'stderr' | 'compile' | 'json')}
          class="flex min-h-0 w-full flex-1 flex-col"
        >
          <Tabs.List
            class="h-12 w-full shrink-0 justify-start rounded-none border-b border-border/40 bg-transparent px-4 py-0"
          >
            <Tabs.Trigger
              value="stdout"
              class="rounded-none border-primary px-4 data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >Stdout</Tabs.Trigger
            >
            <Tabs.Trigger
              value="stderr"
              class="rounded-none border-primary px-4 data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >Stderr</Tabs.Trigger
            >
            <Tabs.Trigger
              value="compile"
              class="rounded-none border-primary px-4 data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >Compile</Tabs.Trigger
            >
            <Tabs.Trigger
              value="json"
              class="rounded-none border-primary px-4 data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >JSON</Tabs.Trigger
            >
          </Tabs.List>

          <div class="relative flex-1 overflow-auto bg-muted/30 p-4 font-mono text-sm leading-relaxed text-foreground">
            {#if running}
              <div
                class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background/80 text-muted-foreground"
              >
                <Loader2 class="h-8 w-8 animate-spin text-primary" />
                <p class="font-sans font-medium text-foreground">Executing in secure sandbox...</p>
              </div>
            {:else if result}
              <Tabs.Content value="stdout" class="m-0 mt-0 h-full">
                <pre class="h-full break-all whitespace-pre-wrap">{result.stdout || 'No standard output.'}</pre>
              </Tabs.Content>
              <Tabs.Content value="stderr" class="m-0 mt-0 h-full">
                <pre class="h-full break-all whitespace-pre-wrap text-destructive">{result.stderr ||
                    'No standard error.'}</pre>
              </Tabs.Content>
              <Tabs.Content value="compile" class="m-0 mt-0 h-full">
                <pre
                  class="h-full break-all whitespace-pre-wrap text-yellow-600 dark:text-yellow-500">{result.compile_output ||
                    'No compilation output.'}</pre>
              </Tabs.Content>
              <Tabs.Content value="json" class="m-0 mt-0 h-full">
                <pre class="h-full break-all whitespace-pre-wrap text-muted-foreground">{JSON.stringify(
                    result,
                    null,
                    2,
                  )}</pre>
              </Tabs.Content>
            {:else}
              <div class="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <CheckCircle2 class="h-12 w-12 opacity-20" />
                <p class="font-sans text-sm">Write code and click Run to see the output</p>
              </div>
            {/if}
          </div>
        </Tabs.Root>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- System Info Section -->
  <div class="grid shrink-0 grid-cols-1 gap-6 pb-8 md:grid-cols-2 lg:grid-cols-3">
    <!-- Statistics Card -->
    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Submissions Statistics</Card.Title>
        <BarChart3 class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="space-y-2">
          {#if stats}
            <div class="flex justify-between text-xs">
              <span class="text-muted-foreground">Total:</span>
              <span class="font-mono font-bold">{submissionsCount}</span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div class="h-full bg-primary transition-all" style="width: {acceptedPercentage}%"></div>
            </div>
            <div class="grid grid-cols-2 gap-2 pt-1 text-[10px]">
              <div class="flex items-center gap-1">
                <div class="h-2 w-2 rounded-full bg-primary"></div>
                <span class="text-muted-foreground">Accepted: {acceptedCount}</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="h-2 w-2 rounded-full bg-destructive"></div>
                <span class="text-muted-foreground">Other: {submissionsCount - acceptedCount}</span>
              </div>
            </div>
          {:else}
            <p class="text-xs text-muted-foreground">No statistics available</p>
          {/if}
        </div>
      </Card.Content>
    </Card.Root>

    <!-- System Info Card -->
    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">System Information</Card.Title>
        <Server class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="space-y-1 text-xs">
          {#if system}
            <div class="flex justify-between gap-4">
              <span class="shrink-0 text-muted-foreground">CPU:</span>
              <span class="truncate text-right font-mono">{system['Model name'] || 'N/A'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Arch:</span>
              <span class="font-mono">{system['Architecture'] || 'N/A'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Memory:</span>
              <span class="font-mono">{system['Mem'] || 'N/A'}</span>
            </div>
          {:else}
            <p class="text-xs text-muted-foreground">No system info available</p>
          {/if}
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Configuration Card -->
    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Default Limits</Card.Title>
        <Info class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="space-y-1 text-xs">
          {#if config}
            <div class="flex justify-between">
              <span class="text-muted-foreground">Time Limit:</span>
              <span class="font-mono">{config.cpu_time_limit}s</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Memory Limit:</span>
              <span class="font-mono">{config.memory_limit} KB</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Max Procs:</span>
              <span class="font-mono">{config.max_processes_and_or_threads}</span>
            </div>
          {:else}
            <p class="text-xs text-muted-foreground">No config info available</p>
          {/if}
        </div>
      </Card.Content>
    </Card.Root>
  </div>
</div>
