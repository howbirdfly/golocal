/**
 * CloudBase 云函数入口
 * 把 ai-proxy 的 (req, res) 风格处理器适配成云函数 HTTP 访问的 (event) → response 形式。
 * 云函数不支持真正的流式输出，SSE 事件会被缓冲成完整文本一次性返回，
 * 前端 src/services/ai.js 已兼容这种降级情形。
 */
import { createAiProxyHandler } from '../server/ai-proxy.js'

const handler = createAiProxyHandler(process.env)

function normalizeHeaders(headers = {}) {
  const result = {}
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined || value === null) continue
    result[key.toLowerCase()] = Array.isArray(value) ? value.join(',') : String(value)
  }
  return result
}

function readBody(event) {
  const raw = event.body
  if (!raw) return ''
  return event.isBase64Encoded ? Buffer.from(raw, 'base64').toString('utf8') : raw
}

function createRequest(event) {
  const headers = normalizeHeaders(event.headers)
  const req = {
    method: (event.httpMethod || event.requestContext?.httpMethod || 'POST').toUpperCase(),
    headers,
    // 直接提供已解析的报文体，让 readJsonBody 跳过流式读取
    body: readBody(event),
    url: event.path || '/api/generate'
  }
  return req
}

function createResponse() {
  const chunks = []
  const headers = {}
  const res = {
    statusCode: 200,
    writableEnded: false,
    setHeader(name, value) {
      headers[name.toLowerCase()] = value
    },
    getHeader(name) {
      return headers[name.toLowerCase()]
    },
    removeHeader(name) {
      delete headers[name.toLowerCase()]
    },
    flushHeaders() {},
    write(chunk) {
      if (res.writableEnded) return true
      chunks.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'))
      return true
    },
    end(chunk) {
      if (chunk !== undefined) res.write(chunk)
      res.writableEnded = true
    },
    toResult() {
      return {
        statusCode: res.statusCode,
        headers: { ...headers },
        body: chunks.join(''),
        isBase64Encoded: false
      }
    }
  }
  return res
}

export async function main(event = {}) {
  const req = createRequest(event)
  const res = createResponse()

  try {
    await handler(req, res)
  } catch (error) {
    console.error('[GoLocal AI] 云函数执行失败', error)
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'AI 服务暂时不可用，请稍后重试' }),
      isBase64Encoded: false
    }
  }

  return res.toResult()
}
