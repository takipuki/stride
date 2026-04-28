<script lang="ts">
  import LanguageSelect from '$lib/components/language-select.svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Resizable from '$lib/components/ui/resizable/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import type { SubmissionResult } from '$lib/server/judge0';

  let sourceCode = $state('');
  let stdinData = $state('');
  let selectedLanguageId = $state<string | undefined>(undefined);

  let isExecuting = $state(false);
  let result = $state<SubmissionResult | null>(null);
  let activeTab = $state('stdout');

  async function executeCode() {
    if (!selectedLanguageId) return;

    isExecuting = true;
    result = null;

    try {
      const submitRes = await fetch('/api/judge0/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: sourceCode,
          language_id: parseInt(selectedLanguageId, 10),
          stdin: stdinData || undefined,
        }),
      });

      if (!submitRes.ok) throw new Error('Submission failed');

      const submitData = await submitRes.json();
      const token = submitData.token;

      let statusId = 1;
      while (statusId === 1 || statusId === 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const pollRes = await fetch(`/api/judge0/submissions/${token}`);
        if (pollRes.ok) {
          const pollData = await pollRes.json();
          statusId = pollData.status.id;
          if (statusId !== 1 && statusId !== 2) {
            result = pollData;
          }
        } else {
          throw new Error('Polling failed');
        }
      }

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
</script>

<div class="flex h-full w-full flex-1">
  <Resizable.PaneGroup direction="horizontal" class="h-full w-full rounded-lg border">
    <Resizable.Pane defaultSize={50} minSize={20}>
      <div class="h-full w-full p-4">
        <Textarea
          class="h-full w-full resize-none font-mono"
          placeholder="Write your code here..."
          bind:value={sourceCode}
        />
      </div>
    </Resizable.Pane>

    <Resizable.Handle />

    <Resizable.Pane defaultSize={50} minSize={20}>
      <Resizable.PaneGroup direction="vertical" class="h-full">
        <Resizable.Pane defaultSize={70} minSize={15}>
          <div class="flex h-full items-center justify-center p-6">
            <span class="font-semibold">Question-viewer</span>
          </div>
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
                        {#if result.status}
                          <div class="mt-2 text-xs font-semibold">
                            Status: {result.status.description}
                          </div>
                        {/if}
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
