import { useLocation } from "@docusaurus/router";
import { translate } from "@docusaurus/Translate";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { usePluginData } from "@docusaurus/useGlobalData";
import IconLanguage from "@theme/Icon/Language";
import DropdownNavbarItem from "@theme/NavbarItem/DropdownNavbarItem";
import type { Props } from "@theme/NavbarItem/LocaleDropdownNavbarItem";
import type React from "react";
import { normalizePathname } from "../../../utils/locale";

export default function LocaleDropdownNavbarItem({
  mobile,
  dropdownItemsBefore = [],
  dropdownItemsAfter = [],
  queryString = "",
  ...props
}: Props): React.JSX.Element {
  const {
    i18n: { currentLocale, localeConfigs },
  } = useDocusaurusContext();
  const location = useLocation();
  const localeMap = usePluginData("locale-doc-map") as
    | Record<string, string>
    | undefined;

  const currentPath = normalizePathname(location.pathname);

  function getLocalePath(locale: string): string {
    if (locale === currentLocale) return currentPath;

    // Use mapping if available
    const mapped = localeMap?.[currentPath];
    if (mapped) return mapped;

    // Fallback: simple prefix swap
    if (currentLocale === "en") return `/fr${currentPath}`;
    return currentPath.replace(/^\/fr/, "") || "/";
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

  // On desktop the trigger shows the globe icon plus the current language name.
  // In the mobile hamburger that collapsed "English"/"Français" entry reads as
  // just another link, so use the standard, explicit "Languages" label there
  // (same translation id Docusaurus ships, already provided in fr/code.json).
  const label = mobile ? (
    translate({
      id: "theme.navbar.mobileLanguageDropdown.label",
      message: "Languages",
      description: "The label for the mobile language switcher dropdown",
    })
  ) : (
    <>
      <IconLanguage
        style={{ verticalAlign: "text-bottom", marginRight: "0.3em" }}
      />
      {localeConfigs[currentLocale].label}
    </>
  );

  return (
    <DropdownNavbarItem
      {...props}
      mobile={mobile}
      label={label}
      items={items}
    />
  );
}
