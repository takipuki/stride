<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import BookOpen from '@lucide/svelte/icons/book-open';
  import Save from '@lucide/svelte/icons/save';
  import Search from '@lucide/svelte/icons/search';
  import UserCheck from '@lucide/svelte/icons/user-check';
  import UserX from '@lucide/svelte/icons/user-x';
  import Users from '@lucide/svelte/icons/users';
  import { useConvexClient, useQuery } from 'convex-svelte';
  import { toast } from 'svelte-sonner';

  import { page } from '$app/state';
  import { api } from '$convex/_generated/api.js';
  import type { Id } from '$convex/_generated/dataModel.js';

  import Tiptap from '$lib/components/editor/Tiptap.svelte';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { session } from '$lib/session';

  const client = useConvexClient();
  const sectionId = $derived(page.params.sectionId as Id<'sections'>);
  const userRole = $derived($session?.role);

  // --- Real-time Convex Queries ---
  const sectionQuery = useQuery(api.sections.get, () => ({ id: sectionId }));
  const sectionTeachersQuery = useQuery(api.sections.listTeachers, () => ({ sectionId }));
  const sectionStudentsQuery = useQuery(api.sections.listStudents, () => ({ sectionId }));
  const usersQuery = useQuery(api.users.list, () => (userRole === 'admin' ? {} : 'skip'));

  // --- Reactive Derived States ---
  const section = $derived(sectionQuery.data);
  const sectionTeachers = $derived(
    (sectionTeachersQuery.data || []).filter((t): t is NonNullable<typeof t> => t !== null),
  );
  const sectionStudents = $derived(
    (sectionStudentsQuery.data || []).filter((s): s is NonNullable<typeof s> => s !== null),
  );
  const users = $derived(usersQuery.data || []);

  const teachers = $derived(users.filter((u) => u.role === 'teacher'));
  const students = $derived(users.filter((u) => u.role === 'student'));

  // --- Search / Filter Lists ---
  let studentSearchQuery = $state('');
  let teacherToAssignId = $state('');
  let studentToEnrollId = $state('');

  let name = $state('');
  let aboutMd = $state('');
  let isSubmitting = $state(false);

  // Sync loaded section data into local form states
  let initialized = $state(false);
  $effect(() => {
    if (section && !initialized) {
      name = section.name;
      aboutMd = section.aboutMd || '';
      initialized = true;
    }
  });

  const availableTeachers = $derived(
    teachers.filter((t) => !sectionTeachers.some((assigned) => assigned._id === t._id)),
  );

  const availableStudents = $derived(
    students.filter((s) => !sectionStudents.some((enrolled) => enrolled._id === s._id)),
  );

  const selectedTeacherLabel = $derived(
    availableTeachers.find((t) => t._id === teacherToAssignId)?.name || 'Choose Instructor...',
  );
  const selectedStudentLabel = $derived(
    availableStudents.find((s) => s._id === studentToEnrollId)?.name || 'Select Student...',
  );

  const isLoading = $derived(
    sectionQuery.isLoading ||
      sectionTeachersQuery.isLoading ||
      sectionStudentsQuery.isLoading ||
      (userRole === 'admin' && usersQuery.isLoading),
  );

  // --- Operations ---
  async function handleUpdateSection(e: Event) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Section name is required');
      return;
    }
    isSubmitting = true;
    try {
      await client.mutation(api.sections.update, {
        id: sectionId,
        name: name.trim(),
        aboutMd: aboutMd.trim() || undefined,
      });
      toast.success('Section info updated successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to update section info');
    } finally {
      isSubmitting = false;
    }
  }

  async function assignTeacher(e: Event) {
    e.preventDefault();
    if (!teacherToAssignId) return;
    try {
      await client.mutation(api.sections.addTeacher, {
        sectionId,
        teacherId: teacherToAssignId as Id<'users'>,
      });
      toast.success('Teacher assigned successfully');
      teacherToAssignId = '';
    } catch (e) {
      console.error(e);
      toast.error('Failed to assign teacher');
    }
  }

  async function removeTeacher(teacherId: string) {
    try {
      await client.mutation(api.sections.removeTeacher, {
        sectionId,
        teacherId: teacherId as Id<'users'>,
      });
      toast.success('Teacher assignment removed');
    } catch (e) {
      console.error(e);
      toast.error('Failed to remove teacher');
    }
  }

  async function enrollStudent(e: Event) {
    e.preventDefault();
    if (!studentToEnrollId) return;
    try {
      await client.mutation(api.sections.addStudent, {
        sectionId,
        studentId: studentToEnrollId as Id<'users'>,
      });
      toast.success('Student enrolled successfully');
      studentToEnrollId = '';
    } catch (e) {
      console.error(e);
      toast.error('Failed to enroll student');
    }
  }

  async function removeStudent(studentId: string) {
    try {
      await client.mutation(api.sections.removeStudent, {
        sectionId,
        studentId: studentId as Id<'users'>,
      });
      toast.success('Student unenrolled');
    } catch (e) {
      console.error(e);
      toast.error('Failed to unenroll student');
    }
  }
</script>

<div class="container mx-auto max-w-4xl px-4 py-8 md:py-12">
  <!-- Back Action -->
  <div class="mb-6">
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
          >Only administrators are authorized to manage section settings and enrollments.</Card.Description
        >
      </Card.Header>
      <Card.Content class="pt-4">
        <Button href="/sections" variant="outline" class="border-border text-xs font-semibold">
          Return to Sections List
        </Button>
      </Card.Content>
    </Card.Root>
  {:else if isLoading}
    <div class="flex flex-col gap-6">
      <Card.Root class="overflow-hidden border border-border bg-card">
        <Card.Header class="gap-2">
          <Skeleton class="h-8 w-1/3" />
          <Skeleton class="h-4 w-1/2" />
        </Card.Header>
        <Card.Content class="gap-4">
          <Skeleton class="h-10 w-full" />
          <Skeleton class="h-28 w-full" />
        </Card.Content>
      </Card.Root>
    </div>
  {:else if !section}
    <Card.Root class="border-border bg-card p-8 text-center shadow-sm">
      <Card.Header>
        <Card.Title class="text-md font-bold text-foreground">Section Not Found</Card.Title>
        <Card.Description class="text-xs text-muted-foreground"
          >The section you are attempting to edit does not exist in the database.</Card.Description
        >
      </Card.Header>
      <Card.Content class="pt-4">
        <Button href="/sections" variant="outline" class="border-border text-xs font-semibold">
          Return to Sections
        </Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Master Header -->
    <div class="mb-10 flex flex-col gap-2">
      <h1 class="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Section Management</h1>
      <p class="text-xs text-muted-foreground">
        Configure syllabus details, assigned faculty, and enrolled student rosters.
      </p>
    </div>

    <!-- Stacked Cards (User Settings Profile UI style) -->
    <div class="flex flex-col gap-8">
      <!-- 1. Section Info Settings Card -->
      <form onsubmit={handleUpdateSection}>
        <Card.Root class="overflow-hidden border border-border bg-card shadow-sm">
          <Card.Header class="space-y-1.5 border-b bg-muted/10 p-6">
            <Card.Title class="flex items-center gap-2 text-lg font-bold tracking-tight">
              <BookOpen class="h-5 w-5 text-primary" />
              Course Metadata
            </Card.Title>
            <Card.Description class="text-xs text-muted-foreground"
              >Modify the academic title and core syllabus overview of the section.</Card.Description
            >
          </Card.Header>

          <Card.Content class="flex flex-col gap-6 p-6">
            <!-- Section Title -->
            <div class="flex flex-col gap-2">
              <Label for="section-name" class="text-xs font-semibold">Course Title / Name</Label>
              <Input
                id="section-name"
                placeholder="e.g. CSE 1115"
                bind:value={name}
                disabled={isSubmitting}
                class="py-4 text-xs focus-visible:ring-primary/20"
              />
            </div>

            <!-- Syllabus Description -->
            <div class="flex flex-col gap-2">
              <Label class="text-xs font-semibold">Syllabus Overview</Label>
              <div class="rounded-md border border-border bg-card p-1">
                <Tiptap initialContent={aboutMd} onUpdate={(html: string) => (aboutMd = html)} />
              </div>
            </div>
          </Card.Content>

          <Card.Footer class="flex justify-end border-t bg-muted/5 px-6 py-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              class="gap-1.5 bg-primary text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Save class="h-3.5 w-3.5" />
              Save Course Info
            </Button>
          </Card.Footer>
        </Card.Root>
      </form>

      <!-- 2. Instructor Assignment Card -->
      <form onsubmit={assignTeacher}>
        <Card.Root class="overflow-hidden border border-border bg-card shadow-sm">
          <Card.Header class="space-y-1.5 border-b bg-muted/10 p-6">
            <Card.Title class="flex items-center gap-2 text-lg font-bold tracking-tight">
              <UserCheck class="h-5 w-5 text-primary" />
              Primary Instructor
            </Card.Title>
            <Card.Description class="text-xs text-muted-foreground">
              Configure the instructor assigned to lead this academic section. Strict one-teacher policy is enforced.
            </Card.Description>
          </Card.Header>

          <Card.Content class="flex flex-col gap-6 p-6">
            <!-- Current Instructor Profile details -->
            <div class="space-y-3">
              <Label class="text-xs font-semibold text-muted-foreground">Assigned Faculty Member</Label>
              {#if sectionTeachers.length === 0}
                <div
                  class="rounded-lg border border-dashed border-border bg-muted/10 p-5 text-center text-xs text-muted-foreground italic"
                >
                  No primary instructor currently assigned. Choose an instructor below.
                </div>
              {:else}
                <div class="space-y-2">
                  {#each sectionTeachers as teacher (teacher._id)}
                    <div
                      class="flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-xs"
                    >
                      <div class="flex items-center gap-3">
                        <Avatar.Root class="h-9 w-9 border border-border">
                          <Avatar.Image src={teacher.avatarUrl} alt={teacher.name} />
                          <Avatar.Fallback class="bg-primary/5 text-xs font-bold text-primary">
                            {teacher.name.substring(0, 2).toUpperCase()}
                          </Avatar.Fallback>
                        </Avatar.Root>
                        <div>
                          <h4 class="text-xs font-bold text-foreground">{teacher.name}</h4>
                          <p class="text-[10px] text-muted-foreground">{teacher.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        class="h-8 gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onclick={() => removeTeacher(teacher._id)}
                      >
                        <UserX class="h-3.5 w-3.5" />
                        Unassign Instructor
                      </Button>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

            <!-- Instructor assign block -->
            {#if sectionTeachers.length === 0}
              <div class="flex flex-col gap-2 border-t border-border/30 pt-2">
                <Label for="select-teacher" class="text-xs font-semibold">Assign Instructor</Label>
                <div class="flex flex-col gap-3 sm:flex-row">
                  <Select.Root type="single" bind:value={teacherToAssignId}>
                    <Select.Trigger
                      class="h-9 w-full border border-input bg-background text-xs focus:ring-1 focus:ring-ring focus:outline-hidden"
                    >
                      {selectedTeacherLabel}
                    </Select.Trigger>
                    <Select.Content class="max-h-[300px] overflow-y-auto">
                      {#each availableTeachers as teacher (teacher._id)}
                        <Select.Item value={teacher._id} label={teacher.name}>
                          {teacher.name} ({teacher.email})
                        </Select.Item>
                      {/each}
                    </Select.Content>
                  </Select.Root>
                  <Button
                    type="submit"
                    disabled={!teacherToAssignId}
                    size="sm"
                    class="h-9 gap-1.5 bg-primary text-xs font-semibold whitespace-nowrap text-primary-foreground hover:bg-primary/90"
                  >
                    <UserCheck class="h-3.5 w-3.5" />
                    Assign Faculty
                  </Button>
                </div>
              </div>
            {:else}
              <div class="rounded-lg border border-border/30 bg-muted/10 p-3 text-xs text-muted-foreground italic">
                Unassign the current primary instructor to assign a different teacher.
              </div>
            {/if}
          </Card.Content>
        </Card.Root>
      </form>

      <!-- 3. Student Enrollment Card -->
      <Card.Root class="overflow-hidden border border-border bg-card shadow-sm">
        <Card.Header class="space-y-1.5 border-b bg-muted/10 p-6">
          <Card.Title class="flex items-center gap-2 text-lg font-bold tracking-tight">
            <Users class="h-5 w-5 text-primary" />
            Student Enrollment Roster
          </Card.Title>
          <Card.Description class="text-xs text-muted-foreground"
            >Add or remove student credentials registered inside this active section.</Card.Description
          >
        </Card.Header>

        <Card.Content class="flex flex-col gap-6 p-6">
          <!-- Enroll new student form -->
          <form onsubmit={enrollStudent} class="flex flex-col gap-2">
            <Label for="select-student" class="text-xs font-semibold">Enroll New Student</Label>
            <div class="flex flex-col gap-3 sm:flex-row">
              <Select.Root type="single" bind:value={studentToEnrollId}>
                <Select.Trigger
                  class="h-9 w-full border border-input bg-background text-xs focus:ring-1 focus:ring-ring focus:outline-hidden"
                >
                  {selectedStudentLabel}
                </Select.Trigger>
                <Select.Content class="max-h-[300px] overflow-y-auto">
                  {#each availableStudents as student (student._id)}
                    <Select.Item value={student._id} label={student.name}>
                      {student.name} ({student.email})
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
              <Button
                type="submit"
                disabled={!studentToEnrollId}
                size="sm"
                class="h-9 gap-1.5 bg-primary text-xs font-semibold whitespace-nowrap text-primary-foreground hover:bg-primary/90"
              >
                <UserCheck class="h-3.5 w-3.5" />
                Enroll Student
              </Button>
            </div>
          </form>

          <!-- List of enrolled students -->
          <div class="space-y-3 border-t border-border/30 pt-4">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Label class="text-xs font-semibold text-muted-foreground"
                >Enrolled Students ({sectionStudents.length})</Label
              >
              <div class="relative max-w-xs flex-1">
                <Search class="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/75" />
                <Input
                  placeholder="Filter student list..."
                  class="h-8 pl-8 text-xs focus-visible:ring-primary/20"
                  bind:value={studentSearchQuery}
                />
              </div>
            </div>

            {#if sectionStudents.length === 0}
              <div
                class="rounded-lg border border-dashed border-border bg-muted/10 p-5 text-center text-xs text-muted-foreground italic"
              >
                No students currently enrolled. Use the selector above to enroll.
              </div>
            {:else}
              {@const filteredStudents = sectionStudents.filter(
                (s) =>
                  s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                  s.email.toLowerCase().includes(studentSearchQuery.toLowerCase()),
              )}
              {#if filteredStudents.length === 0}
                <div class="p-3 text-center text-xs text-muted-foreground">No matching student records found.</div>
              {:else}
                <div class="max-h-[300px] divide-y divide-border/30 overflow-y-auto pr-1">
                  {#each filteredStudents as student (student._id)}
                    <div class="flex items-center justify-between py-2">
                      <div class="flex items-center gap-3">
                        <Avatar.Root class="h-8 w-8 border border-border">
                          <Avatar.Image src={student.avatarUrl} alt={student.name} />
                          <Avatar.Fallback class="bg-primary/5 text-xs font-bold text-primary">
                            {student.name.substring(0, 2).toUpperCase()}
                          </Avatar.Fallback>
                        </Avatar.Root>
                        <div>
                          <h4 class="text-xs font-bold text-foreground">{student.name}</h4>
                          <p class="text-[10px] text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        class="h-8 gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onclick={() => removeStudent(student._id)}
                      >
                        <UserX class="h-3.5 w-3.5" />
                        Unenroll
                      </Button>
                    </div>
                  {/each}
                </div>
              {/if}
            {/if}
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  {/if}
</div>
