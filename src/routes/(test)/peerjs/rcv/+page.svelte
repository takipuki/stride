<script lang="ts">
  import { useConvexClient, useQuery } from 'convex-svelte';
  import SimplePeer from 'simple-peer/simplepeer.min.js';

  import { api } from '$convex/_generated/api';

  type StudentEntry = { peer: SimplePeer.Instance; stream?: MediaStream };

  const client = useConvexClient();
  const sendSignal = (data: any) => client.mutation(api.signals.send, data);
  const removeSignal = (data: any) => client.mutation(api.signals.remove, data);
  const incoming = useQuery(api.signals.getFor, { to: 'teacher' });

  let students = $state<Record<string, StudentEntry>>({});

  const processedIds = new Set<string>();
  $effect(() => {
    if (!Array.isArray(incoming.data)) return;

    for (const sig of incoming.data) {
      if (processedIds.has(sig._id)) continue; // already handled
      processedIds.add(sig._id);

      removeSignal({ id: sig._id }); // fire-and-forget, don't await

      const data = JSON.parse(sig.data);

      if (sig.type === 'offer') {
        if (!students[sig.from]) {
          const peer = new SimplePeer({ initiator: false, trickle: false });

          peer.on('signal', (outData: any) => {
            const type = outData.type === 'answer' ? 'answer' : 'ice';
            sendSignal({ from: 'teacher', to: sig.from, type, data: JSON.stringify(outData) });
          });

          peer.on('stream', (stream: MediaStream) => {
            students[sig.from] = { ...students[sig.from], stream };
          });

          peer.on('error', console.error);
          students[sig.from] = { peer };
        }

        if (!students[sig.from].peer.destroyed) {
          // guard before signal
          students[sig.from].peer.signal(data);
        }
      }

      if (sig.type === 'ice' && students[sig.from]) {
        if (!students[sig.from].peer.destroyed) {
          // guard before signal
          students[sig.from].peer.signal(data);
        }
      }
    }
  });

  // Cleanup all peers on unmount
  $effect(() => {
    return () => {
      for (const { peer } of Object.values(students)) peer.destroy();
    };
  });

  function attachStream(node: HTMLVideoElement, stream: MediaStream) {
    node.srcObject = stream;
    node.play();

    return {
      destroy() {
        node.srcObject = null;
      },
    };
  }
</script>

<div class="grid grid-cols-3 gap-2">
  {#each Object.entries(students) as [id, { stream }]}
    {#if stream}
      <div>
        <p class="text-sm">{id.slice(0, 6)}</p>
        <video use:attachStream={stream} muted autoplay playsinline class="w-full rounded" />
      </div>
    {/if}
  {/each}
</div>
