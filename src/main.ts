import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<main class="grid min-h-svh place-items-center px-4 py-8 sm:px-6">
  <section
    class="grid w-full max-w-3xl gap-4 rounded-3xl border border-stone-300/90 bg-white/80 p-5 shadow-[0_12px_32px_rgba(37,39,46,0.09),0_2px_8px_rgba(37,39,46,0.05)] backdrop-blur-md sm:p-8"
    aria-labelledby="mvp-title"
  >
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

    <p class="m-0 text-xs text-slate-500">PDF logic is added in the next step.</p>
  </section>
</main>
`
