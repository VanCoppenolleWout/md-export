type DragStateHandler = (isActive: boolean) => void

type MarkdownFilePickerOptions = {
	fileInput: HTMLInputElement
	dropzone: HTMLElement
	onFileSelected: (file: File) => Promise<void> | void
	onInvalidFile: () => void
	onReadError: () => void
	onDragStateChange?: DragStateHandler
}

function isMarkdownFile(file: File): boolean {
	return file.name.toLowerCase().endsWith('.md') || file.type === 'text/markdown'
}

export function setupMarkdownFilePicker(options: MarkdownFilePickerOptions) {
	const {fileInput, dropzone, onFileSelected, onInvalidFile, onReadError, onDragStateChange} =
		options

	const handleFile = async (file: File) => {
		if (!isMarkdownFile(file)) {
			onInvalidFile()
			return
		}

		try {
			await onFileSelected(file)
		} catch {
			onReadError()
		}
	}

	const activateDropzone = () => {
		onDragStateChange?.(true)
	}

	const deactivateDropzone = () => {
		onDragStateChange?.(false)
	}

	fileInput.addEventListener('change', async () => {
		const file = fileInput.files?.[0]
		if (!file) {
			return
		}

		await handleFile(file)
	})

	dropzone.addEventListener('click', () => {
		fileInput.click()
	})

	dropzone.addEventListener('keydown', (event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()
			fileInput.click()
		}
	})

	dropzone.addEventListener('dragenter', (event) => {
		event.preventDefault()
		activateDropzone()
	})

	dropzone.addEventListener('dragover', (event) => {
		event.preventDefault()
		activateDropzone()
	})

	dropzone.addEventListener('dragleave', (event) => {
		event.preventDefault()

		if (!dropzone.contains(event.relatedTarget as Node | null)) {
			deactivateDropzone()
		}
	})

	dropzone.addEventListener('drop', async (event) => {
		event.preventDefault()
		deactivateDropzone()

		const file = event.dataTransfer?.files?.[0]
		if (!file) {
			return
		}

		await handleFile(file)
	})
}
