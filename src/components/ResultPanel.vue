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

<style scoped>
.result-panel {
  padding: 23px;
  min-height: 500px;
}

/* ---------- 头部 ---------- */
.result-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}

.result-head h2 {
  font-size: 18px;
  margin: 0 0 5px;
}

.result-head p {
  font-size: 12px;
  color: var(--muted);
  margin: 0;
}

.tag {
  font-size: 10px;
  background: #f0f4ef;
  color: #63746a;
  padding: 7px 10px;
  border-radius: 30px;
  white-space: nowrap;
}

/* ---------- 空状态 ---------- */
.empty {
  min-height: 370px;
  border: 1px dashed #d5ded6;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 25px;
  color: var(--muted);
}

.empty-icon {
  width: 66px;
  height: 66px;
  border-radius: 22px;
  background: #eef5ef;
  display: grid;
  place-items: center;
  font-size: 31px;
  margin-bottom: 14px;
}

.empty b {
  color: var(--ink);
  font-size: 15px;
  margin-bottom: 7px;
}

.empty p {
  font-size: 12px;
  line-height: 1.8;
  max-width: 310px;
  margin: 0;
}

/* ---------- 结果内容 ---------- */
.results {
  display: none;
}

.results.show {
  display: block;
}

.result-banner {
  background: #eff6ef;
  border-radius: 15px;
  padding: 15px 17px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.result-banner strong {
  font-size: 14px;
}

.result-banner span {
  font-size: 11px;
  color: var(--muted);
}

.result-section {
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
}

.sec-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.sec-title b {
  font-size: 13px;
}

.sec-title small {
  color: var(--muted);
  font-size: 10px;
}

.copy {
  border: 0;
  background: #edf5ef;
  color: var(--green);
  font-size: 10px;
  font-weight: 800;
  border-radius: 8px;
  padding: 7px 10px;
}

.copy:hover {
  background: #dceee1;
}

.copy-text {
  font-size: 13px;
  line-height: 1.85;
  white-space: pre-wrap;
  color: #35443b;
}

.localized {
  background: #f8faf8;
  border-radius: 10px;
  padding: 12px;
  margin-top: 10px;
}

.localized .lang {
  font-size: 10px;
  color: var(--muted);
  font-weight: 800;
  margin-bottom: 5px;
}

/* ---------- 风险提示 ---------- */
.risk-list {
  display: grid;
  gap: 9px;
}

.risk {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  font-size: 12px;
  line-height: 1.7;
  color: #46544b;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #e4a24d;
  flex: none;
  margin-top: 7px;
}

/* ---------- 适配建议 ---------- */
.tip-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
}

.tip {
  background: #f7f9f7;
  border-radius: 10px;
  padding: 11px;
  font-size: 11px;
  line-height: 1.7;
  color: #58665d;
}

.tip b {
  display: block;
  color: #26372d;
  font-size: 11px;
  margin-bottom: 3px;
}

/* ---------- 响应式 ---------- */
@media (max-width: 520px) {
  .result-panel {
    padding: 17px;
  }
}
</style>
