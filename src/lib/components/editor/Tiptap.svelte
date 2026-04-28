<script lang="ts">
  import { Editor, Extension } from '@tiptap/core';
  import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
  import Document from '@tiptap/extension-document';
  import History from '@tiptap/extension-history';
  import Paragraph from '@tiptap/extension-paragraph';
  import Text from '@tiptap/extension-text';
  import { common, createLowlight } from 'lowlight';
  import { onDestroy, onMount } from 'svelte';

  // ✅ Svelte 5 props
  let { initialContent = '', language = 'cpp', onUpdate, editable = true } = $props();

  let element: HTMLElement;

  // ✅ Svelte 5 state
  let editor = $state<Editor | null>(null);

  const lowlight = createLowlight(common);

  const IDEHelper = Extension.create({
    name: 'ideHelper',
    addKeyboardShortcuts() {
      const insertPair = (pair: string) => () => {
        const pos = this.editor.state.selection.from;
        this.editor
          .chain()
          .insertContent(pair)
          .setTextSelection(pos + 1)
          .run();
        return true;
      };

      return {
        Tab: () => {
          this.editor.commands.insertContent('  ');
          return true;
        },

        '(': insertPair('()'),
        '[': insertPair('[]'),
        '{': insertPair('{}'),
        '"': insertPair('""'),
        "'": insertPair("''"),

        Enter: () => {
          if (!this.editor.isActive('codeBlock')) return false;

          const { state } = this.editor;
          const fromPos = state.selection.$from;

          const textNode = fromPos.nodeBefore;
          let leadingSpace = '';

          if (textNode && textNode.isText) {
            const text = textNode.text || '';
            const lines = text.split('\n');
            const currentLine = lines[lines.length - 1];

            const match = currentLine.match(/^\s*/);
            if (match) leadingSpace = match[0];

            if (/[{[(]\s*$/.test(currentLine)) {
              leadingSpace += '  ';
            }
          }

          this.editor
            .chain()
            .insertContent('\n' + leadingSpace)
            .run();
          return true;
        },
      };
    },
  });

  onMount(() => {
    editor = new Editor({
      element,
      editable, // ✅ IMPORTANT
      autofocus: 'end',

      editorProps: {
        attributes: {
          spellcheck: 'false',
          class: 'focus:outline-none min-h-full font-mono text-sm leading-relaxed',
        },
      },

      extensions: [Document, Paragraph, Text, History, CodeBlockLowlight.configure({ lowlight }), IDEHelper],

      content: `<pre><code class="language-${language}">${initialContent}</code></pre>`,

      onUpdate: ({ editor: e }) => {
        if (!e.isActive('codeBlock')) {
          e.commands.setCodeBlock({ language });
        }

        onUpdate?.(e.getText());
      },

      onSelectionUpdate: ({ editor: e }) => {
        if (!e.isActive('codeBlock')) {
          e.commands.setCodeBlock({ language });
        }
      },
    });
  });

  // ✅ reactive sync for Svelte 5 props change
  $effect(() => {
    if (editor) {
      editor.setEditable(editable);
      editor.commands.setCodeBlock({ language });
    }
  });

  onDestroy(() => {
    editor?.destroy();
  });
</script>

<div class="flex h-full w-full flex-col overflow-hidden bg-[#18181b] text-zinc-100">
  <div class="flex-1 overflow-y-auto p-6">
    <div bind:this={element}></div>
  </div>
</div>
