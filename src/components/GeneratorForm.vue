<script setup>
import { computed, reactive, ref } from 'vue'
import TagInput from './TagInput.vue'

const props = defineProps({
  market: { type: String, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['update:market', 'generate'])

const suggestions = {
  audience: ['年轻消费者', '学生群体', '上班族', '家庭用户', '商务客户', '旅行者'],
  goal: ['新品上市', '品牌推广', '节日营销', '门店引流', '社媒种草', '复购提升'],
  tone: ['温暖亲切', '简洁专业', '年轻活泼', '高端克制', '幽默轻松', '真诚可信']
}

const form = reactive({
  product: '中国风味奶茶',
  selling: '精选茶叶，口感清爽，提供多种创新口味',
  audience: ['年轻消费者'],
  goal: ['新品上市'],
  tone: ['温暖亲切']
})
const localError = ref('')
const generatedOnce = ref(false)
const displayError = computed(() => props.error || localError.value)
const targetMarket = computed({
  get: () => props.market,
  set: (value) => emit('update:market', value)
})

function onGenerate() {
  localError.value = ''
  if (!targetMarket.value.trim()) {
    localError.value = '请输入目标国家或市场'
    return
  }
  if (!form.product.trim() || !form.selling.trim()) {
    localError.value = '请填写产品名称和产品卖点'
    return
  }
  if (!form.audience.length || !form.goal.length || !form.tone.length) {
    localError.value = '请至少选择一个目标人群、营销目的和文案风格标签'
    return
  }

  generatedOnce.value = true
  emit('generate', {
    product: form.product,
    selling: form.selling,
    audience: [...form.audience],
    goal: [...form.goal],
    tone: [...form.tone]
  })
}
</script>

<template>
  <aside class="panel form-panel">
    <div class="panel-head"><h2>创建出海方案</h2><span class="step">STEP 01 / 02</span></div>
    <div class="field">
      <label for="target-market">目标国家 / 市场 <span class="hint">支持任意国家或地区</span></label>
      <input
        id="target-market"
        v-model="targetMarket"
        :disabled="loading"
        maxlength="50"
        placeholder="例如：日本、德国、阿联酋"
      >
    </div>
    <div class="field">
      <label for="product">产品 / 品牌名称</label>
      <input id="product" v-model="form.product" :disabled="loading" placeholder="例如：中国风味奶茶">
    </div>
    <div class="field">
      <label for="selling">产品卖点 <span class="hint">用一句话描述</span></label>
      <textarea id="selling" v-model="form.selling" :disabled="loading" placeholder="例如：精选茶叶、口感清爽、提供多种口味"></textarea>
    </div>
    <div class="field">
      <label for="audience">目标人群 <span class="hint">可选择或直接输入</span></label>
      <TagInput
        input-id="audience"
        v-model="form.audience"
        :suggestions="suggestions.audience"
        placeholder="例如：露营爱好者，按 Enter 添加"
      />
    </div>
    <div class="field">
      <label for="goal">营销目的 <span class="hint">可多选</span></label>
      <TagInput
        input-id="goal"
        v-model="form.goal"
        :suggestions="suggestions.goal"
        placeholder="例如：新品首发，按 Enter 添加"
      />
    </div>
    <div class="field">
      <label for="tone">文案风格 <span class="hint">可自定义语气</span></label>
      <TagInput
        input-id="tone"
        v-model="form.tone"
        :suggestions="suggestions.tone"
        placeholder="例如：克制高级，按 Enter 添加"
      />
    </div>

    <p v-if="displayError" class="form-error" role="alert">{{ displayError }}</p>
    <button class="primary" type="button" :disabled="loading" @click="onGenerate">
      <span v-if="loading" class="spinner" aria-hidden="true"></span>
      {{ loading ? 'AI 正在生成方案…' : generatedOnce ? '✦ 重新生成 AI 方案' : '✦ 生成 AI 出海方案' }}
    </button>
    <div class="bottom-note">AI 服务已由平台安全接入，无需填写 API Key。结果仅用于创意演示与初步参考。</div>
  </aside>
</template>

<style scoped>
.form-panel {
  padding: 23px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-head h2 {
  font-size: 18px;
  margin: 0;
}

.step {
  font-size: 11px;
  color: var(--green);
  background: var(--green2);
  padding: 6px 10px;
  border-radius: 30px;
  font-weight: 800;
}

/* ---------- 字段 ---------- */
.field {
  margin-bottom: 18px;
}

label {
  display: block;
  font-size: 13px;
  font-weight: 750;
  margin-bottom: 9px;
}

.hint {
  font-size: 11px;
  color: #8a968f;
  font-weight: 400;
  margin-left: 5px;
}

/* ---------- 输入控件 ---------- */
input,
select,
textarea {
  width: 100%;
  border: 1px solid #dfe6e0;
  border-radius: 11px;
  padding: 12px 13px;
  background: #fbfcfb;
  color: var(--ink);
  outline: none;
  font-size: 13px;
  transition: 0.15s;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #6fa68a;
  box-shadow: 0 0 0 3px #e7f3eb;
}

textarea {
  resize: vertical;
  min-height: 75px;
  line-height: 1.6;
}

.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

/* ---------- 按钮 ---------- */
.primary {
  width: 100%;
  border: 0;
  background: var(--green);
  color: #fff;
  border-radius: 12px;
  padding: 14px;
  font-weight: 800;
  font-size: 14px;
  box-shadow: 0 8px 18px #176b5225;
  transition: 0.18s;
}

.primary:hover {
  background: #105840;
  transform: translateY(-1px);
}


/* ---------- 响应式 ---------- */
@media (max-width: 520px) {
  .form-panel {
    padding: 17px;
  }

  .two {
    grid-template-columns: 1fr;
  }
}

/* ---------- 加载状态与按钮 ---------- */
button:disabled {
  cursor: not-allowed;
  opacity: 0.72;
  transform: none !important;
}

.form-error {
  margin: 0 0 12px;
  border: 1px solid #f0ceca;
  background: #fff4f2;
  color: #9c4038;
  border-radius: 10px;
  padding: 10px 11px;
  font-size: 11px;
  line-height: 1.6;
}

.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid #ffffff66;
  border-top-color: #fff;
  border-radius: 50%;
  vertical-align: -2px;
  margin-right: 5px;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
