import Link from "@docusaurus/Link";
import type {
  PropSidebarItem,
  PropSidebarItemCategory,
  PropSidebarItemLink,
} from "@docusaurus/plugin-content-docs";
import {
  filterDocCardListItems,
  findFirstSidebarItemLink,
  useCurrentSidebarSiblings,
  useDocById,
} from "@docusaurus/plugin-content-docs/client";
import { ThemeClassNames } from "@docusaurus/theme-common";
import type { Props } from "@theme/DocCardList";
import clsx from "clsx";
import type { ReactNode } from "react";
import styles from "./styles.module.css";

/**
 * Swizzled DocCardList (safe eject of @docusaurus/theme-classic).
 *
 * Category index pages (`generated-index`) ship a 2-column grid of boxed,
 * truncated cards. That format does not scale: sections like Ruby (16 chapters)
 * or the battle engine (16 guides) become a long wall of cards, and a grid
 * breaks the reading order of the numbered Ruby course. We render a single
 * compact list instead — one scannable row per entry, reading order preserved.
 *
 * DocCardList is the component the theme marks as `safe` to swizzle (DocCard
 * and DocCard/Layout are not), so this owns the whole structure using only the
 * public `@docusaurus/plugin-content-docs/client` API — no `theme-common/internal`
 * imports, nothing to break on a minor upgrade. The leading-emoji-from-label
 * feature is dropped on purpose: no label in this repo uses it.
 *
 * Descriptions are rendered as plain text: the frontmatter `description` is the
 * SEO meta tag and is kept Markdown-free by convention (see CONTRIBUTING.md).
 */

type RowProps = {
  href: string;
  title: string;
  description?: string;
};

function Row({ href, title, description }: RowProps): ReactNode {
  return (
    <Link
      href={href}
      className={clsx(ThemeClassNames.docs.docCard.container, styles.row)}
    >
      <span className={styles.body}>
        <span className={styles.title}>{title}</span>
        {description && (
          <span className={styles.description}>{description}</span>
        )}
      </span>
      <span className={styles.chevron} aria-hidden="true">
        ›
      </span>
    </Link>
  );
}

function CategoryRow({ item }: { item: PropSidebarItemCategory }): ReactNode {
  const href = findFirstSidebarItemLink(item);
  // Categories with no linkable child are filtered out upstream; guard anyway.
  if (!href) {
    return null;
  }
  return <Row href={href} title={item.label} description={item.description} />;
}

function LinkRow({ item }: { item: PropSidebarItemLink }): ReactNode {
  const doc = useDocById(item.docId ?? undefined);
  return (
    <Row
      href={item.href}
      title={item.label}
      description={item.description ?? doc?.description}
    />
  );
}

function DocListRow({ item }: { item: PropSidebarItem }): ReactNode {
  switch (item.type) {
    case "link":
      return <LinkRow item={item} />;
    case "category":
      return <CategoryRow item={item} />;
    default:
      // "html" items never appear on generated-index pages.
      return null;
  }
}

function CurrentSidebarRows({ className }: { className?: string }): ReactNode {
  const items = useCurrentSidebarSiblings();
  return <DocCardList items={items} className={className} />;
}

export default function DocCardList(props: Props): ReactNode {
  const { items, className } = props;
  if (!items) {
    return <CurrentSidebarRows className={className} />;
  }
  const filteredItems = filterDocCardListItems(items);
  return (
    <section className={clsx(styles.list, className)}>
      {filteredItems.map((item, index) => (
        <DocListRow key={index} item={item} />
      ))}
    </section>
  );
}
