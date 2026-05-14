<script lang="ts">
  import { Editor } from '@tiptap/core';
  import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
  import Image from '@tiptap/extension-image';
  import Link from '@tiptap/extension-link';
  import StarterKit from '@tiptap/starter-kit';
  import { common, createLowlight } from 'lowlight';
  import {
    Bold,
    Code,
    Heading1,
    Heading2,
    ImageIcon,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Quote,
    Redo,
    SquareCode,
    Strikethrough,
    Undo,
  } from 'lucide-svelte';
  import { onDestroy, onMount } from 'svelte';

  import { Button } from '$lib/components/ui/button';
  import { Separator } from '$lib/components/ui/separator';

  let { initialContent = '', onUpdate } = $props();

  let element: HTMLElement;
  let editor = $state.raw<Editor>();
  let tick = $state(0);

  const lowlight = createLowlight(common);

  function checkActive(type: string, options?: any) {
    void tick;
    return editor?.isActive(type, options);
  }

  function canUndo() {
    void tick;
    return editor?.can().undo();
  }

  function canRedo() {
    void tick;
    return editor?.can().redo();
  }

  function addImage() {
    const url = window.prompt('Enter Image URL');
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  }

  function setLink() {
    const url = window.prompt('Enter URL');
    if (url) editor?.chain().focus().setLink({ href: url }).run();
  }

  onMount(() => {
    editor = new Editor({
      element,
      extensions: [
        StarterKit.configure({
          codeBlock: false,
        }),
        CodeBlockLowlight.configure({
          lowlight,
          HTMLAttributes: {
            class: 'rounded-md p-4 bg-muted/50 font-mono text-sm overflow-x-auto my-4 border border-border shadow-sm',
          },
        }),
        Image.configure({
          HTMLAttributes: { class: 'rounded-lg border border-border max-w-full my-4 shadow-sm' },
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { class: 'text-primary underline cursor-pointer' },
        }),
      ],
      content: initialContent,
      editorProps: {
        attributes: {
          class: 'focus:outline-none prose prose-zinc dark:prose-invert max-w-none min-h-[400px] p-6',
        },
        handlePaste: (view, event) => {
          const items = event.clipboardData?.items;
          if (!items) return false;

          for (const item of items) {
            if (item.type.startsWith('image/')) {
              const file = item.getAsFile();
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  const src = e.target?.result as string;
                  editor?.chain().focus().setImage({ src }).run();
                };
                reader.readAsDataURL(file);
                return true;
              }
            }
          }
          return false;
        },
      },
      onUpdate: ({ editor: e }) => {
        const html = e.getHTML();
        if (onUpdate && html !== initialContent) onUpdate(html);
      },
      onTransaction: () => {
        tick++;
      },
    });
  });

  onDestroy(() => {
    editor?.destroy();
  });

  const btnClass = 'h-8 w-8 p-0';
</script>

<div class="flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
  {#if editor}
    <div class="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 p-1.5">
      <Button
        variant={checkActive('bold') ? 'secondary' : 'ghost'}
        size="icon"
        class={btnClass}
        onclick={() => editor?.chain().focus().toggleBold().run()}
      >
        <Bold size={16} />
      </Button>
      <Button
        variant={checkActive('italic') ? 'secondary' : 'ghost'}
        size="icon"
        class={btnClass}
        onclick={() => editor?.chain().focus().toggleItalic().run()}
      >
        <Italic size={16} />
      </Button>
      <Button
        variant={checkActive('strike') ? 'secondary' : 'ghost'}
        size="icon"
        class={btnClass}
        onclick={() => editor?.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={16} />
      </Button>
      <Button
        variant={checkActive('code') ? 'secondary' : 'ghost'}
        size="icon"
        class={btnClass}
        onclick={() => editor?.chain().focus().toggleCode().run()}
      >
        <Code size={16} />
      </Button>

      <Separator orientation="vertical" class="mx-1 h-6" />

      <Button
        variant={checkActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
        size="icon"
        class={btnClass}
        onclick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 size={16} />
      </Button>
      <Button
        variant={checkActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
        size="icon"
        class={btnClass}
        onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={16} />
      </Button>
      <Button
        variant={checkActive('bulletList') ? 'secondary' : 'ghost'}
        size="icon"
        class={btnClass}
        onclick={() => editor?.chain().focus().toggleBulletList().run()}
      >
        <List size={16} />
      </Button>
      <Button
        variant={checkActive('orderedList') ? 'secondary' : 'ghost'}
        size="icon"
        class={btnClass}
        onclick={() => editor?.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={16} />
      </Button>

      <Separator orientation="vertical" class="mx-1 h-6" />

      <Button
        variant={checkActive('blockquote') ? 'secondary' : 'ghost'}
        size="icon"
        class={btnClass}
        onclick={() => editor?.chain().focus().toggleBlockquote().run()}
      >
        <Quote size={16} />
      </Button>
      <Button variant="ghost" size="icon" class={btnClass} onclick={addImage}>
        <ImageIcon size={16} />
      </Button>
      <Button variant={checkActive('link') ? 'secondary' : 'ghost'} size="icon" class={btnClass} onclick={setLink}>
        <LinkIcon size={16} />
      </Button>
      <Button
        variant={checkActive('codeBlock') ? 'secondary' : 'ghost'}
        size="icon"
        class={btnClass}
        onclick={() => editor?.chain().focus().toggleCodeBlock().run()}
      >
        <SquareCode size={16} />
      </Button>

      <div class="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          class={btnClass}
          onclick={() => editor?.chain().focus().undo().run()}
          disabled={!canUndo()}
        >
          <Undo size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class={btnClass}
          onclick={() => editor?.chain().focus().redo().run()}
          disabled={!canRedo()}
        >
          <Redo size={16} />
        </Button>
      </div>
    </div>
  {/if}

  <div bind:this={element} class="bg-background"></div>
</div>

<style>
  /* Force Tailwind Prose to drop its hardcoded white text and obey Shadcn */
  :global(.tiptap pre) {
    background-color: hsl(var(--muted) / 0.5) !important;
    color: hsl(var(--foreground)) !important;
  }

  :global(.tiptap pre code) {
    background: transparent !important;
    color: inherit !important;
  }

  /* Syntax Highlighting Colors */
  :global(.hljs-keyword),
  :global(.hljs-operator),
  :global(.hljs-selector-tag),
  :global(.hljs-type),
  :global(.hljs-built_in) {
    color: hsl(var(--primary));
    font-weight: 600;
  }

  :global(.hljs-string),
  :global(.hljs-regexp),
  :global(.hljs-literal),
  :global(.hljs-symbol) {
    color: hsl(var(--chart-1, var(--primary)));
  }

  :global(.hljs-number),
  :global(.hljs-boolean) {
    color: hsl(var(--chart-2, var(--destructive)));
  }

  :global(.hljs-title),
  :global(.hljs-title.function_),
  :global(.hljs-title.class_),
  :global(.hljs-attr),
  :global(.hljs-property) {
    color: hsl(var(--chart-3, var(--ring)));
  }

  :global(.hljs-comment),
  :global(.hljs-meta) {
    color: hsl(var(--muted-foreground));
    font-style: italic;
  }

  :global(.hljs-tag),
  :global(.hljs-name) {
    color: hsl(var(--chart-4, var(--accent-foreground)));
  }
</style>
