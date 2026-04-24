<script lang="ts">
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Tabs from "$lib/components/ui/tabs/index.js";

	const posts = Array.from({ length: 20 }).map((_, i) => ({
		id: i,
		user: `Student_${Math.floor(Math.random() * 900) + 100}`,
		title: `Discussion Topic #${i + 1}`,
		content: "This is the content for the discussion feed. Click the title to view the full popup."
	}));

	const comments = [
		{ user: "Alex_P", text: "I found this really helpful, thanks!", time: "2h ago" },
		{ user: "Sarah_J", text: "Does anyone know the deadline for this?", time: "1h ago" }
	];
</script>

<div class="flex h-full w-full gap-6 p-6 overflow-hidden bg-background">
	<div class="flex flex-1 flex-col min-w-0">
		<ScrollArea class="h-full w-full rounded-md border bg-card shadow-sm">
			<div class="p-6">
				<h1 class="sticky top-0 z-20 bg-card pb-6 text-4xl font-bold tracking-tight border-b mb-4">
					Student Forum
				</h1>

				{#each posts as post (post.id)}
					<div class="flex h-48 flex-col justify-center py-4 px-2">
						<div class="flex items-center gap-2 mb-2">
							<div class="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
								{post.user[0]}
							</div>
							<span class="text-xs font-bold uppercase text-muted-foreground">{post.user}</span>
						</div>

						<!-- POPUP INTEGRATION -->
						<Dialog.Root>
							<Dialog.Trigger class="text-left">
								<h2 class="text-xl font-bold hover:text-primary cursor-pointer transition-colors">
									{post.title}
								</h2>
							</Dialog.Trigger>
							
							<Dialog.Content class="sm:max-w-[800px] h-fit max-h-[90vh] flex flex-col p-10">
								<Dialog.Header>
									<Dialog.Title class="text-3xl font-black">{post.title}</Dialog.Title>
									<Dialog.Description class="text-base font-medium">
										Posted by <span class="font-black text-foreground">{post.user}</span>
									</Dialog.Description>
								</Dialog.Header>

								<Tabs.Root value="post" class="mt-8 flex flex-col overflow-hidden">
									<Tabs.List class="grid w-full grid-cols-2">
										<Tabs.Trigger value="post" class="font-bold">Discussion</Tabs.Trigger>
										<Tabs.Trigger value="comments" class="font-bold">Comments ({comments.length})</Tabs.Trigger>
									</Tabs.List>

									<Tabs.Content value="post" class="py-6">
										<p class="text-lg font-medium leading-relaxed text-muted-foreground">
											{post.content}
										</p>
									</Tabs.Content>

									<!-- TAB 2: COMMENTS -->
<Tabs.Content value="comments" class="flex flex-col">
  <ScrollArea class="max-h-[300px] pr-4 mt-2">
    {#each comments as comment}
      <div class="py-3">
        <div class="flex justify-between items-center mb-1">
          <!-- Reduced from text-sm to text-xs -->
          <span class="text-xs font-black">{comment.user}</span>
          <span class="text-[10px] font-bold text-muted-foreground">{comment.time}</span>
        </div>
        <!-- Reduced from text-sm to text-xs -->
        <p class="text-xs font-medium">{comment.text}</p>
        <Separator class="mt-3" />
      </div>
    {/each}
  </ScrollArea>

  <div class="flex gap-3 mt-6">
    <!-- Reduced font to text-xs -->
    <input 
      type="text" 
      placeholder="Add a comment..." 
      class="flex-1 rounded-md border bg-muted px-3 text-xs font-bold" 
    />
    <!-- Increased size to h-12 and px-8, reduced font to text-sm -->
    <Button class="h-12 px-8 text-sm font-black uppercase tracking-tight">
      Post
    </Button>
  </div>
</Tabs.Content>

								</Tabs.Root>
							</Dialog.Content>
						</Dialog.Root>

						<p class="text-sm font-medium text-muted-foreground line-clamp-2 mt-2">
							{post.content}
						</p>

						<div class="flex gap-4 mt-6">
							<Button variant="ghost" size="sm" class="h-8 font-bold">Like</Button>
							<Button variant="ghost" size="sm" class="h-8 font-bold">Reply</Button>
							<Button variant="ghost" size="sm" class="h-8 font-bold">Message</Button>
						</div>
					</div>
					<Separator class="my-2" />
				{/each}
			</div>
		</ScrollArea>
	</div>

	<!-- Sidebar -->
	<!-- RIGHT SIDEBAR SECTION -->
<!-- RIGHT SIDEBAR SECTION -->
<aside class="hidden w-80 flex-col gap-6 lg:flex">
  <!-- TRENDING WIDGET -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="text-lg font-bold">Trending Topics</Card.Title>
    </Card.Header>
    <Card.Content class="grid gap-4">
      {#each ["#Exams", "#Housing", "#Jobs", "#Events"] as tag}
        <div class="flex items-center justify-between text-sm">
          <span class="font-bold text-primary cursor-pointer hover:underline">{tag}</span>
          <span class="text-xs font-bold text-muted-foreground">1.2k</span>
        </div>
      {/each}
    </Card.Content>
    <Card.Footer>
      <Button variant="outline" class="w-full font-bold">Explore All</Button>
    </Card.Footer>
  </Card.Root>

  <!-- 🚀 NEW: CREATE A POST POPUP -->
  <Dialog.Root>
    <Dialog.Trigger class="w-full">
      <Button class="h-16 w-full text-sm font-black uppercase tracking-tighter shadow-lg transition-transform hover:scale-[1.02]">
        + Create a Post
      </Button>
    </Dialog.Trigger>
    
    <!-- POPUP CONTENT (Matches the 800px width from before) -->
    <Dialog.Content class="sm:max-w-[800px] p-10">
      <Dialog.Header>
        <Dialog.Title class="text-3xl font-black">Create New Thread</Dialog.Title>
        <Dialog.Description class="text-sm font-medium">
          Share your thoughts or questions with the student community.
        </Dialog.Description>
      </Dialog.Header>

      <div class="mt-8 flex flex-col gap-6">
        <!-- Title Input -->
        <div class="grid gap-2">
          <label for="post-title" class="text-xs font-black uppercase tracking-widest text-muted-foreground">Title</label>
          <input 
            id="post-title"
            type="text" 
            placeholder="What is your discussion about?" 
            class="w-full rounded-md border bg-muted px-4 py-3 text-sm font-bold outline-none focus:border-primary"
          />
        </div>

        <!-- Content Area -->
        <div class="grid gap-2">
          <label for="post-content" class="text-xs font-black uppercase tracking-widest text-muted-foreground">Content</label>
          <textarea 
            id="post-content"
            rows="6"
            placeholder="Write your post here..." 
            class="w-full rounded-md border bg-muted px-4 py-3 text-sm font-medium outline-none focus:border-primary resize-none"
          ></textarea>
        </div>

        <!-- Submit Button (Large like the Post button before) -->
        <div class="flex justify-end pt-4">
          <Button class="h-14 px-12 text-sm font-black uppercase tracking-tight">
            Publish Post
          </Button>
        </div>
      </div>
    </Dialog.Content>
  </Dialog.Root>

  <!-- STATS WIDGET -->
  <Card.Root class="bg-primary text-primary-foreground">
    <Card.Header>
      <Card.Title class="text-lg font-bold">Community Stats</Card.Title>
    </Card.Header>
    <Card.Content>
      <div class="text-4xl font-black">12,402</div>
      <p class="text-sm font-bold opacity-90 mt-1">Students online now</p>
    </Card.Content>
  </Card.Root>
</aside>


</div>

<style>
	:global(body) { overflow: hidden; }
</style>
