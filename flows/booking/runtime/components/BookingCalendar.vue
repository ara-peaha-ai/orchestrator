<script setup>
import { CalendarDate } from '@internationalized/date'

const props = defineProps({
  customMode: String,
  customPrimary: String
})

const selectedDate = defineModel({ default: () => new CalendarDate(2026, 3, 22) })

const { isDark, themeStyles } = useCustomTheme({
  mode: () => props.customMode,
  primary: () => props.customPrimary
})
</script>

<template>
  <div class="rounded-lg p-2" :class="isDark === null ? '' : isDark ? 'dark' : 'light'" :style="themeStyles">
    <UCalendar v-model="selectedDate" color="primary" class="w-full" />
  </div>
</template>
