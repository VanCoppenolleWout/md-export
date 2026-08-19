import './style.css'
import DOMPurify from 'dompurify'
import {marked} from 'marked'
import {setupMarkdownFilePicker} from './markdown-file-picker'
import {downloadPdfFromPreview, printPdfFromPreview} from './pdf-export'

marked.setOptions({
	gfm: true,
	breaks: false
})

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<main class="grid min-h-svh place-items-center px-4 py-8 sm:px-6">
  <section
    class="grid w-full max-w-6xl gap-5 rounded-3xl border border-stone-300/90 bg-white/80 p-5 shadow-[0_12px_32px_rgba(37,39,46,0.09),0_2px_8px_rgba(37,39,46,0.05)] backdrop-blur-md sm:p-8 lg:grid-cols-2"
    aria-labelledby="mvp-title"
  >
    <div class="grid content-start gap-4">
      <p class="m-0 text-xs font-bold uppercase tracking-[0.09em] text-slate-500">Markdown to PDF</p>
      <h1 id="mvp-title" class="m-0 text-3xl font-semibold leading-[1.05] tracking-[-0.02em] text-slate-900 sm:text-4xl">
        Drop one .md file and export a clean PDF.
      </h1>
      <p class="m-0 max-w-2xl text-[0.96rem] text-slate-600">
        MVP step 1: minimal UI with upload, drag-and-drop surface, and print/download actions.
      </p>

      <div class="flex flex-wrap items-center gap-3 max-sm:flex-col max-sm:items-stretch" role="group" aria-label="File selection">
        <label
          for="markdown-file"
          class="cursor-pointer rounded-full border border-transparent bg-teal-700 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(15,118,110,0.75)] transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
        >
          Choose .md File
        </label>
        <input id="markdown-file" class="sr-only" type="file" accept=".md,text/markdown" />
        <p id="selected-file" class="m-0 text-sm text-slate-500">No file selected</p>
      </div>

      <div
        id="dropzone"
        class="rounded-2xl border-2 border-dashed border-stone-300 bg-white/60 px-4 py-6 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
        role="button"
        tabindex="0"
        aria-label="Drop markdown file"
        aria-describedby="dropzone-hint"
      >
        <p class="m-0 text-base font-semibold text-slate-900">Drop your markdown file here</p>
        <p id="dropzone-hint" class="mt-1 m-0 text-sm text-slate-500">Only .md files are accepted</p>
      </div>

      <p id="mvp-status" class="m-0 text-sm text-slate-600" role="status" aria-live="polite"></p>

      <div class="flex flex-wrap items-center gap-3 max-sm:flex-col max-sm:items-stretch" role="group" aria-label="PDF actions">
        <button
          id="download-pdf"
          type="button"
          class="rounded-full border border-transparent bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(15,118,110,0.75)] transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
        >
          Download PDF
        </button>
        <button
          id="print-pdf"
          type="button"
          class="rounded-full border border-stone-300 bg-white/85 px-4 py-2.5 text-sm font-semibold text-slate-900 transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
        >
          Print PDF
        </button>
      </div>
    </div>

    <section class="grid content-start gap-2 rounded-2xl border border-stone-300 bg-white/75 p-4 sm:p-5" aria-labelledby="preview-title">
      <h2 id="preview-title" class="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Preview</h2>
      <article id="preview-content" class="markdown-preview max-h-[70svh] overflow-auto pr-1 text-slate-800"></article>
    </section>
  </section>
</main>
`

const fileInput = document.querySelector<HTMLInputElement>('#markdown-file')!
const selectedFile = document.querySelector<HTMLParagraphElement>('#selected-file')!
const dropzone = document.querySelector<HTMLDivElement>('#dropzone')!
const statusElement = document.querySelector<HTMLParagraphElement>('#mvp-status')!
const previewContent = document.querySelector<HTMLElement>('#preview-content')!
const downloadButton = document.querySelector<HTMLButtonElement>('#download-pdf')!
const printButton = document.querySelector<HTMLButtonElement>('#print-pdf')!

const dropzoneActiveClasses = ['border-teal-500', 'bg-teal-50/80']
let currentFileName = 'markdown-export'

function setStatus(message: string, tone: 'neutral' | 'success' | 'error' = 'neutral') {
	statusElement.textContent = message
	statusElement.classList.remove('text-slate-600', 'text-teal-700', 'text-rose-700')

	if (tone === 'success') {
		statusElement.classList.add('text-teal-700')
		return
	}

	if (tone === 'error') {
		statusElement.classList.add('text-rose-700')
		return
	}

	statusElement.classList.add('text-slate-600')
}

function renderMarkdownPreview(markdownSource: string) {
	const parsed = marked.parse(markdownSource)
	const html = typeof parsed === 'string' ? parsed : ''
	previewContent.innerHTML = DOMPurify.sanitize(html, {
		USE_PROFILES: {html: true}
	})
}

async function handleMarkdownFile(file: File) {
	const markdownSource = await file.text()
	renderMarkdownPreview(markdownSource)
	currentFileName = file.name
	selectedFile.textContent = file.name
	setStatus(`Loaded ${file.name}`, 'success')
}

function setPdfActionsBusyState(isBusy: boolean) {
	downloadButton.disabled = isBusy
	printButton.disabled = isBusy

	const disabledClasses = ['opacity-60', 'cursor-not-allowed']
	downloadButton.classList.toggle(disabledClasses[0], isBusy)
	downloadButton.classList.toggle(disabledClasses[1], isBusy)
	printButton.classList.toggle(disabledClasses[0], isBusy)
	printButton.classList.toggle(disabledClasses[1], isBusy)
}

function activateDropzone() {
	dropzone.classList.add(...dropzoneActiveClasses)
}

function deactivateDropzone() {
	dropzone.classList.remove(...dropzoneActiveClasses)
}

setStatus('Preview is active. Upload or drop a markdown file.', 'neutral')

setupMarkdownFilePicker({
	fileInput,
	dropzone,
	onFileSelected: handleMarkdownFile,
	onInvalidFile: () => {
		setStatus('Only .md files are accepted.', 'error')
	},
	onReadError: () => {
		setStatus('Could not read file. Try another markdown file.', 'error')
	},
	onDragStateChange: (isActive) => {
		if (isActive) {
			activateDropzone()
			return
		}

		deactivateDropzone()
	}
})

downloadButton.addEventListener('click', async () => {
	setPdfActionsBusyState(true)
	setStatus('Generating PDF download...', 'neutral')

	try {
		await downloadPdfFromPreview(previewContent, {
			fileName: currentFileName
		})
		setStatus('PDF downloaded successfully.', 'success')
	} catch {
		setStatus('PDF download failed. Try again.', 'error')
	} finally {
		setPdfActionsBusyState(false)
	}
})

printButton.addEventListener('click', async () => {
	setPdfActionsBusyState(true)
	setStatus('Preparing print PDF...', 'neutral')

	try {
		await printPdfFromPreview(previewContent)
		setStatus('Print dialog opened.', 'success')
	} catch {
		setStatus('Could not open print PDF. Try again.', 'error')
	} finally {
		setPdfActionsBusyState(false)
	}
})
