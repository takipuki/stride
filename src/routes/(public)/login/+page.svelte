<script lang="ts">
  import loginImage from '$lib/assets/login-image.jpg?enhanced';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Field, FieldDescription, FieldGroup, FieldLabel } from '$lib/components/ui/field/index.js';
  import { Input } from '$lib/components/ui/input/index.js';

  const id = $props.id();
</script>

<div class="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
  <div class="w-full max-w-sm md:max-w-3xl">
    <div class="flex flex-col gap-6">
      <Card.Root class="overflow-hidden p-0">
        <Card.Content class="grid min-h-[550px] p-0 md:grid-cols-2">
          <form class="flex flex-col justify-center p-6 md:p-10">
            <FieldGroup>
              <div class="mb-6 flex flex-col items-center gap-2 text-center">
                <h1 class="text-3xl font-bold">Welcome back</h1>
                <p class="text-balance text-muted-foreground">Login to your Stride account</p>
              </div>
              <Field>
                <FieldLabel for="email-{id}">Email</FieldLabel>
                <Input id="email-{id}" type="email" placeholder="somik@uiu.ac.bd" required />
              </Field>
              <Field>
                <FieldLabel for="password-{id}">Password</FieldLabel>
                <Input id="password-{id}" type="password" required />
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
      <FieldDescription class="px-6 text-center">
        By clicking continue, you agree to our <a href="##">Terms of Service</a> and
        <a href="##">Privacy Policy</a>.
      </FieldDescription>
    </div>
  </div>
</div>
