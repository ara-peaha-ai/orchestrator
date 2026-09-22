<template>
  <main style="padding: 24px; font-family: ui-sans-serif, system-ui;">
    <h1>@ara-peaha-ai/template injected rail page</h1>
    <p>API says: <strong>{{ data?.message }}</strong></p>
    <p><small>Source: <code>/api/rails/template</code></small></p>
  </main>
</template>

<script setup>
const { data } = await useFetch('/api/rails/template')
</script>
