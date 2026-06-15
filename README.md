# Pokémon Workshop Docs

Official documentation for the Pokémon Workshop ecosystem: PSDK tutorials, Ruby course, RPG Maker XP guides, and Pokémon Studio references.

Published at **[docs.pokemonworkshop.com](https://docs.pokemonworkshop.com)**.

Built with [Docusaurus](https://docusaurus.io/), deployed via GitHub Pages.

## Content

The documentation is organized into four sections:

- **Getting Started** — environment setup, Git workflow, PSDK monkey-patching
- **Ruby** — full Ruby course oriented towards PSDK development
- **RPG Maker XP** — basics and interpreter usage with PSDK
- **PSDK** — UI development and battle engine deep dives

All pages are available in English (default) and French.

## Running Locally

Prerequisites:

- [Bun](https://bun.sh/) (package manager and runtime)
- Node.js >= 20

```bash
git clone git@github.com:PokemonWorkshop/PokemonWorkshopDocs.git
cd PokemonWorkshopDocs
bun install
bun start
```

The site will be available at `http://localhost:3000` with hot reload.

## Useful Scripts

| Command                                         | Purpose                                        |
| ----------------------------------------------- | ---------------------------------------------- |
| `bun start`                                     | Run the dev server in English (default locale) |
| `bun run start:fr`                              | Run the dev server in French                   |
| `bun run build`                                 | Production build (both locales)                |
| `bun run preview`                               | Build and serve the production build locally   |
| `bun run serve`                                 | Serve an existing production build             |
| `bun run typecheck`                             | Run the TypeScript type checker                |
| `bun run clear`                                 | Clear the Docusaurus cache                     |
| `bun docusaurus write-translations --locale fr` | Regenerate French translation stubs            |

> **Note on locale switching in dev mode**: `docusaurus start` only serves one locale at a time. The locale dropdown in the navbar will appear broken (404s) because the other locale's routes do not exist in the dev server. To test locale switching, use `bun run preview` which builds both locales and serves them together.

## Project Structure

```
.
├── content/                              # English source docs (default locale)
│   ├── index.md
│   ├── getting-started/
│   ├── psdk/
│   │   ├── battle-engine/
│   │   └── ui-development/
│   ├── rpg-maker-xp/
│   └── ruby/
├── i18n/fr/                              # French translations
│   ├── docusaurus-plugin-content-docs/
│   │   └── current/                      # Translated .md files
│   ├── docusaurus-plugin-content-docs/
│   │   └── current.json                  # Sidebar category labels
│   └── docusaurus-theme-classic/
│       ├── navbar.json                   # Navbar item translations
│       ├── footer.json
│       └── code.json                     # UI string translations
├── plugins/
│   ├── locale-doc-map.js                 # Bidirectional locale routing plugin
│   └── raw-markdown.js                    # postBuild hook: strips frontmatter, serves .md for CopyPageButtons
├── src/
│   ├── components/                       # Custom React components
│   ├── theme/                            # Theme overrides (swizzled)
│   └── css/custom.css
├── static/                               # Static assets (favicon, fonts, CNAME, robots.txt)
└── docusaurus.config.ts                  # Main configuration
```

## Deployment

Deployment is automated via GitHub Actions on every push to `main`:

1. The workflow builds both locales (`bun run build`)
2. Runs typecheck and broken-link validation
3. Uploads the `build/` directory to GitHub Pages
4. Deploys at `https://docs.pokemonworkshop.com`

See `.github/workflows/deploy.yml` for details. Pull requests run the build validation step without deploying.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contribution workflow, style conventions, and page structure requirements.

Quick version:

1. Fork and create a branch `docs/your-topic`
2. Edit or add pages in `content/` (English source)
3. Update the French translation in `i18n/fr/docusaurus-plugin-content-docs/current/`
4. Verify locally with `bun start` and `bun run build`
5. Open a Pull Request against `main`

## License

MIT — see [LICENSE](LICENSE).
