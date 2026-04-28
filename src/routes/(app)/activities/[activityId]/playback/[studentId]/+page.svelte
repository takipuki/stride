<script lang="ts">
  // Robust Individual Icon Imports to fix [ERR_MODULE_NOT_FOUND]
  import CheckCircle2 from '@lucide/svelte/icons/check-circle';
  import FileCode from '@lucide/svelte/icons/file-code';
  import IdentificationCard from '@lucide/svelte/icons/id-card';
  import Info from '@lucide/svelte/icons/info';
  import Loader2 from '@lucide/svelte/icons/loader-2';
  import Pause from '@lucide/svelte/icons/pause';
  import Play from '@lucide/svelte/icons/play';
  import Plus from '@lucide/svelte/icons/plus';
  import SkipBack from '@lucide/svelte/icons/skip-back';
  import SkipForward from '@lucide/svelte/icons/skip-forward';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import Trophy from '@lucide/svelte/icons/trophy';
  import Users from '@lucide/svelte/icons/users';
  import XCircle from '@lucide/svelte/icons/x-circle';
  import { createHighlighter } from 'shiki';
  import { ShikiMagicMove } from 'shiki-magic-move/svelte';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import studentsDataRaw from './students.json';

  import 'shiki-magic-move/dist/style.css';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label';
  import * as Resizable from '$lib/components/ui/resizable/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { Slider } from '$lib/components/ui/slider/index.js';
  import * as Table from '$lib/components/ui/table';
  import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';

  interface Snapshot {
    id: string;
    timestamp: string;
    content: string;
  }

  interface Student {
    name: string;
    id: string;
    snapshots: Snapshot[];
  }

  const studentsData = studentsDataRaw as Record<string, Student>;

  // --- Student & Snapshot Data ---
  const studentIds = Object.keys(studentsData);
  const currentStudentId = $derived(page.params.studentId || '7042');
  const currentStudent = $derived(studentsData[currentStudentId] || studentsData['7042']);
  const snapshots = $derived(currentStudent?.snapshots || []);

  const currentStudentIndex = $derived(studentIds.indexOf(currentStudentId));

  function navigateStudent(direction: 'prev' | 'next') {
    const newIndex =
      direction === 'next'
        ? (currentStudentIndex + 1) % studentIds.length
        : (currentStudentIndex - 1 + studentIds.length) % studentIds.length;

    const nextId = studentIds[newIndex];
    goto(`/activities/${page.params.activityId}/playback/${nextId}`);
  }

  const studentFiles = ['+page.svelte', 'utils.ts', 'Button.svelte'];

  // --- State: Snapshot Navigation ---
  let currentIndex = $state(0);
  let isPlaying = $state(false);
  let speedIndex = $state(0);
  const SPEEDS = [
    { label: '1×', interval: 1000, duration: 600, stagger: 0.1 },
    { label: '2×', interval: 500, duration: 300, stagger: 0 },
    { label: '4×', interval: 200, duration: 100, stagger: 0 },
  ];
  const currentSnapshot = $derived(snapshots[currentIndex] || snapshots[0] || { content: '' });

  // Reset index when student changes
  $effect(() => {
    currentStudentId;
    currentIndex = 0;
    isPlaying = false;
  });

  // --- State: Judge0 Integration ---
  let { data }: { data: { languages: { id: number; name: string }[] } } = $props();
  let languages = $derived(data?.languages || [{ id: 50, name: 'C (GCC 9.2.0)' }]);
  let selectedLanguageId = $state(50);

  interface TestCase {
    id: string;
    input: string;
    expected: string;
    result: any | null;
    status: 'idle' | 'running' | 'completed' | 'error';
  }

  let testCases = $state<TestCase[]>([
    { id: '1', input: '10 20', expected: '30', result: null, status: 'idle' },
    { id: '2', input: '5 7', expected: '12', result: null, status: 'idle' },
  ]);

  let newInput = $state('');
  let newExpected = $state('');
  let running = $state(false);
  let cpuTimeLimit = $state(1.0);
  let memoryLimit = $state(64000);

  // --- Shiki ---
  const highlighterPromise = createHighlighter({
    themes: ['github-dark'],
    langs: ['c', 'cpp', 'typescript', 'javascript', 'python', 'rust', 'go', 'svelte'],
  });

  const shikiLanguage = $derived(() => {
    const lang = languages.find((l: any) => l.id === selectedLanguageId);
    if (!lang) return 'c';
    const name = lang.name.toLowerCase();
    if (name.includes('c (')) return 'c';
    if (name.includes('c++')) return 'cpp';
    if (name.includes('python')) return 'python';
    if (name.includes('javascript')) return 'javascript';
    if (name.includes('typescript')) return 'typescript';
    return 'c';
  });

  // --- Functions ---
  function selectSnapshot(index: number) {
    isPlaying = false;
    currentIndex = index;
  }

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
    testCases = testCases.map((t: TestCase) => ({ ...t, status: 'running', result: null }));

    const payload = {
      submissions: testCases.map((t: TestCase) => ({
        source_code: currentSnapshot.content || '',
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
      const submissions = await res.json();
      await pollBatch(submissions.map((s: any) => s.token));
    } catch (e) {
      testCases = testCases.map((t) => ({ ...t, status: 'error' }));
    } finally {
      running = false;
    }
  }

  async function pollBatch(tokens: string[]) {
    let completed = false;
    while (!completed) {
      const res = await fetch(`/api/judge0/submissions/batch?tokens=${tokens.join(',')}`);
      const { submissions } = await res.json();
      testCases = testCases.map((t: TestCase, i: number) => {
        const result = submissions[i];
        return result && result.status.id > 2 ? { ...t, result, status: 'completed' } : t;
      });
      completed = testCases.every((t: TestCase) => t.status === 'completed');
      if (!completed) await new Promise((r) => setTimeout(r, 1500));
    }
  }

  let passCount = $derived(testCases.filter((t: TestCase) => t.result?.status.id === 3).length);

  $effect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      currentIndex = currentIndex < snapshots.length - 1 ? currentIndex + 1 : 0;
    }, SPEEDS[speedIndex].interval);
    return () => clearInterval(interval);
  });
</script>

<div class="h-screen w-full overflow-hidden bg-background font-sans">
  <Resizable.PaneGroup direction="horizontal" class="h-full">
    <Resizable.Pane defaultSize={75} minSize={40}>
      <Resizable.PaneGroup direction="vertical">
        <Resizable.Pane defaultSize={65} minSize={30} class="flex flex-col bg-card">
          <div class="relative flex flex-1 flex-col overflow-hidden">
            <div class="relative flex items-center justify-between border-b border-border p-4 pb-3">
              <div class="flex items-center gap-3 text-primary">
                <FileCode size={20} />
                <span class="text-base font-bold tracking-widest text-foreground uppercase">Student Code View</span>
              </div>
              <div class="flex items-center gap-4">
                <Select.Root
                  type="single"
                  value={selectedLanguageId.toString()}
                  onValueChange={(v: string | undefined) => v && (selectedLanguageId = parseInt(v))}
                >
                  <Select.Trigger class="h-8 w-[180px] bg-muted text-xs">
                    {languages.find((l: { id: number }) => l.id === selectedLanguageId)?.name || 'Select Language'}
                  </Select.Trigger>
                  <Select.Content>
                    {#each languages as lang}
                      <Select.Item value={lang.id.toString()}>{lang.name}</Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
                <Badge variant="outline" class="px-3 py-1 font-mono text-[11px] font-bold">
                  {currentIndex + 1} / {snapshots.length}
                </Badge>
              </div>
            </div>
            <div
              class="scrollbar-hide relative flex-1 overflow-auto p-4 pt-0 font-mono text-[15px] leading-relaxed text-foreground/90"
            >
              {#await highlighterPromise}
                <div class="flex h-full items-center justify-center">
                  <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              {:then highlighter}
                <ShikiMagicMove
                  {highlighter}
                  lang={shikiLanguage()}
                  theme="github-dark"
                  code={currentSnapshot.content || ''}
                  options={{
                    duration: SPEEDS[speedIndex].duration,
                    stagger: SPEEDS[speedIndex].stagger,
                    lineNumbers: false,
                  }}
                  class="text-sm"
                />
              {/await}
            </div>
          </div>
        </Resizable.Pane>

        <Resizable.Handle />

        <Resizable.Pane defaultSize={12} minSize={10} class="flex flex-col justify-center bg-card px-4 py-2">
          <Slider
            type="multiple"
            value={[currentIndex]}
            max={Math.max(0, snapshots.length - 1)}
            step={1}
            onValueChange={(v: number[]) => selectSnapshot(v[0])}
            class="h-4"
          />
          <div class="mt-4 grid grid-cols-3 items-center">
            <div class="flex justify-start">
              <ToggleGroup.Root
                type="single"
                value={speedIndex.toString()}
                onValueChange={(v: string | undefined) => v && (speedIndex = parseInt(v))}
                class="rounded-lg bg-muted p-1"
              >
                {#each SPEEDS as speed, i}
                  <ToggleGroup.Item value={i.toString()} class="px-5 py-1 text-xs font-bold">
                    {speed.label}
                  </ToggleGroup.Item>
                {/each}
              </ToggleGroup.Root>
            </div>

            <div class="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                class="h-9 w-9 rounded-full border-2"
                onclick={() => selectSnapshot(0)}><SkipBack size={18} /></Button
              >
              <Button
                variant="default"
                size="icon"
                class="h-11 w-11 rounded-full bg-primary"
                onclick={() => (isPlaying = !isPlaying)}
              >
                {#if isPlaying}<Pause size={24} />{:else}<Play size={24} class="ml-1" />{/if}
              </Button>
              <Button
                variant="outline"
                size="icon"
                class="h-9 w-9 rounded-full border-2"
                onclick={() => selectSnapshot(snapshots.length - 1)}><SkipForward size={18} /></Button
              >
            </div>
            <div></div>
          </div>
        </Resizable.Pane>

        <Resizable.Handle />

        <Resizable.Pane defaultSize={23} minSize={15} class="bg-card">
          <div class="flex h-full divide-x divide-border">
            <div class="flex flex-[0_0_28%] items-center gap-4 border-r border-border p-4">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-primary/10 text-primary"
              >
                <Users size={20} />
              </div>
              <div class="flex flex-col">
                <span class="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Student</span>
                <span class="text-sm font-black text-foreground uppercase">{currentStudent.name}</span>
                <Badge
                  variant="outline"
                  class="mt-1 h-8 w-fit border-primary/20 bg-primary/5 px-8 text-[10px] text-primary"
                  >ID: {currentStudent.id}</Badge
                >
              </div>
            </div>

            <div class="flex flex-grow items-center justify-center p-4">
              <div class="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  class="h-10 border-border px-6 text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
                  onclick={() => navigateStudent('prev')}
                >
                  PREVIOUS
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  class="h-10 bg-primary px-10 text-[15px] font-black tracking-widest"
                >
                  SUBMIT GRADE
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  class="h-10 border-border px-6 text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
                  onclick={() => navigateStudent('next')}
                >
                  NEXT
                </Button>
              </div>
            </div>
          </div>
        </Resizable.Pane>
      </Resizable.PaneGroup>
    </Resizable.Pane>

    <Resizable.Handle />

    <Resizable.Pane defaultSize={25} minSize={20} class="flex flex-col bg-card">
      <div class="border-b border-border p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 text-foreground">
            <IdentificationCard size={18} />
            <h3 class="text-[10px] font-black tracking-widest uppercase">Test Bench</h3>
          </div>
          <Button
            size="sm"
            variant="default"
            class="h-7 bg-primary px-3 text-[10px] font-black tracking-widest"
            onclick={runAllTests}
            disabled={running}
          >
            {#if running}
              <Loader2 class="mr-1 h-3 w-3 animate-spin" />
            {:else}
              <Play size={12} class="mr-1 fill-current" />
            {/if}
            RUN ALL
          </Button>
        </div>
      </div>

      <div class="flex-1 overflow-auto">
        <Table.Root>
          <Table.Body>
            <Table.Row class="border-border bg-primary/5">
              <Table.Cell class="px-2 py-3" colspan={2}>
                <div class="flex flex-col gap-2">
                  <Input
                    bind:value={newInput}
                    placeholder="Input..."
                    class="h-7 border-border bg-background text-[10px]"
                  />
                  <Input
                    bind:value={newExpected}
                    placeholder="Expect..."
                    class="h-7 border-border bg-background text-[10px]"
                    onkeydown={(e) => e.key === 'Enter' && addTestCase()}
                  />
                </div>
              </Table.Cell>
              <Table.Cell class="text-center">
                <Button
                  size="icon"
                  variant="ghost"
                  class="h-8 w-8 text-emerald-500 hover:bg-emerald-500/20"
                  onclick={addTestCase}><Plus size={16} /></Button
                >
              </Table.Cell>
            </Table.Row>

            {#each testCases as test (test.id)}
              <Table.Row class="group border-border hover:bg-muted/50">
                <Table.Cell class="text-center">
                  {#if test.status === 'running'}
                    <Loader2 class="mx-auto h-3 w-3 animate-spin text-primary" />
                  {:else if test.result?.status.id === 3}
                    <CheckCircle2 class="mx-auto h-4 w-4 text-primary" />
                  {:else if test.result}
                    <XCircle class="mx-auto h-4 w-4 text-destructive" />
                  {:else}
                    <div class="mx-auto h-2 w-2 rounded-full bg-muted"></div>
                  {/if}
                </Table.Cell>
                <Table.Cell class="px-2 py-3">
                  <div class="flex flex-col font-mono text-[10px]">
                    <span class="text-muted-foreground">IN: {test.input}</span>
                    <span class="text-primary/70">EX: {test.expected}</span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onclick={() => removeTestCase(test.id)}><Trash2 size={14} /></Button
                  >
                </Table.Cell>
              </Table.Row>
              {#if test.result && test.result.status.id !== 3}
                <Table.Row class="border-none bg-destructive/5">
                  <Table.Cell colspan={3} class="px-4 py-2">
                    <div class="rounded bg-background p-2 font-mono text-[9px] break-all text-destructive">
                      <strong>GOT:</strong>
                      {test.result.stdout || test.result.stderr || 'No output'}
                    </div>
                  </Table.Cell>
                </Table.Row>
              {/if}
            {/each}
          </Table.Body>
        </Table.Root>
      </div>

      <div class="border-t border-border bg-muted/30 p-4">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-black tracking-widest text-muted-foreground uppercase">PASSED</span>
          <span class="text-lg font-black text-primary">{passCount} / {testCases.length}</span>
        </div>
      </div>
    </Resizable.Pane>
  </Resizable.PaneGroup>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    height: 100vh;
    overflow: hidden;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
</style>
