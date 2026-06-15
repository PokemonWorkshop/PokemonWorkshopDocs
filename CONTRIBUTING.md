# Contributing to Pokémon Workshop Docs

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

The site uses Docusaurus with two locales: English (default) and French. The dev server can only run one locale at a time, so the right command depends on what you want to test:

| Command            | What it serves                                                                                                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun start`        | The English version on `localhost:3000`. Hot reload.                                                                                                                                          |
| `bun run start:fr` | The French version on `localhost:3000`. Hot reload.                                                                                                                                           |
| `bun run preview`  | A full production build of both locales together on `localhost:3000`. Slower to start (full build) but the only way to test the locale dropdown and cross-locale navigation.                  |

For everyday content edits, `bun start` (or `bun run start:fr`) is the right tool. Switch to `bun run preview` whenever you change navigation, slugs, or anything that touches both locales.

## Project Structure

The repository is structured around the i18n architecture:

```text
.
├── content/                  # English source docs (default locale)
│   ├── index.md
│   ├── getting-started/
│   ├── psdk/
│   │   ├── battle-engine/
│   │   └── ui-development/
│   ├── rpg-maker-xp/
│   └── ruby/
├── i18n/fr/
│   ├── docusaurus-plugin-content-docs/
│   │   ├── current/          # French translations of every English page
│   │   └── current.json      # French sidebar category labels
│   ├── docusaurus-theme-classic/
│   │   ├── navbar.json       # Navbar item translations
│   │   ├── footer.json
│   │   └── code.json         # Other UI string translations
└── …
```

Each section in `content/` has a `_category_.json` file declaring its label, position in the sidebar, and explicit URL slug. The sidebar is auto-generated from this directory structure.

## Adding or Editing a Page

Pages have to be created or edited in **both** locales:

1. Add or edit the English source under `content/<section>/`.
2. Add or edit the French translation under `i18n/fr/docusaurus-plugin-content-docs/current/<section>/` at the **same relative path**.

The two files share the same docId (relative path under the docs root) and the same `sidebar_position`, but may have different slugs and different content. Skipping the French file results in a fallback to the English source on the French site, which is rarely what you want.

### File creation rules

- Create the `.md` file in the appropriate section directory.
- Prefix the filename with a number to control the sidebar order: `01-my-topic.md`, `02-another-topic.md`. The number must match the `sidebar_position` declared in the frontmatter.
- The English and French versions must have identical filenames.

### Required Frontmatter

Every page starts with a YAML frontmatter block:

```markdown
---
title: "Page title as a declarative phrase"
slug: page-url-slug
sidebar_position: 1
description: "Concise description of the content. This description is reused as the first paragraph of the page."
---
```

- **title**: a declarative phrase, keyword first, no leading "How to" / "Comment" and no trailing question mark (`"Make a move fail"` / `"Faire échouer une attaque"`, `"Arrays"` / `"Les tableaux"`). Use an imperative/infinitive verb phrase for action guides and a noun phrase for course chapters. Do not append the section name (no `"… in PSDK"` / `"… dans PSDK"`); the section is already carried by the sidebar, breadcrumb, slug and description. Wrapped in quotes.
- **slug**: URL identifier, in kebab-case, without accents. No leading slash. The English and French versions can have different slugs (e.g., `how-to-create-a-weather` vs `creer-une-meteo`).
- **sidebar_position**: position within the section. Must match the filename prefix and be identical between locales.
- **description**: one or two sentence summary, in **plain text** — no Markdown. This field feeds the SEO `<meta name="description">` tag and the category index list, both of which render it as raw text, so `**bold**` or `` `code` `` markers would show up literally. The page's first paragraph repeats the same wording (see below).

### First Paragraph

The first paragraph after the frontmatter must repeat the `description`'s wording. The paragraph may add Markdown emphasis (`**bold**`, `` `inline code` ``) for readability, but the `description` field itself stays plain text. This keeps previews (lists, search engines, cards) consistent with the page content while keeping the meta tag clean.

### Adding a Section

To create a new section (a new directory under `content/`), add a `_category_.json` file:

```json
{
  "label": "Section name",
  "position": 8,
  "link": {
    "type": "generated-index",
    "slug": "/section-name"
  }
}
```

The explicit `slug` keeps the section index page at `/section-name` rather than the default `/category/section-name`. Pages inside the section then live at `/section-name/<page-slug>`.

To translate the section label in French, add an entry under `i18n/fr/docusaurus-plugin-content-docs/current.json`:

```json
{
  "sidebar.mainSidebar.category.Section name": {
    "message": "Nom de la section"
  }
}
```

## Style Conventions

### Language and Tone

- The English source in `content/` is the canonical text. French translations in `i18n/fr/...` should mirror it page-for-page.
- French translations use the impersonal **on** rather than "vous" or "tu": _"On crée un commit"_, not _"Vous créez un commit"_.
- Both languages keep a direct, educational tone. Explain the **why**, not just the **how**.

### Page Structure

1. **Frontmatter** with title, slug, sidebar_position, description.
2. **Introduction paragraph** (same wording as the description; may add `**bold**` / `` `code` `` emphasis).
3. **`##` sections** for major parts.
4. **`###` subsections** if needed. Do not go deeper than `###`.
5. **`## Conclusion` section** at the end: bullet list summarizing key points.

### Formatting

- **Bold** for concept names, buttons, or menus: _Click on **Add key**_.
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

Use absolute paths starting with `/` for internal links. Docusaurus automatically prepends the locale prefix (`/fr/...`) on French pages.

```markdown
See the guide [How to use Git with PSDK?](/getting-started/using-git-with-psdk).
```

Do not use file paths (`content/getting-started/using-git.md`).

### Images

Place images in `static/img/` inside a subdirectory matching the section. Reference with an absolute path:

```markdown
![Image description](/img/my-section/my-image.png)
```

Accepted formats: PNG, SVG. Prefer SVG for diagrams.

## Contribution Workflow

### 1. Open or Pick an Issue

Every change should map to an issue. Either open one using the appropriate template (User Story for content, Technical Story for tooling) or pick an existing issue to work on.

### 2. Create a Branch

From an up-to-date `main`:

```bash
git switch main
git pull
git switch -c <type>/<short-topic>
```

The branch name follows the same `<type>/<topic>` convention as the commit prefixes (see step 4). Examples:

- `docs/font-setting-page`
- `fix/locale-dropdown-fallback`
- `chore/upgrade-docusaurus`

### 3. Write and Verify

- Write the page in `content/` and translate it in `i18n/fr/docusaurus-plugin-content-docs/current/` following the conventions above.
- Verify the rendering locally with `bun start` (English) or `bun run start:fr` (French).
- For locale-switcher or cross-locale checks, use `bun run preview`.
- Run the type checker:

```bash
bun run typecheck
```

- Run the production build to catch broken links:

```bash
bun run build
```

### 4. Commit

Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. The type prefix mirrors the branch type:

| Type       | When to use                                              |
| ---------- | -------------------------------------------------------- |
| `docs`     | Documentation content (new pages, edits, translations)   |
| `feat`     | New site feature (custom component, plugin)              |
| `fix`      | Bug fix                                                  |
| `chore`    | Tooling, configuration, repo meta                        |
| `ci`       | CI/CD workflow changes                                   |
| `refactor` | Code restructuring without behavior change               |
| `perf`     | Performance improvement                                  |
| `style`    | Formatting, whitespace, linter pass                      |
| `test`     | Tests                                                    |

One commit per logical change. Message in English, concise, present tense:

```bash
git add content/psdk/battle-engine/17-new-topic.md \
        i18n/fr/docusaurus-plugin-content-docs/current/psdk/battle-engine/17-new-topic.md
git commit -m "docs: add guide for new battle engine topic"
```

### 5. Push and Open a Pull Request

```bash
git push -u origin <type>/<short-topic>
```

Open a Pull Request on GitHub targeting `main`. The PR template pre-fills the description; fill in:

- A short summary of the change.
- The related issue (`Closes #N`) so it auto-closes on merge.
- The test plan describing how you verified the change.
- Screenshots if it's a new or modified page.

### 6. Review and Merge

The CI workflow runs typecheck and build on every PR. A reviewer also checks:

- Compliance with style conventions.
- That both English and French versions are present and consistent.
- Technical accuracy of the content.

After approval and a green CI, the PR is merged into `main`. A push to `main` automatically deploys the site to `docs.pokemonworkshop.com` via GitHub Actions.
