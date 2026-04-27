<script lang="ts">
  import { CheckCircle2, Info, Loader2, Play, Plus, Trash2, XCircle } from 'lucide-svelte';

  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Table from '$lib/components/ui/table';
  import { Textarea } from '$lib/components/ui/textarea';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let languages = $derived(data.languages);

  interface SubmissionResult {
    status: { id: number; description: string };
    stdout?: string;
    stderr?: string;
    compile_output?: string;
    message?: string;
    time?: string;
    memory?: number;
  }

  // Default State
  let selectedLanguageId = $state(50); // C (GCC 9.2.0)
  let sourceCode = $state(`#include <stdio.h>

int main() {
    int a, b;
    while (scanf("%d %d", &a, &b) == 2) {
        printf("%d\\n", a + b);
    }
    return 0;
}`);

  interface TestCase {
    id: string;
    input: string;
    expected: string;
    result: SubmissionResult | null;
    status: 'idle' | 'running' | 'completed' | 'error';
  }

  let testCases = $state<TestCase[]>([
    { id: '1', input: '10 20', expected: '30', result: null, status: 'idle' },
    { id: '2', input: '5 7', expected: '12', result: null, status: 'idle' },
    { id: '3', input: '-1 1', expected: '0', result: null, status: 'idle' },
  ]);

  let newInput = $state('');
  let newExpected = $state('');

  let running = $state(false);
  let cpuTimeLimit = $state(1.0);
  let memoryLimit = $state(64000);

  function addTestCase() {
    if (!newInput.trim()) return;
    testCases = [
      ...testCases,
      {
        id: Math.random().toString(36).substr(2, 6),
        input: newInput,
        expected: newExpected,
        result: null,
        status: 'idle',
      },
    ];
    newInput = '';
    newExpected = '';
  }

  function removeTestCase(id: string) {
    testCases = testCases.filter((t) => t.id !== id);
  }

  async function runAllTests() {
    if (running) return;
    running = true;

    // Reset statuses
    testCases = testCases.map((t) => ({ ...t, status: 'running', result: null }));

    const payload = {
      submissions: testCases.map((t) => ({
        source_code: sourceCode,
        language_id: selectedLanguageId,
        stdin: t.input,
        expected_output: t.expected,
        cpu_time_limit: cpuTimeLimit,
        memory_limit: memoryLimit,
      })),
    };

    try {
      const res = await fetch('/api/judge0/submissions/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Batch submission failed');

      const submissions = await res.json();
      const tokens = submissions.map((s: { token: string }) => s.token);

      await pollBatch(tokens);
    } catch (e) {
      console.error(e);
      testCases = testCases.map((t) => ({ ...t, status: 'error' }));
    } finally {
      running = false;
    }
  }

  async function pollBatch(tokens: string[]) {
    let completed = false;
    let attempts = 0;

    while (!completed && attempts < 30) {
      const res = await fetch(`/api/judge0/submissions/batch?tokens=${tokens.join(',')}`);
      if (!res.ok) throw new Error('Batch polling failed');

      const { submissions }: { submissions: SubmissionResult[] } = await res.json();

      // Map results back to test cases by index (preserving order)
      testCases = testCases.map((t, i) => {
        const result = submissions[i];
        if (result && result.status.id > 2) {
          return { ...t, result, status: 'completed' as const };
        }
        return t;
      });

      completed = testCases.every((t) => t.status === 'completed');
      if (!completed) {
        await new Promise((r) => setTimeout(r, 1500));
        attempts++;
      }
    }
  }

  let passCount = $derived(testCases.filter((t) => t.result?.status.id === 3).length);
</script>

<svelte:head>
  <title>Judge0 Contest Env</title>
</svelte:head>

<div class="container mx-auto flex h-screen max-w-7xl flex-col gap-6 overflow-hidden px-4 py-8">
  <div class="flex shrink-0 items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Contest Test Environment</h1>
      <p class="text-sm text-muted-foreground">Run code against multiple test cases simultaneously</p>
    </div>
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2 text-sm font-medium">
        <span class="text-muted-foreground">Success Rate:</span>
        <Badge variant={passCount === testCases.length ? 'default' : 'secondary'}>
          {passCount} / {testCases.length} Passed
        </Badge>
      </div>
      <Button onclick={runAllTests} disabled={running} class="min-w-[140px]">
        {#if running}
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          Running...
        {:else}
          <Play class="mr-2 h-4 w-4 fill-current" />
          Run All Tests
        {/if}
      </Button>
    </div>
  </div>

  <div class="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-12">
    <!-- Left: Code Editor (8 columns) -->
    <div class="flex min-h-0 flex-col gap-4 lg:col-span-7">
      <Card.Root class="flex flex-1 flex-col overflow-hidden">
        <Card.Header class="flex flex-row items-center justify-between border-b bg-muted/20 px-4 py-3">
          <Card.Title class="text-sm font-medium">Source Code</Card.Title>
          <select
            bind:value={selectedLanguageId}
            class="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
          >
            {#each languages as lang (lang.id)}
              <option value={lang.id}>{lang.name}</option>
            {/each}
          </select>
        </Card.Header>
        <Card.Content class="flex-1 p-0">
          <Textarea
            bind:value={sourceCode}
            class="h-full resize-none rounded-none border-0 font-mono text-sm focus-visible:ring-0"
            placeholder="Write your code here..."
          />
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="border-b bg-muted/20 px-4 py-2">
          <Card.Title
            class="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
          >
            <Info class="h-3 w-3" /> Execution Limits
          </Card.Title>
        </Card.Header>
        <Card.Content class="grid grid-cols-2 gap-4 p-4">
          <div class="space-y-1">
            <Label class="text-[10px] uppercase">CPU Limit (s)</Label>
            <Input type="number" step="0.1" bind:value={cpuTimeLimit} class="h-8 text-xs" />
          </div>
          <div class="space-y-1">
            <Label class="text-[10px] uppercase">Memory Limit (KB)</Label>
            <Input type="number" step="1024" bind:value={memoryLimit} class="h-8 text-xs" />
          </div>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Right: Test Cases (5 columns) -->
    <div class="flex min-h-0 flex-col gap-4 lg:col-span-5">
      <Card.Root class="flex flex-1 flex-col overflow-hidden">
        <Card.Header class="border-b px-4 py-2">
          <Card.Title class="text-sm font-semibold tracking-wider text-muted-foreground uppercase"
            >Test Cases</Card.Title
          >
        </Card.Header>
        <Card.Content class="flex-1 overflow-auto p-0">
          <Table.Root>
            <Table.Header class="sticky top-0 z-10 bg-muted/30">
              <Table.Row>
                <Table.Head class="w-12 px-2 text-center">Stat</Table.Head>
                <Table.Head class="px-2">Input</Table.Head>
                <Table.Head class="px-2">Expect</Table.Head>
                <Table.Head class="w-10 px-2"></Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <!-- Add New Row -->
              <Table.Row class="bg-muted/10">
                <Table.Cell class="px-2 text-center">
                  <Plus class="mx-auto h-3.5 w-3.5 text-muted-foreground/50" />
                </Table.Cell>
                <Table.Cell class="px-1 py-1">
                  <Input
                    bind:value={newInput}
                    placeholder="Input..."
                    class="h-7 border-0 bg-background/50 text-[10px] focus-visible:ring-1"
                  />
                </Table.Cell>
                <Table.Cell class="px-1 py-1">
                  <Input
                    bind:value={newExpected}
                    placeholder="Output..."
                    class="h-7 border-0 bg-background/50 text-[10px] focus-visible:ring-1"
                    onkeydown={(e) => e.key === 'Enter' && addTestCase()}
                  />
                </Table.Cell>
                <Table.Cell class="px-1 py-1">
                  <Button size="icon" variant="ghost" class="h-7 w-7" onclick={addTestCase} title="Add Case">
                    <Plus class="h-3.5 w-3.5" />
                  </Button>
                </Table.Cell>
              </Table.Row>

              {#each testCases as test (test.id)}
                <Table.Row class="group">
                  <Table.Cell class="px-2 text-center">
                    {#if test.status === 'running'}
                      <Loader2 class="mx-auto h-3 w-3 animate-spin text-muted-foreground" />
                    {:else if test.result?.status.id === 3}
                      <CheckCircle2 class="mx-auto h-3.5 w-3.5 text-green-500" />
                    {:else if test.result}
                      <XCircle class="mx-auto h-3.5 w-3.5 text-red-500" />
                    {:else}
                      <span class="text-[8px] font-bold text-muted-foreground/30 uppercase">Wait</span>
                    {/if}
                  </Table.Cell>
                  <Table.Cell class="px-2 py-2">
                    <code class="block max-w-[100px] truncate font-mono text-[10px]" title={test.input}
                      >{test.input}</code
                    >
                  </Table.Cell>
                  <Table.Cell class="px-2 py-2">
                    <code class="block max-w-[100px] truncate font-mono text-[10px]" title={test.expected}
                      >{test.expected}</code
                    >
                  </Table.Cell>
                  <Table.Cell class="px-1 py-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-7 w-7 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                      onclick={() => removeTestCase(test.id)}
                    >
                      <Trash2 class="h-3.5 w-3.5" />
                    </Button>
                  </Table.Cell>
                </Table.Row>
                {#if test.result && test.result.status.id !== 3}
                  <Table.Row class="bg-destructive/5 hover:bg-destructive/5">
                    <Table.Cell colspan={4} class="border-t-0 px-4 py-2">
                      <div class="font-mono text-[9px] text-destructive">
                        <span class="font-bold">GOT:</span>
                        {test.result.stdout || test.result.stderr || 'No output'}
                        <div class="mt-0.5 text-[8px] opacity-60">
                          {test.result.time}s | {test.result.memory}kb
                        </div>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                {/if}
              {/each}
            </Table.Body>
          </Table.Root>
        </Card.Content>
        <Card.Footer class="justify-between border-t bg-muted/10 px-4 py-2 text-[10px] text-muted-foreground">
          <span>Total Cases: {testCases.length}</span>
          <span>Passed: {passCount}</span>
        </Card.Footer>
      </Card.Root>
    </div>
  </div>
</div>
