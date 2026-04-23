<script lang="ts">
  import { Editor } from '@tiptap/core';
  import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
  import StarterKit from '@tiptap/starter-kit';
  import { common, createLowlight } from 'lowlight';
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

  // Initialize lowlight with common languages (JS, TS, Python, C++, etc.)
  const lowlight = createLowlight(common);

  function checkActive(type: string, options?: any) {
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
      autofocus: 'end',
      extensions: [
        StarterKit.configure({
          codeBlock: false, // Turn off the default code block
        }),
        CodeBlockLowlight.configure({
          lowlight, // Use our syntax-highlighted version
        }),
      ],
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
    'p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400';
  const activeClass = 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold';
</script>

<div class="flex h-full w-full flex-col overflow-hidden bg-white dark:bg-zinc-950">
  {#if editor}
    <div
      class="flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-zinc-50/50 p-2 dark:border-zinc-800 dark:bg-zinc-900/50"
    >
      <button
        onclick={() => editor?.chain().focus().toggleBold().run()}
        class="{btnClass} {checkActive('bold') ? activeClass : ''}"
      >
        <Bold size={16} />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleItalic().run()}
        class="{btnClass} {checkActive('italic') ? activeClass : ''}"
      >
        <Italic size={16} />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleStrike().run()}
        class="{btnClass} {checkActive('strike') ? activeClass : ''}"
      >
        <Strikethrough size={16} />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleCode().run()}
        class="{btnClass} {checkActive('code') ? activeClass : ''}"
      >
        <Code size={16} />
      </button>

      <div class="mx-1 h-5 w-px bg-zinc-300 dark:bg-zinc-700"></div>

      <button
        onclick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        class="{btnClass} {checkActive('heading', { level: 1 }) ? activeClass : ''}"
      >
        <Heading1 size={16} />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        class="{btnClass} {checkActive('heading', { level: 2 }) ? activeClass : ''}"
      >
        <Heading2 size={16} />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleBulletList().run()}
        class="{btnClass} {checkActive('bulletList') ? activeClass : ''}"
      >
        <List size={16} />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleOrderedList().run()}
        class="{btnClass} {checkActive('orderedList') ? activeClass : ''}"
      >
        <ListOrdered size={16} />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleBlockquote().run()}
        class="{btnClass} {checkActive('blockquote') ? activeClass : ''}"
      >
        <Quote size={16} />
      </button>
      <button
        onclick={() => editor?.chain().focus().toggleCodeBlock().run()}
        class="{btnClass} {checkActive('codeBlock') ? activeClass : ''}"
      >
        <SquareCode size={16} />
      </button>

      <div class="mx-1 h-5 w-px bg-zinc-300 dark:bg-zinc-700"></div>

      <button
        onclick={() => editor?.chain().focus().undo().run()}
        disabled={!checkUndo()}
        class="{btnClass} disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Undo size={16} />
      </button>
      <button
        onclick={() => editor?.chain().focus().redo().run()}
        disabled={!checkRedo()}
        class="{btnClass} disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Redo size={16} />
      </button>
    </div>
  {/if}

  <div class="flex-1 cursor-text overflow-y-auto p-6" onclick={() => editor?.chain().focus().run()}>
    <div bind:this={element} class="prose min-h-full max-w-none prose-zinc focus:outline-none dark:prose-invert"></div>
  </div>
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

  /* IDE Syntax Highlighting Tokens (GitHub Dark style) */
  :global(.hljs-keyword),
  :global(.hljs-operator),
  :global(.hljs-pattern-match) {
    color: #f97583;
  }
  :global(.hljs-function),
  :global(.hljs-title) {
    color: #b392f0;
  }
  :global(.hljs-string),
  :global(.hljs-meta .hljs-string) {
    color: #9ecbff;
  }
  :global(.hljs-built_in),
  :global(.hljs-type) {
    color: #79b8ff;
  }
  :global(.hljs-number),
  :global(.hljs-symbol) {
    color: #fce6f3;
  }
  :global(.hljs-comment) {
    color: #6a737d;
    font-style: italic;
  }
</style>
