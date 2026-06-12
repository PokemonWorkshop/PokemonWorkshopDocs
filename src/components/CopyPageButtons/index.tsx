import { useLocation } from "@docusaurus/router";
import { useState } from "react";
import styles from "./styles.module.css";

const COPIED_RESET_MS = 2000;

function ClipboardIcon() {
  return (
    <svg
      className={styles.icon}
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="2" width="8" height="2.5" rx="0.5" />
      <path d="M5.5 3.5h-2A1 1 0 0 0 2.5 4.5v9A1 1 0 0 0 3.5 14.5h9A1 1 0 0 0 13.5 13.5v-9A1 1 0 0 0 12.5 3.5h-2" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      className={styles.icon}
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.5 2.5h4v4" />
      <path d="M13.5 2.5l-6 6" />
      <path d="M12.5 9v3.5a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1H7" />
    </svg>
  );
}

function buildMarkdownUrl(pathname: string): string {
  const trimmed = pathname.replace(/\/$/, "") || "/";
  return `${trimmed}.md`;
}

export default function CopyPageButtons() {
  const { pathname } = useLocation();
  const markdownUrl = buildMarkdownUrl(pathname);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      const response = await fetch(markdownUrl);
      if (!response.ok) throw new Error(`Failed to fetch ${markdownUrl}`);
      const text = await response.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch (error) {
      console.error("Copy markdown failed", error);
    }
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        onClick={handleCopy}
        className={styles.button}
        aria-live="polite"
      >
        <ClipboardIcon />
        <span>{copied ? "Copied!" : "Copy page"}</span>
      </button>
      <a
        href={markdownUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.button}
      >
        <ExternalIcon />
        <span>View</span>
      </a>
    </div>
  );
}
