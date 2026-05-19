<script lang="ts">
  import Calendar from '@lucide/svelte/icons/calendar';
  import Code2 from '@lucide/svelte/icons/code-2';
  import Eye from '@lucide/svelte/icons/eye';
  import Loader2 from '@lucide/svelte/icons/loader-2';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import User from '@lucide/svelte/icons/user';
  import { useConvexClient, useQuery } from 'convex-svelte';
  import { toast } from 'svelte-sonner';
  import { fade } from 'svelte/transition';

  import { goto } from '$app/navigation';
  import { api } from '$convex/_generated/api.js';
  import type { Id } from '$convex/_generated/dataModel';

  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { session } from '$lib/session';

  const client = useConvexClient();

  // Queries
  const problemsQuery = useQuery(api.problems.list, {});

  // State
  let searchQuery = $state('');
  let activeTab = $state<'all' | 'my'>('all');
  let problemToDeleteId = $state<Id<'problems'> | null>(null);
  let deleteDialogOpen = $state(false);
  let isDeleting = $state(false);

  // Filtered problems list
  const filteredProblems = $derived.by(() => {
    if (!problemsQuery.data) return [];
    let list = [...problemsQuery.data];

    // Filter by role: Teachers can ONLY see their own problems
    if ($session) {
      if ($session.role === 'teacher') {
        list = list.filter((p) => p.createdBy === $session.userId);
      } else if ($session.role === 'admin') {
        // Admin can toggle between all and my
        if (activeTab === 'my') {
          list = list.filter((p) => p.createdBy === $session.userId);
        }
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }

    // Sort by newest
    return list.sort((a, b) => b.createdAt - a.createdAt);
  });

  function canManage(createdBy: string) {
    if (!$session) return false;
    return $session.userId === createdBy || $session.role === 'admin' || $session.role === 'teacher';
  }

  function formatTime(timestamp: number) {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function startDelete(id: Id<'problems'>) {
    problemToDeleteId = id;
    deleteDialogOpen = true;
  }

  async function confirmDelete() {
    if (!problemToDeleteId) return;
    isDeleting = true;
    try {
      await client.mutation(api.problems.remove, { id: problemToDeleteId });
      toast.success('Problem deleted successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete problem.');
    } finally {
      isDeleting = false;
      problemToDeleteId = null;
      deleteDialogOpen = false;
    }
  }
</script>

<div class="container mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-6" in:fade>
  <!-- Hero Banner with gradient -->
  <div
    class="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent p-6 md:p-8"
  >
    <div class="flex flex-col gap-2 md:max-w-2xl">
      <h1 class="text-3xl font-black tracking-tight text-foreground md:text-4xl">Problems</h1>
      <p class="text-sm leading-relaxed text-muted-foreground">
        Browse, manage, and edit programming challenges. Filter, search, and manage inputs/outputs for student
        submissions.
      </p>
    </div>
  </div>

  <!-- Filters & Search Bar -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <!-- Tab filters -->
    {#if $session && $session.role === 'admin'}
      <div class="flex items-center gap-1.5 rounded-lg border bg-muted/20 p-1">
        <button
          onclick={() => (activeTab = 'all')}
          class="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-all {activeTab === 'all'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'}"
        >
          All Problems
        </button>
        <button
          onclick={() => (activeTab = 'my')}
          class="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-all {activeTab === 'my'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'}"
        >
          My Problems
        </button>
      </div>
    {:else}
      <div></div>
    {/if}

    <!-- Search and Add Actions -->
    <div class="flex items-center gap-3">
      <div class="relative w-full max-w-xs sm:w-64">
        <Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by title..."
          bind:value={searchQuery}
          class="pl-9 text-xs focus-visible:ring-primary/30"
        />
      </div>
      {#if $session && ($session.role === 'teacher' || $session.role === 'admin')}
        <Button size="sm" onclick={() => goto('/problems/new')} class="cursor-pointer gap-1.5 font-bold shadow-sm">
          <Plus class="h-4 w-4" /> Create Problem
        </Button>
      {/if}
    </div>
  </div>

  <!-- Problems Grid -->
  {#if problemsQuery.isLoading}
    <div class="flex h-64 flex-col items-center justify-center gap-2">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
      <span class="text-xs font-semibold text-muted-foreground">Loading problems...</span>
    </div>
  {:else if filteredProblems.length === 0}
    <div class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-24 text-center">
      <Code2 class="h-10 w-10 text-muted-foreground opacity-30" />
      <h3 class="text-lg font-bold tracking-tight">No problems found</h3>
      <p class="text-sm text-muted-foreground">Try adjusting your filters or search queries.</p>
    </div>
  {:else}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each filteredProblems as problem (problem._id)}
        <Card.Root
          class="group flex flex-col justify-between border bg-card/40 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md"
        >
          <Card.Header class="p-5 pb-3">
            <Card.Title
              class="line-clamp-1 text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-primary"
            >
              {problem.title}
            </Card.Title>
            <div class="mt-2 flex flex-col gap-1 text-[11px] text-muted-foreground">
              <div class="flex items-center gap-1.5">
                <Calendar class="h-3.5 w-3.5 shrink-0" />
                <span>Created: {formatTime(problem.createdAt)}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <Code2 class="h-3.5 w-3.5 shrink-0" />
                <span
                  >Test Cases: <span class="font-semibold text-foreground/80">{problem.testCaseCount ?? 0}</span></span
                >
              </div>
            </div>
          </Card.Header>
          <Card.Footer class="flex items-center justify-between border-t border-border/40 bg-muted/5 p-4">
            <Button
              variant="ghost"
              size="sm"
              class="h-8 cursor-pointer gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
              onclick={() => goto(`/problems/${problem._id}`)}
            >
              <Eye class="h-3.5 w-3.5" /> View Details
            </Button>
            {#if canManage(problem.createdBy)}
              <div class="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 cursor-pointer text-muted-foreground hover:text-primary"
                  onclick={() => goto(`/problems/${problem._id}/edit`)}
                >
                  <Pencil class="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 cursor-pointer text-muted-foreground hover:text-destructive"
                  onclick={() => startDelete(problem._id)}
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </Button>
              </div>
            {/if}
          </Card.Footer>
        </Card.Root>
      {/each}
    </div>
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
