import RubyPlayground from "@site/src/components/RubyPlayground";
import type { Props } from "@theme/CodeBlock";
import OriginalCodeBlock from "@theme-original/CodeBlock";
import type React from "react";

function isLiveRuby(props: Props): boolean {
  const { metastring, className } = props as Props & {
    metastring?: string;
    className?: string;
  };

  const isRuby =
    typeof className === "string" && className.includes("language-ruby");
  const isLive = typeof metastring === "string" && /\blive\b/.test(metastring);

  return isRuby && isLive;
}

function extractCode(children: React.ReactNode): string {
  if (typeof children === "string") return children.trim();

  return String(children ?? "").trim();
}

export default function CodeBlock(props: Props) {
  if (isLiveRuby(props)) {
    return <RubyPlayground code={extractCode(props.children)} />;
  }

  return <OriginalCodeBlock {...props} />;
}
