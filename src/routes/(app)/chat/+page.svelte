<script lang="ts">
  import { Send } from '@lucide/svelte';
  import MoreVertical from '@lucide/svelte/icons/more-vertical';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Trash from '@lucide/svelte/icons/trash';
  import { useConvexClient, useQuery } from 'convex-svelte';

  import { api } from '$convex/_generated/api.js';
  import type { Doc, Id } from '$convex/_generated/dataModel';

  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import * as Resizable from '$lib/components/ui/resizable/index.js';
  import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { session } from '$lib/session';
  import { cn } from '$lib/utils';

  const client = useConvexClient();
  let selectedChatId = $state<Id<'chats'> | null>(null);
  let newMessage = $state('');
  let viewportRef = $state<HTMLElement | null>(null);

  let editingMessageId = $state<Id<'messages'> | null>(null);
  let editingContent = $state('');

  const chatsQuery = useQuery(api.chats.listByUser, () => ($session?.userId ? { userId: $session.userId } : 'skip'));

  const messagesQuery = useQuery(api.messages.listWithSender, () =>
    selectedChatId ? { chatId: selectedChatId } : 'skip',
  );

  async function sendMessage() {
    if (!newMessage.trim() || !selectedChatId || !$session?.userId) return;
    const content = newMessage;
    newMessage = '';
    await client.mutation(api.messages.send, {
      chatId: selectedChatId,
      senderId: $session.userId,
      content,
    });
  }

  function startEditing(
    msg:
      | (Doc<'messages'> & { senderName: string; senderAvatar: string | null })
      | NonNullable<typeof messagesQuery.data>[number],
  ) {
    editingMessageId = msg._id;
    editingContent = msg.content;
  }

  function cancelEditing() {
    editingMessageId = null;
    editingContent = '';
  }

  async function saveEdit() {
    if (!editingMessageId || !editingContent.trim()) return;
    await client.mutation(api.messages.edit, { id: editingMessageId, content: editingContent });
    editingMessageId = null;
    editingContent = '';
  }

  async function deleteMessage(id: Id<'messages'>) {
    await client.mutation(api.messages.remove, { id });
  }

  const selectedChat = $derived(chatsQuery.data?.find((c) => c?._id === selectedChatId));

  $effect(() => {
    if (messagesQuery.data && viewportRef) {
      setTimeout(() => {
        viewportRef?.scrollTo({
          top: viewportRef.scrollHeight,
          behavior: 'smooth',
        });
      }, 50);
    }
  });

  function formatTime(timestamp: number) {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="flex h-full w-full flex-1 overflow-hidden rounded-xl border bg-background shadow-sm">
  <Resizable.PaneGroup direction="horizontal" class="h-full w-full">
    <!-- Chat List -->
    <Resizable.Pane defaultSize={30} minSize={20} maxSize={40} class="flex flex-col border-r bg-muted/10">
      <div class="p-4">
        <h2 class="text-xl font-bold tracking-tight">Chats</h2>
      </div>
      <Separator />
      <ScrollArea class="flex-1">
        <div class="flex flex-col gap-1 p-2">
          {#if chatsQuery.isLoading}
            <div class="p-4 text-center text-sm text-muted-foreground">Loading chats...</div>
          {:else if chatsQuery.data?.length === 0}
            <div class="p-4 text-center text-sm text-muted-foreground">No chats found</div>
          {:else}
            {#each chatsQuery.data ?? [] as chat (chat?._id)}
              {#if chat}
                <button
                  onclick={() => (selectedChatId = chat._id)}
                  class={cn(
                    'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all duration-200 hover:bg-muted/50',
                    selectedChatId === chat._id && 'bg-primary/10 hover:bg-primary/15',
                  )}
                >
                  <Avatar.Root class="h-10 w-10 border shadow-sm">
                    <Avatar.Image src={`https://api.dicebear.com/9.x/shapes/svg?seed=${chat.name}`} />
                    <Avatar.Fallback class="bg-primary/5 text-primary">
                      {chat.name.substring(0, 2).toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <div class="flex-1 overflow-hidden">
                    <div class="flex items-center justify-between">
                      <span class="truncate font-semibold">{chat.name}</span>
                    </div>
                  </div>
                </button>
              {/if}
            {/each}
          {/if}
        </div>
      </ScrollArea>
    </Resizable.Pane>

    <Resizable.Handle withHandle />

    <!-- Chat Window -->
    <Resizable.Pane defaultSize={70} class="flex flex-col bg-background">
      {#if selectedChatId && selectedChat}
        <!-- Header -->
        <div class="flex items-center gap-3 p-4 shadow-sm">
          <Avatar.Root class="h-8 w-8 border">
            <Avatar.Image src={`https://api.dicebear.com/9.x/shapes/svg?seed=${selectedChat.name}`} />
            <Avatar.Fallback class="bg-primary/5 text-xs text-nowrap text-primary">
              {selectedChat.name.substring(0, 2).toUpperCase()}
            </Avatar.Fallback>
          </Avatar.Root>
          <h3 class="font-bold">{selectedChat.name}</h3>
        </div>
        <Separator />

        <!-- Messages -->
        <ScrollArea class="flex-1" bind:viewportRef>
          <div class="flex flex-col gap-6 p-6">
            {#if messagesQuery.isLoading}
              <div class="flex h-full items-center justify-center py-10">
                <span class="text-sm text-muted-foreground italic">Loading messages...</span>
              </div>
            {:else if messagesQuery.data?.length === 0}
              <div class="flex h-full items-center justify-center py-10">
                <span class="text-sm text-muted-foreground italic">No messages yet. Say hello!</span>
              </div>
            {:else}
              {#each messagesQuery.data ?? [] as msg (msg._id)}
                <div class="group relative flex items-start gap-3">
                  <Avatar.Root class="h-8 w-8 shrink-0 border">
                    <Avatar.Image src={msg.senderAvatar ?? undefined} />
                    <Avatar.Fallback class="text-nowrap">{msg.senderName.substring(0, 2).toUpperCase()}</Avatar.Fallback
                    >
                  </Avatar.Root>
                  <div class={cn('flex flex-col gap-1.5', editingMessageId === msg._id ? 'flex-1' : 'max-w-[80%]')}>
                    <div class="flex items-baseline gap-2">
                      <span class="text-sm font-semibold">{msg.senderName}</span>
                      <span class="text-[10px] text-muted-foreground">
                        {formatTime(msg.sentAt)}
                      </span>
                    </div>
                    {#if editingMessageId === msg._id}
                      <div class="flex w-full flex-col gap-2">
                        <Input
                          bind:value={editingContent}
                          onkeydown={(e) => e.key === 'Enter' && saveEdit()}
                          class="w-full"
                        />
                        <div class="flex gap-2">
                          <Button size="sm" onclick={saveEdit}>Save</Button>
                          <Button size="sm" variant="ghost" onclick={cancelEditing}>Cancel</Button>
                        </div>
                      </div>
                    {:else}
                      <div class="rounded-2xl rounded-tl-none bg-muted px-4 py-2 text-sm shadow-sm">
                        {msg.content}
                      </div>
                    {/if}
                  </div>

                  <!-- Actions -->
                  {#if editingMessageId !== msg._id && (msg.senderId === $session?.userId || $session?.role === 'teacher' || $session?.role === 'admin')}
                    <div class="absolute top-0 -right-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                          {#snippet child({ props })}
                            <Button {...props} variant="ghost" size="icon" class="h-8 w-8">
                              <MoreVertical class="h-4 w-4" />
                            </Button>
                          {/snippet}
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content align="end">
                          {#if msg.senderId === $session?.userId}
                            <DropdownMenu.Item onclick={() => startEditing(msg)}>
                              <Pencil class="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenu.Item>
                          {/if}
                          <DropdownMenu.Item
                            class="text-destructive focus:text-destructive"
                            onclick={() => deleteMessage(msg._id)}
                          >
                            <Trash class="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Root>
                    </div>
                  {/if}
                </div>
              {/each}
            {/if}
          </div>
        </ScrollArea>

        <!-- Input -->
        <Separator />
        <div class="p-4">
          <form
            onsubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            class="flex gap-2"
          >
            <Input
              placeholder="Type a message..."
              bind:value={newMessage}
              class="flex-1 border-primary/20 focus-visible:ring-primary/30"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()} class="shrink-0">
              <Send class="h-4 w-4" />
            </Button>
          </form>
        </div>
      {:else}
        <div class="flex h-full flex-col items-center justify-center gap-4 p-8 text-center text-muted-foreground">
          <div class="rounded-full bg-muted p-6">
            <Send class="h-12 w-12 opacity-20" />
          </div>
          <div class="max-w-[200px]">
            <h3 class="text-lg font-semibold text-foreground">Select a chat</h3>
            <p class="text-sm">Choose a conversation from the sidebar to start messaging.</p>
          </div>
        </div>
      {/if}
    </Resizable.Pane>
  </Resizable.PaneGroup>
</div>
