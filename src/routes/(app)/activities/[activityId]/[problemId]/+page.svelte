<script lang="ts">
  import { useConvexClient, useQuery } from 'convex-svelte';
  import DOMPurify from 'isomorphic-dompurify';
  import { onMount } from 'svelte';

  import { page } from '$app/state';
  import { api } from '$convex/_generated/api.js';
  import type { Id } from '$convex/_generated/dataModel';

  import Tiptap from '$lib/components/editor/Tiptap.svelte';
  import LanguageSelect from '$lib/components/language-select.svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Resizable from '$lib/components/ui/resizable/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import type { SubmissionResult } from '$lib/server/judge0';
  import { session } from '$lib/session';

  const problemQuery = useQuery(api.problems.get, () =>
    page.params.problemId ? { id: page.params.problemId as Id<'problems'> } : 'skip',
  );

  function renderProblem(html: string) {
    return DOMPurify.sanitize(html);
  }

  let sourceCode = $state('');
  let stdinData = $state('');
  let selectedLanguageId = $state<string | undefined>(undefined);
  const languageFromId: Record<number, string> = {
    45: 'x86asm',
    46: 'bash',
    47: 'basic',
    48: 'c',
    49: 'c',
    50: 'c',
    51: 'csharp',
    52: 'cpp',
    53: 'cpp',
    54: 'cpp',
    55: 'lisp',
    56: 'd',
    57: 'elixir',
    58: 'erlang',
    59: 'fortran',
    60: 'go',
    61: 'haskell',
    62: 'java',
    63: 'javascript',
    64: 'lua',
    65: 'ocaml',
    67: 'pascal',
    68: 'php',
    69: 'prolog',
    70: 'python',
    71: 'python',
    72: 'ruby',
    73: 'rust',
    74: 'typeScript',
    75: 'c',
    76: 'cpp',
    77: 'cobol',
    78: 'kotlin',
    79: 'objc',
    80: 'r',
    81: 'scala',
    82: 'sql',
    83: 'swift',
    84: 'vb',
    85: 'perl',
    86: 'clojure',
    87: 'fsharp',
    88: 'groovy',
  };
  let tiptapLanguage = $derived(selectedLanguageId ? languageFromId[parseInt(selectedLanguageId, 10)] : 'plaintext');

  let isExecuting = $state(false);
  let result = $state<SubmissionResult | null>(null);
  let activeTab = $state('stdout');

  async function executeCode() {
    if (!selectedLanguageId) return;

    isExecuting = true;
    result = null;

    try {
      const submitRes = await fetch('/api/judge0/submissions?wait=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: sourceCode,
          language_id: parseInt(selectedLanguageId, 10),
          stdin: stdinData || undefined,
        }),
      });

      if (!submitRes.ok) throw new Error('Submission failed');

      result = await submitRes.json();

      if (result?.compile_output) {
        activeTab = 'compile_output';
      } else if (result?.stderr) {
        activeTab = 'stderr';
      } else {
        activeTab = 'stdout';
      }
    } catch (err) {
      console.error('Execution error:', err);
    } finally {
      isExecuting = false;
    }
  }

  let lastSourceCode = '';
  const client = useConvexClient();
  function snapshotSave() {
    if (!$session?.userId) return;
    if (!page.params.problemId || !page.params.activityId) return;
    if (sourceCode !== lastSourceCode) {
      client.mutation(api.snapshots.save, {
        authorId: $session.userId,
        problemId: page.params.problemId as Id<'problems'>,
        activityId: page.params.activityId as Id<'activities'>,
        content: sourceCode,
      });
      lastSourceCode = sourceCode;
    }
    setTimeout(snapshotSave, 5000);
  }
  onMount(snapshotSave);
</script>

<div class="flex h-full w-full flex-1">
  <Resizable.PaneGroup direction="horizontal" class="h-full w-full rounded-lg border">
    <Resizable.Pane defaultSize={50} minSize={20}>
      <Tiptap language={tiptapLanguage} onUpdate={(text: string) => (sourceCode = text)} />
    </Resizable.Pane>

    <Resizable.Handle />

    <Resizable.Pane defaultSize={50} minSize={20}>
      <Resizable.PaneGroup direction="vertical" class="h-full">
        <Resizable.Pane defaultSize={70} minSize={15}>
          {#if problemQuery.isLoading}
            <div class="flex h-full items-center justify-center text-muted-foreground">Loading...</div>
          {:else if !problemQuery.data}
            <div class="mb-2 text-sm font-medium text-destructive">Error loading question</div>
          {:else}
            <div class="flex h-full flex-col overflow-hidden">
              <div class="border-b px-4 py-2">
                <h2 class="text-sm font-semibold">{problemQuery.data.title}</h2>
              </div>
              <div class="flex-1 overflow-y-auto px-4 py-3">
                <p class="text-justify text-sm leading-relaxed break-words whitespace-pre-wrap text-muted-foreground">
                  {@html renderProblem(problemQuery.data.contentMd)}
                </p>
              </div>
            </div>
          {/if}
        </Resizable.Pane>

        <Resizable.Handle />

        <Resizable.Pane defaultSize={30} minSize={15}>
          <Resizable.PaneGroup direction="horizontal" class="h-full w-full border-t">
            <Resizable.Pane defaultSize={50} minSize={20}>
              <div class="flex h-full flex-col gap-2 p-4">
                <div class="flex items-center gap-2">
                  <LanguageSelect bind:value={selectedLanguageId} disabled={isExecuting} />
                  <Button size="sm" onclick={executeCode} disabled={isExecuting || !selectedLanguageId}>
                    {#if isExecuting}
                      <Spinner class="mr-2 h-4 w-4" />
                      Executing...
                    {:else}
                      Execute
                    {/if}
                  </Button>
                </div>
                <Textarea
                  class="flex-1 resize-none font-mono text-sm"
                  placeholder="Standard Input (stdin)"
                  bind:value={stdinData}
                />
              </div>
            </Resizable.Pane>

            <Resizable.Handle />

            <Resizable.Pane defaultSize={50} minSize={20}>
              <div class="flex h-full w-full flex-col overflow-hidden p-4">
                <Tabs.Root bind:value={activeTab} class="flex h-full flex-col overflow-hidden">
                  <Tabs.List class="h-auto w-full shrink-0 justify-start rounded-none border-b bg-transparent p-0 pb-2">
                    <Tabs.Trigger value="stdout" class="data-active:bg-primary! data-active:text-primary-foreground!"
                      >Stdout</Tabs.Trigger
                    >
                    <Tabs.Trigger value="stderr" class="data-active:bg-primary! data-active:text-primary-foreground!"
                      >Stderr</Tabs.Trigger
                    >
                    <Tabs.Trigger
                      value="compile_output"
                      class="data-active:bg-primary! data-active:text-primary-foreground!">Compile</Tabs.Trigger
                    >
                    <Tabs.Trigger value="message" class="data-active:bg-primary! data-active:text-primary-foreground!"
                      >Message</Tabs.Trigger
                    >
                  </Tabs.List>

                  <div class="mt-2 flex-1 overflow-auto rounded-md bg-muted/30 p-2 font-mono text-sm">
                    {#if !result}
                      <div class="flex h-full items-center justify-center text-muted-foreground">
                        Run code to see output...
                      </div>
                    {:else}
                      <Tabs.Content value="stdout" class="m-0 h-full outline-none">
                        <pre class="whitespace-pre-wrap">{result.stdout || 'No standard output'}</pre>
                      </Tabs.Content>
                      <Tabs.Content value="stderr" class="m-0 h-full outline-none">
                        {#if result.stderr}
                          <pre class="whitespace-pre-wrap text-destructive">{result.stderr}</pre>
                        {:else}
                          <pre class="whitespace-pre-wrap text-success">No standard error</pre>
                        {/if}
                      </Tabs.Content>
                      <Tabs.Content value="compile_output" class="m-0 h-full outline-none">
                        {#if result.compile_output}
                          <pre class="whitespace-pre-wrap text-destructive">{result.compile_output}</pre>
                        {:else}
                          <pre class="whitespace-pre-wrap text-success">No compilation errors</pre>
                        {/if}
                      </Tabs.Content>
                      <Tabs.Content value="message" class="m-0 h-full outline-none">
                        <pre class="whitespace-pre-wrap">{result.message || 'No additional messages'}</pre>
                        <div class="mt-4 grid grid-cols-[100px_1fr] gap-1 text-xs">
                          {#if result.status}
                            <div class="font-semibold text-muted-foreground">Status:</div>
                            <div>{result.status.description}</div>
                          {/if}
                          {#if result.time != null}
                            <div class="font-semibold text-muted-foreground">Time:</div>
                            <div>{result.time} s</div>
                          {/if}
                          {#if result.wall_time != null}
                            <div class="font-semibold text-muted-foreground">Wall Time:</div>
                            <div>{result.wall_time} s</div>
                          {/if}
                          {#if result.memory != null}
                            <div class="font-semibold text-muted-foreground">Memory:</div>
                            <div>{(result.memory / 1024).toFixed(2)} MB</div>
                          {/if}
                          {#if result.exit_code != null}
                            <div class="font-semibold text-muted-foreground">Exit Code:</div>
                            <div>{result.exit_code}</div>
                          {/if}
                        </div>
                      </Tabs.Content>
                    {/if}
                  </div>
                </Tabs.Root>
              </div>
            </Resizable.Pane>
          </Resizable.PaneGroup>
        </Resizable.Pane>
      </Resizable.PaneGroup>
    </Resizable.Pane>
  </Resizable.PaneGroup>
</div>
