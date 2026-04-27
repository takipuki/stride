<script lang="ts">
  import { useConvexClient } from 'convex-svelte';
  import { onMount } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  import { goto } from '$app/navigation';
  import { api } from '$convex/_generated/api.js';

  import loginImage from '$lib/assets/login-image.jpg?enhanced';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Field, FieldDescription, FieldGroup, FieldLabel } from '$lib/components/ui/field/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { setSession } from '$lib/session';

  const id = $props.id();

  const client = useConvexClient();

  let email = $state('');
  let password = $state('');
  let error = $state<string | null>(null);
  let loading = $state(false);

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    console.log('submitting');
    error = null;
    loading = true;

    try {
      const res = await client.mutation(api.users.login, { email, passwordHash: password });

      if (!res) {
        error = 'Invalid email or password.';
        return;
      }

      setSession({
        userId: res.userId,
        name: res.name,
        email: res.email,
        avatarUrl: res.avatarUrl,
      });

      await goto('/dashboard');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Login failed.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
  <div class="w-full max-w-sm md:max-w-3xl">
    <div class="flex flex-col gap-6">
      <Card.Root class="overflow-hidden p-0">
        <Card.Content class="grid min-h-[550px] p-0 md:grid-cols-2">
          <form class="flex flex-col justify-center p-6 md:p-8" onsubmit={onSubmit}>
            <FieldGroup>
              <div class="mb-6 flex flex-col items-center gap-2 text-center">
                <h1 class="text-3xl font-bold">Welcome back</h1>
                <p class="text-balance text-muted-foreground">Login to your Stride account</p>
              </div>
              <Field>
                <FieldLabel for="email-{id}">Email</FieldLabel>
                <Input id="email-{id}" type="email" placeholder="somik@uiu.ac.bd" required bind:value={email} />
              </Field>
              <Field>
                <div class="flex items-center">
                  <FieldLabel for="password-{id}">Password</FieldLabel>
                  <a href="/forgot-password" class="ms-auto text-xs underline-offset-2 hover:underline">
                    Forgot your password?
                  </a>
                </div>
                <Input id="password-{id}" type="password" required bind:value={password} />
              </Field>
              <Field>
                <Button type="submit">Login</Button>
              </Field>
              <div class="mt-4 text-center text-sm">
                <a href="/forgot-password" class="underline underline-offset-4 hover:text-primary">
                  Forgot your password?
                </a>
              </div>
            </FieldGroup>
          </form>

          <div
            class="relative hidden h-full w-full items-center justify-center overflow-hidden border-l bg-black select-none md:flex"
          >
            <enhanced:img
              src={loginImage}
              alt="graduation cap"
              class="absolute inset-0 h-full w-full object-cover opacity-80"
              sizes="(min-width: 768px) 50vw, 0vw"
            />
          </div>
        </Card.Content>
      </Card.Root>

      {#if error}
        <div class="text-sm text-destructive">{error}</div>
      {/if}

      <FieldDescription class="px-6 text-center">
        By clicking continue, you agree to our <a href="##">Terms of Service</a> and
        <a href="##">Privacy Policy</a>.
      </FieldDescription>
    </div>
  </div>
</div>
