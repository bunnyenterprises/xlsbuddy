import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Lock, BookOpen, Lightning, Clock, CaretDown, ArrowRight } from "@phosphor-icons/react";
import api from "@/lib/api";

function LessonRow({ lesson, pathSlug }) {
  const isLocked = false; // future: sequential locking

  return (
    <Link
      to={lesson.completed || !isLocked ? `/lesson/${lesson.id}` : "#"}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
        isLocked
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
      }`}
    >
      {/* Status icon */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${
        lesson.completed
          ? "bg-emerald-500 text-white"
          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
      }`}>
        {lesson.completed ? <CheckCircle size={16} weight="fill" /> : lesson.order}
      </div>

      {/* Lesson info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${
          lesson.completed ? "text-gray-500 dark:text-gray-400 line-through" : "text-gray-900 dark:text-white"
        }`}>
          {lesson.title}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-0.5 text-xs text-gray-400 dark:text-gray-500">
            <Clock size={10} /> {lesson.estimated_minutes} min
          </span>
          <span className="flex items-center gap-0.5 text-xs text-[#002FA7] dark:text-blue-400 font-semibold">
            <Lightning size={10} weight="fill" /> +{lesson.xp_value} XP
          </span>
        </div>
      </div>

      <ArrowRight size={14} className="text-gray-400 shrink-0" />
    </Link>
  );
}

function ModuleAccordion({ module, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const completed = module.lessons.filter((l) => l.completed).length;
  const total = module.lessons.length;
  const pct = total > 0 ? Math.round(completed / total * 100) : 0;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-4 bg-white dark:bg-[#111d36] hover:bg-gray-50 dark:hover:bg-[#162038] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#002FA7] dark:text-blue-400 uppercase tracking-wide">
              Module {module.order}
            </span>
            {completed === total && total > 0 && (
              <CheckCircle size={13} weight="fill" className="text-emerald-500" />
            )}
          </div>
          <h3 className="font-black text-gray-900 dark:text-white text-base">{module.title}</h3>
          {module.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{module.description}</p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-gray-600 dark:text-gray-300">{completed}/{total}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500">lessons</div>
          </div>
          <div className="w-12 h-12 relative hidden sm:block">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-200 dark:text-gray-700" />
              <circle
                cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3"
                className="text-[#002FA7]"
                strokeDasharray={`${pct * 0.879} 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-700 dark:text-gray-300">
              {pct}%
            </span>
          </div>
          <CaretDown size={16} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111d36] px-2 py-2 space-y-1">
          {module.lessons.map((lesson) => (
            <LessonRow key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PathView() {
  const { pathSlug } = useParams();
  const navigate = useNavigate();
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/learn/paths/${pathSlug}`);
        setPath(res.data);
      } catch (err) {
        if (err.response?.status === 403) {
          navigate("/pricing");
        } else {
          navigate("/learn");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pathSlug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#002FA7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!path) return null;

  const allLessons = path.modules.flatMap((m) => m.lessons);
  const totalCompleted = allLessons.filter((l) => l.completed).length;
  const totalLessons = allLessons.length;
  const overallPct = totalLessons > 0 ? Math.round(totalCompleted / totalLessons * 100) : 0;

  const nextLesson = allLessons.find((l) => !l.completed);

  // Open first incomplete module by default
  const firstIncompleteModule = path.modules.findIndex((m) =>
    m.lessons.some((l) => !l.completed)
  );

  return (
    <div className="min-h-screen page-bg">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Back */}
        <Link to="/learn" className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium mb-6 w-fit transition-colors">
          <ArrowLeft size={14} /> All Paths
        </Link>

        {/* Path header */}
        <div className="bg-white dark:bg-[#111d36] rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-4">
            <span className="text-5xl">{path.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wide text-[#002FA7] dark:text-blue-400">
                  {path.level}
                </span>
                {path.is_pro && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">Pro</span>
                )}
              </div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{path.title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{path.description}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <BookOpen size={14} /> {totalLessons} lessons
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-[#002FA7] dark:text-blue-400">
                  <Lightning size={14} weight="fill" /> {totalCompleted}/{totalLessons} done
                </span>
              </div>
            </div>
          </div>

          {/* Overall progress */}
          <div className="mt-5">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
              <span>Overall Progress</span>
              <span className="font-bold">{overallPct}%</span>
            </div>
            <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#002FA7] rounded-full transition-all duration-700"
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>

          {/* Continue CTA */}
          {nextLesson && (
            <Link
              to={`/lesson/${nextLesson.id}`}
              className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#002FA7] hover:bg-blue-800 text-white font-bold text-sm transition-colors"
            >
              <ArrowRight size={15} weight="bold" />
              {totalCompleted === 0 ? "Start Learning" : "Continue Learning"}
            </Link>
          )}
          {totalCompleted === totalLessons && totalLessons > 0 && (
            <div className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm">
              <CheckCircle size={16} weight="fill" /> Path Complete! 🎉
            </div>
          )}
        </div>

        {/* Module list */}
        <div>
          {path.modules.map((module, i) => (
            <ModuleAccordion
              key={module.id}
              module={module}
              defaultOpen={i === firstIncompleteModule || firstIncompleteModule === -1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
