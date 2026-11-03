<script setup>
defineProps({
  result: { type: Object, required: true },
  generated: { type: Boolean, default: false }
})
const emit = defineEmits(['copy'])

function copy(text) {
  emit('copy', text)
}
</script>

<template>
  <section class="panel result-panel">
    <div class="result-head">
      <div><h2>本地化方案预览</h2><p>生成适配建议，让出海表达更贴近目标市场。</p></div>
      <span class="tag">GOLOCAL STUDIO</span>
    </div>
    <div v-if="!generated" class="empty">
      <div class="empty-icon">✧</div>
      <b>你的出海方案将在这里呈现</b>
      <p>先选择目标市场，填写产品信息，再点击左侧按钮。系统将生成营销文案建议、语言表达参考与文化风险检查清单。</p>
    </div>
    <div v-else class="results show">
      <div class="result-banner">
        <div><strong>{{ result.title }}</strong><br><span>{{ result.sub }}</span></div>
        <span class="tag">已生成方案</span>
      </div>
      <div class="result-section">
        <div class="sec-title"><b>01 / 本地化中文文案</b><button class="copy" type="button" @click="copy(result.cn)">复制文案</button></div>
        <div class="copy-text">{{ result.cn }}</div>
        <div class="localized">
          <div class="lang">{{ result.langLabel }}</div>
          <div class="copy-text">{{ result.local }}</div>
        </div>
        <div class="bottom-note">外语短句为展示用参考表达，正式发布前建议由目标市场母语者校对。</div>
      </div>
      <div class="result-section">
        <div class="sec-title"><b>02 / 跨文化风险提示</b><button class="copy" type="button" @click="copy(result.riskText)">复制提示</button></div>
        <div class="risk-list">
          <div v-for="(risk, i) in result.risks" :key="i" class="risk">
            <span class="dot"></span><span>{{ risk }}</span>
          </div>
        </div>
      </div>
      <div class="result-section">
        <div class="sec-title"><b>03 / 市场适配建议</b><small>可执行的下一步</small></div>
        <div class="tip-grid">
          <div v-for="([title, text], i) in result.tips" :key="i" class="tip">
            <b>{{ title }}</b>{{ text }}
          </div>
        </div>
      </div>
      <div class="bottom-note">免责声明：结果由本地规则模板生成，仅用于创意演示与初步参考，不构成专业翻译、法律或市场准入意见。涉及商标、广告宣称、标签及当地法规时，请进行专业核验。</div>
    </div>
  </section>
</template>
