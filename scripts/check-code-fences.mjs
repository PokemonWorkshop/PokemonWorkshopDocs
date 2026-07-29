#!/usr/bin/env node
// Verifies that every fenced code block in the documentation closes.
//
// markdownlint has no rule for this, and an unclosed block is still valid
// Markdown: it silently swallows the rest of the page instead of failing the
// build. That is exactly how a lint pass once turned closing fences into
// ```text and fed whole pages to the Ruby playground as source code.
//
// CommonMark: a closing fence carries NO info string. So once a block is open,
// only a bare ``` closes it; ```anything inside is literal content.
import { readFileSync, globSync } from "node:fs";

const files = [
  ...globSync("content/**/*.md"),
  ...globSync("i18n/**/*.md"),
  ...globSync("*.md"),
].map((path) => path.replaceAll("\\", "/"));

let failures = 0;

for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  let openLine = null;
  let openInfo = "";
  const problems = [];

  lines.forEach((line, index) => {
    const fence = line.match(/^\s*```(.*)$/);
    if (!fence) return;
    const info = fence[1].trim();

    if (openLine === null) {
      openLine = index + 1;
      openInfo = info;
      return;
    }
    if (info === "") {
      openLine = null;
      return;
    }
    problems.push(
      `${file}:${index + 1} \`\`\`${info} sits inside the block opened at line ${openLine} (\`\`\`${openInfo}). A closing fence takes no language.`,
    );
  });

  if (openLine !== null)
    problems.push(
      `${file}:${openLine} block opened with \`\`\`${openInfo} is never closed.`,
    );

  for (const problem of problems) console.error(problem);
  failures += problems.length;
}

if (failures > 0) {
  console.error(`\n${failures} unclosed or mis-closed code block(s).`);
  process.exit(1);
}

console.log(`Code fences: ${files.length} files checked, all blocks close.`);
