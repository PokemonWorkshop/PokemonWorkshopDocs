import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

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

  plugins: [require.resolve("./plugins/locale-doc-map")],

  themes: [
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        language: ["en", "fr"],
        docsRouteBasePath: "/",
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
      title: "Pokémon Workshop Docs",
      logo: {
        alt: "Pokémon Workshop Logo",
        src: "img/logo.svg",
      },
      items: [
        { label: "Getting Started", to: "/getting-started", position: "left" },
        { label: "PSDK", to: "/psdk", position: "left" },
        { label: "RPG Maker XP", to: "/rpg-maker-xp", position: "left" },
        { label: "Ruby", to: "/ruby", position: "left" },
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
            { label: "PSDK", to: "/psdk" },
            { label: "RPG Maker XP", to: "/rpg-maker-xp" },
            { label: "Ruby", to: "/ruby" },
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
