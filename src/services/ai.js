function parseSseBlock(block) {
  let event = 'message'
  const dataLines = []

  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart())
  }

  if (!dataLines.length) return null
  return {
    event,
    data: JSON.parse(dataLines.join('\n'))
  }
}

export async function generatePlan(payload, { onProgress } = {}) {
  let response
  try {
    response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  } catch {
    throw new Error('无法连接 AI 服务，请稍后重试')
  }

  const contentType = response.headers.get('content-type') || ''
  if (!response.ok || !contentType.includes('text/event-stream')) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.error || `AI 方案生成失败（${response.status}）`)
  }

  if (!response.body) throw new Error('当前浏览器不支持流式输出，请升级浏览器后重试')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let result = null

  function handleBlock(block) {
    const parsed = parseSseBlock(block.trim())
    if (!parsed) return

    if (parsed.event === 'progress') {
      onProgress?.(parsed.data)
    } else if (parsed.event === 'result') {
      result = parsed.data.result
    } else if (parsed.event === 'error') {
      throw new Error(parsed.data?.error || 'AI 方案生成失败')
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
    const blocks = buffer.split(/\r?\n\r?\n/)
    buffer = blocks.pop() || ''
    for (const block of blocks) handleBlock(block)
    if (done) break
  }

  if (buffer.trim()) handleBlock(buffer)
  if (!result) throw new Error('AI 未返回完整方案，请重试')
  return result
}