<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import BookOpen from '@lucide/svelte/icons/book-open';
  import Calendar from '@lucide/svelte/icons/calendar';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Clock from '@lucide/svelte/icons/clock';
  import Code from '@lucide/svelte/icons/code';
  import Play from '@lucide/svelte/icons/play';
  import { useQuery } from 'convex-svelte';

  import { page } from '$app/state';
  import { api } from '$convex/_generated/api.js';
  import type { Id } from '$convex/_generated/dataModel.js';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { session } from '$lib/session';

  const activityId = $derived(page.params.activityId as Id<'activities'>);
  const userRole = $derived($session?.role);

  // --- Real-time Convex Queries ---
  const activityQuery = useQuery(api.activities.get, () => ({ id: activityId }));
  const problemsQuery = useQuery(api.activities.listProblems, () => ({ activityId }));

  const activity = $derived(activityQuery.data);
  const problems = $derived(problemsQuery.data ?? []);
  const isLoading = $derived(activityQuery.isLoading || problemsQuery.isLoading);

  const isActive = $derived.by(() => {
    if (!activity) return false;
    const now = Date.now();
    return now >= activity.startTime && now <= activity.endTime;
  });

  const isUpcoming = $derived.by(() => {
    if (!activity) return false;
    return Date.now() < activity.startTime;
  });

  const isCompleted = $derived.by(() => {
    if (!activity) return false;
    return Date.now() > activity.endTime;
  });

  function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatTime(timestamp: number) {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
</script>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6 md:p-8">
  <!-- Back Action -->
  <div>
    {#if activity}
      <Button
        href="/sections/{activity.sectionId}"
        variant="ghost"
        class="h-8 gap-1.5 pl-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
      >
        <ArrowLeft class="h-3.5 w-3.5" />
        Back to Section Hub
      </Button>
    {:else}
      <Button
        href="/sections"
        variant="ghost"
        class="h-8 gap-1.5 pl-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
      >
        <ArrowLeft class="h-3.5 w-3.5" />
        Back to Sections
      </Button>
    {/if}
  </div>

  {#if isLoading}
    <div class="flex flex-col gap-6">
      <Card.Root class="overflow-hidden border border-border bg-card">
        <Card.Header class="gap-2">
          <Skeleton class="h-8 w-1/3" />
          <Skeleton class="h-4 w-1/2" />
        </Card.Header>
        <Card.Content class="gap-4">
          <Skeleton class="h-20 w-full" />
        </Card.Content>
      </Card.Root>
    </div>
  {:else if !activity}
    <Card.Root class="border-border bg-card p-8 text-center shadow-xs">
      <Card.Header>
        <Card.Title class="text-md font-bold text-foreground">Activity Not Found</Card.Title>
        <Card.Description class="text-xs text-muted-foreground"
          >The requested activity or exam could not be loaded.</Card.Description
        >
      </Card.Header>
      <Card.Content class="pt-4">
        <Button href="/sections" variant="outline" class="border-border text-xs font-semibold">
          Return to Sections
        </Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Activity Status Banner / Header -->
    <div class="flex flex-col justify-between gap-4 border-b border-border/40 pb-6 md:flex-row md:items-center">
      <div class="space-y-2">
        <div class="flex items-center gap-2.5">
          <div class="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Calendar class="size-4.5" />
          </div>
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-foreground">{activity.title}</h1>
            <p class="text-xs text-muted-foreground">Course activity inside this section.</p>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          class="border-border bg-muted/30 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
        >
          {activity.type}
        </Badge>
      </div>
    </div>

    <div class="grid gap-6 md:grid-cols-3">
      <!-- Main Activity Area -->
      <div class="space-y-6 md:col-span-2">
        <!-- Problems Card -->
        <Card.Root class="border border-border bg-card shadow-xs">
          <Card.Header class="flex flex-row items-center justify-between pb-3">
            <Card.Title class="text-sm font-bold tracking-wider text-muted-foreground uppercase"
              >Problem List</Card.Title
            >
            <Badge variant="outline" class="border-border bg-muted/30 px-2 py-0.5 text-xs font-bold">
              {problems.length} Problem(s)
            </Badge>
          </Card.Header>
          <Separator />
          <Card.Content class="p-0">
            {#if problems.length === 0}
              <div class="p-6 text-center text-xs text-muted-foreground italic">
                No problems have been assigned to this activity yet.
              </div>
            {:else}
              <div class="divide-y divide-border/30">
                {#each problems as ap, i (ap._id)}
                  {#if ap.problem}
                    <div class="flex items-center justify-between p-4 transition-colors hover:bg-muted/10">
                      <div class="flex items-center gap-3">
                        <div
                          class="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 text-xs font-bold"
                        >
                          {ap.problemOrder + 1}
                        </div>
                        <div>
                          <h4 class="text-xs font-bold text-foreground">{ap.problem.title}</h4>
                          {#if ap.problem.contentMd}
                            <p class="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                              {ap.problem.contentMd.replace(/<[^>]*>/g, '').substring(0, 80)}
                            </p>
                          {/if}
                        </div>
                      </div>

                      <div>
                        {#if userRole === 'teacher'}
                          <!-- Teachers can enter directly to review or solve -->
                          <Button
                            href="/activities/{activityId}/{ap.problem._id}"
                            size="sm"
                            class="h-7 bg-primary px-2.5 text-[10px] font-bold text-primary-foreground hover:bg-primary/90"
                          >
                            Enter Workspace
                          </Button>
                        {:else if userRole === 'admin'}
                          <!-- Admins can go and view the problems and content -->
                          <Button
                            href="/activities/{activityId}/{ap.problem._id}"
                            size="sm"
                            class="h-7 bg-primary px-2.5 text-[10px] font-bold text-primary-foreground hover:bg-primary/90"
                          >
                            View Content
                          </Button>
                        {:else}
                          <!-- Read-only view -->
                          <Badge variant="outline" class="border-border bg-muted/30 text-[10px] text-muted-foreground">
                            Closed
                          </Badge>
                        {/if}
                      </div>
                    </div>
                  {/if}
                {/each}
              </div>
            {/if}
          </Card.Content>
        </Card.Root>
      </div>

      <!-- Schedule / Details Area -->
      <div class="space-y-6">
        <!-- Details Card -->
        <Card.Root class="border-border bg-card shadow-xs">
          <Card.Header class="pb-3">
            <Card.Title class="text-sm font-bold tracking-wider text-muted-foreground uppercase"
              >Schedule Details</Card.Title
            >
          </Card.Header>
          <Card.Content class="space-y-4 text-xs">
            <div class="flex items-start gap-2.5">
              <Clock class="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div class="space-y-1">
                <span class="font-semibold text-muted-foreground">Start Time</span>
                <p class="font-bold text-foreground">
                  {formatDate(activity.startTime)} at {formatTime(activity.startTime)}
                </p>
              </div>
            </div>

            <div class="flex items-start gap-2.5 border-t border-border/30 pt-3">
              <Clock class="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div class="space-y-1">
                <span class="font-semibold text-muted-foreground">End Time</span>
                <p class="font-bold text-foreground">
                  {formatDate(activity.endTime)} at {formatTime(activity.endTime)}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      </div>
    </div>
  {/if}
</div>
