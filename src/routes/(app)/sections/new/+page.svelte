<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import GraduationCap from '@lucide/svelte/icons/graduation-cap';
  import Plus from '@lucide/svelte/icons/plus';
  import UserCheck from '@lucide/svelte/icons/user-check';
  import { useConvexClient, useQuery } from 'convex-svelte';
  import { toast } from 'svelte-sonner';

  import { goto } from '$app/navigation';
  import { api } from '$convex/_generated/api.js';

  import Tiptap from '$lib/components/editor/Tiptap.svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { session } from '$lib/session';

  const client = useConvexClient();
  const userRole = $derived($session?.role);

  // --- Real-time Convex Queries ---
  const usersQuery = useQuery(api.users.list, () => (userRole === 'admin' ? {} : 'skip'));
  const users = $derived(usersQuery.data || []);
  const teachers = $derived(users.filter((u) => u.role === 'teacher'));

  let name = $state('');
  let aboutMd = $state('');
  let teacherId = $state('');
  const selectedTeacherLabel = $derived(teachers.find((t) => t._id === teacherId)?.name || 'Select Instructor...');
  let isSubmitting = $state(false);

  async function handleCreateSection() {
    if (!name.trim()) {
      toast.error('Section name is required');
      return;
    }
    if (!teacherId) {
      toast.error('Please assign an instructor to this section');
      return;
    }
    isSubmitting = true;
    try {
      // 1. Create the section
      const sectionId = await client.mutation(api.sections.create, {
        name: name.trim(),
        aboutMd: aboutMd.trim() || undefined,
      });

      // 2. Assign the teacher directly
      await client.mutation(api.sections.addTeacher, {
        sectionId,
        teacherId: teacherId as any,
      });

      toast.success('Section created and teacher assigned successfully!');
      goto('/sections');
    } catch (e) {
      console.error(e);
      toast.error('Failed to create section');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 md:p-8">
  <!-- Header / Navigation -->
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

  {#if userRole !== 'admin'}
    <!-- Unauthorized Access Protection -->
    <Card.Root class="border-destructive bg-destructive/5 p-8 text-center">
      <Card.Header>
        <Card.Title class="text-md font-bold text-destructive">Unauthorized Access</Card.Title>
        <Card.Description class="text-xs text-muted-foreground"
          >Only administrators are authorized to create new sections.</Card.Description
        >
      </Card.Header>
      <Card.Content class="pt-4">
        <Button href="/sections" variant="outline" class="border-border text-xs font-semibold">
          Return to Sections List
        </Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Section Creation Form -->
    <Card.Root class="overflow-hidden border border-border bg-card shadow-sm">
      <Card.Header class="space-y-1.5 border-b bg-muted/10 p-6">
        <Card.Title class="text-md flex items-center gap-2 font-bold tracking-tight text-foreground">
          <GraduationCap class="h-5 w-5 text-primary" />
          Create New Section
        </Card.Title>
        <Card.Description class="text-xs text-muted-foreground">
          Define a new academic course, assign its instructor directly, and initialize class syllabus.
        </Card.Description>
      </Card.Header>

      <Card.Content class="flex flex-col gap-6 p-6">
        <!-- Section Name -->
        <div class="flex flex-col gap-2">
          <Label for="section-name" class="text-xs font-semibold">
            Section / Course Title <span class="text-destructive">*</span>
          </Label>
          <Input
            id="section-name"
            placeholder="e.g. CSE 1115: Object Oriented Programming"
            class="py-4 text-xs focus-visible:ring-primary/20"
            bind:value={name}
            disabled={isSubmitting}
          />
        </div>

        <!-- Instructor Assignment Dropdown -->
        <div class="flex flex-col gap-2">
          <Label for="teacher-assignment" class="text-xs font-semibold">
            Assign Primary Instructor <span class="text-destructive">*</span>
          </Label>
          {#if usersQuery.isLoading}
            <Skeleton class="h-9 w-full" />
          {:else}
            <Select.Root type="single" bind:value={teacherId} disabled={isSubmitting}>
              <Select.Trigger
                class="h-9 w-full border border-input bg-background text-xs focus:ring-1 focus:ring-ring focus:outline-hidden"
              >
                {selectedTeacherLabel}
              </Select.Trigger>
              <Select.Content class="max-h-[300px] overflow-y-auto">
                {#each teachers as teacher (teacher._id)}
                  <Select.Item value={teacher._id} label={teacher.name}>
                    {teacher.name} ({teacher.email})
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          {/if}
        </div>

        <!-- Syllabus -->
        <div class="flex flex-col gap-2">
          <Label class="text-xs font-semibold">Syllabus & Description</Label>
          <div class="rounded-md border border-border bg-card p-1">
            <Tiptap initialContent={aboutMd} onUpdate={(html: string) => (aboutMd = html)} />
          </div>
        </div>
      </Card.Content>

      <Card.Footer class="flex items-center justify-end gap-3 border-t bg-muted/5 px-6 py-4">
        <Button
          href="/sections"
          variant="outline"
          class="h-9 border-border text-xs font-semibold"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onclick={handleCreateSection}
          class="h-9 bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
          disabled={isSubmitting}
        >
          {#if isSubmitting}
            Creating...
          {:else}
            <Plus class="mr-1.5 h-3.5 w-3.5" />
            Create Section
          {/if}
        </Button>
      </Card.Footer>
    </Card.Root>
  {/if}
</div>
