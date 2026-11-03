/**
 * 打包 CloudBase 云函数
 * 云函数只能上传自身目录，因此用 esbuild 把 ai-proxy 及其依赖打包成单文件，
 * 产物：dist-cloudbase/functions/generate/{index.js, package.json}
 */
import { build } from 'esbuild'
import { mkdir, rm, writeFile } from 'node:fs/promises'

const outDir = 'dist-cloudbase/functions/generate'

await rm(outDir, { recursive: true, force: true })
await mkdir(outDir, { recursive: true })

await build({
  entryPoints: ['cloudbase/index.js'],
  outfile: `${outDir}/index.js`,
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  minify: false,
  logLevel: 'info'
})

await writeFile(
  `${outDir}/package.json`,
  JSON.stringify({ name: 'generate', version: '1.0.0', main: 'index.js' }, null, 2) + '\n',
  'utf8'
)

console.log(`[cloudbase] 云函数产物已生成：${outDir}`)
