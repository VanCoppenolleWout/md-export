import {jsPDF} from 'jspdf'

const PAGE_FORMAT = 'a4'
const PAGE_UNIT = 'mm'
const PAGE_MARGIN_MM = 20
const PAGE_BOTTOM_MARGIN_MM = 20

type TextBlock =
	| {type: 'heading'; level: number; text: string}
	| {type: 'paragraph'; text: string}
	| {type: 'list-item'; text: string; ordered: boolean; index: number}
	| {type: 'quote'; text: string}
	| {type: 'code'; text: string}
	| {type: 'divider'}

function normalizeText(value: string): string {
	return value.replace(/\s+/g, ' ').trim()
}

function getHeadingSize(level: number): number {
	if (level === 1) return 20
	if (level === 2) return 16
	if (level === 3) return 14
	if (level === 4) return 12
	if (level === 5) return 11
	return 10
}

function extractTextBlocksFromNode(node: Element): TextBlock[] {
	const tag = node.tagName.toLowerCase()

	if (tag === 'hr') {
		return [{type: 'divider'}]
	}

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

	if (tag === 'blockquote') {
		return [{type: 'quote', text: normalizeText(node.textContent || '')}]
	}

	if (tag === 'pre') {
		return [{type: 'code', text: node.textContent?.trim() || ''}]
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

function extractTextBlocks(exportElement: HTMLElement): TextBlock[] {
	return Array.from(exportElement.children).flatMap((node) => extractTextBlocksFromNode(node))
}

export function renderPdfFromTextBlocks(exportElement: HTMLElement): jsPDF {
	const blocks = extractTextBlocks(exportElement)
	if (!blocks.length) {
		throw new Error('No Markdown content available for fallback PDF export.')
	}

	const pdf = new jsPDF({
		orientation: 'portrait',
		unit: PAGE_UNIT,
		format: PAGE_FORMAT,
		compress: true
	})

	const pageWidth = pdf.internal.pageSize.getWidth()
	const pageHeight = pdf.internal.pageSize.getHeight()
	const maxY = pageHeight - PAGE_BOTTOM_MARGIN_MM
	const contentWidth = pageWidth - PAGE_MARGIN_MM * 2
	let y = PAGE_MARGIN_MM

	const ensureSpace = (requiredHeight: number) => {
		if (y + requiredHeight <= maxY) {
			return
		}
		pdf.addPage()
		y = PAGE_MARGIN_MM
	}

	for (const block of blocks) {
		if (block.type === 'divider') {
			ensureSpace(4)
			pdf.setDrawColor(217, 224, 226)
			pdf.setLineWidth(0.3)
			pdf.line(PAGE_MARGIN_MM, y, PAGE_MARGIN_MM + contentWidth, y)
			y += 3.2
			continue
		}

		if (block.type === 'heading') {
			const size = getHeadingSize(block.level)
			pdf.setFont('helvetica', 'bold')
			pdf.setFontSize(size)
			const lines = pdf.splitTextToSize(block.text, contentWidth)
			const lineHeight = size * 0.42
			const needsDivider = block.level <= 2
			ensureSpace(lines.length * lineHeight + (needsDivider ? 4 : 2.4))
			pdf.text(lines, PAGE_MARGIN_MM, y)
			y += lines.length * lineHeight + 1.3

			if (needsDivider) {
				pdf.setDrawColor(217, 224, 226)
				pdf.setLineWidth(0.3)
				pdf.line(PAGE_MARGIN_MM, y, PAGE_MARGIN_MM + contentWidth, y)
				y += 2
			}
			continue
		}

		if (block.type === 'code') {
			pdf.setFont('courier', 'normal')
			pdf.setFontSize(10)
			const lines = pdf.splitTextToSize(block.text, contentWidth - 4)
			const lineHeight = 4.2
			const boxHeight = lines.length * lineHeight + 4
			ensureSpace(boxHeight + 3)
			pdf.setFillColor(238, 243, 246)
			pdf.rect(PAGE_MARGIN_MM, y - 1.4, contentWidth, boxHeight, 'F')
			pdf.text(lines, PAGE_MARGIN_MM + 2, y + 1.8)
			y += boxHeight + 2.2
			continue
		}

		if (block.type === 'quote') {
			pdf.setFont('helvetica', 'italic')
			pdf.setFontSize(11)
			const lines = pdf.splitTextToSize(block.text, contentWidth - 4)
			const lineHeight = 4.8
			ensureSpace(lines.length * lineHeight + 3)
			pdf.setDrawColor(148, 163, 184)
			pdf.line(PAGE_MARGIN_MM, y - 1.2, PAGE_MARGIN_MM, y + lines.length * lineHeight - 1.2)
			pdf.text(lines, PAGE_MARGIN_MM + 3, y)
			y += lines.length * lineHeight + 1.8
			continue
		}

		if (block.type === 'list-item') {
			pdf.setFont('helvetica', 'normal')
			pdf.setFontSize(11)
			const bullet = block.ordered ? `${block.index}.` : '-'
			const lines = pdf.splitTextToSize(`${bullet} ${block.text}`, contentWidth)
			const lineHeight = 4.8
			ensureSpace(lines.length * lineHeight + 2)
			pdf.text(lines, PAGE_MARGIN_MM, y)
			y += lines.length * lineHeight + 1
			continue
		}

		pdf.setFont('helvetica', 'normal')
		pdf.setFontSize(11)
		const lines = pdf.splitTextToSize(block.text, contentWidth)
		const lineHeight = 4.8
		ensureSpace(lines.length * lineHeight + 2)
		pdf.text(lines, PAGE_MARGIN_MM, y)
		y += lines.length * lineHeight + 1.2
	}

	return pdf
}
