<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Loader2 from '@lucide/svelte/icons/loader-2';
  import Plus from '@lucide/svelte/icons/plus';
  import Save from '@lucide/svelte/icons/save';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { useConvexClient, useQuery } from 'convex-svelte';
  import { toast } from 'svelte-sonner';
  import { fade } from 'svelte/transition';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { api } from '$convex/_generated/api.js';
  import type { Id } from '$convex/_generated/dataModel';

  import Tiptap from '$lib/components/editor/Tiptap.svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { session } from '$lib/session';

  const client = useConvexClient();

  const problemId = $derived(page.params.problemId as Id<'problems'>);

  // Queries
  const problemQuery = useQuery(api.problems.get, () => ({ id: problemId }));
  const testCasesQuery = useQuery(api.problems.listIO, () => ({ problemId }));

  // Form State
  let isInitialized = $state(false);
  let title = $state('');
  let contentMd = $state('');
  let editorKey = $state(0);

  // Mutation Submitting flags
  let isSavingDetails = $state(false);
  let isAddingTestCase = $state(false);
  let updatingIoMap = $state<Record<string, boolean>>({});
  let deletingIoMap = $state<Record<string, boolean>>({});

  // New Test Case Form State
  let newCaseInput = $state('');
  let newCaseOutput = $state('');

  // Svelte 5 Effect to initialize state from fetched data
  $effect(() => {
    if (problemQuery.data && !isInitialized) {
      title = problemQuery.data.title;
      contentMd = problemQuery.data.contentMd;
      editorKey++;
      isInitialized = true;
    }
  });

  const canManage = $derived.by(() => {
    if (!$session || !problemQuery.data) return false;
    return $session.userId === problemQuery.data.createdBy || $session.role === 'admin';
  });

  async function saveDetails(e: Event) {
    e.preventDefault();
    if (!title.trim()) return toast.error('Problem title is required.');
    const plainText = contentMd.replace(/<[^>]*>/g, '').trim();
    if (!plainText) return toast.error('Problem content is required.');

    isSavingDetails = true;
    try {
      await client.mutation(api.problems.update, {
        id: problemId,
        title: title.trim(),
        contentMd: contentMd.trim(),
      });
      toast.success('Problem details updated successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save details.');
    } finally {
      isSavingDetails = false;
    }
  }

  async function addTestCase(e: Event) {
    e.preventDefault();
    if (!newCaseOutput.trim()) {
      return toast.error('Expected output is required.');
    }

    isAddingTestCase = true;
    try {
      const ioOrder = testCasesQuery.data ? testCasesQuery.data.length + 1 : 1;
      await client.mutation(api.problems.addIO, {
        problemId,
        inputData: newCaseInput,
        outputData: newCaseOutput.trim(),
        ioOrder,
      });
      toast.success('Test case added successfully.');
      newCaseInput = '';
      newCaseOutput = '';
    } catch (err) {
      console.error(err);
      toast.error('Failed to add testcase.');
    } finally {
      isAddingTestCase = false;
    }
  }

  async function updateTestCase(ioId: Id<'problemIos'>, inputData: string, outputData: string) {
    if (!outputData.trim()) {
      return toast.error('Expected output is required.');
    }
    updatingIoMap[ioId] = true;
    try {
      await client.mutation(api.problems.updateIO, {
        id: ioId,
        inputData,
        outputData: outputData.trim(),
      });
      toast.success('Test case updated.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update testcase.');
    } finally {
      updatingIoMap[ioId] = false;
    }
  }

  async function deleteTestCase(ioId: Id<'problemIos'>) {
    deletingIoMap[ioId] = true;
    try {
      await client.mutation(api.problems.removeIO, { id: ioId });
      toast.success('Testcase deleted.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete testcase.');
    } finally {
      deletingIoMap[ioId] = false;
    }
  }
</script>

<div class="container mx-auto flex max-w-4xl flex-col gap-6 p-4 md:p-6" in:fade>
  <!-- Back navigation header -->
  <div class="flex items-center">
    <Button
      variant="ghost"
      size="sm"
      onclick={() => goto(`/problems/${problemId}`)}
      class="h-8 cursor-pointer gap-1.5 pl-2 text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft class="h-4 w-4" /> Back to Problem details
    </Button>
  </div>

  {#if problemQuery.isLoading}
    <div class="flex h-96 flex-col items-center justify-center gap-2">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
      <span class="text-xs font-semibold text-muted-foreground">Loading problem...</span>
    </div>
  {:else if !problemQuery.data}
    <div class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-20 text-center">
      <h3 class="text-xl font-bold">Problem not found</h3>
      <p class="text-sm text-muted-foreground">The problem you are trying to edit does not exist.</p>
    </div>
  {:else if !canManage}
    <div
      class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-destructive/30 py-20 text-center"
    >
      <h3 class="text-xl font-bold text-destructive">Permission Denied</h3>
      <p class="text-sm text-muted-foreground">You do not have permission to manage this problem.</p>
      <Button size="sm" onclick={() => goto(`/problems/${problemId}`)}>Return to Details</Button>
    </div>
  {:else}
    <!-- Vertical Layout -->
    <div class="flex flex-col gap-6">
      <!-- Edit Details Card -->
      <Card.Root class="border bg-card/45 shadow-sm backdrop-blur-md">
        <Card.Header class="p-6">
          <Card.Title class="text-lg font-bold tracking-tight">Edit Problem Details</Card.Title>
          <Card.Description>Update the title and core markdown content for this programming task.</Card.Description>
        </Card.Header>
        <Separator />
        <Card.Content class="p-6">
          <form onsubmit={saveDetails} class="flex flex-col gap-5">
            <!-- Title input -->
            <div class="flex flex-col gap-2">
              <Label for="prob-title" class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                >Problem Title</Label
              >
              <Input
                id="prob-title"
                placeholder="Enter problem title..."
                bind:value={title}
                maxlength={150}
                required
                class="border-primary/20 text-sm focus-visible:ring-primary/30"
              />
            </div>

            <!-- Tiptap editor -->
            <div class="flex flex-col gap-2">
              <Label for="prob-desc" class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                >Problem Description</Label
              >
              {#key editorKey}
                <Tiptap initialContent={contentMd} onUpdate={(html: string) => (contentMd = html)} />
              {/key}
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSavingDetails || !title.trim() || !contentMd.replace(/<[^>]*>/g, '').trim()}
                class="min-w-32 cursor-pointer font-bold shadow-sm"
              >
                {#if isSavingDetails}
                  <Loader2 class="h-4 w-4 animate-spin" /> Saving...
                {:else}
                  Save Details
                {/if}
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card.Root>

      <!-- Existing Test Cases -->
      <Card.Root class="border bg-card/45 shadow-sm backdrop-blur-md">
        <Card.Header class="p-6">
          <Card.Title class="text-lg font-bold tracking-tight">Existing Test Cases</Card.Title>
          <Card.Description
            >Manage inputs and outputs. You can edit values inline and save them individually.</Card.Description
          >
        </Card.Header>
        <Separator />
        <Card.Content class="flex flex-col gap-6 p-6">
          {#if testCasesQuery.isLoading}
            <div class="flex items-center justify-center gap-1.5 py-6 text-sm text-muted-foreground italic">
              <Loader2 class="h-4 w-4 animate-spin" /> Loading test cases...
            </div>
          {:else if !testCasesQuery.data || testCasesQuery.data.length === 0}
            <div class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground italic">
              No test cases added yet. Write a new testcase using the form below.
            </div>
          {:else}
            <div class="flex flex-col gap-6">
              {#each testCasesQuery.data as io, idx (io._id)}
                <div
                  class="flex flex-col gap-4 rounded-xl border bg-muted/10 p-4 transition-all duration-300 hover:border-primary/10"
                >
                  <div class="flex items-center justify-between">
                    <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary"
                      >Test Case #{idx + 1}</span
                    >
                    <div class="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        class="h-8 cursor-pointer gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                        onclick={() => updateTestCase(io._id, io.inputData, io.outputData)}
                        disabled={updatingIoMap[io._id] || deletingIoMap[io._id]}
                      >
                        {#if updatingIoMap[io._id]}
                          <Loader2 class="h-3.5 w-3.5 animate-spin" /> Saving...
                        {:else}
                          <Save class="h-3.5 w-3.5" /> Save
                        {/if}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        class="h-8 w-8 cursor-pointer text-muted-foreground hover:text-destructive"
                        onclick={() => deleteTestCase(io._id)}
                        disabled={updatingIoMap[io._id] || deletingIoMap[io._id]}
                      >
                        {#if deletingIoMap[io._id]}
                          <Loader2 class="h-3.5 w-3.5 animate-spin" />
                        {:else}
                          <Trash2 class="h-3.5 w-3.5" />
                        {/if}
                      </Button>
                    </div>
                  </div>

                  <div class="grid gap-4 md:grid-cols-2">
                    <div class="flex flex-col gap-1.5">
                      <Label class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Input</Label>
                      <Textarea
                        bind:value={io.inputData}
                        placeholder="Input values if any..."
                        rows={3}
                        class="border-primary/10 bg-background/50 font-mono text-xs focus-visible:ring-primary/20"
                      />
                    </div>
                    <div class="flex flex-col gap-1.5">
                      <Label class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
                        >Expected Output</Label
                      >
                      <Textarea
                        bind:value={io.outputData}
                        placeholder="Expected output values..."
                        rows={3}
                        required
                        class="border-primary/10 bg-background/50 font-mono text-xs focus-visible:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Add New Test Case Card -->
      <Card.Root class="border bg-card/45 shadow-sm backdrop-blur-md">
        <Card.Header class="p-6">
          <Card.Title class="flex items-center gap-1.5 text-lg font-bold tracking-tight">
            <Plus class="h-5 w-5 text-primary" /> Add New Test Case
          </Card.Title>
          <Card.Description>Provide input/output pairs to append to the test suite.</Card.Description>
        </Card.Header>
        <Separator />
        <Card.Content class="p-6">
          <form onsubmit={addTestCase} class="flex flex-col gap-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div class="flex flex-col gap-1.5">
                <Label for="new-input" class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                  >Input</Label
                >
                <Textarea
                  id="new-input"
                  placeholder="StdIn (e.g. values separated by newlines)..."
                  bind:value={newCaseInput}
                  rows={4}
                  class="border-primary/20 font-mono text-xs focus-visible:ring-primary/30"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <Label
                  for="new-output"
                  class="text-xs font-bold tracking-wider text-muted-foreground text-primary uppercase"
                  >Expected Output (Required)</Label
                >
                <Textarea
                  id="new-output"
                  placeholder="StdOut (expected output sequence)..."
                  bind:value={newCaseOutput}
                  rows={4}
                  required
                  class="border-primary/20 font-mono text-xs focus-visible:ring-primary/30"
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                disabled={isAddingTestCase || !newCaseOutput.trim()}
                class="min-w-32 cursor-pointer font-bold shadow-sm"
              >
                {#if isAddingTestCase}
                  <Loader2 class="h-4 w-4 animate-spin" /> Adding...
                {:else}
                  Add Test Case
                {/if}
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card.Root>
    </div>
  {/if}
</div>
