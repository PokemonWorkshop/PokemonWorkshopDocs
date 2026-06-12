const fs = require("node:fs");
const path = require("node:path");

const FRONTMATTER_OPEN = "---\n";
const FRONTMATTER_CLOSE = "\n---\n";

/**
 * Read a markdown file and split its leading frontmatter from the body.
 * Returns null when the file has no frontmatter block (the docs convention).
 * Assumes LF line endings, enforced repo-wide via .gitattributes.
 */
function readMarkdown(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  if (!content.startsWith(FRONTMATTER_OPEN)) return null;

  const closeIndex = content.indexOf(
    FRONTMATTER_CLOSE,
    FRONTMATTER_OPEN.length,
  );
  if (closeIndex === -1) return null;

  const frontmatter = content.slice(FRONTMATTER_OPEN.length, closeIndex);
  const body = content.slice(closeIndex + FRONTMATTER_CLOSE.length);
  return { frontmatter, body };
}

function extractSlug(frontmatter) {
  const match = frontmatter.match(/^slug:\s*["']?([^\s"']+)["']?/m);
  return match ? match[1] : null;
}

/**
 * Build the slug-based URL path (without extension) for a doc, mirroring the
 * rendered route: the source directory tree plus the page slug.
 */
function toUrlPath(relPath, slug) {
  const relDir = path.dirname(relPath).replace(/\\/g, "/");
  const cleanSlug = slug.startsWith("/") ? slug.slice(1) : slug;
  if (!relDir || relDir === ".") return cleanSlug;
  return `${relDir}/${cleanSlug}`;
}

/**
 * Walk a docs source tree and write a clean `.md` file (frontmatter stripped)
 * into outDir at each page's slug-based URL path. Skips the home page
 * (slug "/"). Returns the number of files written.
 */
function copyMarkdownTree(sourceDir, outDir) {
  if (!fs.existsSync(sourceDir)) return 0;

  let count = 0;
  for (const relPath of fs.globSync("**/*.{md,mdx}", { cwd: sourceDir })) {
    const parsed = readMarkdown(path.join(sourceDir, relPath));
    if (!parsed) continue;

    const slug = extractSlug(parsed.frontmatter);
    if (!slug || slug === "/") continue;

    const dstPath = path.join(outDir, `${toUrlPath(relPath, slug)}.md`);
    fs.mkdirSync(path.dirname(dstPath), { recursive: true });
    fs.writeFileSync(dstPath, parsed.body);
    count++;
  }

  return count;
}

module.exports = function rawMarkdownPlugin() {
  return {
    name: "raw-markdown",

    async postBuild({ outDir, siteDir, i18n }) {
      const { currentLocale, defaultLocale } = i18n;
      const isDefault = currentLocale === defaultLocale;
      const sourceDir = isDefault
        ? path.join(siteDir, "content")
        : path.join(
            siteDir,
            "i18n",
            currentLocale,
            "docusaurus-plugin-content-docs",
            "current",
          );

      const count = copyMarkdownTree(sourceDir, outDir);
      console.log(
        `[raw-markdown] ${currentLocale}: copied ${count} markdown files`,
      );
    },
  };
};
