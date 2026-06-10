import { useDoc } from "@docusaurus/plugin-content-docs/client";
import { translate } from "@docusaurus/Translate";
import ProgressTracker from "@site/src/components/ProgressTracker";
import OriginalDocItemLayout from "@theme-original/DocItem/Layout";
import type { Props } from "@theme/DocItem/Layout";

export default function DocItemLayout(props: Props) {
  const { metadata } = useDoc();

  const rubyChapterLabel = translate({
    id: "progressTracker.ruby.label",
    message: "Chapter",
    description: "Label prefix for the Ruby course chapters in the progress tracker",
  });

  const uiDevStepLabel = translate({
    id: "progressTracker.uiDev.label",
    message: "Mystery Gift — Step",
    description: "Label prefix for the UI Development tutorial steps in the progress tracker",
  });

  return (
    <>
      {metadata.sourceDirName === "ruby" && (
        <ProgressTracker
          storageKey="ruby-progress"
          label={rubyChapterLabel}
        />
      )}
      {metadata.sourceDirName === "psdk/ui-development/mystery-gift" && (
        <ProgressTracker
          storageKey="fil-rouge-progress"
          label={uiDevStepLabel}
        />
      )}
      <OriginalDocItemLayout {...props} />
    </>
  );
}
