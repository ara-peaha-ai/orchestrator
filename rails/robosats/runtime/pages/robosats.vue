<script setup>
const amount = ref(50)
const currency = ref('EUR')
const loading = ref(false)
const result = ref(null)
const failure = ref(null)
const robotWarning = ref(null)
const { data: info } = await useFetch('/api/rails/robosats/info', { default: () => null })

// Facade: the card checkout lives on another domain; here the card maps to a fiat method the maker accepts.
// ponytail: hardcoded mapping, make it a coordinator-driven list when more methods are supported
const CARD_PAYMENT_METHOD = 'Revolut'

const call = async (step, url, opts) => {
  try {
    return await $fetch(`/api/rails/robosats/${url}`, opts)
  } catch (err) {
    // surface the first API error verbatim (e.g. escrow/robot creation disabled by the coordinator)
    failure.value = { step, status: err.statusCode ?? err.status, message: err.statusMessage ?? err.message, data: err.data }
    throw err
  }
}

const openTrade = async () => {
  loading.value = true
  result.value = failure.value = robotWarning.value = null
  try {
    const { authorization } = await useRobot()
    const headers = { 'X-Robosats-Authorization': authorization }

    const limits = await call('limits', 'limits', { query: { currency: currency.value } })
    // the coordinator can 500 on GET /robot/ while /make/ still authenticates, so a robot failure is not fatal
    const robot = await call('robot', 'robot', { method: 'POST', headers }).catch(() => {
      robotWarning.value = failure.value
      failure.value = null
    })
    const offer = await call('offer', 'offer', {
      method: 'POST',
      headers,
      body: { amount: amount.value, currency: currency.value, paymentMethods: CARD_PAYMENT_METHOD }
    })
    const order = await call('order', 'order', { query: { id: offer.id }, headers })

    result.value = { limits, robot, offer, order }
  } catch {
    // failure already set by call()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main style="padding: 24px; font-family: ui-sans-serif, system-ui; max-width: 480px;">
    <h1>Pay by card</h1>

    <p v-if="info">
      Coordinator {{ info.node_alias }} v{{ info.version?.major }}.{{ info.version?.minor }}.{{ info.version?.patch }}
      · {{ info.num_public_buy_orders + info.num_public_sell_orders }} public orders
      · fee {{ (info.maker_fee * 100).toFixed(4) }}% / {{ (info.taker_fee * 100).toFixed(4) }}%
    </p>

    <form style="display: grid; gap: 12px;" @submit.prevent="openTrade">
      <label>Amount
        <input v-model.number="amount" type="number" min="1" step="1" required>
      </label>
      <label>Currency
        <select v-model="currency">
          <option>EUR</option>
          <option>USD</option>
          <option>BRL</option>
          <option>ARS</option>
        </select>
      </label>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Opening trade…' : 'Continue to card checkout' }}
      </button>
    </form>

    <section v-if="robotWarning">
      <h2>Robot warning: {{ robotWarning.status }}</h2>
      <pre>{{ robotWarning.data }}</pre>
    </section>

    <section v-if="failure" style="color: #b00020;">
      <h2>Failed at: {{ failure.step }}</h2>
      <pre>{{ failure }}</pre>
    </section>

    <section v-if="result">
      <h2>Trade opened</h2>
      <p v-if="result.order.bond_invoice">Post the bond (Lightning hold invoice) to publish the offer:</p>
      <pre v-if="result.order.bond_invoice">{{ result.order.bond_invoice }}</pre>
      <pre>{{ result.order }}</pre>
    </section>
  </main>
</template>
