#!/usr/bin/env node
// POC: server-side Markdown -> PDF, no browser/canvas required client-side.
// Usage: node scripts/render-markdown-pdf.mjs <input.md> <output.pdf> [extra-css-file]
import {readFile, writeFile} from 'node:fs/promises'
import {resolve, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {JSDOM} from 'jsdom'
import createDOMPurify from 'dompurify'
import {marked} from 'marked'
import puppeteer from 'puppeteer'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
	const [inputPath, outputPath, extraCssPath] = process.argv.slice(2)

	if (!inputPath || !outputPath) {
		console.error('Usage: node scripts/render-markdown-pdf.mjs <input.md> <output.pdf> [extra-css-file]')
		process.exitCode = 1
		return
	}

	const markdownSource = await readFile(resolve(inputPath), 'utf8')
	const markdownCss = await readFile(resolve(__dirname, '../src/markdown-pdf.css'), 'utf8')
	const extraCss = extraCssPath ? await readFile(resolve(extraCssPath), 'utf8') : ''

	// DOMPurify needs a DOM implementation outside the browser.
	const window = new JSDOM('').window
	const DOMPurify = createDOMPurify(window)

	marked.setOptions({gfm: true, breaks: false})
	const parsed = marked.parse(markdownSource)
	const html = typeof parsed === 'string' ? parsed : ''
	const safeHtml = DOMPurify.sanitize(html, {USE_PROFILES: {html: true}})

	const documentHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { margin: 0; background: #ffffff; }
  ${extraCss}
  ${markdownCss}
</style>
</head>
<body>
  <article class="markdown-pdf">${safeHtml}</article>
</body>
</html>`

	const browser = await puppeteer.launch({headless: true})

	try {
		const page = await browser.newPage()
		await page.setContent(documentHtml, {waitUntil: 'networkidle0'})
		await page.pdf({
			path: resolve(outputPath),
			format: 'a4',
			printBackground: true,
			margin: {top: '20mm', bottom: '20mm', left: '20mm', right: '20mm'}
		})
	} finally {
		await browser.close()
	}

	console.log(`PDF written to ${resolve(outputPath)}`)
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
