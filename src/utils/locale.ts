/**
 * Strip a single trailing slash from a runtime pathname, preserving the root "/".
 *
 * Shared by SiteMetadata and LocaleDropdownNavbarItem so both resolve the
 * current path against the locale-doc-map plugin's keys identically. The plugin
 * itself builds those keys from frontmatter slugs (never trailing-slashed), so
 * it has no need for this helper: normalization is purely a runtime concern,
 * since `location.pathname` may or may not carry a trailing slash.
 */
export function normalizePathname(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}
