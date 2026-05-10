const fs = require("fs");
const path = require("path");

/**
 * Read a markdown file, split frontmatter from body.
 * Returns null if the file has no frontmatter (the docs convention).
 */
function readMarkdown(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return null;
  return { frontmatter: match[1], body: content.slice(match[0].length) };
}

function extractSlug(frontmatter) {
  const match = frontmatter.match(/^slug:\s*["']?([^\s"']+)["']?/m);
  return match ? match[1] : null;
}

/**
 * Walk a docs source tree, write `.md` files into outDir at their slug-based
 * URL path. Skips the home page (slug "/"). Files are written without
 * frontmatter so they read as clean markdown for clipboards / LLMs.
 */
function copyMarkdownTree(sourceDir, outDir) {
  if (!fs.existsSync(sourceDir)) return 0;

  let count = 0;
  const stack = [sourceDir];

  while (stack.length > 0) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (!/\.mdx?$/.test(entry.name)) continue;

      const parsed = readMarkdown(fullPath);
      if (!parsed) continue;

      const slug = extractSlug(parsed.frontmatter);
      if (!slug || slug === "/") continue;

      const relDir = path
        .relative(sourceDir, path.dirname(fullPath))
        .replace(/\\/g, "/");
      const cleanSlug = slug.startsWith("/") ? slug.slice(1) : slug;
      const urlPath = relDir && relDir !== "." ? `${relDir}/${cleanSlug}` : cleanSlug;

      const dstPath = path.join(outDir, `${urlPath}.md`);
      fs.mkdirSync(path.dirname(dstPath), { recursive: true });
      fs.writeFileSync(dstPath, parsed.body);
      count++;
    }
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
      console.log(`[raw-markdown] ${currentLocale}: copied ${count} markdown files`);
    },
  };
};
