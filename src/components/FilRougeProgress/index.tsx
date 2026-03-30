import Link from "@docusaurus/Link";
import { useDoc } from "@docusaurus/plugin-content-docs/client";
import { useChapterProgress } from "../CourseProgress/useChapterProgress";
import styles from "./styles.module.css";

export default function FilRougeProgress() {
  const { metadata } = useDoc();
  const { chapters, currentIndex, visitedIds } = useChapterProgress(
    "fil-rouge-progress",
    metadata.id,
  );

  if (chapters.length === 0 || currentIndex < 0) return null;

  const current = chapters[currentIndex];
  const percent = Math.round(((currentIndex + 1) / chapters.length) * 100);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.projectLabel}>
          Mystery Gift &mdash; Etape {currentIndex + 1} / {chapters.length}
        </span>
        <span className={styles.stepTitle}>&mdash; {current.label}</span>
      </div>

      <div
        className={styles.barTrack}
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={chapters.length}
        aria-label={`Progression : étape ${currentIndex + 1} sur ${chapters.length}`}
      >
        <div className={styles.barFill} style={{ width: `${percent}%` }} />
      </div>

      <div className={styles.steps}>
        {chapters.map((ch, i) => {
          const isCurrent = i === currentIndex;
          const isVisited = visitedIds.has(ch.docId);
          const stepClass = [
            styles.step,
            isCurrent
              ? styles.stepCurrent
              : isVisited
                ? styles.stepVisited
                : "",
          ]
            .filter(Boolean)
            .join(" ");

          const icon = isCurrent ? "\u25B6" : isVisited ? "\u2713" : `${i + 1}`;

          return (
            <Link
              key={ch.docId}
              to={ch.href}
              className={stepClass}
              aria-label={`Etape ${i + 1} : ${ch.label}`}
              {...(isCurrent ? { "aria-current": "step" } : {})}
            >
              <span className={styles.stepIcon}>{icon}</span>
              {ch.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
