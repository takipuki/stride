<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Code2 from '@lucide/svelte/icons/code-2';
  import Loader2 from '@lucide/svelte/icons/loader-2';
  import Plus from '@lucide/svelte/icons/plus';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { useConvexClient } from 'convex-svelte';
  import { toast } from 'svelte-sonner';
  import { fade, slide } from 'svelte/transition';

  import { goto } from '$app/navigation';
  import { api } from '$convex/_generated/api.js';

  import Tiptap from '$lib/components/editor/Tiptap.svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { session } from '$lib/session';

  const client = useConvexClient();

  // Form State
  let title = $state('');
  let contentMd = $state('');
  let isSubmitting = $state(false);

  // Local Test Cases State
  let testCases = $state<{ inputData: string; outputData: string }[]>([]);
  let newCaseInput = $state('');
  let newCaseOutput = $state('');

  const isTeacherOrAdmin = $derived($session && ($session.role === 'teacher' || $session.role === 'admin'));

  function addLocalTestCase() {
    if (!newCaseOutput.trim()) {
      return toast.error('Expected output is required.');
    }
    testCases = [...testCases, { inputData: newCaseInput, outputData: newCaseOutput.trim() }];
    newCaseInput = '';
    newCaseOutput = '';
    toast.success('Test case added to suite.');
  }

  function removeLocalTestCase(index: number) {
    testCases = testCases.filter((_, i) => i !== index);
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!title.trim()) return toast.error('Problem title is required.');
    const plainText = contentMd.replace(/<[^>]*>/g, '').trim();
    if (!plainText) return toast.error('Problem description is required.');
    if (!$session?.userId) return;

    isSubmitting = true;
    try {
      // 1. Create problem
      const problemId = await client.mutation(api.problems.create, {
        createdBy: $session.userId,
        title: title.trim(),
        contentMd: contentMd.trim(),
      });

      // 2. Add test cases
      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        await client.mutation(api.problems.addIO, {
          problemId,
          inputData: tc.inputData,
          outputData: tc.outputData,
          ioOrder: i + 1,
        });
      }

      toast.success('Problem created successfully!');
      goto(`/problems/${problemId}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create problem.');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="container mx-auto flex max-w-4xl flex-col gap-6 p-4 md:p-6" in:fade>
  <!-- Back button -->
  <div class="flex items-center">
    <Button
      variant="ghost"
      size="sm"
      onclick={() => goto('/problems')}
      class="h-8 cursor-pointer gap-1.5 pl-2 text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft class="h-4 w-4" /> Back to Problems
    </Button>
  </div>

  {#if !isTeacherOrAdmin}
    <div
      class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-destructive/30 py-20 text-center"
    >
      <h3 class="text-xl font-bold text-destructive">Access Restricted</h3>
      <p class="text-sm text-muted-foreground">Only teachers and admins can create programming problems.</p>
      <Button size="sm" onclick={() => goto('/problems')} class="cursor-pointer">Back to Problems</Button>
    </div>
  {:else}
    <div class="flex flex-col gap-6">
      <!-- Title Card -->
      <div
        class="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent p-6 md:p-8"
      >
        <div class="flex flex-col gap-2 md:max-w-2xl">
          <h1 class="text-3xl font-black tracking-tight text-foreground md:text-4xl">New Problem</h1>
          <p class="text-sm leading-relaxed text-muted-foreground">
            Create a new programming problem for students. Define the description and seed test cases to automatically
            validate submissions.
          </p>
        </div>
      </div>

      <!-- Problem Details Form -->
      <Card.Root class="border bg-card/45 shadow-sm backdrop-blur-md">
        <Card.Header class="p-6">
          <Card.Title class="text-lg font-bold tracking-tight">1. Problem Details</Card.Title>
          <Card.Description>Provide a concise title and clear details about the algorithmic challenge.</Card.Description
          >
        </Card.Header>
        <Separator />
        <Card.Content class="p-6">
          <div class="flex flex-col gap-5">
            <!-- Title -->
            <div class="flex flex-col gap-2">
              <Label for="prob-title" class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                >Problem Title</Label
              >
              <Input
                id="prob-title"
                placeholder="e.g. Reverse a Linked List..."
                bind:value={title}
                maxlength={150}
                required
                class="border-primary/20 text-sm focus-visible:ring-primary/30"
              />
            </div>

            <!-- Description -->
            <div class="flex flex-col gap-2">
              <Label for="prob-desc" class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                >Problem Description</Label
              >
              <Tiptap initialContent={contentMd} onUpdate={(html: string) => (contentMd = html)} />
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Test Cases Suite Builder -->
      <Card.Root class="border bg-card/45 shadow-sm backdrop-blur-md">
        <Card.Header class="p-6">
          <Card.Title class="flex items-center gap-1.5 text-lg font-bold tracking-tight">
            <Code2 class="h-5 w-5 text-primary" /> 2. Seed Test Cases
          </Card.Title>
          <Card.Description>Add the test cases that student submissions will be evaluated against.</Card.Description>
        </Card.Header>
        <Separator />

        <Card.Content class="flex flex-col gap-6 p-6">
          <!-- Locally added test cases list -->
          {#if testCases.length === 0}
            <div class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground italic">
              No test cases added to this suite yet. Formulate case details below.
            </div>
          {:else}
            <div class="flex flex-col gap-4">
              {#each testCases as tc, idx (idx)}
                <div
                  class="flex flex-col gap-3 rounded-xl border bg-muted/10 p-4 transition-all duration-300 hover:border-primary/10"
                  transition:slide
                >
                  <div class="flex items-center justify-between">
                    <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary"
                      >Test Case #{idx + 1}</span
                    >
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      class="h-8 w-8 cursor-pointer text-muted-foreground hover:text-destructive"
                      onclick={() => removeLocalTestCase(idx)}
                    >
                      <Trash2 class="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div class="grid gap-4 md:grid-cols-2">
                    <div class="flex flex-col gap-1">
                      <span class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Input</span>
                      <pre
                        class="overflow-x-auto rounded border border-border/40 bg-background p-2.5 font-mono text-xs whitespace-pre-wrap">{tc.inputData ||
                          '[Empty Input]'}</pre>
                    </div>
                    <div class="flex flex-col gap-1">
                      <span class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
                        >Expected Output</span
                      >
                      <pre
                        class="overflow-x-auto rounded border border-border/40 bg-background p-2.5 font-mono text-xs whitespace-pre-wrap">{tc.outputData}</pre>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}

          <!-- Form to append test cases -->
          <div class="flex flex-col gap-4 rounded-xl border bg-muted/5 p-4">
            <h4 class="text-xs font-bold tracking-wider text-muted-foreground uppercase">Create Custom Case</h4>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="flex flex-col gap-1.5">
                <Label for="new-input" class="text-xs font-semibold">StdIn (Input)</Label>
                <Textarea
                  id="new-input"
                  placeholder="Input arguments or strings (optional)..."
                  bind:value={newCaseInput}
                  rows={3}
                  class="border-primary/20 font-mono text-xs focus-visible:ring-primary/30"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <Label for="new-output" class="text-xs font-semibold text-primary"
                  >StdOut (Expected Output - Required)</Label
                >
                <Textarea
                  id="new-output"
                  placeholder="Console output sequence..."
                  bind:value={newCaseOutput}
                  rows={3}
                  required
                  class="border-primary/20 font-mono text-xs focus-visible:ring-primary/30"
                />
              </div>
            </div>

            <div class="flex justify-end pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onclick={addLocalTestCase}
                disabled={!newCaseOutput.trim()}
                class="cursor-pointer gap-1.5 font-bold"
              >
                <Plus class="h-4 w-4" /> Add to Suite
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Publish Actions -->
      <div class="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onclick={() => goto('/problems')}
          disabled={isSubmitting}
          class="cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onclick={handleSubmit}
          disabled={isSubmitting || !title.trim() || !contentMd.replace(/<[^>]*>/g, '').trim()}
          class="min-w-36 cursor-pointer font-bold shadow-sm"
        >
          {#if isSubmitting}
            <Loader2 class="h-4 w-4 animate-spin" /> Creating...
          {:else}
            Publish Problem
          {/if}
        </Button>
      </div>
    </div>
  {/if}
</div>
