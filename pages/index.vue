<template>
  <main style="padding: 24px; font-family: ui-sans-serif, system-ui;">
    <h1>@ara-peaha-ai/orchestrator</h1>

    <p>Root API says: <strong>{{ data?.message }}</strong></p>

    <ul>
      <li>
        <NuxtLink to="/rails/template">/rails/template</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/rails/peach">/rails/peach</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/rails/robosats">/rails/robosats</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/flows/booking">/flows/booking</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/flows/booking/embed?customMode=dark&customPrimary=0ea5e9&customBackground=0b1220">
          /flows/booking/embed (themed embed)
        </NuxtLink>
      </li>
    </ul>

    <p><small>Source: <code>/api</code></small></p>
  </main>
</template>

<script setup>
const { data } = await useFetch('/api')
</script>
