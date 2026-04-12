import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

const config: Config = {
  title: "Pokémon Workshop Docs",
  tagline: "Tutorials and guides for the PSDK ecosystem",
  favicon: "img/favicon.ico",

  future: {
    v4: true,
  },

  url: "https://docs.pokemonworkshop.com",
  baseUrl: "/",

  organizationName: "PokemonWorkshop",
  projectName: "pokemon-workshop-docs",

  onBrokenLinks: "throw",

  markdown: {
    format: "md",
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en", "fr"],
    localeConfigs: {
      fr: { label: "Français", direction: "ltr" },
      en: { label: "English", direction: "ltr" },
    },
  },

  plugins: [require.resolve("./plugins/locale-doc-map")],

  themes: [
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        language: ["fr", "en"],
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
      } satisfies Preset.Options,
    ],
  ],

  headTags: [
    {
      tagName: "meta",
      attributes: {
        name: "description",
        content:
          "Official documentation for Pokémon Workshop: PSDK tutorials, Ruby courses, RPG Maker guides, and Studio references.",
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
        { label: "Getting Started", to: "/category/getting-started", position: "left" },
        { label: "Ruby", to: "/category/ruby-course", position: "left" },
        { label: "RPG Maker", to: "/category/rpg-maker", position: "left" },
        { label: "PSDK", to: "/category/psdk", position: "left" },
        { label: "Studio", to: "/category/studio", position: "left" },
        { label: "Tiled", to: "/category/tiled", position: "left" },
        { label: "Misc", to: "/category/misc", position: "left" },
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
