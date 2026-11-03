import http from 'node:http'
import https from 'node:https'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { markets } from '../src/data/markets.js'

const DEFAULT_MODEL = 'kimi-k3.1-pro-highspeed'
const DEFAULT_BASE_URL = 'https://api.moonshot.cn/v1'
const DEFAULT_PROVIDER_NAME = 'Kimi'
const DEFAULT_MAX_TOKENS = 8000
const MAX_BODY_BYTES = 64 * 1024
const MODEL_PATTERN = /^[a-zA-Z0-9._:-]{2,80}$/

const SYSTEM_PROMPT = `你是 GoLocal 的资深跨文化出海策略师。你擅长为消费品牌制定符合目标市场语境、用户习惯和广告合规要求的本地化营销方案。你的判断必须具体、可执行、简洁，并明确提示需要专业复核的事项。你只能输出一个合法 JSON 对象，不得输出 Markdown、注释或额外说明。`

function sendJson(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(data))
}

function startSse(res) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders?.()
}

function writeSse(res, event, data) {
  if (res.writableEnded) return
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function cleanTags(value, maxCount = 8, maxLength = 30) {
  if (!Array.isArray(value)) return []
  return [...new Set(
    value
      .map((item) => cleanText(item, maxLength))
      .filter(Boolean)
  )].slice(0, maxCount)
}

function parseMaybeJson(value) {
  try {
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

async function readJsonBody(req) {
  if (req.body !== undefined) {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body
    const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body)
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
      const error = new Error('请求内容过大')
      error.statusCode = 413
      throw error
    }
    const parsed = parseMaybeJson(raw)
    if (parsed === null) {
      const error = new Error('请求内容不是有效的 JSON')
      error.statusCode = 400
      throw error
    }
    return parsed
  }

  let body = ''
  for await (const chunk of req) {
    body += chunk
    if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
      const error = new Error('请求内容过大')
      error.statusCode = 413
      throw error
    }
  }

  const parsed = parseMaybeJson(body || '{}')
  if (parsed === null) {
    const error = new Error('请求内容不是有效的 JSON')
    error.statusCode = 400
    throw error
  }
  return parsed
}

function extractPartialString(text, key) {
  const marker = `"${key}"`
  const keyIndex = text.indexOf(marker)
  if (keyIndex < 0) return ''

  let index = keyIndex + marker.length
  while (index < text.length && /\s/.test(text[index])) index++
  if (text[index] !== ':') return ''
  index++
  while (index < text.length && /\s/.test(text[index])) index++
  if (text[index] !== '"') return ''
  index++

  let output = ''
  let escaped = false
  for (; index < text.length; index++) {
    const char = text[index]
    if (escaped) {
      if (char === 'u') {
        const hex = text.slice(index + 1, index + 5)
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) break
        output += String.fromCharCode(Number.parseInt(hex, 16))
        index += 4
      } else if (char === 'n') output += '\n'
      else if (char === 'r') output += '\r'
      else if (char === 't') output += '\t'
      else output += char
      escaped = false
    } else if (char === '\\') {
      escaped = true
    } else if (char === '"') {
      break
    } else {
      output += char
    }
  }
  return output
}

function readApiKey(env) {
  const key = readEnv(env, 'LLM_API_KEY') || readEnv(env, 'DEEPSEEK_API_KEY')
  return cleanText(key, 300).replace(/^Bearer\s+/i, '')
}

function readEnv(env, key) {
  return env?.[key] || process.env?.[key] || ''
}

function requestUpstream(urlString, body, headers, env, handlers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString)
    const isLocalTestUrl = url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname)
    if (url.protocol !== 'https:' && !isLocalTestUrl) {
      reject(new Error('AI 服务地址必须使用 HTTPS'))
      return
    }

    const proxyUrl = cleanText(
      readEnv(env, 'HTTPS_PROXY') || readEnv(env, 'https_proxy') || readEnv(env, 'HTTP_PROXY') || readEnv(env, 'http_proxy'),
      300
    )
    const agent = proxyUrl && url.protocol === 'https:' ? new HttpsProxyAgent(proxyUrl) : undefined
    const transport = url.protocol === 'http:' ? http : https
    const request = transport.request(url, {
      method: 'POST',
      agent,
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(body, 'utf8')
      }
    }, (response) => {
      const ok = response.statusCode >= 200 && response.statusCode < 300
      let raw = ''
      let lineBuffer = ''
      let outputText = ''
      let finishReason = null
      response.setEncoding('utf8')

      if (ok) handlers.onOpen?.()

      response.on('data', (chunk) => {
        raw += chunk
        if (!ok) return

        lineBuffer += chunk
        const lines = lineBuffer.split(/\r?\n/)
        lineBuffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (!payload || payload === '[DONE]') continue
          const event = parseMaybeJson(payload)
          if (!event) continue
          const choice = event.choices?.[0]
          if (choice?.finish_reason) finishReason = choice.finish_reason

          // 推理模型会先流式输出 reasoning_content，这段不计入正文
          const reasoning = choice?.delta?.reasoning_content
          if (typeof reasoning === 'string' && reasoning) {
            handlers.onReasoning?.(reasoning)
          }

          const delta = choice?.delta?.content
          if (typeof delta === 'string' && delta) {
            outputText += delta
            handlers.onDelta?.(delta, outputText)
          }
        }
      })

      response.on('end', () => {
        if (ok && !outputText) {
          const data = parseMaybeJson(raw)
          const content = data?.choices?.[0]?.message?.content
          if (typeof content === 'string') outputText = content
          finishReason ||= data?.choices?.[0]?.finish_reason
        }

        resolve({
          ok,
          status: response.statusCode,
          raw,
          outputText,
          finishReason
        })
      })
    })

    request.setTimeout(60000, () => request.destroy(new Error('AI 服务请求超时')))
    request.on('error', reject)
    request.end(body)
  })
}

function normalizePlan(plan) {
  const risks = cleanTags(plan?.risks, 5, 90)
  const tips = Array.isArray(plan?.tips)
    ? plan.tips
        .map((tip) => ({
          title: cleanText(tip?.title, 24),
          text: cleanText(tip?.text, 100)
        }))
        .filter((tip) => tip.title && tip.text)
        .slice(0, 5)
    : []

  if (!cleanText(plan?.cn, 2000) || !cleanText(plan?.local, 2000) || risks.length < 3 || tips.length < 3) {
    throw new Error('AI 返回的结构化方案不完整，请重试')
  }

  return {
    title: cleanText(plan.title, 60),
    sub: cleanText(plan.sub, 120),
    cn: cleanText(plan.cn, 2000),
    langLabel: cleanText(plan.langLabel, 40),
    local: cleanText(plan.local, 2000),
    risks,
    tips
  }
}

function buildUserPrompt(payload, market) {
  return `请为以下品牌需求生成一份可执行的出海本地化方案。

目标市场：${market.name}（${market.english}）
产品 / 品牌名称：${payload.product}
产品卖点：${payload.selling}
目标人群标签：${payload.audience.join('、')}
营销目的标签：${payload.goal.join('、')}
文案风格标签：${payload.tone.join('、')}

请严格按以下 JSON 结构返回，必须包含全部字段：
{"title":"方案标题","sub":"一句话概述","cn":"简体中文文案","langLabel":"目标语言说明","local":"目标语言文案","risks":["风险1","风险2","风险3"],"tips":[{"title":"建议标题","text":"具体建议"}]}

输出约束：
1. title：12-24 个中文字符，并明确目标市场。
2. sub：不超过 50 个中文字符。
3. cn：120-240 个中文字符，自然融入全部标签，避免重复和空泛描述。
4. langLabel：不超过 16 个中文字符，例如“日语表达参考”。
5. local：80-180 个目标语言字符，表达自然、地道，避免逐字翻译。
6. risks：3-5 条，每条不超过 60 个中文字符。
7. tips：3-5 条，每条 title 不超过 8 个字，text 不超过 50 个中文字符。
8. 不要虚构产品认证、销量、功效或用户评价；涉及法规、食品标签和广告宣称时必须提醒专业复核。
9. 只返回合法 JSON，不要输出 Markdown、代码块或额外解释。`
}

export function createAiProxyHandler(env = {}) {
  return async function aiProxyHandler(req, res) {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: '仅支持 POST 请求' })
      return
    }

    const wantsStream = String(req.headers.accept || '').includes('text/event-stream')
    let streamStarted = false
    let lastProgressAt = 0

    function emitProgress(outputText, force = false) {
      if (!wantsStream || !streamStarted) return
      const now = Date.now()
      if (!force && now - lastProgressAt < 250) return
      lastProgressAt = now
      writeSse(res, 'progress', {
        characters: outputText.length,
        preview: {
          cn: extractPartialString(outputText, 'cn'),
          local: extractPartialString(outputText, 'local')
        }
      })
    }

    function sendFailure(status, message) {
      if (streamStarted) {
        writeSse(res, 'error', { error: message })
        res.end()
      } else {
        sendJson(res, status, { error: message })
      }
    }

    try {
      const payload = await readJsonBody(req)
      const marketKey = cleanText(payload.market, 10).toLowerCase()
      const market = markets[marketKey]

      if (!market) {
        sendFailure(400, '请选择有效的目标市场')
        return
      }

      const normalized = {
        market: marketKey,
        product: cleanText(payload.product, 120),
        selling: cleanText(payload.selling, 800),
        audience: cleanTags(payload.audience),
        goal: cleanTags(payload.goal),
        tone: cleanTags(payload.tone)
      }

      if (!normalized.product || !normalized.selling || !normalized.audience.length || !normalized.goal.length || !normalized.tone.length) {
        sendFailure(400, '请完整填写产品信息，并至少选择一个目标人群、营销目的和文案风格标签')
        return
      }

      const apiKey = readApiKey(env)
      if (!apiKey) {
        sendFailure(503, '服务端尚未配置 LLM_API_KEY，请在部署平台的环境变量中添加后重新部署。')
        return
      }

      // 兼容 LLM_* 与旧版 DEEPSEEK_* 变量名；默认指向 Moonshot（Kimi）
      const readOption = (name) => readEnv(env, `LLM_${name}`) || readEnv(env, `DEEPSEEK_${name}`)
      const providerName = cleanText(readOption('PROVIDER_NAME'), 20) || DEFAULT_PROVIDER_NAME
      const configuredModel = cleanText(readOption('MODEL'), 80)
      const model = MODEL_PATTERN.test(configuredModel) ? configuredModel : DEFAULT_MODEL
      const baseUrl = (cleanText(readOption('BASE_URL'), 300) || DEFAULT_BASE_URL).replace(/\/+$/, '')
      const configuredMaxTokens = Number.parseInt(readOption('MAX_TOKENS'), 10)
      const maxTokens = Number.isFinite(configuredMaxTokens)
        ? Math.min(Math.max(configuredMaxTokens, 2000), 8000)
        : DEFAULT_MAX_TOKENS

      // 推理模型（如 kimi-k3 系列）只接受默认 temperature，未显式配置时不传该字段
      const configuredTemperature = Number.parseFloat(readOption('TEMPERATURE'))
      const temperature = Number.isFinite(configuredTemperature)
        ? Math.min(Math.max(configuredTemperature, 0), 2)
        : null

      const requestBody = JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(normalized, market) }
        ],
        response_format: { type: 'json_object' },
        max_tokens: maxTokens,
        ...(temperature === null ? {} : { temperature }),
        stream: true
      })

      const upstream = await requestUpstream(`${baseUrl}/chat/completions`, requestBody, {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }, env, {
        onOpen() {
          if (!wantsStream) return
          startSse(res)
          streamStarted = true
          writeSse(res, 'progress', {
            characters: 0,
            preview: { cn: '', local: '' },
            message: `${providerName} 已连接，正在生成方案…`
          })
        },
        onDelta(_delta, outputText) {
          emitProgress(outputText)
        },
        onReasoning() {
          // 推理阶段正文还没开始，用轻量提示让前端知道仍在工作
          if (!wantsStream || !streamStarted) return
          const now = Date.now()
          if (now - lastProgressAt < 800) return
          lastProgressAt = now
          writeSse(res, 'progress', {
            characters: 0,
            preview: { cn: '', local: '' },
            message: `${providerName} 正在思考并组织文案…`
          })
        }
      })

      if (!upstream.ok) {
        const data = parseMaybeJson(upstream.raw)
        const message = data?.error?.message || `${providerName} 服务请求失败（${upstream.status}）`
        sendFailure(upstream.status === 401 ? 401 : 502, message)
        return
      }

      if (upstream.finishReason === 'length') {
        sendFailure(502, `AI 输出超过 ${maxTokens} tokens 上限被截断（含推理消耗），请缩短产品卖点或调高 LLM_MAX_TOKENS 后重试`)
        return
      }

      if (!upstream.outputText) {
        sendFailure(502, `${providerName} 未返回可用的方案内容，请重试`)
        return
      }

      let plan
      try {
        plan = JSON.parse(upstream.outputText.replace(/^```json\s*|\s*```$/g, ''))
      } catch {
        sendFailure(502, 'AI 返回内容无法解析，请重试')
        return
      }

      const result = normalizePlan(plan)
      if (streamStarted) {
        writeSse(res, 'result', { result, model })
        res.end()
      } else {
        sendJson(res, 200, { result, model })
      }
    } catch (error) {
      const status = error.statusCode || 500
      if (status >= 500) console.error('[GoLocal AI]', error.message)
      sendFailure(status, error.message || 'AI 方案生成失败，请稍后重试')
    }
  }
}