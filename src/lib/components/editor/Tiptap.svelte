<script lang="ts">
  import { Editor, Extension } from '@tiptap/core';
  import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
  import Document from '@tiptap/extension-document';
  import History from '@tiptap/extension-history';
  import Paragraph from '@tiptap/extension-paragraph';
  import Text from '@tiptap/extension-text';
  import { common, createLowlight } from 'lowlight';
  import { onDestroy, onMount } from 'svelte';

  let { initialContent = '', language = 'cpp', onUpdate } = $props();

  let element: HTMLElement;
  let editor = $state.raw<Editor>();
  const lowlight = createLowlight(common);

  // Upgrade to a full IDE Helper Extension
  const IDEHelper = Extension.create({
    name: 'ideHelper',
    addKeyboardShortcuts() {
      // Helper to insert a pair like "{}" and put cursor in the middle
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
        // 1. Maintain Tab for spacing
        Tab: () => {
          this.editor.commands.insertContent('  ');
          return true;
        },

        // 2. Auto-close brackets and quotes
        '(': insertPair('()'),
        '[': insertPair('[]'),
        '{': insertPair('{}'),
        '"': insertPair('""'),
        "'": insertPair("''"),

        // 3. Smart Enter (Auto-indentation)
        // 3. Smart Enter (Auto-indentation)
        Enter: () => {
          if (!this.editor.isActive('codeBlock')) return false;

          const { state } = this.editor;

          // FIX: Access the property directly without destructuring it to a $ variable
          const fromPos = state.selection.$from;

          // Get the text right before the cursor
          const textNode = fromPos.nodeBefore;
          let leadingSpace = '';

          if (textNode && textNode.isText) {
            const text = textNode.text || '';
            const lines = text.split('\n');
            const currentLine = lines[lines.length - 1];

            const match = currentLine.match(/^\s*/);
            if (match) leadingSpace = match[0];

            if (/[{\[(]\s*$/.test(currentLine)) {
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
      element: element,
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
        if (onUpdate) onUpdate(e.getText());
      },

      onSelectionUpdate: ({ editor: e }) => {
        if (!e.isActive('codeBlock')) {
          e.commands.setCodeBlock({ language });
        }
      },
    });
  });

  onDestroy(() => {
    if (editor) editor.destroy();
  });
</script>

<div class="flex h-full w-full flex-col overflow-hidden bg-[#18181b] text-zinc-100">
  <div class="flex-1 cursor-text overflow-y-auto p-6" onclick={() => editor?.chain().focus().run()}>
    <div bind:this={element}></div>
  </div>
</div>
