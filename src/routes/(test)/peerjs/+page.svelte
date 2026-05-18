<script lang="ts">
  import { useConvexClient, useQuery } from 'convex-svelte';
  import SimplePeer from 'simple-peer/simplepeer.min.js';

  import { api } from '$convex/_generated/api';

  const studentId = crypto.randomUUID();

  const client = useConvexClient();
  const sendSignal = (data: any) => client.mutation(api.signals.send, data);
  const removeSignal = (data: any) => client.mutation(api.signals.remove, data);
  const incomingSignals = useQuery(api.signals.getFor, { to: studentId });
  $effect(() => {
    console.log(incomingSignals);
  });

  let peer = $state<SimplePeer.Instance | null>(null);
  let sharing = $state(false);

  async function startSharing() {
    // Called directly from onclick — gesture context intact
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });

    const p = new SimplePeer({ initiator: true, stream, trickle: false });

    p.on('signal', (data: any) => {
      const type = data.type === 'offer' ? 'offer' : 'ice';
      sendSignal({ from: studentId, to: 'teacher', type, data: JSON.stringify(data) });
    });

    p.on('connect', () => console.log('connected'));
    p.on('error', console.error);

    peer = p;
    sharing = true;
  }

  function stopSharing() {
    peer?.destroy();
    peer = null;
    sharing = false;
  }

  $effect(() => {
    if (!incomingSignals?.data || !peer) return;

    for (const sig of incomingSignals.data) {
      peer.signal(JSON.parse(sig.data));
      removeSignal({ id: sig._id });
    }
  });

  $effect(() => {
    return () => peer?.destroy();
  });
</script>

{#if !sharing}
  <button onclick={startSharing}>Share Screen</button>
{:else}
  <button onclick={stopSharing}>Stop Sharing</button>
{/if}
