import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, CheckCircle, LightbulbFilament,
  Robot, X, Lightning, Clock, BookOpen, Star,
} from "@phosphor-icons/react";
import api from "@/lib/api";
import AICoach from "@/components/AICoach";

// ── Markdown-to-JSX renderer (no external dep) ─────────────────────────
function LessonContent({ content }) {
  const lines = content.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith("```")) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} className="bg-gray-900 dark:bg-gray-950 text-green-300 rounded-xl p-4 overflow-x-auto text-sm font-mono my-4 border border-gray-700">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      i++;
      continue;
    }

    // H2
    if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-xl font-black text-gray-900 dark:text-white mt-8 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">{line.slice(3)}</h2>);
      i++; continue;
    }
    // H3
    if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-base font-black text-[#002FA7] dark:text-blue-400 mt-6 mb-3">{line.slice(4)}</h3>);
      i++; continue;
    }

    // Table
    if (line.startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const headers = tableLines[0].split("|").filter(Boolean).map((h) => h.trim());
      const rows = tableLines.slice(2).map((r) => r.split("|").filter(Boolean).map((c) => c.trim()));
      elements.push(
        <div key={i} className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>{headers.map((h, j) => <th key={j} className="bg-[#002FA7] text-white font-bold px-4 py-2 text-left">{renderInline(h)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, j) => (
                <tr key={j} className={j % 2 === 0 ? "bg-gray-50 dark:bg-gray-800/40" : "bg-white dark:bg-transparent"}>
                  {row.map((cell, k) => <td key={k} className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">{renderInline(cell)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Bullet list
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={i} className="list-disc list-inside space-y-1 my-3 text-gray-700 dark:text-gray-300 text-sm">
          {items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={i} className="list-decimal list-inside space-y-1 my-3 text-gray-700 dark:text-gray-300 text-sm">
          {items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
        </ol>
      );
      continue;
    }

    // Blank line
    if (line.trim() === "") { i++; continue; }

    // Paragraph
    elements.push(
      <p key={i} className="text-gray-700 dark:text-gray-300 text-sm leading-7 my-2">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div>{elements}</div>;
}

function renderInline(text) {
  // Bold (**text**) and inline code (`text`)
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="font-mono bg-blue-50 dark:bg-blue-900/30 text-[#002FA7] dark:text-blue-300 px-1.5 py-0.5 rounded text-xs">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

// ── Exercise: Formula Input ────────────────────────────────────────────
function FormulaInput({ exercise, onCorrect }) {
  const [value, setValue] = useState("");
  const [state, setState] = useState("idle"); // idle | checking | correct | wrong
  const [explanation, setExplanation] = useState("");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHint, setCurrentHint] = useState("");
  const [totalHints, setTotalHints] = useState(exercise.hints?.length || 0);
  const lessonId = useParams().lessonId;

  const check = async () => {
    if (!value.trim() || state === "checking") return;
    setState("checking");
    try {
      const res = await api.post(`/learn/lessons/${lessonId}/check`, { answer: value });
      setExplanation(res.data.explanation);
      if (res.data.correct) {
        setState("correct");
        onCorrect();
      } else {
        setState("wrong");
      }
    } catch {
      setState("idle");
    }
  };

  const getHint = async () => {
    if (hintsUsed >= totalHints) return;
    try {
      const res = await api.post(`/learn/lessons/${lessonId}/hint`);
      if (res.data.hint) {
        setCurrentHint(res.data.hint);
        setHintsUsed(res.data.hint_index);
        setTotalHints(res.data.total_hints);
      }
    } catch {}
  };

  const retry = () => {
    setState("idle");
    setExplanation("");
    setValue("");
  };

  return (
    <div className="space-y-4">
      <p className="font-semibold text-gray-900 dark:text-white text-base">{exercise.question}</p>

      {currentHint && (
        <div className="flex gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <LightbulbFilament size={16} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200">{currentHint}</p>
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={(e) => { setValue(e.target.value); setState("idle"); }}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="=YOUR_FORMULA_HERE"
            disabled={state === "correct"}
            className={`w-full font-mono text-sm px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none transition-colors ${
              state === "correct"
                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                : state === "wrong"
                ? "border-red-400"
                : "border-gray-300 dark:border-gray-600 focus:border-[#002FA7]"
            }`}
          />
        </div>
        {state !== "correct" && (
          <button
            onClick={check}
            disabled={!value.trim() || state === "checking"}
            className="px-5 py-3 rounded-xl bg-[#002FA7] hover:bg-blue-800 text-white font-bold text-sm disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            {state === "checking" ? "Checking…" : "Check"}
          </button>
        )}
      </div>

      {/* Result feedback */}
      {state === "correct" && (
        <div className="flex gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700">
          <CheckCircle size={18} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm mb-1">Correct! 🎉</p>
            {explanation && <p className="text-sm text-emerald-700 dark:text-emerald-400">{explanation}</p>}
          </div>
        </div>
      )}
      {state === "wrong" && (
        <div className="flex gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <X size={18} weight="bold" className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-red-700 dark:text-red-300 text-sm mb-1">Not quite — try again!</p>
            {explanation && <p className="text-sm text-red-600 dark:text-red-400 mb-2">{explanation}</p>}
            <button onClick={retry} className="text-xs font-semibold text-red-600 dark:text-red-400 underline">
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Hints */}
      {state !== "correct" && totalHints > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={getHint}
            disabled={hintsUsed >= totalHints}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <LightbulbFilament size={14} weight="fill" />
            {hintsUsed >= totalHints ? "No more hints" : `Hint (${hintsUsed}/${totalHints} used)`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Exercise: Multiple Choice ──────────────────────────────────────────
function MultipleChoice({ exercise, onCorrect }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const lessonId = useParams().lessonId;
  const [explanation, setExplanation] = useState("");

  const submit = async (opt) => {
    if (submitted) return;
    setSelected(opt);
    setSubmitted(true);
    try {
      const res = await api.post(`/learn/lessons/${lessonId}/check`, { answer: opt });
      setExplanation(res.data.explanation);
      if (res.data.correct) onCorrect();
    } catch {}
  };

  const isCorrect = (opt) => submitted && opt === exercise.answer;
  const isWrong = (opt) => submitted && opt === selected && opt !== exercise.answer;

  return (
    <div className="space-y-4">
      <p className="font-semibold text-gray-900 dark:text-white text-base">{exercise.question}</p>
      <div className="space-y-2.5">
        {(exercise.options || []).map((opt) => (
          <button
            key={opt}
            onClick={() => submit(opt)}
            disabled={submitted}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
              isCorrect(opt)
                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                : isWrong(opt)
                ? "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                : submitted && opt === exercise.answer
                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                : submitted
                ? "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "border-gray-200 dark:border-gray-700 hover:border-[#002FA7] hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-white"
            }`}
          >
            <span className="flex items-center gap-2">
              {isCorrect(opt) && <CheckCircle size={16} weight="fill" className="text-emerald-500 shrink-0" />}
              {isWrong(opt) && <X size={16} weight="bold" className="text-red-500 shrink-0" />}
              {opt}
            </span>
          </button>
        ))}
      </div>
      {submitted && explanation && (
        <div className={`p-4 rounded-xl border text-sm ${
          selected === exercise.answer
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
            : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
        }`}>
          {explanation}
        </div>
      )}
    </div>
  );
}

// ── XP Toast ──────────────────────────────────────────────────────────
function XPToast({ xp, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed top-20 right-4 z-50 animate-bounce">
      <div className="flex items-center gap-2 bg-[#002FA7] text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-lg">
        <Lightning size={20} weight="fill" className="text-yellow-300" />
        +{xp} XP earned!
      </div>
    </div>
  );
}

// ── Main LessonView ────────────────────────────────────────────────────
export default function LessonView() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exerciseCorrect, setExerciseCorrect] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [xpToast, setXpToast] = useState(null);
  const [coachOpen, setCoachOpen] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setExerciseCorrect(false);
      setCompleted(false);
      setXpToast(null);
      try {
        const res = await api.get(`/learn/lessons/${lessonId}`);
        setLesson(res.data);
        setCompleted(res.data.completed);
        if (res.data.completed) setExerciseCorrect(true);
      } catch {
        navigate("/learn");
      } finally {
        setLoading(false);
      }
    };
    load();
    contentRef.current?.scrollTo(0, 0);
  }, [lessonId, navigate]);

  const handleComplete = async () => {
    if (completed || completing) return;
    setCompleting(true);
    try {
      const res = await api.post(`/learn/lessons/${lessonId}/complete`);
      setCompleted(true);
      if (!res.data.already_completed) {
        setXpToast(res.data.xp_earned);
      }
    } catch {
    } finally {
      setCompleting(false);
    }
  };

  const goNext = () => {
    if (lesson?.next_lesson_id) navigate(`/lesson/${lesson.next_lesson_id}`);
    else navigate(`/learn/${lesson.path_slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#002FA7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!lesson) return null;

  const exercise = lesson.exercise;
  const hasExercise = exercise && exercise.type && exercise.question;
  const canComplete = !hasExercise || exerciseCorrect;

  return (
    <div className="min-h-screen page-bg">
      {xpToast && <XPToast xp={xpToast} onDone={() => setXpToast(null)} />}

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-[#111d36]/90 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            to={`/learn/${lesson.path_slug}`}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
          >
            <ArrowLeft size={15} /> Back
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-gray-900 dark:text-white text-sm sm:text-base truncate">
              {lesson.title}
            </h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <Clock size={12} /> {lesson.estimated_minutes} min
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-[#002FA7] dark:text-blue-400">
              <Lightning size={12} weight="fill" /> +{lesson.xp_value} XP
            </span>
            {completed && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={13} weight="fill" /> Done
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto flex gap-0 lg:gap-6 px-0 lg:px-4 pb-24 lg:pb-8 pt-4">

        {/* ── Content column ── */}
        <div className="flex-1 min-w-0 px-4 lg:px-0" ref={contentRef}>

          {/* Lesson content (markdown) */}
          <article className="bg-white dark:bg-[#111d36] rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <LessonContent content={lesson.content} />
          </article>

          {/* Exercise panel */}
          {hasExercise && (
            <div className="bg-white dark:bg-[#111d36] rounded-2xl border-2 border-[#002FA7]/30 dark:border-blue-800/50 p-6 mb-6">
              <div className="flex items-center gap-2 mb-5">
                <Star size={16} weight="fill" className="text-[#002FA7]" />
                <h2 className="font-black text-gray-900 dark:text-white">Exercise</h2>
                {exerciseCorrect && (
                  <span className="ml-auto flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle size={13} weight="fill" /> Solved!
                  </span>
                )}
              </div>

              {exercise.type === "formula_input" && (
                <FormulaInput
                  exercise={exercise}
                  onCorrect={() => setExerciseCorrect(true)}
                />
              )}
              {exercise.type === "multiple_choice" && (
                <MultipleChoice
                  exercise={exercise}
                  onCorrect={() => setExerciseCorrect(true)}
                />
              )}
            </div>
          )}

          {/* Complete + navigation */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {lesson.prev_lesson_id && (
              <Link
                to={`/lesson/${lesson.prev_lesson_id}`}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft size={14} /> Previous
              </Link>
            )}

            <div className="flex-1" />

            {!completed ? (
              <button
                onClick={handleComplete}
                disabled={!canComplete || completing}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                  canComplete
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                }`}
              >
                <CheckCircle size={16} weight="bold" />
                {completing ? "Saving…" : canComplete ? `Mark Complete · +${lesson.xp_value} XP` : "Solve the exercise first"}
              </button>
            ) : (
              <button
                onClick={goNext}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#002FA7] hover:bg-blue-800 text-white font-bold text-sm transition-colors"
              >
                {lesson.next_lesson_id ? (
                  <><ArrowRight size={15} weight="bold" /> Next Lesson</>
                ) : (
                  <><BookOpen size={15} weight="bold" /> Back to Module</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Desktop AI Coach sidebar ── */}
        <div className="hidden lg:flex flex-col w-80 shrink-0 sticky top-[61px] h-[calc(100vh-80px)]">
          <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden flex flex-col">
            <AICoach
              lessonId={lessonId}
              lessonTitle={lesson.title}
              defaultOpen={true}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* ── Mobile AI Coach floating button + panel ── */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        {coachOpen ? (
          <div className="fixed inset-x-0 bottom-0 z-50 h-[70vh] rounded-t-2xl border-t border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
            <AICoach
              lessonId={lessonId}
              lessonTitle={lesson.title}
              defaultOpen={true}
            />
            <button
              onClick={() => setCoachOpen(false)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCoachOpen(true)}
            className="w-14 h-14 rounded-full bg-[#002FA7] shadow-2xl flex items-center justify-center"
          >
            <Robot size={24} weight="fill" className="text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
