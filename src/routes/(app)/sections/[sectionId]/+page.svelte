<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Calendar from '@lucide/svelte/icons/calendar';
  import Clock from '@lucide/svelte/icons/clock';
  import GraduationCap from '@lucide/svelte/icons/graduation-cap';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Plus from '@lucide/svelte/icons/plus';
  import { useQuery } from 'convex-svelte';
  import DOMPurify from 'isomorphic-dompurify';

  import { page } from '$app/state';
  import { api } from '$convex/_generated/api.js';
  import type { Id } from '$convex/_generated/dataModel.js';

  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { session } from '$lib/session';

  const sectionId = $derived(page.params.sectionId as Id<'sections'>);
  const userId = $derived($session?.userId);
  const userRole = $derived($session?.role);

  // --- Real-time Convex Queries ---
  const sectionQuery = useQuery(api.sections.get, () => ({ id: sectionId }));
  const teachersQuery = useQuery(api.sections.listTeachers, () => ({ sectionId }));
  const studentsQuery = useQuery(api.sections.listStudents, () => ({ sectionId }));
  const activitiesQuery = useQuery(api.activities.listBySection, () => ({ sectionId }));

  // --- Derived states ---
  const section = $derived(sectionQuery.data);
  const teachers = $derived((teachersQuery.data || []).filter((t): t is NonNullable<typeof t> => t !== null));
  const students = $derived((studentsQuery.data || []).filter((s): s is NonNullable<typeof s> => s !== null));
  const activities = $derived((activitiesQuery.data || []).filter((a): a is NonNullable<typeof a> => a !== null));

  const isTeacher = $derived(teachers.some((t: any) => t._id === userId));
  const isStudent = $derived(students.some((s: any) => s._id === userId));
  const isAuthorized = $derived(userRole === 'admin' || isTeacher || isStudent);

  const isLoading = $derived(
    sectionQuery.isLoading || teachersQuery.isLoading || studentsQuery.isLoading || activitiesQuery.isLoading,
  );

  // --- Layout Helpers ---
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

<div class="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 md:p-8">
  <!-- Back Action -->
  <div>
    <Button
      href="/sections"
      variant="ghost"
      class="h-8 gap-1.5 pl-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
    >
      <ArrowLeft class="h-3.5 w-3.5" />
      Back to Sections
    </Button>
  </div>

  {#if isLoading}
    <div class="flex flex-col gap-6">
      <Card.Root class="overflow-hidden border border-border bg-card">
        <Card.Header class="gap-2">
          <Skeleton class="h-8 w-1/3" />
          <Skeleton class="h-4 w-1/2" />
        </Card.Header>
        <Card.Content class="gap-4">
          <Skeleton class="h-24 w-full" />
        </Card.Content>
      </Card.Root>
    </div>
  {:else if !section}
    <Card.Root class="border-border bg-card p-8 text-center shadow-xs">
      <Card.Header>
        <Card.Title class="text-md font-bold text-foreground">Section Not Found</Card.Title>
        <Card.Description class="text-xs text-muted-foreground"
          >The section you are trying to view does not exist.</Card.Description
        >
      </Card.Header>
      <Card.Content class="pt-4">
        <Button href="/sections" variant="outline" class="border-border text-xs font-semibold">
          Return to Sections
        </Button>
      </Card.Content>
    </Card.Root>
  {:else if !isAuthorized}
    <Card.Root class="border-destructive bg-destructive/5 p-8 text-center">
      <Card.Header>
        <Card.Title class="text-md font-bold text-destructive">Access Restricted</Card.Title>
        <Card.Description class="text-xs text-muted-foreground"
          >You are not enrolled or assigned to this academic section.</Card.Description
        >
      </Card.Header>
      <Card.Content class="pt-4">
        <Button href="/sections" variant="outline" class="border-border text-xs font-semibold">
          Return to Sections
        </Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Section Header Summary -->
    <div class="flex flex-col justify-between gap-4 border-b border-border/40 pb-6 md:flex-row md:items-end">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <GraduationCap class="h-6 w-6 text-primary" />
          <h1 class="text-3xl font-bold tracking-tight text-foreground">{section.name}</h1>
        </div>
        <p class="text-xs text-muted-foreground">Academic portal for class schedules, exams, and memberships.</p>
      </div>

      {#if userRole === 'admin'}
        <Button
          href="/sections/{section._id}/edit"
          variant="outline"
          size="sm"
          class="h-9 gap-1.5 border-border bg-card text-xs font-semibold"
        >
          <Pencil class="h-3.5 w-3.5" />
          Manage Settings
        </Button>
      {/if}
    </div>

    <!-- Layout Cards Stacked Vertically -->
    <div class="flex flex-col gap-6">
      <!-- Syllabus Card -->
      <Card.Root class="border-border bg-card shadow-xs">
        <Card.Header class="pb-3">
          <Card.Title class="text-sm font-bold tracking-wider text-muted-foreground uppercase"
            >Syllabus & Overview</Card.Title
          >
        </Card.Header>
        <Card.Content>
          {#if section.aboutMd}
            <div class="prose prose-sm max-w-none text-xs leading-relaxed text-muted-foreground dark:prose-invert">
              <!-- Render structured content safely -->
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html DOMPurify.sanitize(section.aboutMd)}
            </div>
          {:else}
            <p class="text-xs text-muted-foreground italic">No syllabus description is available for this section.</p>
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Section Stats Card -->
      <Card.Root class="border-border bg-card shadow-xs">
        <Card.Header class="pb-3">
          <Card.Title class="text-sm font-bold tracking-wider text-muted-foreground uppercase">Section Stats</Card.Title
          >
        </Card.Header>
        <Card.Content class="grid gap-4 sm:grid-cols-3">
          <div
            class="flex items-center justify-between border-b border-border/30 pb-3 text-xs sm:border-r sm:border-b-0 sm:pr-4 sm:pb-0"
          >
            <span class="font-semibold text-muted-foreground">Total Students</span>
            <span class="text-sm font-bold text-foreground">{students.length}</span>
          </div>
          <div
            class="flex items-center justify-between border-b border-border/30 pb-3 text-xs sm:border-r sm:border-b-0 sm:px-4 sm:pb-0"
          >
            <span class="font-semibold text-muted-foreground">Active Activities</span>
            <span class="text-sm font-bold text-foreground">{activities.length}</span>
          </div>
          <div class="flex items-center justify-between text-xs sm:pl-4">
            <span class="font-semibold text-muted-foreground">Created At</span>
            <span class="text-sm font-bold text-foreground">{formatDate(section.createdAt)}</span>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Activities & Exams Card -->
      <Card.Root class="border-border bg-card shadow-xs">
        <Card.Header class="flex flex-row items-center justify-between pb-3">
          <Card.Title class="text-sm font-bold tracking-wider text-muted-foreground uppercase"
            >Activities & Exams ({activities.length})</Card.Title
          >
          <!-- Create Action for teachers only -->
          {#if isTeacher}
            <Button href="/activities/new?sectionId={section._id}" size="sm" class="h-8 gap-1.5 text-xs font-semibold">
              <Plus class="h-3.5 w-3.5" />
              New Activity
            </Button>
          {/if}
        </Card.Header>
        <Card.Content class="space-y-4">
          {#if activities.length === 0}
            <div
              class="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-6 text-center"
            >
              <Calendar class="h-7 w-7 text-muted-foreground/60" />
              <h4 class="mt-2 text-xs font-bold text-foreground">No Activities Scheduled</h4>
              <p class="mt-1 max-w-xs text-[11px] text-muted-foreground">
                There are no exams or classes currently scheduled for this section.
              </p>
            </div>
          {:else}
            <div class="grid gap-3">
              {#each activities as activity (activity._id)}
                <Card.Root class="border-border bg-card transition-all duration-200 hover:bg-muted/5">
                  <Card.Content class="flex flex-col p-4">
                    <div class="flex w-full items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div class="rounded-full bg-primary/5 p-2 text-primary">
                          <Clock class="h-4 w-4" />
                        </div>
                        <div>
                          <h4 class="text-xs font-bold text-foreground">{activity.title}</h4>
                          <div class="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span class="flex items-center gap-1">
                              <Calendar class="h-3 w-3" />
                              {formatDate(activity.startTime)}
                            </span>
                            <span>•</span>
                            <span>
                              {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          class="border-border bg-muted/40 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-muted-foreground uppercase"
                        >
                          {activity.type}
                        </Badge>
                        {#if userRole !== 'student'}
                          <Button href="/activities/{activity._id}" size="sm" class="h-8 px-3 text-xs font-semibold">
                            Enter
                          </Button>
                        {/if}
                      </div>
                    </div>

                    {#if userRole === 'student'}
                      {@const problemsQuery = useQuery(api.activities.listProblems, () => ({
                        activityId: activity._id,
                      }))}
                      {@const problems = problemsQuery.data ?? []}
                      {@const now = Date.now()}
                      {@const isActive = now >= activity.startTime && now <= activity.endTime}
                      {@const isUpcoming = now < activity.startTime}

                      {#if problemsQuery.isLoading}
                        <div class="mt-3 flex items-center justify-center border-t border-border/30 py-2 pt-3">
                          <span class="text-[10px] text-muted-foreground italic">Loading assigned tasks...</span>
                        </div>
                      {:else if problems.length === 0}
                        <div
                          class="mt-3 flex items-center justify-center rounded-md border-t border-border/30 bg-muted/5 py-2 pt-3"
                        >
                          <span class="text-[10px] text-muted-foreground italic"
                            >No tasks assigned for this activity yet.</span
                          >
                        </div>
                      {:else}
                        <div class="mt-3 space-y-2 border-t border-border/30 pt-3">
                          <div class="text-[9px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                            Assigned Tasks ({problems.length})
                          </div>
                          <div class="grid gap-2">
                            {#each problems as p (p._id)}
                              {#if p.problem}
                                <div
                                  class="flex items-center justify-between rounded-lg border border-border/40 bg-muted/10 p-2.5"
                                >
                                  <div class="flex items-center gap-2">
                                    <span
                                      class="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary"
                                    >
                                      {p.problemOrder + 1}
                                    </span>
                                    <span class="text-xs font-semibold text-foreground">{p.problem.title}</span>
                                  </div>
                                  <div>
                                    {#if isActive}
                                      <Button
                                        href="/activities/{activity._id}/{p.problem._id}"
                                        size="sm"
                                        class="h-7 bg-primary px-3 text-[10px] font-bold text-primary-foreground hover:bg-primary/90"
                                      >
                                        Enter Assignment Room
                                      </Button>
                                    {:else if isUpcoming}
                                      <Badge
                                        variant="outline"
                                        class="border-info/25 bg-info/5 text-[9px] font-bold tracking-wider text-info uppercase"
                                      >
                                        Upcoming
                                      </Badge>
                                    {:else}
                                      <Badge
                                        variant="outline"
                                        class="border-border bg-muted/20 text-[9px] font-bold tracking-wider text-muted-foreground uppercase"
                                      >
                                        Closed
                                      </Badge>
                                    {/if}
                                  </div>
                                </div>
                              {/if}
                            {/each}
                          </div>
                        </div>
                      {/if}
                    {/if}
                  </Card.Content>
                </Card.Root>
              {/each}
            </div>
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Assigned Faculty Card -->
      <Card.Root class="border-border bg-card shadow-xs">
        <Card.Header class="pb-3">
          <Card.Title class="text-sm font-bold tracking-wider text-muted-foreground uppercase"
            >Assigned Faculty ({teachers.length})</Card.Title
          >
        </Card.Header>
        <Card.Content>
          {#if teachers.length === 0}
            <p class="text-xs text-muted-foreground italic">No instructors assigned yet.</p>
          {:else}
            <div class="grid gap-3 sm:grid-cols-2">
              {#each teachers as teacher (teacher._id)}
                <a
                  href="/users/{teacher._id}"
                  class="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-xs transition-all duration-200 hover:border-primary/30 hover:bg-muted/50"
                >
                  <Avatar.Root class="h-9 w-9 border border-border">
                    <Avatar.Image src={teacher.avatarUrl} alt={teacher.name} />
                    <Avatar.Fallback class="bg-primary/5 text-xs font-bold text-primary">
                      {teacher.name.substring(0, 2).toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <div>
                    <h4 class="text-xs font-bold text-foreground hover:underline">{teacher.name}</h4>
                    <p class="text-[10px] text-muted-foreground">{teacher.email}</p>
                  </div>
                </a>
              {/each}
            </div>
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Students Card -->
      <Card.Root class="border-border bg-card shadow-xs">
        <Card.Header class="pb-3">
          <Card.Title class="text-sm font-bold tracking-wider text-muted-foreground uppercase"
            >Enrolled Students ({students.length})</Card.Title
          >
        </Card.Header>
        <Card.Content>
          {#if students.length === 0}
            <p class="text-xs text-muted-foreground italic">No students currently enrolled.</p>
          {:else}
            <div class="grid gap-3 sm:grid-cols-2">
              {#each students as student (student._id)}
                <a
                  href="/users/{student._id}"
                  class="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-xs transition-all duration-200 hover:border-primary/30 hover:bg-muted/50"
                >
                  <Avatar.Root class="h-9 w-9 border border-border">
                    <Avatar.Image src={student.avatarUrl} alt={student.name} />
                    <Avatar.Fallback class="bg-primary/5 text-xs font-bold text-primary">
                      {student.name.substring(0, 2).toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <div>
                    <h4 class="text-xs font-bold text-foreground hover:underline">{student.name}</h4>
                    <p class="text-[10px] text-muted-foreground">{student.email}</p>
                  </div>
                </a>
              {/each}
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>
  {/if}
</div>
