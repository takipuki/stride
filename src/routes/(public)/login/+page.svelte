<script lang="ts">
  import { onMount } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Field, FieldDescription, FieldGroup, FieldLabel } from '$lib/components/ui/field/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { cn } from '$lib/utils.js';
  import loginImage from '$lib/assets/login-image.jpg';

  let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props();
  const id = $props.id();
</script>

<div class="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
  <div class="w-full max-w-sm md:max-w-3xl">
    <div class={cn('flex flex-col gap-6', className)} {...restProps}>
      <Card.Root class="overflow-hidden p-0">
        <Card.Content class="grid min-h-[550px] p-0 md:grid-cols-2">
          
          <form class="flex flex-col justify-center p-6 md:p-8">
            <FieldGroup>
              <div class="flex flex-col items-center gap-2 text-center">
                <h1 class="text-3xl font-bold">Welcome back</h1>
                <p class="text-balance text-muted-foreground">Login to your Stripe account</p>
              </div>
              <Field>
                <FieldLabel for="email-{id}">Email</FieldLabel>
                <Input id="email-{id}" type="email" placeholder="john@uiu.ac.bd" required />
              </Field>
              <Field>
                <div class="flex items-center">
                  <FieldLabel for="password-{id}">Password</FieldLabel>
                  <a href="/forgot-password" class="ms-auto text-xs underline-offset-2 hover:underline"> Forgot your password? </a>
                </div>
                <Input id="password-{id}" type="password" required />
              </Field>
              <Field>
                <Button type="submit">Login</Button>
              </Field>
            </FieldGroup>
          </form>

          <div class="relative hidden h-full w-full items-center justify-center border-l bg-black select-none md:flex">
            <img src={loginImage} alt="graduation image" class="absolute inset-0 h-full w-full object-cover opacity-80">
          </div>
          
        </Card.Content>
      </Card.Root>
      <FieldDescription class="px-6 text-center">
        By clicking continue, you agree to our <a href="##">Terms of Service</a> and
        <a href="##">Privacy Policy</a>.
      </FieldDescription>
    </div>
  </div>
</div>
