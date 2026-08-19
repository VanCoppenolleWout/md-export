# Markdown Style Showcase

This file is a comprehensive markdown styling sample for preview and PDF export tests.

---

## Table of Contents

1. [Headings](#headings)
2. [Text Formatting](#text-formatting)
3. [Lists](#lists)
4. [Blockquotes](#blockquotes)
5. [Code](#code)
6. [Tables](#tables)
7. [Links and Images](#links-and-images)
8. [Task Lists](#task-lists)
9. [Mixed Content](#mixed-content)
10. [Raw HTML](#raw-html)

---

## Headings

# H1 Heading

## H2 Heading

### H3 Heading

#### H4 Heading

##### H5 Heading

###### H6 Heading

## Text Formatting

Plain paragraph text with **bold**, _italic_, and _**bold italic**_ styles.

You can also use **bold** and _italic_ syntax.

This sentence has ~~strikethrough~~ text.

Inline code example: `const isReady = true`.

Escaped markdown symbols: \*not italic\*, \#not heading, \`not code\`.

## Lists

### Unordered List

- First item
- Second item
    - Nested item A
    - Nested item B
        - Deep nested item
- Third item

### Ordered List

1. First step
2. Second step
3. Third step

### Ordered List (Different Start)

7. Seven
8. Eight
9. Nine

## Blockquotes

> Single line quote.

> Multi-line quote starts here.
> This is the second line.
> And a third line.

> Outer quote
>
> > Nested quote level 2
> >
> > > Nested quote level 3

## Code

### Fenced Code: TypeScript

```ts
interface User {
	id: string
	name: string
	active: boolean
}

const users: User[] = [
	{id: 'u_1', name: 'Ada', active: true},
	{id: 'u_2', name: 'Linus', active: false}
]

const activeUsers = users.filter((u) => u.active)
console.log(activeUsers)
```

### Fenced Code: Bash

```bash
pnpm install
pnpm dev
pnpm build
```

### Fenced Code: JSON

```json
{
	"app": "md-export",
	"version": "1.0.0",
	"features": ["preview", "pdf", "custom-fonts"]
}
```

### Fenced Code: Diff

```diff
- old line
+ new line
 unchanged line
```

## Tables

| Feature | Status |             Notes |
| :------ | :----: | ----------------: |
| Upload  |  Done  |   Works for `.md` |
| Preview |  Done  | Marked + sanitize |
| PDF     |  WIP   |     Layout tuning |

| Left Align | Center Align | Right Align |
| :--------- | :----------: | ----------: |
| alpha      |     beta     |       gamma |
| one        |     two      |       three |

## Links and Images

- Inline link: [Marked documentation](https://github.com/markedjs/marked/tree/master)
- Automatic URL: https://vite.dev
- Reference link: [Vite Docs][vite]

[vite]: https://vite.dev/guide/

Image sample:

![Placeholder image](https://via.placeholder.com/640x220.png?text=Markdown+Image+Sample)

## Task Lists

- [x] Build base layout
- [x] Add markdown preview
- [ ] Add PDF download
- [ ] Add print flow

## Mixed Content

1. Ordered item with nested unordered list:
    - bullet inside ordered list
    - another nested bullet with `inline code`
2. Ordered item with quote:

    > Quote inside list item.

3. Ordered item with code block:

    ```ts
    function sum(a: number, b: number) {
    	return a + b
    }
    ```

## Raw HTML

<div>
  <strong>Raw HTML block</strong>
  <p>This checks how your sanitizer/parser handles embedded HTML.</p>
</div>

<details>
  <summary>Collapsible HTML section</summary>
  <p>This section is useful for testing rendered HTML controls.</p>
</details>

---

End of markdown styling showcase.
