<template>
  <main style="padding: 24px; font-family: ui-sans-serif, system-ui;">
    <h1>@ara-peaha-ai/masspay rail</h1>
    <p v-if="pending">Loading balance…</p>
    <p v-else-if="error">Error: {{ error.message }}</p>
    <ul v-else>
      <li v-for="b in balances" :key="b.token">{{ b.currency_code }}: {{ b.balance }}</li>
    </ul>

    <button :disabled="withdrawing" @click="withdraw">Sweep to beneficiary (PYG / SIPAP)</button>
    <pre v-if="result">{{ result }}</pre>
  </main>
</template>

<script setup>
const { data: balances, pending, error, refresh } = await useFetch('/api/rails/masspay/balance')

const withdrawing = ref(false)
const result = ref(null)

const withdraw = async () => {
  withdrawing.value = true
  try {
    result.value = await $fetch('/api/rails/masspay/withdraw', { method: 'POST' })
    await refresh()
  } finally {
    withdrawing.value = false
  }
}
</script>
