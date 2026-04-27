<script lang="ts">
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import {
    Bold,
    Code,
    Heading1,
    Heading2,
    Italic,
    List,
    ListOrdered,
    Quote,
    Redo,
    SquareCode,
    Strikethrough,
    Undo,
  } from 'lucide-svelte';
  import { onDestroy, onMount } from 'svelte';

  let { initialContent = '', onUpdate } = $props();

  let element: HTMLElement;
  let editor = $state.raw<Editor>();
  let tick = $state(0);

  function checkActive(type: string, options?: Record<string, unknown>) {
    void tick;
    return editor?.isActive(type, options);
  }

  function checkUndo() {
    void tick;
    return editor?.can().undo();
  }

  function checkRedo() {
    void tick;
    return editor?.can().redo();
  }

  onMount(() => {
    editor = new Editor({
      element: element,
      extensions: [StarterKit],
      content: initialContent,
      onUpdate: ({ editor: e }) => {
        if (onUpdate) onUpdate(e.getHTML());
      },
      onTransaction: () => {
        tick++;
      },
    });
  });

  onDestroy(() => {
    if (editor) editor.destroy();
  });

  const btnClass =
    'p-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400';
  const activeClass = 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold';
</script>

<div
  class="flex w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
>
  {#if editor}
    <div
      class="flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-zinc-50/50 p-2 dark:border-zinc-800 dark:bg-zinc-900/50"
    >
      <button
        onclick={() => editor?.chain().focus().toggleBold().run()}
        class="{btnClass} {checkActive('bold') ? activeClass : ''}"
      >
        <Bold size={18} />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleItalic().run()}
        class="{btnClass} {checkActive('italic') ? activeClass : ''}"
      >
        <Italic size={18} />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleStrike().run()}
        class="{btnClass} {checkActive('strike') ? activeClass : ''}"
      >
        <Strikethrough size={18} />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleCode().run()}
        class="{btnClass} {checkActive('code') ? activeClass : ''}"
      >
        <Code size={18} />
      </button>

      <div class="mx-2 h-6 w-px bg-zinc-300 dark:bg-zinc-700"></div>

      <button
        onclick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        class="{btnClass} {checkActive('heading', { level: 1 }) ? activeClass : ''}"
      >
        <Heading1 size={18} />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        class="{btnClass} {checkActive('heading', { level: 2 }) ? activeClass : ''}"
      >
        <Heading2 size={18} />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleBulletList().run()}
        class="{btnClass} {checkActive('bulletList') ? activeClass : ''}"
      >
        <List size={18} />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleOrderedList().run()}
        class="{btnClass} {checkActive('orderedList') ? activeClass : ''}"
      >
        <ListOrdered size={18} />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleBlockquote().run()}
        class="{btnClass} {checkActive('blockquote') ? activeClass : ''}"
      >
        <Quote size={18} />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleCodeBlock().run()}
        class="{btnClass} {checkActive('codeBlock') ? activeClass : ''}"
      >
        <SquareCode size={18} />
      </button>

      <div class="mx-2 h-6 w-px bg-zinc-300 dark:bg-zinc-700"></div>

      <button
        onclick={() => editor?.chain().focus().undo().run()}
        disabled={!checkUndo()}
        class="{btnClass} disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Undo size={18} />
      </button>
      <button
        onclick={() => editor?.chain().focus().redo().run()}
        disabled={!checkRedo()}
        class="{btnClass} disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Redo size={18} />
      </button>
    </div>
  {/if}

  <div
    bind:this={element}
    class="prose min-h-[400px] max-w-none p-6 prose-zinc focus:outline-none dark:prose-invert"
  ></div>
</div>

<style>
  :global(.tiptap:focus) {
    outline: none !important;
  }

  :global(.tiptap pre) {
    background: #18181b;
    color: #f4f4f5;
    padding: 1rem;
    border-radius: 0.5rem;
    font-family: 'JetBrains Mono', monospace;
  }

  :global(.tiptap pre code) {
    background: transparent;
    padding: 0;
    color: inherit;
  }
</style>
