<script setup>
import { reactive, ref } from 'vue'
import TopBar from './components/TopBar.vue'
import HeroSection from './components/HeroSection.vue'
import GeneratorForm from './components/GeneratorForm.vue'
import ResultPanel from './components/ResultPanel.vue'
import Toast from './components/Toast.vue'
import { generatePlan } from './services/ai'

const currentMarket = ref('jp')
const generated = ref(false)
const loading = ref(false)
const generationError = ref('')
const streamState = reactive({
  characters: 0,
  message: '',
  preview: { cn: '', local: '' }
})
const result = reactive({
  title: '',
  sub: '',
  cn: '',
  langLabel: '',
  local: '',
  risks: [],
  riskText: '',
  tips: []
})
const toast = reactive({ show: false, msg: '' })
let toastTimer = null

function showToast(msg) {
  toast.msg = msg
  toast.show = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.show = false), 2200)
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
  showToast('已复制到剪贴板')
}

async function generate(form) {
  if (loading.value) return

  loading.value = true
  generationError.value = ''
  streamState.characters = 0
  streamState.message = ''
  streamState.preview.cn = ''
  streamState.preview.local = ''

  try {
    const plan = await generatePlan({
      market: currentMarket.value,
      ...form
    }, {
      onProgress(progress) {
        streamState.characters = progress.characters || 0
        streamState.message = progress.message || ''
        streamState.preview.cn = progress.preview?.cn || ''
        streamState.preview.local = progress.preview?.local || ''
      }
    })

    Object.assign(result, plan)
    result.riskText = plan.risks.map((item, index) => `${index + 1}. ${item}`).join('\n')
    generated.value = true
    showToast('AI 出海方案已生成')
  } catch (error) {
    generationError.value = error.message
    showToast(error.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <TopBar />
  <main class="wrap">
    <HeroSection />
    <section class="layout">
      <GeneratorForm
        v-model:market="currentMarket"
        :loading="loading"
        :error="generationError"
        @generate="generate"
      />
      <div class="right-col">
        <ResultPanel :result="result" :generated="generated" :loading="loading" :stream="streamState" @copy="copyText" />
        <section class="panel" style="padding:18px 21px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="font-size:24px">💡</div>
            <div>
              <b style="font-size:13px">为什么需要本地化？</b>
              <div style="font-size:11px;color:var(--muted);line-height:1.7;margin-top:4px">
                出海不只是把文字翻译成另一种语言，更要考虑目标用户的语境、文化习惯与当地市场要求。
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
    <div class="footer">
      <span>GoLocal · 跨文化出海本地化助手</span>
      <span>AI 服务由平台安全接入 · 方案仅供初步参考</span>
    </div>
  </main>
  <Toast :show="toast.show" :msg="toast.msg" />
</template>