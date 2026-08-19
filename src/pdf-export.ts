import {jsPDF} from 'jspdf'

type ExportPdfOptions = {
	fileName: string
}

const PAGE_FORMAT = 'a4'
const PAGE_UNIT = 'mm'
const PAGE_MARGIN_MM = 16
const PAGE_BOTTOM_MARGIN_MM = 16

type PdfBlock =
	| {type: 'heading'; level: number; text: string}
	| {type: 'paragraph'; text: string}
	| {type: 'list-item'; text: string; ordered: boolean; index: number}
	| {type: 'code'; text: string}
	| {type: 'quote'; text: string}

function sanitizeFileName(fileName: string): string {
	const normalized = fileName.replace(/\.md$/i, '').trim() || 'markdown-export'
	return `${normalized.replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-')}.pdf`
}

function normalizeText(value: string): string {
	return value.replace(/\s+/g, ' ').trim()
}

async function waitForFonts() {
	if ('fonts' in document) {
		await (document as Document & {fonts: FontFaceSet}).fonts.ready
	}
}

function extractBlocksFromNode(node: Element): PdfBlock[] {
	const tag = node.tagName.toLowerCase()

	if (tag === 'ul' || tag === 'ol') {
		const ordered = tag === 'ol'
		return Array.from(node.children)
			.filter((child) => child.tagName.toLowerCase() === 'li')
			.map((li, index) => ({
				type: 'list-item' as const,
				text: normalizeText(li.textContent || ''),
				ordered,
				index: index + 1
			}))
	}

	if (tag === 'pre') {
		return [{type: 'code', text: node.textContent?.trim() || ''}]
	}

	if (tag === 'blockquote') {
		return [{type: 'quote', text: normalizeText(node.textContent || '')}]
	}

	if (/^h[1-6]$/.test(tag)) {
		return [
			{
				type: 'heading',
				level: Number(tag[1]),
				text: normalizeText(node.textContent || '')
			}
		]
	}

	const text = normalizeText(node.textContent || '')
	if (!text) {
		return []
	}

	return [{type: 'paragraph', text}]
}

function extractBlocks(previewElement: HTMLElement): PdfBlock[] {
	return Array.from(previewElement.children).flatMap((node) => extractBlocksFromNode(node))
}

function getHeadingFontSize(level: number): number {
	if (level === 1) return 22
	if (level === 2) return 18
	if (level === 3) return 15
	if (level === 4) return 13
	if (level === 5) return 12
	return 11
}

async function renderPdfFromElement(previewElement: HTMLElement): Promise<jsPDF> {
	await waitForFonts()

	const blocks = extractBlocks(previewElement)
	if (!blocks.length) {
		throw new Error('No preview content available for PDF export.')
	}

	const pdf = new jsPDF({
		orientation: 'portrait',
		unit: PAGE_UNIT,
		format: PAGE_FORMAT,
		compress: true
	})

	const pageWidth = pdf.internal.pageSize.getWidth()
	const pageHeight = pdf.internal.pageSize.getHeight()
	const printableWidth = pageWidth - PAGE_MARGIN_MM * 2
	const maxY = pageHeight - PAGE_BOTTOM_MARGIN_MM

	let y = PAGE_MARGIN_MM

	const ensureSpace = (neededHeight: number) => {
		if (y + neededHeight <= maxY) {
			return
		}

		pdf.addPage()
		y = PAGE_MARGIN_MM
	}

	for (const block of blocks) {
		if (!block.text) {
			continue
		}

		if (block.type === 'heading') {
			const fontSize = getHeadingFontSize(block.level)
			pdf.setFont('helvetica', 'bold')
			pdf.setFontSize(fontSize)
			const lines = pdf.splitTextToSize(block.text, printableWidth)
			const lineHeight = fontSize * 0.42
			ensureSpace(lines.length * lineHeight + 5)
			pdf.text(lines, PAGE_MARGIN_MM, y)
			y += lines.length * lineHeight + 3
			continue
		}

		if (block.type === 'code') {
			pdf.setFont('courier', 'normal')
			pdf.setFontSize(10)
			const lines = pdf.splitTextToSize(block.text, printableWidth - 4)
			const lineHeight = 4.5
			const boxHeight = lines.length * lineHeight + 4
			ensureSpace(boxHeight + 3)
			pdf.setFillColor(238, 243, 246)
			pdf.rect(PAGE_MARGIN_MM, y - 1.5, printableWidth, boxHeight, 'F')
			pdf.text(lines, PAGE_MARGIN_MM + 2, y + 2)
			y += boxHeight + 3
			continue
		}

		if (block.type === 'quote') {
			pdf.setFont('helvetica', 'italic')
			pdf.setFontSize(11)
			const quoteText = `"${block.text}"`
			const lines = pdf.splitTextToSize(quoteText, printableWidth - 4)
			const lineHeight = 5
			ensureSpace(lines.length * lineHeight + 3)
			pdf.setDrawColor(148, 163, 184)
			pdf.line(PAGE_MARGIN_MM, y - 1.5, PAGE_MARGIN_MM, y + lines.length * lineHeight - 1)
			pdf.text(lines, PAGE_MARGIN_MM + 3, y)
			y += lines.length * lineHeight + 2
			continue
		}

		if (block.type === 'list-item') {
			pdf.setFont('helvetica', 'normal')
			pdf.setFontSize(11)
			const bullet = block.ordered ? `${block.index}.` : '-'
			const lines = pdf.splitTextToSize(`${bullet} ${block.text}`, printableWidth)
			const lineHeight = 5
			ensureSpace(lines.length * lineHeight + 2)
			pdf.text(lines, PAGE_MARGIN_MM, y)
			y += lines.length * lineHeight + 1
			continue
		}

		pdf.setFont('helvetica', 'normal')
		pdf.setFontSize(11)
		const lines = pdf.splitTextToSize(block.text, printableWidth)
		const lineHeight = 5
		ensureSpace(lines.length * lineHeight + 2)
		pdf.text(lines, PAGE_MARGIN_MM, y)
		y += lines.length * lineHeight + 1
	}

	return pdf
}

export async function downloadPdfFromPreview(
	previewElement: HTMLElement,
	options: ExportPdfOptions
) {
	const pdf = await renderPdfFromElement(previewElement)
	pdf.save(sanitizeFileName(options.fileName))
}

export async function printPdfFromPreview(previewElement: HTMLElement) {
	const pdf = await renderPdfFromElement(previewElement)
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
}
