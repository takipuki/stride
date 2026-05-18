<script lang="ts">
  import ActivityIcon from '@lucide/svelte/icons/activity';
  import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
  import InfoIcon from '@lucide/svelte/icons/info';
  import MonitorOffIcon from '@lucide/svelte/icons/monitor-off';
  import ScreenShareIcon from '@lucide/svelte/icons/screen-share';
  import { useConvexClient, useQuery } from 'convex-svelte';
  import SimplePeer from 'simple-peer/simplepeer.min.js';

  import { page } from '$app/state';
  import { api } from '$convex/_generated/api.js';
  import type { Id } from '$convex/_generated/dataModel';

  import { session } from '$lib/session';

  const client = useConvexClient();
  const sectionId = page.params.sectionId;

  // Reactively derive student ID once session finishes loading asynchronously
  const studentId = $derived($session?.userId || '');

  // Reactively derive isolated signaling target channels
  const teacherTargetId = $derived(`${sectionId}_teacher`);
  const studentTargetId = $derived(`${sectionId}_${studentId}`);
  const broadcastTargetId = $derived(`${sectionId}_broadcast_ping`);

  // Queries & Mutations
  const sectionQuery = useQuery(api.sections.get, () => ({ id: sectionId as Id<'sections'> }));
  const incomingSignals = useQuery(api.signals.getFor, () => (studentId ? { to: studentTargetId } : 'skip'));
  const broadcastSignals = useQuery(api.signals.getFor, () => ({ to: broadcastTargetId }));

  const sendSignal = (data: { from: string; to: string; type: string; data: string }) =>
    client.mutation(api.signals.send, data);
  const removeSignal = (data: { id: Id<'signals'> }) => client.mutation(api.signals.remove, data);

  // Reactive State
  let peer = $state<SimplePeer.Instance | null>(null);
  let stream = $state<MediaStream | null>(null);
  let sharing = $state(false);
  let status = $state<'disconnected' | 'ready' | 'sharing'>('disconnected');
  let errorMessage = $state<string | null>(null);
  let videoElement = $state<HTMLVideoElement | null>(null);

  // Track processed signal IDs to prevent duplicate WebRTC negotiations
  const processedIds = new Set<string>();

  // Re-creates / starts WebRTC peer connection
  function restartPeerConnection() {
    if (peer) {
      try {
        peer.destroy();
      } catch (err) {
        console.error('Error destroying peer:', err);
      }
      peer = null;
    }

    if (!stream || !studentId) return;

    console.log('Initiating WebRTC SimplePeer connection...');
    const p = new SimplePeer({ initiator: true, stream, trickle: false });

    p.on('signal', (data) => {
      const type = data.type === 'offer' ? 'offer' : 'ice';
      sendSignal({
        from: studentId,
        to: teacherTargetId,
        type,
        data: JSON.stringify(data),
      }).catch(console.error);
    });

    p.on('connect', () => {
      console.log('WebRTC connection established with teacher.');
    });

    p.on('error', (err) => {
      console.error('WebRTC peer error:', err);
      errorMessage = 'WebRTC connection dropped. Retrying...';
    });

    peer = p;
  }

  // Handle incoming signaling responses from teacher
  $effect(() => {
    const sigs = incomingSignals?.data;
    if (!sigs || !peer) return;

    for (const sig of sigs) {
      if (processedIds.has(sig._id)) continue;
      processedIds.add(sig._id);

      try {
        peer.signal(JSON.parse(sig.data));
      } catch (err) {
        console.error('Error signaling peer:', err);
      }
      removeSignal({ id: sig._id }).catch(console.error);
    }
  });

  // Handle teacher joining/refreshing (broadcast ping)
  $effect(() => {
    const sigs = broadcastSignals?.data;
    if (!sigs) return;

    for (const sig of sigs) {
      if (processedIds.has(sig._id)) continue;
      processedIds.add(sig._id);

      if (sharing && stream) {
        console.log('Teacher joined. Sending WebRTC reconnection offer...');
        restartPeerConnection();
      }
      removeSignal({ id: sig._id }).catch(console.error);
    }
  });

  // Start display media capture
  async function startSharing() {
    errorMessage = null;
    try {
      console.log('Requesting display media...');
      const s = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        },
        audio: false,
      });

      stream = s;
      status = 'sharing';
      sharing = true;

      if (videoElement) {
        videoElement.srcObject = s;
        videoElement.play().catch(console.error);
      }

      // Handle user stopping screen share via browser prompt bar
      s.getVideoTracks()[0].onended = () => {
        stopSharing();
      };

      restartPeerConnection();
    } catch (err: any) {
      console.error('Display media request rejected:', err);
      errorMessage =
        err.name === 'NotAllowedError'
          ? 'Screen capture permission was denied.'
          : err.message || 'Failed to capture screen.';
      status = 'disconnected';
      sharing = false;
    }
  }

  // Stop screen sharing and clean up
  function stopSharing() {
    console.log('Stopping screen sharing...');
    if (peer) {
      try {
        peer.destroy();
      } catch (err) {
        console.error('Error destroying peer on stop:', err);
      }
      peer = null;
    }

    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.error(e);
        }
      });
      stream = null;
    }

    if (videoElement) {
      videoElement.srcObject = null;
    }

    sharing = false;
    status = 'disconnected';
    errorMessage = null;
  }

  // Auto clean up on destroy
  $effect(() => {
    return () => {
      if (peer) {
        try {
          peer.destroy();
        } catch (e) {}
      }
      if (stream) {
        stream.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch (e) {}
        });
      }
    };
  });
</script>

<div class="flex h-full w-full flex-col items-center justify-start overflow-y-auto p-6">
  <!-- Banner Details -->
  <div class="mb-6 w-full max-w-4xl">
    <div
      class="flex flex-col justify-between gap-4 rounded-2xl border border-border/40 bg-card/45 p-6 shadow-xl backdrop-blur-md md:flex-row md:items-center"
    >
      <div class="flex items-center gap-4">
        <div class="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ActivityIcon class="size-6 animate-pulse" />
        </div>
        <div>
          {#if sectionQuery.isLoading}
            <div class="h-5 w-32 animate-pulse rounded bg-muted"></div>
            <div class="mt-2 h-4 w-20 animate-pulse rounded bg-muted"></div>
          {:else if sectionQuery.data}
            <h1 class="text-xl font-bold text-foreground">Section: {sectionQuery.data.name}</h1>
            <p class="text-sm text-muted-foreground capitalize">Classroom Hub &bull; Screen Capture</p>
          {:else}
            <h1 class="text-xl font-bold text-foreground">Classroom Hub</h1>
            <p class="text-sm text-muted-foreground">Screen Capture Setup</p>
          {/if}
        </div>
      </div>

      <!-- Status Indicator -->
      <div class="flex w-fit items-center gap-3 rounded-xl border border-border/30 bg-background/50 px-4 py-2">
        {#if status === 'sharing'}
          <div class="relative flex h-3 w-3">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
          </div>
          <span class="text-xs font-semibold text-emerald-400">Actively Sharing</span>
        {:else}
          <div class="relative flex h-3 w-3">
            <span class="relative inline-flex h-3 w-3 rounded-full bg-muted-foreground/60"></span>
          </div>
          <span class="text-xs font-semibold text-muted-foreground">Not Sharing</span>
        {/if}
      </div>
    </div>
  </div>

  <!-- Primary Interactive Body -->
  <div class="grid w-full max-w-4xl grid-cols-1 gap-6 lg:grid-cols-12">
    <!-- Action controls and Guidelines -->
    <div class="flex flex-col gap-6 lg:col-span-5">
      <div class="flex flex-col gap-6 rounded-2xl border border-border/40 bg-card/45 p-6 shadow-xl backdrop-blur-md">
        <h2 class="text-md font-bold text-foreground">Screen Share Control</h2>

        {#if errorMessage}
          <div
            class="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive"
          >
            <AlertCircleIcon class="mt-0.5 size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        {/if}

        <div class="flex flex-col gap-3">
          {#if !sharing}
            <button
              onclick={startSharing}
              disabled={!studentId}
              class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02] hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              <ScreenShareIcon class="size-4" />
              <span>Share Screen</span>
            </button>
          {:else}
            <button
              onclick={stopSharing}
              class="text-destructive-foreground flex w-full animate-pulse cursor-pointer items-center justify-center gap-2 rounded-xl bg-destructive px-5 py-3 font-semibold shadow-lg shadow-destructive/20 transition-all duration-300 hover:scale-[1.02] hover:bg-destructive/90"
            >
              <MonitorOffIcon class="size-4" />
              <span>Stop Sharing</span>
            </button>
          {/if}
        </div>

        <div class="my-2 border-t border-border/40"></div>

        <div class="flex flex-col gap-4">
          <div class="flex gap-3 text-xs text-muted-foreground">
            <InfoIcon class="size-4 shrink-0 text-primary/70" />
            <p>
              Ensure you share your <strong>Entire Screen</strong> so that the teacher/invigilator can watch properly during
              the activity.
            </p>
          </div>
          <div class="flex gap-3 text-xs text-muted-foreground">
            <CheckCircleIcon class="size-4 shrink-0 text-emerald-500/70" />
            <p>Do not close this browser tab while sharing. Closing it will terminate the screen share.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Live Preview area -->
    <div class="lg:col-span-7">
      <div
        class="flex h-full min-h-[300px] flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/45 shadow-xl backdrop-blur-md"
      >
        <!-- Preview Header -->
        <div class="flex items-center justify-between border-b border-border/40 bg-background/20 px-6 py-4">
          <span class="text-sm font-semibold text-foreground">Screen Preview</span>
          {#if sharing}
            <span
              class="flex animate-pulse items-center gap-1.5 rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-400 uppercase"
            >
              Live
            </span>
          {/if}
        </div>

        <!-- Video Frame -->
        <div class="relative flex flex-1 items-center justify-center bg-background/40 p-6">
          <!-- Hidden video tag for streaming/preview -->
          <video
            bind:this={videoElement}
            muted
            autoplay
            playsinline
            class="aspect-video h-full w-full rounded-lg border border-border/20 bg-black/60 shadow-md transition-all duration-500 {sharing
              ? 'scale-100 opacity-100'
              : 'pointer-events-none absolute scale-95 opacity-0'}"
          ></video>

          {#if !sharing}
            <div class="flex max-w-sm flex-col items-center justify-center p-6 text-center">
              <div
                class="mb-4 flex size-16 items-center justify-center rounded-full border border-border/20 bg-muted/40 text-muted-foreground"
              >
                <ScreenShareIcon class="size-8 opacity-60" />
              </div>
              <h3 class="mb-1 text-sm font-bold text-foreground">Preview Offline</h3>
              <p class="text-xs text-muted-foreground">
                Your screen is not currently sharing. Click the "Share Screen" button to begin your stream.
              </p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
