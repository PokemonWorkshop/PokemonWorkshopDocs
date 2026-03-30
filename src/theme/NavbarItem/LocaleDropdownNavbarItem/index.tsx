import React from "react";
import { useLocation } from "@docusaurus/router";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { usePluginData } from "@docusaurus/useGlobalData";
import DropdownNavbarItem from "@theme/NavbarItem/DropdownNavbarItem";
import IconLanguage from "@theme/Icon/Language";
import type { Props } from "@theme/NavbarItem/LocaleDropdownNavbarItem";

function normalize(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

export default function LocaleDropdownNavbarItem({
  mobile,
  dropdownItemsBefore = [],
  dropdownItemsAfter = [],
  queryString = "",
  ...props
}: Props): JSX.Element {
  const {
    i18n: { currentLocale, localeConfigs },
  } = useDocusaurusContext();
  const location = useLocation();
  const localeMap = usePluginData("locale-doc-map") as
    | Record<string, string>
    | undefined;

  const currentPath = normalize(location.pathname);

  function getLocalePath(locale: string): string {
    if (locale === currentLocale) return currentPath;

    // Use mapping if available
    const mapped = localeMap?.[currentPath];
    if (mapped) return mapped;

    // Fallback: simple prefix swap
    if (currentLocale === "fr") return `/en${currentPath}`;
    return currentPath.replace(/^\/en/, "") || "/";
  }

  const localeItems = Object.entries(localeConfigs).map(([locale, config]) => ({
    label: config.label,
    lang: locale,
    to: `pathname://${getLocalePath(locale)}${queryString}`,
    target: "_self" as const,
    autoAddBaseUrl: false,
    className: locale === currentLocale ? "dropdown__link--active" : "",
  }));

  const items = [...dropdownItemsBefore, ...localeItems, ...dropdownItemsAfter];

  return (
    <DropdownNavbarItem
      {...props}
      mobile={mobile}
      label={
        <>
          <IconLanguage style={{ verticalAlign: "text-bottom", marginRight: "0.3em" }} />
          {localeConfigs[currentLocale]!.label}
        </>
      }
      items={items}
    />
  );
}
