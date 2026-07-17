import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Lock, CheckCircle, ArrowRight, Lightning, Trophy, Star } from "@phosphor-icons/react";
import api from "@/lib/api";

const LEVEL_COLORS = {
  beginner: { bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" },
  intermediate: { bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
  advanced: { bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800", badge: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" },
};

function PathCard({ path, onStart }) {
  const colors = LEVEL_COLORS[path.level] || LEVEL_COLORS.beginner;
  const isComplete = path.progress_pct === 100;
  const hasStarted = path.completed_lessons > 0;

  return (
    <div className={`rounded-2xl border-2 ${colors.border} ${colors.bg} overflow-hidden transition-all hover:shadow-lg`}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <span className="text-4xl">{path.emoji}</span>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.badge} uppercase tracking-wide`}>
              {path.level}
            </span>
            {path.locked && (
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                <Lock size={12} weight="bold" /> Pro
              </span>
            )}
            {isComplete && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle size={12} weight="fill" /> Done
              </span>
            )}
          </div>
        </div>

        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">{path.title}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{path.description}</p>
      </div>

      {/* Stats row */}
      <div className="px-6 pb-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <BookOpen size={13} /> {path.total_lessons} lessons
        </span>
        <span className="flex items-center gap-1">
          <Lightning size={13} /> {path.total_xp} XP
        </span>
        <span>~{path.estimated_hours}h</span>
      </div>

      {/* Progress bar */}
      <div className="px-6 pb-4">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
          <span>{path.completed_lessons}/{path.total_lessons} completed</span>
          <span>{path.progress_pct}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#002FA7] rounded-full transition-all duration-500"
            style={{ width: `${path.progress_pct}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-6">
        {path.locked ? (
          <Link
            to="/pricing"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors"
          >
            <Lock size={15} weight="bold" />
            Unlock with Pro
          </Link>
        ) : (
          <Link
            to={`/learn/${path.slug}`}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#002FA7] hover:bg-blue-800 text-white font-bold text-sm transition-colors"
          >
            {isComplete ? (
              <>
                <Trophy size={15} weight="fill" /> Review Path
              </>
            ) : hasStarted ? (
              <>
                <ArrowRight size={15} weight="bold" /> Continue Learning
              </>
            ) : (
              <>
                <BookOpen size={15} weight="bold" /> Start Path
              </>
            )}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function Learn() {
  const [paths, setPaths] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [pathsRes, progressRes] = await Promise.all([
          api.get("/learn/paths"),
          api.get("/learn/progress"),
        ]);
        setPaths(pathsRes.data.paths);
        setProgress(progressRes.data);
      } catch {
        // handled by auth context redirect
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#002FA7] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading your learning paths...</p>
        </div>
      </div>
    );
  }

  const totalCompleted = paths.reduce((s, p) => s + p.completed_lessons, 0);
  const totalLessons = paths.reduce((s, p) => s + p.total_lessons, 0);

  return (
    <div className="min-h-screen page-bg">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
            Learn Excel with AI Coach
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            From absolute basics to advanced formulas. Your AI coach is with you every step.
          </p>
        </div>

        {/* Progress summary */}
        {progress && (
          <div className="bg-white dark:bg-[#1c2640] rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-8 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{progress.level?.emoji}</span>
              <div>
                <div className="font-black text-gray-900 dark:text-white">{progress.level?.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{progress.xp} XP total</div>
              </div>
            </div>
            <div className="h-10 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            <div className="text-center">
              <div className="text-2xl font-black text-[#002FA7] dark:text-blue-400">{progress.streak}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">day streak 🔥</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-[#002FA7] dark:text-blue-400">{totalCompleted}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">of {totalLessons} lessons</div>
            </div>
            {totalLessons > 0 && (
              <div className="flex-1 min-w-[140px]">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                  Overall progress — {Math.round(totalCompleted / totalLessons * 100)}%
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#002FA7] rounded-full transition-all"
                    style={{ width: `${Math.round(totalCompleted / totalLessons * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Path cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {paths.map((path) => (
            <PathCard key={path.id} path={path} />
          ))}
        </div>

        {/* Quick tools promo */}
        <div className="bg-white dark:bg-[#1c2640] rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-black text-gray-900 dark:text-white mb-4">Quick Tools</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { to: "/chat", emoji: "🤖", label: "AI Chat" },
              { to: "/formula-lab", emoji: "⚗️", label: "Formula Lab" },
              { to: "/excel-analyzer", emoji: "📊", label: "Analyze Excel" },
              { to: "/functions", emoji: "📚", label: "Function Library" },
            ].map((t) => (
              <Link
                key={t.to}
                to={t.to}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all text-center"
              >
                <span className="text-2xl">{t.emoji}</span>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{t.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
