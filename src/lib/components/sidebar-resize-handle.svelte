<script lang="ts">
  import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
  import { cn } from '$lib/utils.js';

  const sidebar = useSidebar();

  const MIN_WIDTH = 200;
  const MAX_WIDTH = 480;
  const COLLAPSED_THRESHOLD = 140;

  let isDragging = $state(false);

  function onPointerDown(e: PointerEvent) {
    // Only left mouse button
    if (e.button !== 0) return;
    if (sidebar.isMobile) return;

    e.preventDefault();
    isDragging = true;

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const wrapper = target.closest('[data-slot="sidebar-wrapper"]') as HTMLElement | null;
    if (!wrapper) return;

    function onPointerMove(ev: PointerEvent) {
      const newWidth = ev.clientX;
      if (newWidth < COLLAPSED_THRESHOLD) {
        sidebar.setOpen(false);
      } else {
        if (!sidebar.open) sidebar.setOpen(true);
        const clamped = Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH);
        wrapper!.style.setProperty('--sidebar-width', `${clamped}px`);
      }
    }

    function onPointerUp() {
      isDragging = false;
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    }

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  }
</script>

<div
  data-slot="sidebar-resize-handle"
  class={cn(
    'absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex',
    'after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border',
    'cursor-col-resize select-none',
    'group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar',
    '[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
    '[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
    isDragging && 'after:w-[3px] after:bg-sidebar-primary',
  )}
  ondblclick={sidebar.toggle}
  onpointerdown={onPointerDown}
  role="separator"
  aria-orientation="vertical"
  aria-label="Resize sidebar"
></div>
