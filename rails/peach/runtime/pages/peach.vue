<template>
  <main style="padding: 24px; font-family: ui-sans-serif, system-ui;">
    <h1>@ara-peaha-ai/peach rail</h1>
    <p v-if="pending">Loading merchant account…</p>
    <p v-else-if="error">Error: {{ error.message }}</p>
    <template v-else>
      <p>Peach account: <code>{{ me?.id }}</code></p>
    </template>
  </main>
</template>

<script setup>
const { getMe } = usePeach()
const { data: me, pending, error } = await useAsyncData('peach-me', getMe)
</script>
