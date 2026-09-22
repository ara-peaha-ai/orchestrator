<script setup>
import { today, getLocalTimeZone } from '@internationalized/date'

const props = defineProps({
  customMode: String,
  customPrimary: String
})

const todayDate = today(getLocalTimeZone())
const selectedDate = defineModel({ default: () => todayDate })

const { isDark, themeStyles } = useCustomTheme({
  mode: () => props.customMode,
  primary: () => props.customPrimary
})
</script>

<template>
  <div class="rounded-lg p-2" :class="isDark === null ? '' : isDark ? 'dark' : 'light'" :style="themeStyles">
    <UCalendar v-model="selectedDate" :min-value="todayDate" color="primary" class="w-full" />
  </div>
</template>
