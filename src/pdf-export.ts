import html2canvas from 'html2canvas'
import {jsPDF} from 'jspdf'
import DOMPurify from 'dompurify'
import {marked} from 'marked'
import {renderPdfFromTextBlocks} from './pdf-text-fallback'
import './markdown-pdf.css'

type ExportPdfOptions = {
	fileName: string
}

export type PdfRenderMode = 'canvas' | 'fallback'

const PAGE_FORMAT = 'a4'
const PAGE_UNIT = 'mm'
const PAGE_MARGIN_MM = 20
const PAGE_BOTTOM_MARGIN_MM = 20
const RENDER_WIDTH_PX = 980

function sanitizeFileName(fileName: string): string {
	const normalized = fileName.replace(/\.md$/i, '').trim() || 'markdown-export'
	return `${normalized.replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-')}.pdf`
}

function createExportElement(markdownSource: string): HTMLElement {
	const parsed = marked.parse(markdownSource)
	const html = typeof parsed === 'string' ? parsed : ''
	const exportElement = document.createElement('article')
	exportElement.className = 'markdown-pdf'
	exportElement.innerHTML = DOMPurify.sanitize(html, {
		USE_PROFILES: {html: true}
	})
	return exportElement
}

function hasRenderableContent(element: HTMLElement): boolean {
	return Boolean(element.textContent?.trim() || element.querySelector('img, table, hr, pre'))
}

async function waitForFonts() {
	if ('fonts' in document) {
		await (document as Document & {fonts: FontFaceSet}).fonts.ready
	}
}

const LIST_MARKER_COLOR = '#334155'
const UNORDERED_MARKER_GLYPHS = ['•', '◦', '▪']

function getListDepth(list: Element, root: Element): number {
	let depth = 0
	let current = list.parentElement
	while (current && current !== root) {
		const tag = current.tagName.toLowerCase()
		if (tag === 'ul' || tag === 'ol') {
			depth += 1
		}
		current = current.parentElement
	}
	return depth
}

// Loose list items wrap their content in block elements; the marker must be
// inserted inside the first text block or it would land on its own line.
// Returns null when the item starts with a block the marker cannot join.
function findMarkerTarget(item: HTMLElement): HTMLElement | null {
	let node: ChildNode | null = item.firstChild
	while (node && node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
		node = node.nextSibling
	}
	if (!node || node.nodeType !== Node.ELEMENT_NODE) {
		return item
	}
	const tag = (node as HTMLElement).tagName.toLowerCase()
	if (/^(p|h[1-6])$/.test(tag)) {
		return node as HTMLElement
	}
	if (/^(ul|ol|pre|blockquote|table|div|details|figure)$/.test(tag)) {
		return null
	}
	return item
}

// html2canvas ignores ::marker styling and misplaces native list markers, so
// the offscreen clone gets real inline-text markers instead.
function inlineListMarkers(clone: HTMLElement) {
	for (const list of clone.querySelectorAll<HTMLElement>('ul, ol')) {
		const ordered = list.tagName.toLowerCase() === 'ol'
		const start = ordered ? Number(list.getAttribute('start') || '1') : 1
		const depth = getListDepth(list, clone)
		const glyph = UNORDERED_MARKER_GLYPHS[Math.min(depth, UNORDERED_MARKER_GLYPHS.length - 1)]
		let index = start

		for (const child of Array.from(list.children)) {
			if (child.tagName.toLowerCase() !== 'li') {
				continue
			}
			const item = child as HTMLElement
			const currentIndex = index
			index += 1

			item.style.listStyle = 'none'
			if (
				item.querySelector(
					':scope > input[type="checkbox"], :scope > p:first-child > input[type="checkbox"]'
				)
			) {
				continue
			}

			// The marker sits inside the list padding (inline-block pulled left by
			// its own width) so it can never be clipped at the container edge.
			const marker = document.createElement('span')
			marker.setAttribute('aria-hidden', 'true')
			marker.textContent = ordered ? `${currentIndex}.` : glyph
			marker.style.display = 'inline-block'
			marker.style.width = '1.45rem'
			marker.style.marginLeft = '-1.75rem'
			marker.style.marginRight = '0.3rem'
			marker.style.textAlign = 'right'
			marker.style.whiteSpace = 'nowrap'
			marker.style.color = LIST_MARKER_COLOR
			marker.style.fontWeight = '600'

			const target = findMarkerTarget(item)
			if (target) {
				target.insertBefore(marker, target.firstChild)
			} else {
				// The item starts with a non-text block (code, nested list, quote):
				// hang the marker in the list padding beside it.
				marker.style.position = 'absolute'
				marker.style.left = '-1.75rem'
				marker.style.marginLeft = '0'
				marker.style.marginRight = '0'
				item.style.position = 'relative'
				item.insertBefore(marker, item.firstChild)
			}
		}
	}
}

// html2canvas draws the background of padded inline elements at the wrong
// vertical offset; inline-block renders correctly. The inner span lifts the
// text a couple of pixels to counter html2canvas painting text lower than
// the browser, keeping it centered in the background box.
function fixInlineCodeRendering(clone: HTMLElement) {
	for (const code of clone.querySelectorAll<HTMLElement>('code')) {
		if (code.parentElement?.tagName.toLowerCase() === 'pre') {
			continue
		}
		code.style.display = 'inline-block'
		code.style.lineHeight = '1.25'

		const inner = document.createElement('span')
		inner.style.position = 'relative'
		inner.style.top = '-2px'
		while (code.firstChild) {
			inner.appendChild(code.firstChild)
		}
		code.appendChild(inner)
	}
}

// html2canvas paints line-through decorations too high; replace them with a
// background gradient line positioned to cross the (lower-painted) text.
function fixStrikethroughRendering(clone: HTMLElement) {
	for (const struck of clone.querySelectorAll<HTMLElement>('del, s, strike')) {
		struck.style.textDecoration = 'none'
		struck.style.backgroundImage = 'linear-gradient(#1e293b, #1e293b)'
		struck.style.backgroundRepeat = 'no-repeat'
		struck.style.backgroundSize = '100% 1px'
		struck.style.backgroundPosition = '0 97%'
	}
}

// Padded blocks suffer from the same lower-painted text: shift the padding
// upward (less top, more bottom) so the content sits visually centered.
function fixBlockPaddingRendering(clone: HTMLElement) {
	for (const pre of clone.querySelectorAll<HTMLElement>('pre')) {
		pre.style.paddingTop = '0.45rem'
		pre.style.paddingBottom = '1.15rem'
	}
	for (const quote of clone.querySelectorAll<HTMLElement>('blockquote')) {
		quote.style.paddingTop = '0.25rem'
		quote.style.paddingBottom = '0.85rem'
	}
}

// html2canvas paints text a few pixels lower than the browser, so heading
// underlines need extra bottom padding to keep the preview's visual gap.
function fixHeadingDividerRendering(clone: HTMLElement) {
	for (const heading of clone.querySelectorAll<HTMLElement>('h1')) {
		heading.style.paddingBottom = '1.5rem'
	}
	for (const heading of clone.querySelectorAll<HTMLElement>('h2')) {
		heading.style.paddingBottom = '1.2rem'
	}
}

function createRenderContainer(exportElement: HTMLElement): HTMLElement {
	const container = document.createElement('section')
	container.setAttribute('aria-hidden', 'true')
	container.style.position = 'fixed'
	container.style.left = '-10000px'
	container.style.top = '0'
	container.style.width = `${RENDER_WIDTH_PX}px`
	container.style.background = '#ffffff'
	container.style.boxSizing = 'border-box'
	container.style.overflow = 'visible'
	// Keeps descenders of the last text line off the canvas edge.
	container.style.paddingBottom = '8px'

	// The portable stylesheet uses hex fallbacks, which html2canvas can parse.
	const clone = exportElement.cloneNode(true) as HTMLElement
	clone.style.color = '#1e293b'
	clone.style.maxHeight = 'none'
	clone.style.overflow = 'visible'
	clone.style.background = '#ffffff'

	inlineListMarkers(clone)
	fixInlineCodeRendering(clone)
	fixStrikethroughRendering(clone)
	fixHeadingDividerRendering(clone)
	fixBlockPaddingRendering(clone)

	container.appendChild(clone)
	document.body.appendChild(container)
	return container
}

async function renderCanvas(exportElement: HTMLElement): Promise<HTMLCanvasElement> {
	await waitForFonts()
	const container = createRenderContainer(exportElement)

	try {
		return await html2canvas(container, {
			backgroundColor: '#ffffff',
			useCORS: true,
			// Fixed scale keeps the output sharp (~300 DPI) regardless of the
			// user's screen; devicePixelRatio would drop to 1 on non-retina.
			scale: 2,
			logging: false
		})
	} finally {
		container.remove()
	}
}

function renderPdfFromCanvas(canvas: HTMLCanvasElement): jsPDF {
	const pdf = new jsPDF({
		orientation: 'portrait',
		unit: PAGE_UNIT,
		format: PAGE_FORMAT,
		compress: true
	})

	const pageWidth = pdf.internal.pageSize.getWidth()
	const pageHeight = pdf.internal.pageSize.getHeight()
	const printableWidth = pageWidth - PAGE_MARGIN_MM * 2
	const printableHeight = pageHeight - PAGE_MARGIN_MM - PAGE_BOTTOM_MARGIN_MM

	const pxPerMm = canvas.width / printableWidth
	const pageSliceHeightPx = Math.floor(printableHeight * pxPerMm)

	const sliceCanvas = document.createElement('canvas')
	sliceCanvas.width = canvas.width
	const sliceContext = sliceCanvas.getContext('2d')
	if (!sliceContext) {
		throw new Error('Could not create canvas context for PDF pagination.')
	}

	let renderedHeightPx = 0
	let page = 0

	while (renderedHeightPx < canvas.height) {
		const sliceHeightPx = Math.min(pageSliceHeightPx, canvas.height - renderedHeightPx)
		sliceCanvas.height = sliceHeightPx
		sliceContext.fillStyle = '#ffffff'
		sliceContext.fillRect(0, 0, sliceCanvas.width, sliceHeightPx)
		sliceContext.drawImage(
			canvas,
			0,
			renderedHeightPx,
			canvas.width,
			sliceHeightPx,
			0,
			0,
			canvas.width,
			sliceHeightPx
		)

		if (page > 0) {
			pdf.addPage()
		}

		pdf.addImage(
			sliceCanvas.toDataURL('image/png'),
			'PNG',
			PAGE_MARGIN_MM,
			PAGE_MARGIN_MM,
			printableWidth,
			sliceHeightPx / pxPerMm
		)

		renderedHeightPx += sliceHeightPx
		page += 1
	}

	return pdf
}

async function renderPdfFromElement(exportElement: HTMLElement): Promise<jsPDF> {
	if (!hasRenderableContent(exportElement)) {
		throw new Error('No Markdown content available for PDF export.')
	}

	const canvas = await renderCanvas(exportElement)
	return renderPdfFromCanvas(canvas)
}

async function renderPdfWithFallback(
	markdownSource: string
): Promise<{pdf: jsPDF; mode: PdfRenderMode}> {
	const exportElement = createExportElement(markdownSource)
	if (!hasRenderableContent(exportElement)) {
		throw new Error('No Markdown content available for PDF export.')
	}

	try {
		const pdf = await renderPdfFromElement(exportElement)
		return {pdf, mode: 'canvas'}
	} catch (error) {
		console.warn('Canvas-based PDF render failed. Falling back to text renderer.', error)
		return {pdf: renderPdfFromTextBlocks(exportElement), mode: 'fallback'}
	}
}

export async function downloadPdfFromMarkdown(markdownSource: string, options: ExportPdfOptions) {
	const {pdf, mode} = await renderPdfWithFallback(markdownSource)
	pdf.save(sanitizeFileName(options.fileName))
	return mode
}

export async function printPdfFromMarkdown(markdownSource: string) {
	const {pdf, mode} = await renderPdfWithFallback(markdownSource)
	const blob = pdf.output('blob')
	const blobUrl = URL.createObjectURL(blob)
	const printFrame = document.createElement('iframe')

	printFrame.style.position = 'fixed'
	printFrame.style.right = '0'
	printFrame.style.bottom = '0'
	printFrame.style.width = '0'
	printFrame.style.height = '0'
	printFrame.style.border = '0'
	printFrame.src = blobUrl

	printFrame.onload = () => {
		printFrame.contentWindow?.focus()
		printFrame.contentWindow?.print()

		setTimeout(() => {
			URL.revokeObjectURL(blobUrl)
			printFrame.remove()
		}, 2000)
	}

	document.body.appendChild(printFrame)
	return mode
}
