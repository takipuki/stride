<script lang="ts">
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import ArrowUp from '@lucide/svelte/icons/arrow-up';
  import Award from '@lucide/svelte/icons/award';
  import Calendar from '@lucide/svelte/icons/calendar';
  import Clock from '@lucide/svelte/icons/clock';
  import Flame from '@lucide/svelte/icons/flame';
  import MessageSquare from '@lucide/svelte/icons/message-square';
  import Plus from '@lucide/svelte/icons/plus';
  import Share2 from '@lucide/svelte/icons/share-2';
  import ShieldAlert from '@lucide/svelte/icons/shield-alert';
  import Signature from '@lucide/svelte/icons/signature';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import TrendingUp from '@lucide/svelte/icons/trending-up';
  import { useConvexClient, useQuery } from 'convex-svelte';
  import { toast } from 'svelte-sonner';
  import { fade, slide } from 'svelte/transition';

  import { goto } from '$app/navigation';
  import { api } from '$convex/_generated/api.js';
  import type { Id } from '$convex/_generated/dataModel';

  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { session } from '$lib/session';
  import { cn } from '$lib/utils';

  const client = useConvexClient();

  // State
  let activeSort = $state<'new' | 'top' | 'hot'>('new');
  let selectedTagId = $state<Id<'tags'> | null>(null);
  let showOnlyMyPosts = $state(false);
  let postToDeleteId = $state<Id<'posts'> | null>(null);
  let deletePostDialogOpen = $state(false);

  // Queries
  const postsQuery = useQuery(api.posts.list, () => ({
    userId: $session?.userId || undefined,
    tagId: selectedTagId || undefined,
    sortBy: activeSort,
    onlyMyPosts: showOnlyMyPosts || undefined,
  }));

  const tagsQuery = useQuery(api.posts.listTags, () => ({}));

  // Voting action
  async function vote(postId: Id<'posts'>, value: 1 | -1 | 0, currentVote: number) {
    if (!$session?.userId) return;
    // Determine target vote value (toggle off if clicked same)
    const nextVoteValue = currentVote === value ? 0 : value;

    try {
      await client.mutation(api.posts.vote, {
        postId,
        userId: $session.userId,
        value: nextVoteValue,
      });
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  }

  function deletePost(e: Event, postId: Id<'posts'>) {
    e.stopPropagation();
    postToDeleteId = postId;
    deletePostDialogOpen = true;
  }

  async function confirmDeletePost() {
    if (!postToDeleteId) return;
    try {
      await client.mutation(api.posts.remove, { id: postToDeleteId });
      toast.success('Post deleted successfully.');
    } catch (err) {
      console.error('Failed to delete post:', err);
      toast.error('Failed to delete post.');
    } finally {
      postToDeleteId = null;
      deletePostDialogOpen = false;
    }
  }

  function formatTime(timestamp: number) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
</script>

<div class="container mx-auto flex h-full max-w-7xl gap-6 p-4 md:p-6">
  <!-- Main Feed Area -->
  <div class="flex flex-1 flex-col gap-6">
    <!-- Header Controls -->
    <div
      class="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between"
    >
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">Stride Community Forum</h1>
        <p class="text-sm text-muted-foreground">Discuss programming, share problems, and help your peers.</p>
      </div>
      <div class="flex items-center gap-2">
        {#if $session?.userId}
          <Button
            variant="outline"
            size="sm"
            class={cn(
              'gap-1.5 font-semibold transition-all duration-200',
              showOnlyMyPosts && 'border-primary bg-primary/10 text-primary hover:bg-primary/15',
            )}
            onclick={() => (showOnlyMyPosts = !showOnlyMyPosts)}
          >
            <Signature class="h-4 w-4" />
            My Posts
          </Button>
        {/if}
        <Button
          variant="outline"
          size="sm"
          class={cn(
            'gap-1.5 transition-all duration-200',
            activeSort === 'new' && 'border-primary bg-primary/10 text-primary hover:bg-primary/15',
          )}
          onclick={() => (activeSort = 'new')}
        >
          <Clock class="h-4 w-4" />
          New
        </Button>
        <Button
          variant="outline"
          size="sm"
          class={cn(
            'gap-1.5 transition-all duration-200',
            activeSort === 'hot' && 'border-primary bg-primary/10 text-primary hover:bg-primary/15',
          )}
          onclick={() => (activeSort = 'hot')}
        >
          <Flame class="h-4 w-4" />
          Hot
        </Button>
        <Button
          variant="outline"
          size="sm"
          class={cn(
            'gap-1.5 transition-all duration-200',
            activeSort === 'top' && 'border-primary bg-primary/10 text-primary hover:bg-primary/15',
          )}
          onclick={() => (activeSort = 'top')}
        >
          <TrendingUp class="h-4 w-4" />
          Top
        </Button>
      </div>
    </div>

    <!-- Active Tag Indicator -->
    {#if selectedTagId}
      <div
        class="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-2"
        transition:slide={{ duration: 200 }}
      >
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium">Filtering by Tag:</span>
          {#if tagsQuery.data}
            {@const tag = tagsQuery.data.find((t) => t?._id === selectedTagId)}
            {#if tag}
              <Badge class="border-primary/30 bg-primary/20 text-primary hover:bg-primary/25">#{tag.name}</Badge>
            {/if}
          {/if}
        </div>
        <Button variant="ghost" size="sm" onclick={() => (selectedTagId = null)} class="h-8 px-2 text-xs"
          >Clear Filter</Button
        >
      </div>
    {/if}

    <!-- Posts Feed -->
    <div class="flex flex-col gap-4">
      {#if postsQuery.isLoading}
        {#each [0, 1, 2] as i (i)}
          <div class="h-48 animate-pulse rounded-xl border bg-muted/20"></div>
        {/each}
      {:else if !postsQuery.data || postsQuery.data.length === 0}
        <div
          class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center"
          in:fade
        >
          <div class="rounded-full bg-muted p-6">
            <Sparkles class="h-12 w-12 text-muted-foreground opacity-40" />
          </div>
          <h3 class="text-xl font-bold">No posts found</h3>
          <p class="max-w-xs text-sm text-muted-foreground">
            Be the first to ask a question, start a discussion, or share some insights with the community.
          </p>
          <Button size="sm" onclick={() => goto('/forum/new')} class="mt-2">
            <Plus class="mr-2 h-4 w-4" /> Create Post
          </Button>
        </div>
      {:else}
        {#each postsQuery.data as post (post._id)}
          {#if post}
            <div in:fade>
              <Card.Root
                class="group cursor-pointer overflow-hidden border-border transition-all duration-300 hover:border-primary/30 hover:shadow-md"
                onclick={() => post._id && goto(`/forum/${post._id}`)}
              >
                <div class="flex">
                  <!-- Vote Controller (Left panel) -->
                  <div
                    class="flex w-12 flex-col items-center justify-start gap-1 border-r bg-muted/10 p-3 transition-all group-hover:bg-muted/15"
                  >
                    <button
                      onclick={(e) => {
                        e.stopPropagation();
                        if (post._id) vote(post._id, 1, post.userVote ?? 0);
                      }}
                      class={cn(
                        'rounded p-1 transition-colors hover:bg-muted',
                        post.userVote === 1 ? 'text-orange-500 hover:bg-orange-500/10' : 'text-muted-foreground',
                      )}
                      aria-label="Upvote"
                    >
                      <ArrowUp class="h-5 w-5 font-bold" />
                    </button>
                    <span
                      class={cn(
                        'text-sm font-bold tracking-tight',
                        post.userVote === 1 && 'text-orange-500',
                        post.userVote === -1 && 'text-blue-500',
                        post.userVote === 0 && 'text-foreground/80',
                      )}
                    >
                      {post.score ?? 0}
                    </span>
                    <button
                      onclick={(e) => {
                        e.stopPropagation();
                        if (post._id) vote(post._id, -1, post.userVote ?? 0);
                      }}
                      class={cn(
                        'rounded p-1 transition-colors hover:bg-muted',
                        post.userVote === -1 ? 'text-blue-500 hover:bg-blue-500/10' : 'text-muted-foreground',
                      )}
                      aria-label="Downvote"
                    >
                      <ArrowDown class="h-5 w-5" />
                    </button>
                  </div>

                  <!-- Main Card Content -->
                  <div class="flex flex-1 flex-col gap-3 p-5">
                    <!-- Meta Header -->
                    <div class="flex items-center justify-between text-xs text-muted-foreground">
                      <div class="flex items-center gap-2">
                        <Avatar.Root class="h-5 w-5 border shadow-sm">
                          <Avatar.Image src={post.authorAvatar ?? undefined} />
                          <Avatar.Fallback class="bg-primary/5 text-[8px]">
                            {post.authorName.substring(0, 2).toUpperCase()}
                          </Avatar.Fallback>
                        </Avatar.Root>
                        <span class="font-semibold text-foreground/80">{post.authorName}</span>
                        <span>•</span>
                        <span>{formatTime(post._creationTime ?? Date.now())}</span>
                      </div>

                      <!-- Delete button if authorized -->
                      {#if $session?.userId && (post.authorId === $session.userId || $session.role === 'admin' || $session.role === 'teacher')}
                        <button
                          onclick={(e) => post._id && deletePost(e, post._id)}
                          class="rounded p-1 text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
                          title="Delete Post"
                        >
                          <Trash2 class="h-4 w-4" />
                        </button>
                      {/if}
                    </div>

                    <!-- Post Title -->
                    <h2
                      class="text-lg leading-snug font-bold tracking-tight text-foreground transition-colors group-hover:text-primary"
                    >
                      {post.title ?? 'Untitled Post'}
                    </h2>

                    <!-- Text preview (strip HTML tags for plain text snippet) -->
                    <p class="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {(post.contentMd || '').replace(/<[^>]*>/g, '')}
                    </p>

                    <!-- Image Preview -->
                    {#if post.imageUrl}
                      <div class="mt-2 max-h-72 overflow-hidden rounded-lg border bg-muted/5">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          class="h-full w-full object-cover transition-transform duration-500 hover:scale-102"
                          loading="lazy"
                        />
                      </div>
                    {/if}

                    <!-- Tags -->
                    {#if post.tags && post.tags.length > 0}
                      <div class="mt-1 flex flex-wrap gap-1.5">
                        {#each post.tags as tag (tag?._id)}
                          {#if tag}
                            <button
                              onclick={(e) => {
                                e.stopPropagation();
                                selectedTagId = tag._id;
                              }}
                              class="inline-block"
                            >
                              <Badge
                                variant="secondary"
                                class="border text-xs font-normal hover:bg-muted-foreground/10"
                              >
                                #{tag.name}
                              </Badge>
                            </button>
                          {/if}
                        {/each}
                      </div>
                    {/if}

                    <!-- Footer stats -->
                    <div class="mt-2 flex items-center gap-4 text-xs font-medium text-muted-foreground">
                      <div class="flex items-center gap-1 transition-colors hover:text-foreground">
                        <MessageSquare class="h-4 w-4" />
                        <span>{post.commentCount ?? 0} {post.commentCount === 1 ? 'comment' : 'comments'}</span>
                      </div>
                      <div class="flex items-center gap-1 transition-colors hover:text-foreground">
                        <Share2 class="h-4 w-4" />
                        <span>Share</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card.Root>
            </div>
          {/if}
        {/each}
      {/if}
    </div>
  </div>

  <!-- Sidebar Columns -->
  <div class="sticky top-20 hidden w-80 shrink-0 flex-col gap-6 lg:flex">
    <!-- Premium Create Post Button -->
    <div class="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm">
      <Button onclick={() => goto('/forum/new')} class="w-full gap-2 font-semibold shadow-sm">
        <Plus class="h-5 w-5" />
        Create Post
      </Button>
    </div>

    <!-- Community guidelines -->
    <div class="relative flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
      <div class="flex items-center gap-2 text-sm font-bold tracking-wider text-orange-500 uppercase">
        <ShieldAlert class="h-4 w-4" />
        Community Rules
      </div>
      <Separator />
      <ul class="flex list-decimal flex-col gap-2 pl-4 text-xs leading-relaxed text-muted-foreground">
        <li>Be respectful and support your classmates.</li>
        <li>Do not share complete source code for exams.</li>
        <li>Use clear titles and add descriptive images when reporting compiler errors.</li>
        <li>Categorize your posts with appropriate tags.</li>
      </ul>
    </div>

    <!-- Popular Tags Cloud -->
    <div class="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
      <h3 class="flex items-center gap-1.5 text-sm font-bold tracking-wider text-muted-foreground uppercase">
        <Award class="h-4 w-4" />
        Popular Tags
      </h3>
      <Separator />
      <div class="flex flex-wrap gap-1.5">
        {#if tagsQuery.isLoading}
          <div class="w-full text-xs text-muted-foreground italic">Loading tags...</div>
        {:else if !tagsQuery.data || tagsQuery.data.length === 0}
          <div class="w-full text-xs text-muted-foreground italic">No tags created yet.</div>
        {:else}
          {#each tagsQuery.data as tag, i (tag?._id || i)}
            {#if tag}
              <button onclick={() => (selectedTagId = selectedTagId === tag._id ? null : tag._id)} class="inline-block">
                <Badge
                  class={cn(
                    'cursor-pointer border text-xs font-normal transition-all duration-200',
                    selectedTagId === tag._id
                      ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/95'
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  #{tag.name}
                </Badge>
              </button>
            {/if}
          {/each}
        {/if}
      </div>
    </div>

    <!-- Community Stats -->
    <div class="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
      <h3 class="flex items-center gap-1.5 text-sm font-bold tracking-wider text-muted-foreground uppercase">
        <Calendar class="h-4 w-4" />
        Community Stats
      </h3>
      <Separator />
      <div class="grid grid-cols-2 gap-4 text-center">
        <div class="rounded-lg bg-muted/20 p-2.5">
          <span class="block text-xl font-bold tracking-tight text-primary">
            {postsQuery.data?.length ?? 0}
          </span>
          <span class="text-[10px] font-semibold text-muted-foreground uppercase">Total Posts</span>
        </div>
        <div class="rounded-lg bg-muted/20 p-2.5">
          <span class="block text-xl font-bold tracking-tight text-primary">
            {tagsQuery.data?.length ?? 0}
          </span>
          <span class="text-[10px] font-semibold text-muted-foreground uppercase">Unique Tags</span>
        </div>
      </div>
    </div>
  </div>
</div>

<AlertDialog.Root bind:open={deletePostDialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete Post</AlertDialog.Title>
      <AlertDialog.Description>Are you sure you want to delete this post?</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={() => (postToDeleteId = null)}>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action variant="destructive" onclick={confirmDeletePost}>Delete</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
