<script setup>
defineProps({
  show: { type: Boolean, default: false },
  msg: { type: String, default: '' }
})
</script>

<template>
  <div class="toast" :class="{ show }">{{ msg }}</div>
</template>

<style scoped>
.toast {
  position: fixed;
  bottom: 22px;
  left: 50%;
  transform: translate(-50%, 20px);
  opacity: 0;
  background: #172a20;
  color: white;
  padding: 11px 17px;
  border-radius: 30px;
  font-size: 12px;
  transition: 0.25s;
  z-index: 10;
  pointer-events: none;
}

.toast.show {
  opacity: 1;
  transform: translate(-50%, 0);
}
</style>
