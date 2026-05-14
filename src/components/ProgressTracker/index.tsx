import Link from "@docusaurus/Link";
import { useDoc } from "@docusaurus/plugin-content-docs/client";
import { translate } from "@docusaurus/Translate";
import styles from "./styles.module.css";
import { useChapterProgress } from "./useChapterProgress";

interface ProgressTrackerProps {
  storageKey: string;
  label: string;
}

export default function ProgressTracker({
  storageKey,
  label,
}: ProgressTrackerProps) {
  const { metadata } = useDoc();
  const { chapters, currentIndex, visitedIds } = useChapterProgress(
    storageKey,
    metadata.id,
  );

  if (chapters.length === 0 || currentIndex < 0) return null;

  const current = chapters[currentIndex];
  const percent = Math.round(((currentIndex + 1) / chapters.length) * 100);

  const barAriaLabel = translate(
    {
      id: "progressTracker.barAriaLabel",
      message: "Progress: {current} of {total}",
      description: "ARIA label for the progress tracker bar",
    },
    { current: currentIndex + 1, total: chapters.length },
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>
          {label} {currentIndex + 1} / {chapters.length}
        </span>
        <span className={styles.title}>&mdash; {current.label}</span>
      </div>

      <div
        className={styles.barTrack}
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={chapters.length}
        aria-label={barAriaLabel}
      >
        <div className={styles.barFill} style={{ width: `${percent}%` }} />
      </div>

      <div className={styles.dots}>
        {chapters.map((ch, i) => {
          const isCurrent = i === currentIndex;
          const isVisited = visitedIds.has(ch.docId);
          const dotClass = [
            styles.dot,
            isCurrent ? styles.dotCurrent : isVisited ? styles.dotVisited : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={ch.docId} className={styles.dotWrapper}>
              <Link
                to={ch.href}
                className={dotClass}
                aria-label={`${i + 1} — ${ch.label}`}
                {...(isCurrent ? { "aria-current": "step" } : {})}
              />
              <span className={styles.tooltip}>
                {i + 1}. {ch.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
