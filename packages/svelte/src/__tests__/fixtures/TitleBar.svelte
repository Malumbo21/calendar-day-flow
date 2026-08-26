<script lang="ts">
  const { slot = 'unknown' }: { slot?: string } = $props();
</script>

<span data-testid="title-bar">my toolbar:{slot}</span>
