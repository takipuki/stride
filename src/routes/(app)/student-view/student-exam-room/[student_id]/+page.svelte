<script lang="ts">
  import Archive from '@lucide/svelte/icons/archive';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import CalendarPlus from '@lucide/svelte/icons/calendar-plus';
  import Clock from '@lucide/svelte/icons/clock';
  import ListFilter from '@lucide/svelte/icons/list-filter';
  import MailCheck from '@lucide/svelte/icons/mail-check';
  import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
  import Tag from '@lucide/svelte/icons/tag';
  import Trash2 from '@lucide/svelte/icons/trash-2';

  import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import * as Resizable from '$lib/components/ui/resizable/index.js';

  let label = $state('personal');

  let { data } = $props();

  const studentId = data.student_id;

  //  console.log(studentId);
</script>

<div class="page-wrapper">
  <!-- <h1>Student ID: {studentId}</h1> -->

  <Resizable.PaneGroup direction="horizontal" class="h-full w-full rounded-lg border">
    <Resizable.Pane defaultSize={50}>
      <div class="flex h-full items-center justify-center p-6">
        <span class="font-semibold">Tiptap</span>
      </div>
    </Resizable.Pane>

    <Resizable.Handle />

    <Resizable.Pane defaultSize={50}>
      <Resizable.PaneGroup direction="vertical" class="h-full">
        <Resizable.Pane defaultSize={55}>
          <div class="flex h-full items-center justify-center p-6">
            <span class="font-semibold">Question-viewer</span>
          </div>
        </Resizable.Pane>

        <Resizable.Handle />

        <Resizable.Pane defaultSize={75}>
          <div class="h-full w-full">
            <Resizable.PaneGroup direction="vertical" class="h-full w-full">
              <!-- THREE - A (15%) -->
              <Resizable.Pane defaultSize={25} minSize={10} maxSize={30}>
                <div class="flex h-full items-center justify-center border-b p-4">
                  <span class="font-semibold"
                    ><ButtonGroup.Root class="flex flex-wrap gap-2">
                      <!-- Back -->
                      <Button variant="outline" size="icon-sm" aria-label="Go Back">
                        <ArrowLeft />
                      </Button>

                      <!-- Main actions -->
                      <Button variant="outline" size="sm">Archive</Button>
                      <Button variant="outline" size="sm">Report</Button>
                      <Button variant="outline" size="sm">Snooze</Button>

                      <!-- Dropdown -->
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                          {#snippet child({ props })}
                            <Button {...props} variant="outline" size="icon-sm">
                              <MoreHorizontal />
                            </Button>
                          {/snippet}
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Content align="end" class="w-52">
                          <DropdownMenu.Group>
                            <DropdownMenu.Item>
                              <MailCheck />
                              Mark as Read
                            </DropdownMenu.Item>

                            <DropdownMenu.Item>
                              <Archive />
                              Archive
                            </DropdownMenu.Item>
                          </DropdownMenu.Group>

                          <DropdownMenu.Separator />

                          <DropdownMenu.Group>
                            <DropdownMenu.Item>
                              <Clock />
                              Snooze
                            </DropdownMenu.Item>

                            <DropdownMenu.Item>
                              <CalendarPlus />
                              Add to Calendar
                            </DropdownMenu.Item>

                            <DropdownMenu.Item>
                              <ListFilter />
                              Add to List
                            </DropdownMenu.Item>

                            <DropdownMenu.Sub>
                              <DropdownMenu.SubTrigger>
                                <Tag />
                                Label As...
                              </DropdownMenu.SubTrigger>

                              <DropdownMenu.SubContent>
                                <DropdownMenu.RadioGroup bind:value={label}>
                                  <DropdownMenu.RadioItem value="personal">Personal</DropdownMenu.RadioItem>

                                  <DropdownMenu.RadioItem value="work">Work</DropdownMenu.RadioItem>

                                  <DropdownMenu.RadioItem value="other">Other</DropdownMenu.RadioItem>
                                </DropdownMenu.RadioGroup>
                              </DropdownMenu.SubContent>
                            </DropdownMenu.Sub>
                          </DropdownMenu.Group>

                          <DropdownMenu.Separator />

                          <DropdownMenu.Group>
                            <DropdownMenu.Item class="text-destructive focus:text-destructive">
                              <Trash2 />
                              Trash
                            </DropdownMenu.Item>
                          </DropdownMenu.Group>
                        </DropdownMenu.Content>
                      </DropdownMenu.Root>

                      <Button variant="outline" size="sm">1</Button>
                      <Button variant="outline" size="sm">2</Button>
                      <Button variant="outline" size="sm">3</Button>
                      <Button variant="outline" size="sm">4</Button>
                      <Button variant="outline" size="sm">5</Button>

                      <Button variant="outline" size="icon-sm" aria-label="Previous">
                        <ArrowLeft />
                      </Button>
                      <Button variant="outline" size="icon-sm" aria-label="Next">
                        <ArrowRight />
                      </Button>
                    </ButtonGroup.Root></span
                  >
                </div>
              </Resizable.Pane>

              <Resizable.Handle />

              <!-- THREE - B (rest 85%) -->
              <Resizable.Pane defaultSize={85}>
                <Resizable.PaneGroup direction="horizontal" class="h-full w-full">
                  <Resizable.Pane defaultSize={50}>
                    <div class="flex h-full items-center justify-center p-6">
                      <span class="font-semibold">Input</span>
                    </div>
                  </Resizable.Pane>

                  <Resizable.Handle />

                  <Resizable.Pane defaultSize={50}>
                    <div class="flex h-full items-center justify-center p-6">
                      <span class="font-semibold">Output</span>
                    </div>
                  </Resizable.Pane>
                </Resizable.PaneGroup>
              </Resizable.Pane>
            </Resizable.PaneGroup>
          </div>
        </Resizable.Pane>
      </Resizable.PaneGroup>
    </Resizable.Pane>
  </Resizable.PaneGroup>
</div>

<style>
  .page-wrapper {
    height: 100%;
    width: 100%;
    flex: 1;
    display: flex;
  }
</style>
