<script lang="ts">
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import type { CarouselAPI } from '$lib/components/ui/carousel/context.js';
  import * as Carousel from '$lib/components/ui/carousel/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Pagination from '$lib/components/ui/pagination/index.js';
  import * as Resizable from '$lib/components/ui/resizable/index.js';
  import * as Sheet from '$lib/components/ui/sheet/index.js';

  let api = $state<CarouselAPI>();
  let current = $state(0);
  const count = $derived(api ? api.scrollSnapList().length : 0);

  $effect(() => {
    if (api) {
      current = api.selectedScrollSnap() + 1;
      api.on('select', () => {
        current = api!.selectedScrollSnap() + 1;
      });
    }
  });
</script>

<Resizable.PaneGroup direction="horizontal" class="h-full w-full rounded-lg border">
  <!-- LEFT SIDE -->
  <Resizable.Pane defaultSize={75}>
    <Resizable.PaneGroup direction="vertical" class="h-full">
      <Resizable.Pane defaultSize={50}>
        <div class="flex h-full items-center justify-center p-6">
          <span class="font-semibold">Student's Code</span>
        </div>
      </Resizable.Pane>

      <Resizable.Handle />

      <Resizable.Pane defaultSize={50}>
        <!-- justify-center centers the group horizontally; gap-20 pushes them apart -->
        <div class="flex h-full items-center justify-center gap-20 p-6">
          <!-- Carousel Section (Left) -->
          <!-- Reduced max-width slightly to balance the layout -->
          <div class="w-full max-w-2xl px-12">
            <Carousel.Root setApi={(emblaApi) => (api = emblaApi)} class="w-full">
              <Carousel.Content>
                {#each [0, 1, 2, 3, 4] as i (i)}
                  <Carousel.Item class="basis-full">
                    <Card.Root>
                      <Card.Content class="flex h-80 items-center justify-center p-6">
                        <span class="text-4xl font-semibold">{i + 1}</span>
                      </Card.Content>
                    </Card.Root>
                  </Carousel.Item>
                {/each}
              </Carousel.Content>
              <Carousel.Previous />
              <Carousel.Next />
            </Carousel.Root>

            <div class="py-2 text-center text-sm text-muted-foreground">
              Screenshots {current} of {count}
            </div>
          </div>

          <!-- Search & Pagination Section (Right) -->
          <!-- Removed -mt-66 to keep it centered with the carousel -->
          <div class="flex flex-col items-center gap-10">
            <!-- Search Bar -->
            <div class="flex w-full max-w-lg items-center gap-3">
              <Input type="text" placeholder="Enter Student ID" class="h-12 text-lg" />
              <Button type="submit" variant="outline" class="h-12 px-6 text-lg">Search</Button>
            </div>

            <!-- Pagination -->
            <div class="origin-center scale-125">
              <Pagination.Root count={30} page={2}>
                {#snippet children({ pages, currentPage })}
                  <Pagination.Content>
                    <Pagination.Item><Pagination.PrevButton /></Pagination.Item>
                    {#each pages as page (page.key)}
                      {#if page.type === 'ellipsis'}
                        <Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
                      {:else}
                        <Pagination.Item>
                          <Pagination.Link {page} isActive={currentPage === page.value}>
                            {page.value}
                          </Pagination.Link>
                        </Pagination.Item>
                      {/if}
                    {/each}
                    <Pagination.Item><Pagination.NextButton /></Pagination.Item>
                  </Pagination.Content>
                {/snippet}
              </Pagination.Root>
            </div>
            <div>
              <Button type="submit" variant="outline" class="h-12 px-6 text-lg">Previous Student</Button>
              <Button type="submit" variant="outline" class="h-12 px-6 text-lg">Next Student</Button>
            </div>

            <Sheet.Root>
              <!-- Added h-14, w-64, and text-xl for a much larger button -->
              <Sheet.Trigger class={buttonVariants({ variant: 'outline' }) + ' h-14 w-64 text-xl font-bold'}>
                Grade Student
              </Sheet.Trigger>

              <Sheet.Content side="right">
                <Sheet.Header>
                  <Sheet.Title>Grade Student</Sheet.Title>
                  <Sheet.Description>Enter the grades for the selected student below.</Sheet.Description>
                </Sheet.Header>

                <div class="grid flex-1 auto-rows-min gap-6 px-4 py-6">
                  <div class="grid gap-3">
                    <Label for="name">Student Name</Label>
                    <Input id="name" value="Pedro Duarte" />
                  </div>
                  <div class="grid gap-3">
                    <Label for="grade">Grade</Label>
                    <Input id="grade" placeholder="Enter grade..." />
                  </div>
                </div>

                <Sheet.Footer>
                  <Button type="submit">Submit Grade</Button>
                  <Sheet.Close class={buttonVariants({ variant: 'outline' })}>Cancel</Sheet.Close>
                </Sheet.Footer>
              </Sheet.Content>
            </Sheet.Root>
          </div>
        </div>
      </Resizable.Pane>
    </Resizable.PaneGroup>
  </Resizable.Pane>

  <Resizable.Handle />

  <!-- RIGHT SIDE -->
  <Resizable.Pane defaultSize={25}>
    <Resizable.PaneGroup direction="vertical" class="h-full">
      <Resizable.Pane defaultSize={25}>
        <div class="flex h-full items-center justify-center p-6">
          <span class="font-semibold">Source of the Code</span>
        </div>
      </Resizable.Pane>

      <Resizable.Handle />
    </Resizable.PaneGroup>
  </Resizable.Pane>
</Resizable.PaneGroup>
