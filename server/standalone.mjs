import http from 'node:http'
import { createAiProxyHandler } from './ai-proxy.js'

const host = process.env.HOST || '127.0.0.1'
const port = Number.parseInt(process.env.PORT || '3100', 10)
const handler = createAiProxyHandler(process.env)

const server = http.createServer(async (req, res) => {
  if (req.url === '/healthz') {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ ok: true }))
    return
  }

  try {
    await handler(req, res)
  } catch (error) {
    console.error('[GoLocal server]', error)
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: '服务器内部错误' }))
    } else {
      res.end()
    }
  }
})

server.listen(port, host, () => {
  console.log(`GoLocal server listening on http://${host}:${port}`)
})

function shutdown() {
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 5000).unref()
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)