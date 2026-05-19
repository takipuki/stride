<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Calendar from '@lucide/svelte/icons/calendar';
  import Code2 from '@lucide/svelte/icons/code-2';
  import Loader2 from '@lucide/svelte/icons/loader-2';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { useConvexClient, useQuery } from 'convex-svelte';
  import DOMPurify from 'isomorphic-dompurify';
  import { toast } from 'svelte-sonner';
  import { fade } from 'svelte/transition';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { api } from '$convex/_generated/api.js';
  import type { Id } from '$convex/_generated/dataModel';

  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { session } from '$lib/session';

  const client = useConvexClient();

  const problemId = $derived(page.params.problemId as Id<'problems'>);

  // Queries
  const problemQuery = useQuery(api.problems.get, () => ({ id: problemId }));
  const testCasesQuery = useQuery(api.problems.listIO, () => ({ problemId }));

  // State
  let deleteDialogOpen = $state(false);
  let isDeleting = $state(false);

  const canManage = $derived.by(() => {
    if (!$session || !problemQuery.data) return false;
    return $session.userId === problemQuery.data.createdBy || $session.role === 'admin';
  });

  const hasAccess = $derived.by(() => {
    if (!$session || !problemQuery.data) return false;
    if ($session.role === 'teacher') {
      return problemQuery.data.createdBy === $session.userId;
    }
    return true;
  });

  function formatTime(timestamp: number) {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async function confirmDelete() {
    isDeleting = true;
    try {
      await client.mutation(api.problems.remove, { id: problemId });
      toast.success('Problem deleted successfully.');
      goto('/problems');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete problem.');
    } finally {
      isDeleting = false;
      deleteDialogOpen = false;
    }
  }
</script>

<div class="container mx-auto flex max-w-4xl flex-col gap-6 p-4 md:p-6" in:fade>
  <!-- Back Button & Action Controls -->
  <div class="flex items-center justify-between">
    <Button
      variant="ghost"
      size="sm"
      onclick={() => goto('/problems')}
      class="h-8 cursor-pointer gap-1.5 pl-2 text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft class="h-4 w-4" /> Back to Problems
    </Button>

    {#if canManage}
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onclick={() => goto(`/problems/${problemId}/edit`)}
          class="h-8 cursor-pointer gap-1.5 text-xs font-semibold"
        >
          <Pencil class="h-3.5 w-3.5" /> Edit Problem
        </Button>
        <Button
          variant="outline"
          size="sm"
          onclick={() => (deleteDialogOpen = true)}
          class="h-8 cursor-pointer gap-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
        >
          <Trash2 class="h-3.5 w-3.5" /> Delete
        </Button>
      </div>
    {/if}
  </div>

  {#if problemQuery.isLoading}
    <div class="flex h-96 flex-col items-center justify-center gap-2">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
      <span class="text-xs font-semibold text-muted-foreground">Loading details...</span>
    </div>
  {:else if !problemQuery.data}
    <div class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-20 text-center">
      <h3 class="text-xl font-bold">Problem not found</h3>
      <p class="text-sm text-muted-foreground">
        The problem you are looking for may have been deleted or does not exist.
      </p>
      <Button size="sm" onclick={() => goto('/problems')}>Return to Problems</Button>
    </div>
  {:else if !hasAccess}
    <div
      class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-destructive/30 py-20 text-center"
    >
      <h3 class="text-xl font-bold text-destructive">Permission Denied</h3>
      <p class="text-sm text-muted-foreground">You do not have permission to view this problem.</p>
      <Button size="sm" onclick={() => goto('/problems')} class="cursor-pointer">Return to Problems</Button>
    </div>
  {:else}
    {@const problem = problemQuery.data}
    <!-- Main Content Card -->
    <Card.Root class="border bg-card/45 shadow-sm backdrop-blur-md">
      <Card.Header class="space-y-4 p-6">
        <!-- Title & Metadata -->
        <div class="space-y-2">
          <h1 class="text-2xl font-black tracking-tight text-foreground md:text-3xl">
            {problem.title}
          </h1>
        </div>

        <div class="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
          <!-- Date -->
          <div class="flex items-center gap-1.5">
            <Calendar class="h-4 w-4" />
            <span>Updated: {formatTime(problem.updatedAt)}</span>
          </div>
        </div>
      </Card.Header>

      <Separator />

      <!-- Description body -->
      <Card.Content class="p-6">
        <h3 class="mb-3 text-sm font-bold tracking-wider text-muted-foreground uppercase">Problem Description</h3>
        <div class="prose prose-sm max-w-none leading-relaxed font-normal text-foreground/90 dark:prose-invert">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html DOMPurify.sanitize(problem.contentMd)}
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Test Cases / IOs Section -->
    <Card.Root class="border bg-card/45 shadow-sm backdrop-blur-md">
      <Card.Header class="p-6 pb-3">
        <Card.Title class="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Code2 class="h-5 w-5 text-primary" /> Test Cases / Input & Outputs
        </Card.Title>
        <Card.Description>These inputs and outputs will be used to automatically validate submissions.</Card.Description
        >
      </Card.Header>
      <Card.Content class="p-6 pt-0">
        {#if testCasesQuery.isLoading}
          <div class="flex items-center justify-center gap-1.5 py-6 text-sm text-muted-foreground italic">
            <Loader2 class="h-4 w-4 animate-spin" /> Loading test cases...
          </div>
        {:else if !testCasesQuery.data || testCasesQuery.data.length === 0}
          <div class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground italic">
            No test cases added yet. Eligible users can add test cases by clicking "Edit Problem".
          </div>
        {:else}
          <div class="overflow-x-auto rounded-lg border">
            <Table.Root>
              <Table.Header class="bg-muted/50">
                <Table.Row>
                  <Table.Head class="w-12 text-center">#</Table.Head>
                  <Table.Head>Input</Table.Head>
                  <Table.Head>Expected Output</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {#each testCasesQuery.data as io, idx (io._id)}
                  <Table.Row class="hover:bg-muted/30">
                    <Table.Cell class="text-center font-bold text-muted-foreground">{idx + 1}</Table.Cell>
                    <Table.Cell class="font-mono text-xs whitespace-pre-wrap"
                      >{io.inputData || '[Empty Input]'}</Table.Cell
                    >
                    <Table.Cell class="font-mono text-xs whitespace-pre-wrap"
                      >{io.outputData || '[Empty Output]'}</Table.Cell
                    >
                  </Table.Row>
                {/each}
              </Table.Body>
            </Table.Root>
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  {/if}
</div>

<!-- Deletion Confirmation Dialog -->
<AlertDialog.Root bind:open={deleteDialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete Problem</AlertDialog.Title>
      <AlertDialog.Description>
        Are you sure you want to delete this problem? This action cannot be undone and will delete all associated test
        cases.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action variant="destructive" onclick={confirmDelete} disabled={isDeleting}>
        {#if isDeleting}
          <Loader2 class="h-3.5 w-3.5 animate-spin" /> Deleting...
        {:else}
          Delete
        {/if}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
