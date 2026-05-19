<script lang="ts">
  import { useConvexClient, useQuery } from 'convex-svelte';
  import { onMount } from 'svelte';

  import { page } from '$app/state';
  import { api } from '$convex/_generated/api.js';
  import type { Id } from '$convex/_generated/dataModel';

  import Codemirror from '$lib/components/editor/Codemirror.svelte';
  import LanguageSelect from '$lib/components/language-select.svelte';
  import ProblemContent from '$lib/components/problem-content.svelte';
  import SubmissionResultView from '$lib/components/submission-result-view.svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Resizable from '$lib/components/ui/resizable/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { getLanguageName } from '$lib/judge0-utils';
  import type { SubmissionResult } from '$lib/server/judge0';
  import { session } from '$lib/session';

  const problemQuery = useQuery(api.problems.get, () =>
    page.params.problemId ? { id: page.params.problemId as Id<'problems'> } : 'skip',
  );

  let sourceCode = $state('');
  let stdinData = $state('');
  let selectedLanguageId = $state<string | undefined>(undefined);
  let codemirrorLanguage = $derived(getLanguageName(selectedLanguageId));

  let isExecuting = $state(false);
  let result = $state<SubmissionResult | null>(null);

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
        languageId: Number(selectedLanguageId),
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
      <Codemirror language={codemirrorLanguage} onUpdate={(text: string) => (sourceCode = text)} />
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
            <ProblemContent title={problemQuery.data.title} contentMd={problemQuery.data.contentMd} />
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
                {#if !result}
                  <div
                    class="flex h-full items-center justify-center rounded-md bg-muted/30 font-mono text-sm text-muted-foreground"
                  >
                    Run code to see output...
                  </div>
                {:else}
                  <SubmissionResultView {result} showTabs={true} />
                {/if}
              </div>
            </Resizable.Pane>
          </Resizable.PaneGroup>
        </Resizable.Pane>
      </Resizable.PaneGroup>
    </Resizable.Pane>
  </Resizable.PaneGroup>
</div>
