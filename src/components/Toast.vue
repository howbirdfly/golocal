<script setup>
defineProps({
  show: { type: Boolean, default: false },
  msg: { type: String, default: '' }
})
</script>

<template>
  <div class="toast" :class="{ show }">{{ msg }}</div>
</template>
