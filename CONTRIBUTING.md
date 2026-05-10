# Contributing to Pokémon Workshop Docs

> **Version française** : consultez le [guide de contribution](https://docs.pokemonworkshop.com/divers/contribuer) sur le site.

This guide explains how to add or edit documentation pages, the style conventions to follow, and the contribution workflow via Pull Request.

## Prerequisites

- [Git](https://git-scm.com/) installed and configured.
- [Bun](https://bun.sh/) installed to run the site locally.
- A GitHub account with access to [PokemonWorkshop/PokemonWorkshopDocs](https://github.com/PokemonWorkshop/PokemonWorkshopDocs).

## Running the Site Locally

Clone the repository and install dependencies:

```bash
git clone git@github.com:PokemonWorkshop/PokemonWorkshopDocs.git
cd PokemonWorkshopDocs
bun install
```

Start the development server:

```bash
bun start
```

The site is available at `http://localhost:3000`. Changes are automatically reloaded.

## Project Structure

Documentation lives in the `content/` directory, organized by section:

```
content/
├── index.md                  # Home page
├── getting-started/          # Getting Started
├── ruby-course/              # Ruby Course
├── rpg-maker/                # RPG Maker
├── psdk/                     # PSDK (battle-engine, ui-development)
│   ├── battle-engine/
│   └── ui-development/
├── studio/                   # Studio
├── tiled/                    # Tiled
└── divers/                   # Miscellaneous guides
```

Each directory contains a `_category_.json` file that defines the label and position of the section in the sidebar. The sidebar is auto-generated from the directory structure.

## Adding a Page

### Create the File

Create a `.md` file in the appropriate section directory. The filename determines the default URL (unless a `slug` is defined in the frontmatter).

To order pages in the sidebar, prefix the filename with a number: `01-my-topic.md`, `02-another-topic.md`.

### Required Frontmatter

Each page starts with a YAML frontmatter block:

```markdown
---
title: "Page title as a question"
slug: page-url-slug
sidebar_position: 1
description: "Concise description of the content. This description is reused as the first paragraph of the page."
---
```

- **title**: always phrased as a question (`"How to do X?"`, `"What is X?"`). Wrapped in quotes.
- **slug**: the URL identifier, in kebab-case, without accents. No leading slash.
- **sidebar_position**: position within the section (1, 2, 3...). Check existing positions to avoid duplicates.
- **description**: one or two sentence summary. This text is repeated verbatim as the first paragraph of the page body.

### First Paragraph

The first paragraph after the frontmatter must repeat the `description` word for word. This ensures consistency between previews (lists, search engines) and the actual page content.

### Adding a Section

To create a new section (a new directory in `content/`), add a `_category_.json` file:

```json
{
  "label": "Section name",
  "position": 8,
  "link": {
    "type": "generated-index"
  }
}
```

Adjust `position` to place the section correctly in the sidebar.

## Editing an Existing Page

Open the corresponding `.md` file, make your changes, and verify the rendering locally with `bun start`. Make sure internal links still work after the edit.

## Style Conventions

### Language and Tone

- Write in **French** (primary content language).
- Use the impersonal **on** rather than "vous" or "tu": _"On crée un commit"_, not _"Vous créez un commit"_.
- Direct, educational tone. Explain the **why**, not just the **how**.

### Page Structure

1. **Frontmatter** with title, slug, sidebar_position, description.
2. **Introduction paragraph** (identical to the description).
3. **`##` sections** for major parts.
4. **`###` subsections** if needed. Do not go deeper than `###`.
5. **`## Conclusion` section** at the end: bullet list summarizing key points.

### Formatting

- **Bold** for concept names, buttons, or menus: \*Click on **Add key\***.
- `Inline code` for filenames, commands, methods, variables: _The file `solargraph.yml`_.
- Code blocks with the language specified:

```ruby
def example
  puts "Hello"
end
```

Supported languages: `ruby`, `bash`, `json`, `yaml`, `markdown`.

- Markdown tables for tabular data (commands, comparisons).
- Bullet lists with dashes (`-`), not asterisks.
- 2-space indentation in Ruby code blocks.
- One blank line before and after every heading, code block, and table.

### Internal Links

Use relative paths or slugs for links between pages:

```markdown
See the guide [How to use Git with PSDK?](/utiliser-git-avec-psdk).
```

Do not use file paths (`content/getting-started/using-git.md`).

### Images

Place images in `static/img/` inside a subdirectory matching the section. Reference with an absolute path:

```markdown
![Image description](/img/my-section/my-image.png)
```

Accepted formats: PNG, SVG. Prefer SVG for diagrams.

## Contribution Workflow

### 1. Create a Branch

From an up-to-date `main`:

```bash
git checkout main
git pull
git checkout -b docs/page-topic
```

Name the branch `docs/` followed by a short kebab-case summary.

### 2. Write and Verify

- Write the page following the conventions above.
- Verify the rendering locally with `bun start`.
- Ensure the build passes without errors:

```bash
bun run build
```

### 3. Commit

One commit per logical change. Message in English, concise, present tense:

```bash
git add content/psdk/battle-engine/17-new-topic.md
git commit -m "Add guide for new battle engine topic"
```

### 4. Push and Open a Pull Request

```bash
git push -u origin docs/page-topic
```

Open a Pull Request on GitHub targeting `main`. In the description:

- Summarize the content added or changed.
- Mention the impacted sections.
- Add a screenshot of the rendering if it's a new page.

### 5. Review and Merge

A reviewer checks:

- Compliance with style conventions.
- Technical accuracy of the content.
- Proper functioning of links and the build.

After approval, the PR is merged into `main`.
