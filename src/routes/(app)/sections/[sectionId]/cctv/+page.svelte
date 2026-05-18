<script lang="ts">
  import CctvIcon from '@lucide/svelte/icons/cctv';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import Maximize2Icon from '@lucide/svelte/icons/maximize-2';
  import Minimize2Icon from '@lucide/svelte/icons/minimize-2';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import ScreenShareIcon from '@lucide/svelte/icons/screen-share';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { useConvexClient, useQuery } from 'convex-svelte';
  import SimplePeer from 'simple-peer/simplepeer.min.js';
  import { SvelteSet } from 'svelte/reactivity';

  import { page } from '$app/state';
  import { api } from '$convex/_generated/api.js';
  import type { Id } from '$convex/_generated/dataModel';

  const client = useConvexClient();
  const sectionId = page.params.sectionId;
  const teacherTargetId = `${sectionId}_teacher`;
  const broadcastTargetId = `${sectionId}_broadcast_ping`;

  // Fetch Section Info
  const sectionQuery = useQuery(api.sections.get, () => ({ id: sectionId as Id<'sections'> }));

  // Fetch all enrolled students in the section
  const studentsQuery = useQuery(api.sections.listStudents, () => ({
    sectionId: sectionId as Id<'sections'>,
  }));

  // Listen to incoming WebRTC signals from students
  const incomingSignals = useQuery(api.signals.getFor, () => ({ to: teacherTargetId }));

  const sendSignal = (data: { from: string; to: string; type: string; data: string }) =>
    client.mutation(api.signals.send, data);
  const removeSignal = (data: { id: Id<'signals'> }) => client.mutation(api.signals.remove, data);

  // State Management
  interface StudentConnection {
    peer: SimplePeer.Instance;
    stream: MediaStream | null;
    status: 'connecting' | 'connected';
  }
  let activeStreams = $state<Record<string, StudentConnection>>({});
  let fullscreenStudentId = $state<string | null>(null);
  let isRefreshing = $state(false);

  // Track processed signal IDs to prevent duplicate WebRTC negotiations
  const processedIds = new SvelteSet<string>();

  // Pagination State
  let currentPage = $state(1);
  const itemsPerPage = 6; // Elegant 2x3 grid layout (6 items per page)

  const studentsList = $derived((studentsQuery.data ?? []).filter((s): s is NonNullable<typeof s> => s !== null));
  const totalStudents = $derived(studentsList.length);
  const totalPages = $derived(Math.max(1, Math.ceil(totalStudents / itemsPerPage)));

  const paginatedStudents = $derived(studentsList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));

  const activeStreamCount = $derived(Object.values(activeStreams).filter((s) => s.status === 'connected').length);

  // Send broadcast ping to trigger student offers
  async function triggerBroadcastPing() {
    isRefreshing = true;
    console.log('Sending broadcast ping to students...');
    try {
      await sendSignal({
        from: 'teacher',
        to: broadcastTargetId,
        type: 'broadcast_ping',
        data: '{}',
      });
      // Give a tiny visual spin feedback
      setTimeout(() => {
        isRefreshing = false;
      }, 1000);
    } catch (err) {
      console.error('Failed to send broadcast ping:', err);
      isRefreshing = false;
    }
  }

  // Trigger broadcast ping automatically on load
  $effect(() => {
    if (sectionQuery.data) {
      triggerBroadcastPing();
    }
  });

  // Handle incoming WebRTC signals
  $effect(() => {
    const sigs = incomingSignals?.data;
    if (!sigs) return;

    for (const sig of sigs) {
      if (processedIds.has(sig._id)) continue;
      processedIds.add(sig._id);

      const studentId = sig.from;
      const data = JSON.parse(sig.data);

      if (sig.type === 'offer') {
        console.log(`Received screen share offer from student: ${studentId}`);

        // Cleanup existing connection for this student if any
        if (activeStreams[studentId]?.peer) {
          try {
            activeStreams[studentId].peer.destroy();
          } catch (e) {
            console.error(e);
          }
        }

        const peerInstance = new SimplePeer({ initiator: false, trickle: false });

        activeStreams[studentId] = {
          peer: peerInstance,
          stream: null,
          status: 'connecting',
        };

        // Handle signaling responses back to the specific student
        peerInstance.on('signal', (outData) => {
          const type = outData.type === 'answer' ? 'answer' : 'ice';
          sendSignal({
            from: 'teacher',
            to: `${sectionId}_${studentId}`,
            type,
            data: JSON.stringify(outData),
          }).catch(console.error);
        });

        // Set live stream when WebRTC negotiation finishes
        peerInstance.on('stream', (s) => {
          console.log(`WebRTC stream established with student: ${studentId}`);
          if (activeStreams[studentId]) {
            activeStreams[studentId].stream = s;
            activeStreams[studentId].status = 'connected';
          }
        });

        // Handle error and disconnects
        peerInstance.on('error', (err) => {
          console.error(`WebRTC error for student ${studentId}:`, err);
          cleanupStudent(studentId);
        });

        peerInstance.on('close', () => {
          console.log(`WebRTC connection closed for student ${studentId}`);
          cleanupStudent(studentId);
        });

        peerInstance.signal(data);
      } else if (sig.type === 'ice') {
        if (activeStreams[studentId]?.peer) {
          activeStreams[studentId].peer.signal(data);
        }
      }

      // Delete the processed signal from database immediately
      removeSignal({ id: sig._id }).catch(console.error);
    }
  });

  function cleanupStudent(studentId: string) {
    if (activeStreams[studentId]) {
      const { peer, stream } = activeStreams[studentId];
      try {
        peer.destroy();
      } catch {
        /* ignore */
      }
      if (stream) {
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {
            /* ignore */
          }
        });
      }
      delete activeStreams[studentId];
      if (fullscreenStudentId === studentId) {
        fullscreenStudentId = null;
      }
    }
  }

  // Svelte Action to attach streams dynamically to video elements
  function attachStream(node: HTMLVideoElement, s: MediaStream | null) {
    if (s) {
      node.srcObject = s;
      node.play().catch(console.error);
    }

    return {
      update(newStream: MediaStream | null) {
        node.srcObject = newStream;
        if (newStream) {
          node.play().catch(console.error);
        }
      },
      destroy() {
        node.srcObject = null;
      },
    };
  }

  // Page level cleanup upon navigation or unmount
  $effect(() => {
    return () => {
      Object.keys(activeStreams).forEach((studentId) => {
        cleanupStudent(studentId);
      });
    };
  });
</script>

<div class="flex h-full w-full flex-col overflow-y-auto bg-background p-6">
  <!-- CCTV Header Section -->
  <div class="mb-6 w-full">
    <div
      class="flex flex-col justify-between gap-4 rounded-2xl border border-border/40 bg-card/45 p-6 shadow-xl backdrop-blur-md md:flex-row md:items-center"
    >
      <div class="flex items-center gap-4">
        <div class="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CctvIcon class="size-6 animate-pulse" />
        </div>
        <div>
          {#if sectionQuery.isLoading}
            <div class="h-5 w-32 animate-pulse rounded bg-muted"></div>
            <div class="mt-2 h-4 w-20 animate-pulse rounded bg-muted"></div>
          {:else if sectionQuery.data}
            <h1 class="text-xl font-bold text-foreground">CCTV Hub: {sectionQuery.data.name}</h1>
            <p class="text-sm text-muted-foreground capitalize">Invigilation Dashboard &bull; Section Screen Sharing</p>
          {:else}
            <h1 class="text-xl font-bold text-foreground">CCTV Invigilation Hub</h1>
            <p class="text-sm text-muted-foreground">Screen Share Invigilator</p>
          {/if}
        </div>
      </div>

      <!-- Quick Metrics and Manual Refresh -->
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-3 rounded-xl border border-border/30 bg-background/50 px-4 py-2">
          <UsersIcon class="size-4 text-muted-foreground" />
          <span class="text-xs font-semibold text-muted-foreground">
            {activeStreamCount} / {totalStudents} Screens Active
          </span>
        </div>

        <button
          onclick={triggerBroadcastPing}
          disabled={isRefreshing}
          class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border/30 bg-secondary px-4 py-2 text-xs font-semibold text-secondary-foreground transition-all duration-300 hover:bg-secondary/80 disabled:opacity-50"
        >
          <RefreshCwIcon class="size-3.5 {isRefreshing ? 'animate-spin' : ''}" />
          <span>Refresh All Streams</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Primary CCTV Video Grid -->
  {#if studentsQuery.isLoading}
    <div class="flex flex-1 items-center justify-center text-muted-foreground">
      <span class="animate-pulse">Loading enrolled students...</span>
    </div>
  {:else if totalStudents === 0}
    <div
      class="my-6 flex flex-1 flex-col items-center justify-center rounded-2xl border border-border/40 bg-card/25 p-6 text-center shadow-xl backdrop-blur-md"
    >
      <UsersIcon class="mb-4 size-16 text-muted-foreground/60" />
      <h3 class="mb-1 text-lg font-bold text-foreground">No Students Enrolled</h3>
      <p class="max-w-sm text-sm text-muted-foreground">
        There are currently no students enrolled in this section. Enroll students under section settings to invigilate
        their screens.
      </p>
    </div>
  {:else}
    <div class="mb-6 grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each paginatedStudents as student (student._id)}
        {@const connection = activeStreams[student._id]}
        {@const isLive = connection && connection.status === 'connected' && connection.stream}

        <div
          class="group relative flex h-fit flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/45 shadow-xl backdrop-blur-md"
        >
          <!-- Card Header details -->
          <div class="flex items-center justify-between border-b border-border/40 bg-background/20 px-4 py-3">
            <div class="flex max-w-[70%] items-center gap-2.5">
              {#if student.avatarUrl}
                <img src={student.avatarUrl} alt={student.name} class="size-6 rounded-full border border-border/50" />
              {:else}
                <div
                  class="flex size-6 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-[10px] font-bold text-primary"
                >
                  {student.name.slice(0, 2).toUpperCase()}
                </div>
              {/if}
              <span class="truncate text-xs font-bold text-foreground">{student.name}</span>
            </div>

            <!-- Status Indicator Badge -->
            {#if isLive}
              <span
                class="flex animate-pulse items-center gap-1 rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-emerald-400 uppercase"
              >
                Live
              </span>
            {:else if connection && connection.status === 'connecting'}
              <span
                class="flex animate-pulse items-center gap-1 rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-amber-400 uppercase"
              >
                Connecting
              </span>
            {:else}
              <span
                class="flex items-center gap-1 rounded border border-border/40 bg-muted/40 px-2 py-0.5 text-[9px] font-bold tracking-wider text-muted-foreground uppercase"
              >
                Offline
              </span>
            {/if}
          </div>

          <!-- Card Video Panel (Strict 16:9 Landscape Aspect Ratio) -->
          <div class="group/panel relative flex aspect-video w-full items-center justify-center bg-background/40">
            {#if isLive}
              <video
                use:attachStream={connection.stream}
                muted
                autoplay
                playsinline
                class="h-full w-full bg-black object-contain"
              ></video>

              <!-- Hover Control Overlay -->
              <div
                class="absolute inset-0 flex items-center justify-center gap-4 bg-black/60 opacity-0 transition-opacity duration-300 group-hover/panel:opacity-100"
              >
                <button
                  onclick={() => {
                    fullscreenStudentId = student._id;
                  }}
                  class="flex cursor-pointer items-center justify-center rounded-full bg-primary p-3 text-primary-foreground shadow-lg transition-all duration-300 hover:scale-110 hover:bg-primary/90"
                  title="Expand Fullscreen"
                >
                  <Maximize2Icon class="size-4" />
                </button>
              </div>
            {:else}
              <div class="flex flex-col items-center justify-center p-4 text-center">
                <div
                  class="mb-2 flex size-10 items-center justify-center rounded-full border border-border/20 bg-muted/30 text-muted-foreground/60"
                >
                  <ScreenShareIcon class="size-5" />
                </div>
                <p class="text-xs font-semibold text-muted-foreground/80">No Active Stream</p>
                <p class="mt-0.5 max-w-[180px] text-[10px] text-muted-foreground/50">Waiting for the student...</p>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- CCTV Pagination controls -->
    {#if totalPages > 1}
      <div
        class="mx-auto mt-auto flex w-full max-w-4xl items-center justify-center gap-2 border-t border-border/40 pt-6"
      >
        <button
          onclick={() => {
            currentPage = Math.max(1, currentPage - 1);
          }}
          disabled={currentPage === 1}
          class="flex cursor-pointer items-center justify-center rounded-lg border border-border/30 bg-card/45 p-2 text-foreground transition-all duration-200 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeftIcon class="size-4" />
        </button>

        {#each Array(totalPages) as _, i (i)}
          {@const pageNum = i + 1}
          <button
            onclick={() => {
              currentPage = pageNum;
            }}
            class="flex size-8 cursor-pointer items-center justify-center rounded-lg border text-xs font-semibold transition-all duration-200 {currentPage ===
            pageNum
              ? 'scale-105 border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'border-border/30 bg-card/45 text-foreground hover:bg-secondary'}"
          >
            {pageNum}
          </button>
        {/each}

        <button
          onclick={() => {
            currentPage = Math.min(totalPages, currentPage + 1);
          }}
          disabled={currentPage === totalPages}
          class="flex cursor-pointer items-center justify-center rounded-lg border border-border/30 bg-card/45 p-2 text-foreground transition-all duration-200 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRightIcon class="size-4" />
        </button>
      </div>
    {/if}
  {/if}
</div>

<!-- CCTV Fullscreen Overlay Modal -->
{#if fullscreenStudentId}
  {@const fullscreenStudentObj = studentsList.find((s) => s?._id === fullscreenStudentId)}
  {@const fsConnection = activeStreams[fullscreenStudentId]}

  <div class="animate-fade-in fixed inset-0 z-50 flex flex-col bg-black/90 p-6 backdrop-blur-md">
    <!-- Overlay Header -->
    <div class="mb-4 flex w-full items-center justify-between border-b border-border/20 pb-4">
      <div class="flex items-center gap-3">
        {#if fullscreenStudentObj?.avatarUrl}
          <img src={fullscreenStudentObj.avatarUrl} alt={fullscreenStudentObj.name} class="size-8 rounded-full" />
        {:else}
          <div
            class="flex size-8 items-center justify-center rounded-full bg-primary/25 text-xs font-bold text-primary"
          >
            {fullscreenStudentObj?.name.slice(0, 2).toUpperCase() || 'ST'}
          </div>
        {/if}
        <div>
          <h2 class="text-md font-bold text-white">{fullscreenStudentObj?.name || 'Student Screen'}</h2>
          <p class="text-xs text-zinc-400">Fullscreen Invigilation Mode</p>
        </div>
      </div>

      <!-- Close overlay -->
      <button
        onclick={() => {
          fullscreenStudentId = null;
        }}
        class="flex cursor-pointer items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white transition-all duration-300 hover:scale-105 hover:bg-zinc-800 hover:text-white"
      >
        <Minimize2Icon class="size-4" />
      </button>
    </div>

    <!-- High-res overlay video frame -->
    <div
      class="relative flex w-full flex-1 items-center justify-center overflow-hidden rounded-2xl border border-border/20 bg-black/60"
    >
      {#if fsConnection && fsConnection.status === 'connected' && fsConnection.stream}
        <video use:attachStream={fsConnection.stream} muted autoplay playsinline class="h-full w-full object-contain"
        ></video>
      {:else}
        <div class="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
          <CircleAlertIcon class="mb-4 size-16 animate-pulse text-amber-500" />
          <h3 class="text-md font-bold text-white">Stream Disconnected</h3>
          <p class="mt-1 max-w-xs text-xs text-zinc-400">The screen stream was interrupted or closed by the student.</p>
        </div>
      {/if}
    </div>
  </div>
{/if}
