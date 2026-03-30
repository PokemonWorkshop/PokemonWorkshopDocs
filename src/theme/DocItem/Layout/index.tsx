import { useDoc } from "@docusaurus/plugin-content-docs/client";
import CourseProgress from "@site/src/components/CourseProgress";
import FilRougeProgress from "@site/src/components/FilRougeProgress";
import OriginalDocItemLayout from "@theme-original/DocItem/Layout";
import type { Props } from "@theme/DocItem/Layout";

export default function DocItemLayout(props: Props) {
  const { metadata } = useDoc();

  return (
    <>
      {metadata.sourceDirName === "ruby-course" && <CourseProgress />}
      {metadata.sourceDirName === "psdk/ui-development" && <FilRougeProgress />}
      <OriginalDocItemLayout {...props} />
    </>
  );
}
