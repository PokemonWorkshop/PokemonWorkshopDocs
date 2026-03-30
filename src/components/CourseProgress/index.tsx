import Link from "@docusaurus/Link";
import { useDoc } from "@docusaurus/plugin-content-docs/client";
import styles from "./styles.module.css";
import { useChapterProgress } from "./useChapterProgress";

export default function CourseProgress() {
  const { metadata } = useDoc();
  const { chapters, currentIndex, visitedIds } = useChapterProgress(
    "ruby-course-progress",
    metadata.id,
  );

  if (chapters.length === 0 || currentIndex < 0) return null;

  const current = chapters[currentIndex];
  const percent = Math.round(((currentIndex + 1) / chapters.length) * 100);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.chapterLabel}>
          Chapitre {currentIndex + 1} / {chapters.length}
        </span>
        <span className={styles.chapterTitle}>&mdash; {current.label}</span>
      </div>

      <div
        className={styles.barTrack}
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={chapters.length}
        aria-label={`Progression : chapitre ${currentIndex + 1} sur ${chapters.length}`}
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
                aria-label={`Chapitre ${i + 1} : ${ch.label}`}
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
