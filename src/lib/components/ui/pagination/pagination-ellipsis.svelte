<script lang="ts">
  import DotsThreeIcon from 'phosphor-svelte/lib/DotsThree';
  import type { HTMLAttributes } from 'svelte/elements';

  import { cn, type WithElementRef, type WithoutChildren } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> = $props();
</script>

<span
  bind:this={ref}
  aria-hidden="true"
  data-slot="pagination-ellipsis"
  class={cn(
    "flex size-7 items-center items-center justify-center justify-center [&_svg:not([class*='size-'])]:size-3.5",
    className,
  )}
  {...restProps}
>
  <DotsThreeIcon />
  <span class="sr-only">More pages</span>
</span>
