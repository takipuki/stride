<script lang="ts">
  import ActivityIcon from '@lucide/svelte/icons/activity';
  import CalendarIcon from '@lucide/svelte/icons/calendar';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import PlayCircleIcon from '@lucide/svelte/icons/play-circle';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import SearchIcon from '@lucide/svelte/icons/search';
  import { useConvexClient, useQuery } from 'convex-svelte';
  // Keep now updated every 10 seconds for real-time transitions
  import { onDestroy, onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  import { goto } from '$app/navigation';
  import { api } from '$convex/_generated/api.js';
  import type { Id } from '$convex/_generated/dataModel.js';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Spinner } from '$lib/components/ui/spinner/index.js';
  import { session } from '$lib/session';

  const client = useConvexClient();

  const userId = $derived($session?.userId);
  const role = $derived($session?.role);

  // Query all activities the user is involved in
  const activitiesQuery = useQuery(api.activities.listAllByUser, () => (userId && role ? { userId, role } : 'skip'));

  const activities = $derived(activitiesQuery.data ?? []);
  const isLoading = $derived(activitiesQuery.isLoading);

  let searchQuery = $state('');
  let filterTab = $state<'all' | 'active' | 'upcoming' | 'past'>('all');

  let now = $state(Date.now());

  let intervalId: any;
  onMount(() => {
    intervalId = setInterval(() => {
      now = Date.now();
    }, 10000);
  });
  onDestroy(() => {
    if (intervalId) clearInterval(intervalId);
  });

  // Derived filtered list of activities
  const filteredActivities = $derived.by(() => {
    let list = activities;
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q) || a.sectionName.toLowerCase().includes(q));
    }

    // Tab filter
    if (filterTab === 'active') {
      list = list.filter((a) => a.startTime <= now && now <= a.endTime);
    } else if (filterTab === 'upcoming') {
      list = list.filter((a) => now < a.startTime);
    } else if (filterTab === 'past') {
      list = list.filter((a) => now > a.endTime);
    }

    // Sort by startTime descending
    return [...list].sort((a, b) => b.startTime - a.startTime);
  });

  function getStatus(startTime: number, endTime: number) {
    if (startTime <= now && now <= endTime) return 'active';
    if (now < startTime) return 'upcoming';
    return 'past';
  }

  function formatTime(timestamp: number) {
    return new Date(timestamp).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  function getDurationText(startTime: number, endTime: number) {
    const diff = endTime - startTime;
    const mins = Math.round(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
  }

  function getRelativeTimeText(startTime: number, endTime: number, nowVal: number) {
    if (nowVal < startTime) {
      const diff = startTime - nowVal;
      const mins = Math.round(diff / 60000);
      if (mins < 60) return `Starts in ${mins}m`;
      const hrs = Math.floor(mins / 60);
      const days = Math.floor(hrs / 24);
      if (days > 0) return `Starts in ${days}d ${hrs % 24}h`;
      return `Starts in ${hrs}h ${mins % 60}m`;
    } else if (nowVal <= endTime) {
      const diff = endTime - nowVal;
      const mins = Math.round(diff / 60000);
      if (mins < 60) return `Ends in ${mins}m`;
      const hrs = Math.floor(mins / 60);
      return `Ends in ${hrs}h ${mins % 60}m`;
    } else {
      const diff = nowVal - endTime;
      const mins = Math.round(diff / 60000);
      if (mins < 60) return `Ended ${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      const days = Math.floor(hrs / 24);
      if (days > 0) return `Ended ${days}d ago`;
      return `Ended ${hrs}h ago`;
    }
  }

  async function handleStudentJoin(activityId: Id<'activities'>) {
    try {
      const problems = await client.query(api.activities.listProblems, { activityId });
      if (problems.length > 0 && problems[0].problem) {
        goto(`/activities/${activityId}/${problems[0].problem._id}`);
      } else {
        toast.error('This activity does not have any questions assigned yet.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load activity live room.');
    }
  }
</script>

<div class="mx-auto w-full max-w-5xl p-6">
  <!-- Header -->
  <div class="mb-8 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Activities Hub</h1>
      <p class="text-sm text-muted-foreground">View and manage scheduled classes, exams, and performance reviews.</p>
    </div>
    {#if role === 'teacher' || role === 'admin'}
      <Button onclick={() => goto('/activities/new')}>
        <PlusIcon class="mr-2 size-4" />
        New Activity
      </Button>
    {/if}
  </div>

  <!-- Filters & Search -->
  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex items-center gap-1.5 rounded-lg border bg-background p-1 shadow-sm">
      <button
        class="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors {filterTab === 'all'
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted'}"
        onclick={() => (filterTab = 'all')}
      >
        All
      </button>
      <button
        class="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors {filterTab === 'active'
          ? 'bg-emerald-600 text-white'
          : 'text-muted-foreground hover:bg-muted'}"
        onclick={() => (filterTab = 'active')}
      >
        Active
      </button>
      <button
        class="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors {filterTab === 'upcoming'
          ? 'bg-blue-600 text-white'
          : 'text-muted-foreground hover:bg-muted'}"
        onclick={() => (filterTab = 'upcoming')}
      >
        Upcoming
      </button>
      <button
        class="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors {filterTab === 'past'
          ? 'bg-zinc-600 text-white'
          : 'text-muted-foreground hover:bg-muted'}"
        onclick={() => (filterTab = 'past')}
      >
        Past
      </button>
    </div>

    <!-- Search Input -->
    <div class="relative w-full max-w-[280px]">
      <SearchIcon class="absolute top-2.5 left-3 size-4 text-muted-foreground opacity-50" />
      <Input placeholder="Search title or section..." bind:value={searchQuery} class="h-9 pl-9" />
    </div>
  </div>

  {#if isLoading}
    <div class="flex flex-col items-center justify-center py-20">
      <Spinner class="mb-2 size-8" />
      <p class="text-sm text-muted-foreground">Loading activities...</p>
    </div>
  {:else if filteredActivities.length === 0}
    <div class="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/5 py-20 text-center">
      <CalendarIcon class="mb-3 size-10 text-muted-foreground/30" />
      <p class="text-sm font-semibold">No activities found</p>
      <p class="mt-1 text-xs text-muted-foreground">There are no activities matching the current filter.</p>
    </div>
  {:else}
    <div class="flex flex-col gap-4">
      {#each filteredActivities as activity (activity._id)}
        {@const status = getStatus(activity.startTime, activity.endTime)}
        <Card.Root class="border bg-card shadow-sm transition-shadow hover:shadow">
          <div class="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center">
            <!-- Left Side: Activity details -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                {#if status === 'active'}
                  <span
                    class="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"
                  >
                    Active
                  </span>
                {:else}
                  <span class="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {status === 'upcoming' ? 'Upcoming' : 'Past'}
                  </span>
                {/if}
              </div>
              <h2 class="mt-2 truncate text-lg leading-tight font-bold text-foreground">
                {activity.title}
              </h2>
              <p class="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span class="font-semibold text-foreground/80">{activity.sectionName}</span>
                <span class="text-muted-foreground/50">•</span>
                <span>{activity.type === 'exam' ? 'Exam Interface' : 'Class Viewer'}</span>
              </p>
            </div>

            <!-- Middle: Timing Details -->
            <div class="flex min-w-[240px] flex-col gap-1 text-xs text-muted-foreground">
              <div class="flex items-center gap-2">
                <span class="w-10 font-medium text-foreground/75">Start:</span>
                <span>{formatTime(activity.startTime)}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-10 font-medium text-foreground/75">End:</span>
                <span>{formatTime(activity.endTime)}</span>
              </div>
              <div class="mt-1 flex items-center gap-2 text-[11px] font-medium text-primary">
                <span>Duration: {getDurationText(activity.startTime, activity.endTime)}</span>
                <span class="text-muted-foreground/30">•</span>
                <span class="text-muted-foreground"
                  >{getRelativeTimeText(activity.startTime, activity.endTime, now)}</span
                >
              </div>
            </div>

            <!-- Right Side: Action buttons -->
            <div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {#if role === 'teacher' || role === 'admin'}
                <Button
                  size="sm"
                  variant="outline"
                  class="h-8 px-3 text-xs"
                  onclick={() => goto(`/activities/${activity._id}`)}
                >
                  <ActivityIcon class="mr-1.5 size-3.5" />
                  Status
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  class="h-8 px-3 text-xs"
                  onclick={() => goto(`/activities/${activity._id}/playback`)}
                >
                  <PlayCircleIcon class="mr-1.5 size-3.5" />
                  Playback
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  class="h-8 px-3 text-xs"
                  onclick={() => goto(`/activities/${activity._id}/edit`)}
                >
                  <PencilIcon class="mr-1.5 size-3.5" />
                  Edit
                </Button>
              {:else if role === 'student'}
                {#if status === 'active'}
                  <Button
                    size="sm"
                    class="h-8 px-4 text-xs font-semibold"
                    onclick={() => handleStudentJoin(activity._id)}
                  >
                    Join Live Room
                  </Button>
                {:else if status === 'upcoming'}
                  <Button size="sm" variant="outline" class="h-8 cursor-default px-4 text-xs" disabled>
                    Starts Soon
                  </Button>
                {:else}
                  <Button
                    size="sm"
                    variant="outline"
                    class="h-8 px-4 text-xs"
                    onclick={() => goto(`/sections/${activity.sectionId}`)}
                  >
                    View Performance
                  </Button>
                {/if}
              {/if}
            </div>
          </div>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>
