import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

// Pages relocated by the Getting Started / Pokémon Studio / Misc restructure.
// Key = current route (per locale, FR prefixed with /fr); value = former route
// to preserve. Consumed by plugin-client-redirects below.
const RELOCATED_ROUTES: Record<string, string> = {
  "/getting-started/customize-psdk/setup-development-environment":
    "/getting-started/setup-development-environment",
  "/getting-started/customize-psdk/monkey-patching-in-psdk":
    "/getting-started/monkey-patching-in-psdk",
  "/misc/discover-git": "/getting-started/discover-git",
  "/misc/using-git-with-psdk": "/getting-started/using-git-with-psdk",
  "/pokemon-studio/collaboration/work-together-on-a-psdk-project":
    "/getting-started/work-together-on-a-psdk-project",
  "/pokemon-studio/macos/update-pokemon-studio-macos":
    "/pokemon-studio/update-pokemon-studio-macos",
  "/pokemon-studio/macos/run-pokemon-studio-from-source-macos":
    "/pokemon-studio/run-pokemon-studio-from-source-macos",
  // French routes: keyed WITHOUT the /fr prefix. Each locale builds as a
  // standalone site, so createRedirects receives locale-relative paths and the
  // plugin prepends /fr to the generated redirect file. FR slugs differ from EN
  // slugs, so these never collide with the English entries above.
  "/getting-started/customize-psdk/preparer-son-environnement":
    "/getting-started/preparer-son-environnement",
  "/getting-started/customize-psdk/monkey-patch-dans-psdk":
    "/getting-started/monkey-patch-dans-psdk",
  "/misc/decouvrir-git": "/getting-started/decouvrir-git",
  "/misc/utiliser-git-avec-psdk": "/getting-started/utiliser-git-avec-psdk",
  "/pokemon-studio/collaboration/travailler-a-plusieurs-sur-un-projet-psdk":
    "/getting-started/travailler-a-plusieurs-sur-un-projet-psdk",
  "/pokemon-studio/macos/mettre-a-jour-pokemon-studio-macos":
    "/pokemon-studio/mettre-a-jour-pokemon-studio-macos",
  "/pokemon-studio/macos/executer-pokemon-studio-depuis-les-sources-macos":
    "/pokemon-studio/executer-pokemon-studio-depuis-les-sources-macos",
};

const config: Config = {
  title: "Pokémon Workshop Docs",
  tagline: "Tutorials and guides for the PSDK ecosystem",
  favicon: "favicon.svg",

  future: {
    v4: true,
  },

  url: "https://docs.pokemonworkshop.com",
  baseUrl: "/",

  organizationName: "PokemonWorkshop",
  projectName: "PokemonWorkshopDocs",

  onBrokenLinks: "throw",

  markdown: {
    format: "md",
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en", "fr"],
    localeConfigs: {
      en: { label: "English", direction: "ltr" },
      fr: { label: "Français", direction: "ltr" },
    },
  },

  plugins: [
    require.resolve("./plugins/locale-doc-map"),
    require.resolve("./plugins/raw-markdown"),
    [
      "@docusaurus/plugin-client-redirects",
      {
        createRedirects(existingPath: string) {
          const normalized = existingPath.replace(/\/$/, "");
          const from = RELOCATED_ROUTES[normalized];
          return from ? [from] : undefined;
        },
      },
    ],
  ],

  themes: [
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        language: ["en", "fr"],
        docsRouteBasePath: "/",
        // Sources live in content/, not the plugin's default "docs/".
        docsDir: "content",
        indexBlog: false,
      },
    ],
  ],

  presets: [
    [
      "classic",
      {
        docs: {
          path: "content",
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
        sitemap: {
          ignorePatterns: ["/search", "/search/**"],
        },
      } satisfies Preset.Options,
    ],
  ],

  headTags: [
    {
      tagName: "meta",
      attributes: {
        name: "description",
        content:
          "Official documentation for Pokémon Workshop: PSDK tutorials, Ruby courses, RPG Maker guides, and Pokémon Studio references.",
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "icon",
        type: "image/png",
        sizes: "96x96",
        href: "/favicon-96x96.png",
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "shortcut icon",
        href: "/favicon.ico",
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
    },
    {
      tagName: "meta",
      attributes: {
        name: "apple-mobile-web-app-title",
        content: "Pokémon Workshop Docs",
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "manifest",
        href: "/site.webmanifest",
      },
    },
  ],

  themeConfig: {
    image: "img/logo.png",
    colorMode: {
      defaultMode: "dark",
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: "Home",
      logo: {
        alt: "Pokémon Workshop Logo",
        src: "img/logo.svg",
      },
      items: [
        { label: "Getting Started", to: "/getting-started", position: "left" },
        { label: "Pokémon Studio", to: "/pokemon-studio", position: "left" },
        { label: "PSDK", to: "/psdk", position: "left" },
        { label: "Tiled", to: "/tiled", position: "left" },
        { label: "RMXP", to: "/rpg-maker-xp", position: "left" },
        { label: "Ruby", to: "/ruby", position: "left" },
        { label: "Misc", to: "/misc", position: "left" },
        {
          type: "search",
          position: "right",
        },
        {
          type: "localeDropdown",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      logo: {
        alt: "Pokémon Workshop Logo",
        src: "img/logo.svg",
        width: 48,
        height: 48,
      },
      links: [
        {
          title: "Documentation",
          items: [
            { label: "Getting Started", to: "/getting-started" },
            { label: "Pokémon Studio", to: "/pokemon-studio" },
            { label: "PSDK", to: "/psdk" },
            { label: "Tiled", to: "/tiled" },
            { label: "RMXP", to: "/rpg-maker-xp" },
            { label: "Ruby", to: "/ruby" },
            { label: "Misc", to: "/misc" },
          ],
        },
        {
          title: "Community",
          items: [
            { label: "Website", href: "https://pokemonworkshop.com" },
            {
              label: "Discord",
              href: "https://discord.com/invite/0noB0gBDd91B8pMk",
            },
            {
              label: "X",
              href: "https://x.com/pokemonworkshop",
              "aria-label": "X (formerly Twitter)",
            },
            { label: "GitHub", href: "https://github.com/PokemonWorkshop" },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Pokémon Workshop. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.vsDark,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: ["ruby", "bash", "json"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
