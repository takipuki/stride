<script lang="ts">
  import { acceptCompletion } from '@codemirror/autocomplete';
  import { indentLess, indentMore, indentWithTab, insertTab } from '@codemirror/commands';
  import { cpp } from '@codemirror/lang-cpp';
  import { java } from '@codemirror/lang-java';
  import { javascript } from '@codemirror/lang-javascript';
  import { python } from '@codemirror/lang-python';
  import { Compartment, EditorState } from '@codemirror/state';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { EditorView, keymap } from '@codemirror/view';
  import { basicSetup } from 'codemirror';
  import Moon from 'lucide-svelte/icons/moon';
  import Sun from 'lucide-svelte/icons/sun';
  import { onDestroy, onMount } from 'svelte';

  import { Button } from '$lib/components/ui/button';

  let { initialContent = '', language = 'cpp', onUpdate, editable = true } = $props();

  let element: HTMLElement;
  let view: EditorView;

  let languageConf = new Compartment();
  let editableConf = new Compartment();
  let themeConf = new Compartment();

  let isEditorDark = $state(true);

  function getLanguageExtension(lang: string) {
    if (!lang) return [];
    const l = lang.toLowerCase();
    if (l.includes('c++') || l.includes('cpp') || l === 'c') return cpp();
    if (l.includes('python')) return python();
    if (l.includes('java') && !l.includes('script')) return java();
    if (l.includes('js') || l.includes('javascript') || l.includes('ts')) return javascript();
    return [];
  }

  const baseTheme = EditorView.theme({
    '&': { height: '100%' },
    '.cm-scroller': { overflow: 'auto', fontFamily: "'JetBrains Mono', monospace, sans-serif" },
  });

  onMount(() => {
    let state = EditorState.create({
      doc: initialContent,
      extensions: [
        basicSetup,
        baseTheme,
        keymap.of([
          {
            key: 'Tab',
            run: (view) => {
              // 1. If the autocomplete menu is open, accept the suggestion
              if (acceptCompletion(view)) return true;

              // 2. If no text is selected, insert a tab/spaces at the cursor
              if (view.state.selection.main.empty) {
                return insertTab(view);
              }

              // 3. If text is selected, indent the whole block (standard IDE behavior)
              return indentMore(view);
            },
            shift: indentLess, // Shift+Tab always indents less
          },
        ]),
        themeConf.of(isEditorDark ? oneDark : []),
        languageConf.of(getLanguageExtension(language)),
        editableConf.of(EditorView.editable.of(editable)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && onUpdate) {
            onUpdate(update.state.doc.toString());
          }
        }),
      ],
    });

    view = new EditorView({
      state,
      parent: element,
    });
  });

  $effect(() => {
    if (view) {
      view.dispatch({
        effects: [
          languageConf.reconfigure(getLanguageExtension(language)),
          editableConf.reconfigure(EditorView.editable.of(editable)),
          themeConf.reconfigure(isEditorDark ? oneDark : []),
        ],
      });
    }
  });

  onDestroy(() => {
    if (view) view.destroy();
  });
</script>

<div class="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border shadow-sm">
  <div class="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5">
    <span class="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
      {language || 'Code Editor'}
    </span>
    <Button
      variant="ghost"
      size="sm"
      class="h-6 w-6 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
      onclick={() => (isEditorDark = !isEditorDark)}
    >
      {#if isEditorDark}
        <Sun class="h-3.5 w-3.5" />
      {:else}
        <Moon class="h-3.5 w-3.5" />
      {/if}
      <span class="sr-only">Toggle Editor Theme</span>
    </Button>
  </div>

  <div class="flex-1 overflow-hidden" bind:this={element}></div>
</div>

<style>
  :global(.cm-editor.cm-focused) {
    outline: none !important;
  }
</style>
