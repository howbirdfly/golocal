<script setup>
import { reactive, ref } from 'vue'
import TopBar from './components/TopBar.vue'
import HeroSection from './components/HeroSection.vue'
import GeneratorForm from './components/GeneratorForm.vue'
import ResultPanel from './components/ResultPanel.vue'
import Toast from './components/Toast.vue'
import { markets } from './data/markets'

const currentMarket = ref('jp')
const generated = ref(false)
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
  toastTimer = setTimeout(() => (toast.show = false), 1600)
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

function generate(form) {
  const m = markets[currentMarket.value]
  const product = form.product.trim() || '我们的产品'
  const selling = form.selling.trim() || '优质产品与贴心体验'
  const lead = m.copyLead[form.tone]
  result.title = `${m.name}市场 · 本地化建议`
  result.sub = `${product} · ${form.goal}`
  result.cn = `${lead}\n\n${product}，${selling}。\n面向${form.audience}，围绕${form.goal}场景，建议以清晰、真实、有吸引力的方式介绍产品特色，邀请目标用户进一步了解。`
  result.langLabel = m.language
  result.local = m.phrases[form.tone]
  result.risks = m.risks
  result.riskText = m.risks.map((x, i) => `${i + 1}. ${x}`).join('\n')
  result.tips = m.tips
  generated.value = true
}
</script>

<template>
  <TopBar />
  <main class="wrap">
    <HeroSection />
    <section class="layout">
      <GeneratorForm v-model:market="currentMarket" @generate="generate" />
      <div class="right-col">
        <ResultPanel :result="result" :generated="generated" @copy="copyText" />
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
      <span>概念验证原型 · 规则模板驱动 · 离线可运行</span>
    </div>
  </main>
  <Toast :show="toast.show" :msg="toast.msg" />
</template>
