import fs from 'node:fs/promises'
import path from 'node:path'
import { marked } from 'marked'
import puppeteer from 'puppeteer'

async function main() {
  const cwd = process.cwd()
  const inputPath = path.resolve(cwd, process.argv[2] || 'uniapp-interview-qa.md')
  const cssPath = path.resolve(cwd, process.argv[3] || 'pdf.css')
  const outputPath = path.resolve(cwd, process.argv[4] || 'uniapp-interview-qa.pdf')

  const [md, css] = await Promise.all([
    fs.readFile(inputPath, 'utf8'),
    fs.readFile(cssPath, 'utf8').catch(() => ''),
  ])

  // Configure marked for stable rendering
  marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: true,
    mangle: false,
  })

  const htmlContent = marked.parse(md)

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>uni-app 面试题（含答案）</title>
  <style>
  ${css}
  </style>
  <style>
    /* Extra tweaks for print */
    body { counter-reset: h4; }
    h4 { page-break-after: avoid; }
    pre, blockquote, table { page-break-inside: avoid; }
    code { white-space: pre-wrap; }
  </style>
  </head>
<body>
${htmlContent}
</body>
</html>`

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '16mm', right: '12mm', bottom: '16mm', left: '12mm' },
    })
  } finally {
    await browser.close()
  }
  console.log(`PDF exported: ${outputPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

