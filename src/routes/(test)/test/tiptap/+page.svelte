<script lang="ts">
  import { Languages as LanguagesIcon, Moon as MoonIcon, Sun as SunIcon } from 'lucide-svelte';
  import { onMount } from 'svelte';

  import { Button } from '$lib/components/ui/button';

  import Tiptap from './Tiptap.svelte';

  let content = $state(`
    <h1>Type your title here.</h1>
    <p>This is where the description of your question will go.</p>
    <ul>
      <li><strong>Question 1:</strong> This is just a given template.</li>
      <li><strong>Question 2:</strong> You can format your questions however you like.</li>
      <li><strong>Bonus Question:</strong> All thanks to Stride's rich and powerful text editor!</li>
    </ul>
    <pre><code>console.log("Stride is awesome!");</code></pre>
    <blockquote><p>Use Stride, don't miss out.</p></blockquote>
  `);

  let isDark = $state(false);

  onMount(() => {
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('theme');

    if (storedTheme === 'dark' || (!storedTheme && isSystemDark)) {
      isDark = true;
      document.documentElement.classList.add('dark');
    } else {
      isDark = false;
      document.documentElement.classList.remove('dark');
    }
  });

  function toggleLanguage() {}

  function toggleMode() {
    isDark = !isDark;
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
</script>

<div class="min-h-screen bg-zinc-50 px-4 py-16 transition-colors duration-300 sm:px-8 dark:bg-zinc-900">
  <div class="mx-auto flex max-w-4xl flex-col gap-6">
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Stride Editor</h2>
        <p class="mt-1 text-zinc-500">Faculty drafting area</p>
      </div>

      <div class="flex gap-2">
        <Button onclick={toggleLanguage} variant="outline" size="icon">
          <LanguagesIcon class="h-[1.2rem] w-[1.2rem]" />
          <span class="sr-only">Toggle language</span>
        </Button>
        <Button onclick={toggleMode} variant="outline" size="icon" class="relative">
          <SunIcon class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <MoonIcon
            class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
          />
          <span class="sr-only">Toggle theme</span>
        </Button>
      </div>
    </div>

    <Tiptap initialContent={content} onUpdate={(html) => (content = html)} />
  </div>
</div>
