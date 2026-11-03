<script setup>
import { nextTick, ref } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  inputId: { type: String, default: '' },
  suggestions: { type: Array, default: () => [] },
  placeholder: { type: String, default: '输入后按 Enter 添加' },
  max: { type: Number, default: 8 },
  maxLength: { type: Number, default: 30 }
})
const emit = defineEmits(['update:modelValue'])

const draft = ref('')
const inputRef = ref(null)

function update(tags) {
  emit('update:modelValue', tags)
}

function addMany(value) {
  const candidates = value
    .split(/[,，;；\n]/)
    .map((item) => item.trim().slice(0, props.maxLength))
    .filter(Boolean)
  if (!candidates.length) return

  const next = [...props.modelValue]
  for (const item of candidates) {
    if (next.length >= props.max) break
    if (!next.some((tag) => tag.toLowerCase() === item.toLowerCase())) next.push(item)
  }
  update(next)
  draft.value = ''
}

function commit() {
  addMany(draft.value)
}

function remove(index) {
  update(props.modelValue.filter((_, i) => i !== index))
}

function toggle(tag) {
  if (props.modelValue.includes(tag)) {
    update(props.modelValue.filter((item) => item !== tag))
  } else if (props.modelValue.length < props.max) {
    update([...props.modelValue, tag])
  }
}

function onKeydown(event) {
  if (event.isComposing) return
  if (['Enter', ',', '，', ';', '；'].includes(event.key)) {
    event.preventDefault()
    commit()
    return
  }
  if (event.key === 'Backspace' && !draft.value && props.modelValue.length) {
    remove(props.modelValue.length - 1)
  }
}

function onPaste(event) {
  const text = event.clipboardData?.getData('text') || ''
  if (/[,，;；\n]/.test(text)) {
    event.preventDefault()
    addMany(text)
  }
}

function focusInput() {
  nextTick(() => inputRef.value?.focus())
}
</script>

<template>
  <div class="tag-input-wrap">
    <div class="tag-input" @click="focusInput">
      <span v-for="(tag, index) in modelValue" :key="tag" class="input-chip">
        {{ tag }}
        <button type="button" :aria-label="`移除 ${tag}`" @click.stop="remove(index)">×</button>
      </span>
      <input
        ref="inputRef"
        :id="inputId"
        v-model="draft"
        type="text"
        :maxlength="maxLength"
        :placeholder="modelValue.length ? '继续输入…' : placeholder"
        @keydown="onKeydown"
        @paste="onPaste"
        @blur="commit"
      >
    </div>
    <div v-if="suggestions.length" class="tag-suggestions">
      <button
        v-for="tag in suggestions"
        :key="tag"
        type="button"
        :class="{ selected: modelValue.includes(tag) }"
        @click="toggle(tag)"
      >{{ modelValue.includes(tag) ? '✓ ' : '+ ' }}{{ tag }}</button>
    </div>
  </div>
</template>
<style scoped>
.tag-input-wrap {
  width: 100%;
}

.tag-input {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  min-height: 46px;
  border: 1px solid #dfe6e0;
  border-radius: 11px;
  padding: 7px 9px;
  background: #fbfcfb;
  transition: 0.15s;
  cursor: text;
}

.tag-input:focus-within {
  border-color: #6fa68a;
  box-shadow: 0 0 0 3px #e7f3eb;
}

.tag-input input {
  flex: 1 1 120px;
  width: auto;
  min-width: 100px;
  border: 0 !important;
  background: transparent !important;
  padding: 4px 3px !important;
  box-shadow: none !important;
  font-size: 12px;
}

.input-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--green2);
  color: var(--green);
  border: 1px solid #cfe7da;
  border-radius: 8px;
  padding: 5px 7px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.input-chip button {
  border: 0;
  background: transparent;
  color: #4f8069;
  padding: 0;
  font-size: 14px;
  line-height: 1;
}

.input-chip button:hover {
  color: #b54b45;
}

.tag-suggestions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.tag-suggestions button {
  border: 1px solid #e2e8e3;
  background: #fff;
  color: #718078;
  border-radius: 20px;
  padding: 5px 9px;
  font-size: 10px;
  line-height: 1.2;
  transition: 0.15s;
}

.tag-suggestions button:hover {
  border-color: #9ac0aa;
  color: var(--green);
}

.tag-suggestions button.selected {
  border-color: #c9e2d3;
  background: #eff8f2;
  color: var(--green);
  font-weight: 700;
}
</style>