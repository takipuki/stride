<script lang="ts">
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import GraduationCap from '@lucide/svelte/icons/graduation-cap';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import Users from '@lucide/svelte/icons/users';
  import { useConvexClient, useQuery } from 'convex-svelte';
  import DOMPurify from 'isomorphic-dompurify';
  import { toast } from 'svelte-sonner';

  import { api } from '$convex/_generated/api.js';

  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { session } from '$lib/session';

  const userId = $derived($session?.userId);
  const userRole = $derived($session?.role);

  // --- Real-time Convex Queries ---
  const client = useConvexClient();
  const sectionsQuery = useQuery(api.sections.listWithMembers, {});

  // --- Reactive Derived States (Svelte 5 Runes) ---
  const sections = $derived(sectionsQuery.data || []);
  let searchQuery = $state('');

  const roleFilteredSections = $derived(
    sections.filter((section: any) => {
      if (userRole === 'admin') return true;
      if (userRole === 'teacher') {
        return section.teachers?.some((t: any) => t._id === userId) ?? false;
      }
      if (userRole === 'student') {
        return section.students?.some((s: any) => s._id === userId) ?? false;
      }
      return false;
    }),
  );

  const filteredSections = $derived(
    roleFilteredSections.filter(
      (section: any) =>
        section.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.aboutMd?.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  );

  // --- Loader State ---
  const isLoading = $derived(sectionsQuery.isLoading);

  // --- Modals State ---
  let deleteDialogOpen = $state(false);
  let isSubmitting = $state(false);

  // --- Delete Target Details ---
  let deletingSection = $state<any>(null);

  async function handleDeleteSection() {
    if (!deletingSection) return;
    isSubmitting = true;
    try {
      await client.mutation(api.sections.remove, { id: deletingSection._id });
      toast.success('Section deleted successfully');
      deleteDialogOpen = false;
      deletingSection = null;
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete section');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="flex-1 space-y-6 p-8 pt-6">
  <!-- Top Header Action -->
  <div class="flex items-center justify-between space-y-2">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">Academic Sections</h2>
      <p class="text-xs text-muted-foreground">
        Manage your courses, view assigned schedules, and coordinate students.
      </p>
    </div>
    {#if userRole === 'admin'}
      <div class="flex items-center gap-2">
        <Button href="/sections/new" size="sm" class="h-9 px-4 text-xs font-semibold shadow-xs">
          <Plus class="mr-1.5 h-4 w-4" />
          Create Section
        </Button>
      </div>
    {/if}
  </div>

  <!-- Search and Actions Bar -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="relative max-w-md flex-1">
      <Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/75" />
      <Input
        placeholder="Filter by section title or syllabus..."
        class="pl-9 text-xs focus-visible:ring-primary/20"
        bind:value={searchQuery}
      />
    </div>
  </div>

  <!-- Main Content Grid -->
  {#if isLoading}
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each Array(3) as _, i (i)}
        <Card.Root class="flex h-[240px] flex-col justify-between border-border bg-card">
          <Card.Header class="gap-2">
            <Skeleton class="h-6 w-3/4" />
            <Skeleton class="h-4 w-1/2" />
          </Card.Header>
          <Card.Content class="gap-2">
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-5/6" />
          </Card.Content>
          <Card.Footer>
            <Skeleton class="h-9 w-full" />
          </Card.Footer>
        </Card.Root>
      {/each}
    </div>
  {:else if filteredSections.length === 0}
    <div
      class="flex h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-8 text-center shadow-xs"
    >
      <div class="rounded-full bg-primary/5 p-4 text-primary">
        <GraduationCap class="h-8 w-8" />
      </div>
      <h3 class="text-md mt-4 font-semibold">No Sections Found</h3>
      <p class="mt-1.5 max-w-sm text-xs text-muted-foreground">
        {searchQuery
          ? 'Adjust your search query or clear filters to locate matches.'
          : 'No active sections are currently configured.'}
      </p>
      {#if userRole === 'admin' && !searchQuery}
        <Button href="/sections/new" size="sm" class="mt-4 h-8 px-3 text-xs font-semibold">
          Create Your First Section
        </Button>
      {/if}
    </div>
  {:else}
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each filteredSections as section (section._id)}
        <Card.Root
          class="flex h-full flex-col justify-between border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <Card.Header class="pb-3">
            <div class="flex items-start justify-between gap-4">
              <Card.Title class="line-clamp-1 text-lg font-bold tracking-tight text-foreground">
                {section.name}
              </Card.Title>
            </div>
            <div
              class="prose prose-sm mt-1 line-clamp-3 max-w-none text-xs text-muted-foreground/90 dark:prose-invert [&_ol]:my-1 [&_p]:my-1 [&_ul]:my-1"
            >
              {#if section.aboutMd}
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html DOMPurify.sanitize(section.aboutMd)}
              {:else}
                <p>No description provided.</p>
              {/if}
            </div>
          </Card.Header>

          <Card.Content class="flex flex-1 flex-col justify-end py-2">
            <!-- Instructor left aligned and Enrollment number on right -->
            <div class="flex items-center justify-between border-t border-border/30 pt-3">
              <div class="flex items-center gap-2">
                {#if !section.teachers || section.teachers.length === 0}
                  <span class="text-xs text-muted-foreground italic">No instructor</span>
                {:else}
                  {@const instructor = section.teachers[0]}
                  {#if instructor}
                    <Avatar.Root class="h-6 w-6 border border-border shadow-xs">
                      <Avatar.Image src={instructor.avatarUrl} alt={instructor.name} />
                      <Avatar.Fallback class="bg-primary/5 text-[9px] font-bold text-primary">
                        {instructor.name.substring(0, 2).toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <span class="max-w-[120px] truncate text-xs font-semibold text-foreground" title={instructor.name}>
                      {instructor.name}
                    </span>
                  {/if}
                {/if}
              </div>

              <Badge variant="secondary" class="shrink-0 border-border bg-muted/40 px-2 py-0.5 text-xs font-bold">
                <Users class="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                {(section.students || []).length} Student(s)
              </Badge>
            </div>
          </Card.Content>

          <Card.Footer class="flex gap-2 border-t border-border/40 bg-muted/5 p-3">
            <Button href="/sections/{section._id}" size="sm" class="h-8 flex-1 text-xs font-semibold">
              View More
              <ArrowRight class="ml-1.5 h-3.5 w-3.5" />
            </Button>
            {#if userRole === 'admin'}
              <Button
                href="/sections/{section._id}/edit"
                variant="outline"
                size="sm"
                class="h-8 w-8 p-0"
                title="Edit settings"
              >
                <Pencil class="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 w-8 border-border p-0 hover:bg-destructive/10 hover:text-destructive"
                title="Delete section"
                onclick={() => {
                  deletingSection = section;
                  deleteDialogOpen = true;
                }}
              >
                <Trash2 class="h-3.5 w-3.5" />
              </Button>
            {/if}
          </Card.Footer>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>

<!-- Deletion Dialog -->
<AlertDialog.Root bind:open={deleteDialogOpen}>
  <AlertDialog.Content class="border border-border bg-card">
    <AlertDialog.Header>
      <AlertDialog.Title class="text-md font-bold text-foreground">Are you absolutely sure?</AlertDialog.Title>
      <AlertDialog.Description class="text-xs text-muted-foreground">
        This will permanently delete the section <span class="font-semibold text-foreground"
          >{deletingSection?.name}</span
        > and remove all teacher assignments and student enrollments. This action cannot be undone.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer class="gap-2">
      <AlertDialog.Cancel class="h-8 text-xs font-semibold">Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        class="text-destructive-foreground h-8 bg-destructive text-xs font-semibold hover:bg-destructive/90"
        onclick={handleDeleteSection}
        disabled={isSubmitting}
      >
        {#if isSubmitting}
          Deleting...
        {:else}
          Delete Section
        {/if}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
