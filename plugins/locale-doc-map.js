const fs = require("node:fs");
const path = require("node:path");

/**
 * Recursively walk a directory and extract doc slugs from markdown frontmatter.
 */
function walkDocs(dir, base) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDocs(full, base));
    } else if (/\.mdx?$/.test(entry.name)) {
      const content = fs.readFileSync(full, "utf8");
      const match = content.match(/^slug:\s*["']?([^\s"']+)["']?/m);
      if (!match) continue;

      const rel = path.relative(base, full).replace(/\\/g, "/");
      const docId = rel.replace(/\.mdx?$/, "");
      const dirName = path.posix.dirname(rel);
      const slug = match[1];

      results.push({ docId, slug, dirName });
    }
  }
  return results;
}

function docToPath(doc) {
  if (doc.slug === "/") return "/";
  if (doc.dirName === ".") return `/${doc.slug}`;
  return `/${doc.dirName}/${doc.slug}`;
}

module.exports = function localeDocMapPlugin(context) {
  return {
    name: "locale-doc-map",

    async loadContent() {
      const enDir = path.join(context.siteDir, "content");
      const frDir = path.join(
        context.siteDir,
        "i18n",
        "fr",
        "docusaurus-plugin-content-docs",
        "current"
      );

      const enDocs = walkDocs(enDir, enDir);
      const frDocs = walkDocs(frDir, frDir);

      // Build bidirectional mapping: enPath <-> frPath
      const mapping = {};

      for (const enDoc of enDocs) {
        const frDoc = frDocs.find((d) => d.docId === enDoc.docId);
        if (!frDoc) continue;

        const enPath = docToPath(enDoc);
        const frPath =
          frDoc.slug === "/" ? "/fr" : `/fr${docToPath(frDoc)}`;

        mapping[enPath] = frPath;
        mapping[frPath] = enPath;
      }

      return mapping;
    },

    async contentLoaded({ content, actions }) {
      actions.setGlobalData(content);
    },
  };
};
