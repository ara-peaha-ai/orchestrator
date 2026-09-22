<script setup>
const route = useRoute()
const orderId = computed(() => String(Array.isArray(route.query.orderId) ? route.query.orderId[0] : route.query.orderId ?? ''))

const status = ref('pending')
const error = ref('')
let timer

const TERMINAL_STATUSES = ['paid', 'expired', 'invalid']

const poll = async () => {
  try {
    const order = await $fetch('/flows/booking/order', { query: { orderId: orderId.value } })
    status.value = order.status
    if (TERMINAL_STATUSES.includes(order.status)) clearInterval(timer)
  } catch (e) {
    error.value = e?.statusMessage || 'Could not load order'
    clearInterval(timer)
  }
}

onMounted(() => {
  poll()
  timer = setInterval(poll, 3000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="min-h-screen p-4 sm:p-8">
    <UCard class="mx-auto max-w-lg">
      <template #header>
        <h1 class="text-2xl font-bold">Thank you</h1>
      </template>
      <UAlert v-if="error" color="error" variant="subtle" :title="error" />
      <UAlert v-else-if="status === 'paid'" color="success" variant="subtle" title="Payment received. Your booking is confirmed." />
      <UAlert v-else-if="status === 'expired'" color="error" variant="subtle" title="This invoice expired before payment was received." />
      <UAlert v-else-if="status === 'invalid'" color="error" variant="subtle" title="This payment could not be validated." />
      <UAlert v-else color="primary" variant="subtle" title="Waiting for payment confirmation..." />
    </UCard>
  </div>
</template>
