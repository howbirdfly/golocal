<script setup>
import { reactive, ref } from 'vue'
import { markets } from '../data/markets'

const props = defineProps({
  market: { type: String, required: true }
})
const emit = defineEmits(['update:market', 'generate'])

const marketList = Object.entries(markets).map(([key, m]) => ({
  key, flag: m.flag, name: m.name, english: m.english
}))

const form = reactive({
  product: '中国风味奶茶',
  selling: '精选茶叶，口感清爽，提供多种创新口味',
  audience: '年轻消费者',
  goal: '新品上市',
  tone: 'warm'
})
const generatedOnce = ref(false)

function selectMarket(key) {
  emit('update:market', key)
}

function onGenerate() {
  generatedOnce.value = true
  emit('generate', { ...form })
}
</script>

<template>
  <aside class="panel form-panel">
    <div class="panel-head"><h2>创建出海方案</h2><span class="step">STEP 01 / 02</span></div>
    <div class="field">
      <label>选择目标市场</label>
      <div class="market-grid">
        <button
          v-for="m in marketList"
          :key="m.key"
          class="market"
          :class="{ active: market === m.key }"
          type="button"
          @click="selectMarket(m.key)"
        >
          <span class="flag">{{ m.flag }}</span><b>{{ m.name }}</b><small>{{ m.english }}</small>
        </button>
      </div>
    </div>
    <div class="field">
      <label for="product">产品 / 品牌名称</label>
      <input id="product" v-model="form.product" placeholder="例如：中国风味奶茶">
    </div>
    <div class="field">
      <label for="selling">产品卖点 <span class="hint">用一句话描述</span></label>
      <textarea id="selling" v-model="form.selling" placeholder="例如：精选茶叶、口感清爽、提供多种口味"></textarea>
    </div>
    <div class="two">
      <div class="field">
        <label for="audience">目标人群</label>
        <select id="audience" v-model="form.audience">
          <option>年轻消费者</option><option>学生群体</option><option>上班族</option><option>家庭用户</option><option>商务客户</option>
        </select>
      </div>
      <div class="field">
        <label for="goal">营销目的</label>
        <select id="goal" v-model="form.goal">
          <option>新品上市</option><option>品牌推广</option><option>节日营销</option><option>门店引流</option>
        </select>
      </div>
    </div>
    <div class="field">
      <label for="tone">文案风格</label>
      <select id="tone" v-model="form.tone">
        <option value="warm">温暖亲切</option><option value="simple">简洁专业</option><option value="young">年轻活泼</option>
      </select>
    </div>
    <button class="primary" type="button" @click="onGenerate">{{ generatedOnce ? '✓ 重新生成方案' : '✦ 生成本地化出海方案' }}</button>
    <div class="bottom-note">提示：本演示版使用内置规则与文案模板生成结果，不调用外部 AI 服务，不上传输入内容。</div>
  </aside>
</template>
