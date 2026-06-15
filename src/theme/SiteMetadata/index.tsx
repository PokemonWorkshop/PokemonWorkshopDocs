import React, { type ReactNode } from "react";
import Head from "@docusaurus/Head";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { PageMetadata, useThemeConfig } from "@docusaurus/theme-common";
import { DEFAULT_SEARCH_TAG } from "@docusaurus/theme-common/internal";
import { useLocation } from "@docusaurus/router";
import { applyTrailingSlash } from "@docusaurus/utils-common";
import { usePluginData } from "@docusaurus/useGlobalData";
import SearchMetadata from "@theme/SearchMetadata";
import { normalizePathname } from "../../utils/locale";

function resolveLocalePaths(
  currentLocale: string,
  currentPath: string,
  localeMap: Record<string, string> | undefined,
): { en: string; fr: string } {
  const mapped = localeMap?.[currentPath];

  if (currentLocale === "en") {
    return {
      en: currentPath,
      fr: mapped ?? `/fr${currentPath === "/" ? "" : currentPath}`,
    };
  }

  const fallbackEn = currentPath.replace(/^\/fr/, "") || "/";
  return {
    en: mapped ?? fallbackEn,
    fr: currentPath,
  };
}

function AlternateLangHeaders(): ReactNode {
  const {
    siteConfig: { url: siteUrl },
    i18n: { currentLocale, defaultLocale, localeConfigs },
  } = useDocusaurusContext();
  const location = useLocation();
  const localeMap = usePluginData("locale-doc-map") as
    | Record<string, string>
    | undefined;

  const currentPath = normalizePathname(location.pathname);
  const paths = resolveLocalePaths(currentLocale, currentPath, localeMap);

  const currentHtmlLang = localeConfigs[currentLocale]!.htmlLang;
  const bcp47ToOpenGraphLocale = (code: string): string =>
    code.replace("-", "_");

  const urlFor = (locale: string): string =>
    siteUrl + (locale === "en" ? paths.en : paths.fr);

  return (
    <Head>
      {Object.entries(localeConfigs).map(([locale, { htmlLang }]) => (
        <link
          key={locale}
          rel="alternate"
          href={urlFor(locale)}
          hrefLang={htmlLang}
        />
      ))}
      <link
        rel="alternate"
        href={urlFor(defaultLocale)}
        hrefLang="x-default"
      />

      <meta
        property="og:locale"
        content={bcp47ToOpenGraphLocale(currentHtmlLang)}
      />
      {Object.values(localeConfigs)
        .filter((config) => currentHtmlLang !== config.htmlLang)
        .map((config) => (
          <meta
            key={`meta-og-${config.htmlLang}`}
            property="og:locale:alternate"
            content={bcp47ToOpenGraphLocale(config.htmlLang)}
          />
        ))}
    </Head>
  );
}

function OrganizationSchema(): ReactNode {
  const {
    siteConfig: { url: siteUrl },
  } = useDocusaurusContext();

  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Pokémon Workshop",
    url: "https://pokemonworkshop.com",
    logo: `${siteUrl}/img/logo.png`,
    sameAs: [
      "https://discord.com/invite/0noB0gBDd91B8pMk",
      "https://x.com/pokemonworkshop",
      "https://github.com/PokemonWorkshop",
    ],
  };

  return (
    <Head>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Head>
  );
}

function useDefaultCanonicalUrl() {
  const {
    siteConfig: { url: siteUrl, baseUrl, trailingSlash },
  } = useDocusaurusContext();
  const { pathname } = useLocation();
  const canonicalPathname = applyTrailingSlash(useBaseUrl(pathname), {
    trailingSlash,
    baseUrl,
  });
  return siteUrl + canonicalPathname;
}

function CanonicalUrlHeaders({ permalink }: { permalink?: string }): ReactNode {
  const {
    siteConfig: { url: siteUrl },
  } = useDocusaurusContext();
  const defaultCanonicalUrl = useDefaultCanonicalUrl();

  const canonicalUrl = permalink
    ? `${siteUrl}${permalink}`
    : defaultCanonicalUrl;
  return (
    <Head>
      <meta property="og:url" content={canonicalUrl} />
      <link rel="canonical" href={canonicalUrl} />
    </Head>
  );
}

export default function SiteMetadata(): ReactNode {
  const {
    i18n: { currentLocale },
  } = useDocusaurusContext();
  const { metadata, image: defaultImage } = useThemeConfig();

  return (
    <>
      <Head>
        <meta name="twitter:card" content="summary_large_image" />
        <body />
      </Head>

      {defaultImage && <PageMetadata image={defaultImage} />}

      <CanonicalUrlHeaders />

      <AlternateLangHeaders />

      <OrganizationSchema />

      <SearchMetadata tag={DEFAULT_SEARCH_TAG} locale={currentLocale} />

      <Head>
        {metadata.map((metadatum, i) => (
          <meta key={i} {...metadatum} />
        ))}
      </Head>
    </>
  );
}
