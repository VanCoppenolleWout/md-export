## Plan: MVP Markdown naar PDF

Doel van deze MVP: een markdown-bestand kunnen uploaden of droppen, en daarna een PDF kunnen printen/downloaden met correcte layout en custom font support.

**MVP scope**

- Input: enkel `.md` file via file picker en drag-and-drop.
- Output: PDF download en print-flow vanuit dezelfde render pipeline.
- Rendering: consistente layout voor headings, paragrafen, lijsten, code en pagina-afbreking.
- Fonts: custom fonts moeten zichtbaar zijn in de PDF-output (geen alleen-browser preview truc).
- Out of scope: editor, uitgebreide toolbar, templates, complexe instellingen.

**Concrete stappen**

1. UI minimaliseren in `src/main.ts` naar:
    - dropzone
    - upload knop/input
    - actieknoppen `Download PDF` en `Print PDF`
2. Markdown parsing toevoegen (bijv. `marked`) en renderen naar een gestileerde print-container.
3. Print layout definiëren in `src/style.css` met duidelijke typografische regels en `@media print`.
4. PDF-export implementeren (bijv. `html2pdf.js` of `jsPDF` + html renderer) met vaste pagina-marges en correcte line wrapping.
5. Custom fonts toevoegen via `@font-face` en ervoor zorgen dat dezelfde fonts in de PDF-render path gebruikt worden.
6. Drag-and-drop afwerken:
    - visuele hover-state
    - enkel `.md` accepteren
    - duidelijke foutmelding bij ongeldig bestand
7. Print-flow implementeren:
    - printbare view opbouwen vanuit dezelfde markdown-render
    - browser print openen of print-PDF bestand aanbieden zonder layoutverschillen.

**Acceptatiecriteria (Definition of Done)**

1. Een gebruiker kan een `.md` bestand uploaden via picker.
2. Een gebruiker kan een `.md` bestand droppen op de dropzone.
3. De markdown wordt correct omgezet naar een leesbare layout (headings/lijsten/code/paragrafen).
4. `Download PDF` levert een correct opgemaakte PDF op meerdere pagina's.
5. `Print PDF` gebruikt dezelfde layout als `Download PDF`.
6. Minstens 1 custom font is effectief zichtbaar in de finale PDF-output.
7. Ongeldige bestanden tonen een duidelijke fout zonder crash.

**Bestanden om aan te passen**

- `/Users/woutvancoppenolle/Documents/AppFoundry/Projects/md-export/src/main.ts`
- `/Users/woutvancoppenolle/Documents/AppFoundry/Projects/md-export/src/style.css`
- `/Users/woutvancoppenolle/Documents/AppFoundry/Projects/md-export/package.json`
- optioneel nieuwe modules:
    - `/Users/woutvancoppenolle/Documents/AppFoundry/Projects/md-export/src/markdown.ts`
    - `/Users/woutvancoppenolle/Documents/AppFoundry/Projects/md-export/src/pdf.ts`

**Verificatie**

1. Test met een korte markdown file (1 pagina).
2. Test met een lange markdown file (meerdere pagina's).
3. Test met headings, nested lists en codeblokken.
4. Controleer custom font in PDF in minstens 2 viewers (bv. browser viewer en Preview).
5. Run `pnpm build` en bevestig dat de app zonder fouten buildt.
