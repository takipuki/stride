<script lang="ts">
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Carousel from '$lib/components/ui/carousel/index.js';
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';

  // Svelte 5 state
  type User = { id: number; name: string; bio: string; };
  let search = $state('');
  let selectedUser = $state<User | null>(null);

  const posts = Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    user: `user_${i + 1}`,
    caption: `v1.2.0-beta.${i}`,
    description:
      'This is a sample post description. Users can share thoughts, updates, or context about their images in a real social media style feed.',
    images: Array.from({ length: 5 }).map((_, j) => `https://picsum.photos/600/600?random=${i * 10 + j}`),
    comments: [
      { user: 'alice', text: 'This looks insane 🔥' },
      { user: 'bob', text: 'Clean UI, love it.' },
      { user: 'charlie', text: 'Bro this is actually good 😳' },
    ],
  }));

  const users = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    name: `user_${i + 1}`,
    bio: 'Frontend dev • AI builder • Creator',
  }));

  function openUser(user: User) {
    selectedUser = user;
  }
</script>

<!-- ================= FULL LAYOUT ================= -->
<div class="flex h-full w-full overflow-hidden">
  <!-- ================= CENTER FEED ================= -->
  <div class="flex-1 overflow-hidden">
    <ScrollArea class="h-full w-full">
      <div class="mx-auto max-w-3xl space-y-6 p-4">
        {#each posts as post (post.id)}
          <Card.Root class="w-full">
            <!-- HEADER -->
            <div class="flex items-center gap-3 p-4">
              <Avatar>
                <AvatarFallback>{post.user[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div class="text-sm font-semibold">{post.user}</div>
            </div>

            <!-- CAROUSEL -->
            <Carousel.Root class="relative w-full overflow-hidden" opts={{ align: 'start', loop: false }}>
              <Carousel.Content class="ms-0">
                {#each post.images as img, index (index)}
                  <Carousel.Item class="w-full shrink-0 grow-0 basis-full">
                    <div class="aspect-square w-full overflow-hidden bg-black">
                      <img
                        src={img}
                        alt=""
                        class="pointer-events-none h-full w-full object-cover select-none"
                        draggable="false"
                      />
                    </div>
                  </Carousel.Item>
                {/each}
              </Carousel.Content>

              {#if post.images.length > 1}
                <Carousel.Previous
                  class="absolute top-1/2 left-3 h-14 w-14 -translate-y-1/2 rounded-full border bg-black/70 text-white"
                />
                <Carousel.Next
                  class="absolute top-1/2 right-3 h-14 w-14 -translate-y-1/2 rounded-full border bg-black/70 text-white"
                />
              {/if}
            </Carousel.Root>

            <!-- ACTIONS -->
            <div class="flex items-center gap-4 px-4 py-3 text-sm">
              <button>❤️ Like</button>
              <button>💬 Comment</button>
              <button>🔗 Share</button>
            </div>

            <!-- DESCRIPTION -->
            <div class="px-4 pb-2 text-sm text-muted-foreground">
              {post.description}
            </div>

            <!-- COMMENTS -->
            <div class="px-4 pt-2 text-xs font-semibold text-muted-foreground">Comments</div>

            <div class="space-y-2 px-4 pb-4">
              {#each post.comments as comment, index (index)}
                <div class="flex gap-2 text-sm">
                  <span class="font-semibold">{comment.user}</span>
                  <span class="text-muted-foreground">{comment.text}</span>
                </div>
              {/each}
            </div>
          </Card.Root>

          <Separator />
        {/each}
      </div>
    </ScrollArea>
  </div>

  <!-- ================= RIGHT PANEL ================= -->
  <div class="w-80 border-l border-white/10 bg-muted/10 p-4">
    <!-- SEARCH BAR -->
    <div class="mb-4">
      <Input placeholder="Search users..." bind:value={search} class="w-full" />
    </div>

    <div class="mb-4 text-sm font-semibold text-muted-foreground">Discover People</div>

    <div class="space-y-3">
      {#each users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase())) as user (user.id)}
        <div
          class="flex cursor-pointer items-center justify-between rounded-md p-2 hover:bg-muted"
          role="button"
          tabindex="0"
          onclick={() => openUser(user)}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') openUser(user); }}
        >
          <div class="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{user.name[0].toUpperCase()}</AvatarFallback>
            </Avatar>

            <div>
              <div class="text-sm font-semibold">{user.name}</div>
              <div class="text-xs text-muted-foreground">{user.bio}</div>
            </div>
          </div>

          <Button size="sm" variant="outline">Chat</Button>
        </div>
      {/each}
    </div>
  </div>
</div>

<!-- ================= PROFILE POPUP ================= -->
{#if selectedUser}
  <Dialog open={true} onOpenChange={() => (selectedUser = null)}>
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>{selectedUser.name}</DialogTitle>
      </DialogHeader>

      <div class="space-y-3">
        <p class="text-sm text-muted-foreground">
          {selectedUser.bio}
        </p>

        <Button class="w-full">Start Chat 💬</Button>
        <Button variant="outline" class="w-full">View Profile</Button>
      </div>
    </DialogContent>
  </Dialog>
{/if}
