import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const GOALS = [
  { id: "steps",    icon: "📋", label: "Step-by-step", desc: "Guided walkthrough" },
  { id: "learn",    icon: "⚡", label: "Learn",         desc: "30-sec explanation" },
  { id: "practice", icon: "🎯", label: "Practice",      desc: "Solve a challenge" },
  { id: "quiz",     icon: "🧠", label: "Quiz",          desc: "Test yourself" },
];

const DOMAIN_COLORS = {
  HR:         { bg: "bg-blue-50 dark:bg-blue-950/30",    border: "border-blue-200 dark:border-blue-800",    text: "text-blue-700 dark:text-blue-300",    icon: "👥" },
  Sales:      { bg: "bg-green-50 dark:bg-green-950/30",  border: "border-green-200 dark:border-green-800",  text: "text-green-700 dark:text-green-300",  icon: "📈" },
  Accounts:   { bg: "bg-amber-50 dark:bg-amber-950/30",  border: "border-amber-200 dark:border-amber-800",  text: "text-amber-700 dark:text-amber-300",  icon: "💼" },
  Inventory:  { bg: "bg-orange-50 dark:bg-orange-950/30",border: "border-orange-200 dark:border-orange-800",text: "text-orange-700 dark:text-orange-300", icon: "📦" },
  Freelancer: { bg: "bg-purple-50 dark:bg-purple-950/30",border: "border-purple-200 dark:border-purple-800",text: "text-purple-700 dark:text-purple-300", icon: "💻" },
};

const SAMPLE_DATA = [
  ["ID", "Name",         "Dept",     "Salary"],
  ["101", "Raj Mehta",   "Sales",    "₹55,000"],
  ["102", "Aman Gupta",  "HR",       "₹48,000"],
  ["103", "Ravi Sharma", "Accounts", "₹62,000"],
  ["104", "Priya Patel", "Sales",    "₹58,000"],
  ["105", "Neha Singh",  "HR",       "₹51,000"],
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function Skel({ w = "w-full", h = "h-4", extra = "" }) {
  return <div className={`animate-pulse rounded bg-slate-200 dark:bg-slate-700 ${w} ${h} ${extra}`} />;
}

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.92;
  u.pitch = 1;
  u.lang = "en-IN";
  window.speechSynthesis.speak(u);
}

// ─── INTERACTIVE EXCEL ───────────────────────────────────────────────────────

function InteractiveExcel({ formulaSoFar, stepIndex, totalSteps, onEnter }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const [formulaInput, setFormulaInput] = useState("");
  const [result, setResult] = useState(null);
  const [tried, setTried] = useState(false);
  const cols = ["A", "B", "C", "D"];
  const inputRef = useRef(null);

  useEffect(() => {
    setFormulaInput(formulaSoFar || "");
    setResult(null);
    setTried(false);
  }, [formulaSoFar]);

  const handleEnter = () => {
    setResult("✓ Result");
    setTried(true);
    if (onEnter) onEnter();
  };

  const isLastStep = stepIndex >= totalSteps - 1;
  const resultRow = 7;

  return (
    <div className="border border-[#bfbfbf] overflow-hidden text-[11.5px] font-mono select-none mt-4">
      {/* Excel title bar */}
      <div className="bg-[#217346] px-3 py-1.5 flex items-center gap-2">
        <span className="text-sm">📗</span>
        <span className="text-white text-xs font-semibold">Book1 — Microsoft Excel</span>
        <div className="ml-auto flex gap-1">
          {["─","□","✕"].map(s => <span key={s} className="text-white/50 text-xs px-1 cursor-default">{s}</span>)}
        </div>
      </div>

      {/* Formula bar */}
      <div className="bg-white border-b border-[#c8c6c4] flex items-center text-[11px]">
        <div className="border-r border-[#c8c6c4] px-2 py-1 w-12 text-center text-[#252423] bg-[#f9f9f9] font-sans">
          {selectedCell || "A1"}
        </div>
        <div className="px-2 text-[#217346] font-bold text-sm border-r border-[#c8c6c4] py-1 font-sans">ƒx</div>
        <input
          ref={inputRef}
          className="flex-1 px-3 py-1 font-mono text-[#0d3880] bg-white outline-none text-[12px]"
          value={formulaInput}
          onChange={e => setFormulaInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleEnter(); }}
          placeholder="Click a cell or type a formula…"
          readOnly={tried}
        />
        {isLastStep && !tried && (
          <button
            onClick={handleEnter}
            className="bg-[#217346] text-white text-xs font-bold px-3 py-1 h-full border-l border-[#c8c6c4] hover:bg-[#1a5e38] transition-colors font-sans"
          >
            ↵ Enter
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="overflow-auto bg-white">
        <table className="border-collapse" style={{ minWidth: "100%" }}>
          <thead>
            <tr>
              <th className="w-8 border border-[#d0d0d0] bg-[#f0efee]" />
              {cols.map(c => (
                <th key={c} className="border border-[#d0d0d0] bg-[#f0efee] text-center text-[#5a5a5a] font-medium py-0.5 px-8 min-w-[90px]">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE_DATA.map((row, ri) => (
              <tr key={ri}>
                <td className={`border border-[#d0d0d0] text-center px-1 py-0.5 ${ri === 0 ? "bg-[#d6e8d6] text-[#1a5e38] font-medium" : "bg-[#f0efee] text-[#5a5a5a]"}`}>
                  {ri + 1}
                </td>
                {cols.map((c, ci) => {
                  const isSelected = selectedCell === `${c}${ri + 1}`;
                  const isHeader = ri === 0;
                  return (
                    <td
                      key={ci}
                      onClick={() => {
                        const ref = `${c}${ri + 1}`;
                        setSelectedCell(ref);
                        if (!tried) setFormulaInput(prev => prev ? prev + ref : ref);
                      }}
                      className={`border py-1 px-2 cursor-pointer transition-colors ${
                        isSelected
                          ? "border-2 border-[#217346] bg-[#e8f5e8]"
                          : isHeader
                          ? "border-[#bfc9d6] bg-[#dce6f1] font-bold text-[#1f3864]"
                          : "border-[#d0d0d0] bg-white hover:bg-[#e8f5e8]"
                      }`}
                    >
                      {row[ci] ?? ""}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Result row */}
            <tr>
              <td className="border border-[#d0d0d0] bg-[#f0efee] text-center text-[#5a5a5a] px-1 py-0.5">
                {resultRow}
              </td>
              <td
                className={`border-2 px-2 py-1 font-bold transition-all ${
                  tried
                    ? "border-[#217346] bg-[#e8f5e8] text-[#1a5e38]"
                    : "border-dashed border-[#aaa] bg-[#f9f9f9] text-[#aaa] cursor-pointer"
                }`}
                onClick={() => { if (!tried) setSelectedCell(`A${resultRow}`); }}
              >
                {tried ? result : "← Result here"}
              </td>
              {[1,2,3].map(i => <td key={i} className="border border-[#d0d0d0] bg-white px-2 py-1" />)}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Status bar */}
      <div className="bg-[#217346] px-3 py-0.5 flex items-center justify-between text-white text-[10px]">
        <span className="opacity-80">{tried ? "✓ Formula entered" : "Click a cell to select · Press Enter to run formula"}</span>
        {tried && <span className="font-bold">Result: {result}</span>}
      </div>
    </div>
  );
}

// ─── STEP-BY-STEP GUIDE ──────────────────────────────────────────────────────

function StepsPanel({ topic, lesson, loading }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [enteredFormula, setEnteredFormula] = useState(false);
  const steps = lesson?.steps || [];
  const total = steps.length;
  const current = steps[stepIdx] || {};
  const pct = total ? Math.round(((stepIdx + 1) / total) * 100) : 0;

  const goNext = () => {
    if (stepIdx >= total - 1) { setCompleted(true); return; }
    setStepIdx(i => i + 1);
    setEnteredFormula(false);
  };
  const goPrev = () => { setStepIdx(i => Math.max(0, i - 1)); setEnteredFormula(false); };
  const restart = () => { setStepIdx(0); setCompleted(false); setEnteredFormula(false); };

  if (loading) return (
    <div className="space-y-4 mt-2">
      <Skel h="h-3" w="w-1/3" />
      <Skel h="h-2" />
      <div className="border border-foreground/10 p-6 space-y-3">
        <Skel h="h-5" w="w-1/2" />
        <Skel />
        <Skel w="w-3/4" />
      </div>
      <Skel h="h-40" />
    </div>
  );

  if (completed) return (
    <div className="text-center py-10 space-y-6">
      <div className="text-5xl">🎉</div>
      <div>
        <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Lesson complete!</div>
        <p className="text-slate-500 mt-1 text-sm">You've finished all {total} steps for <strong>{topic}</strong>.</p>
      </div>

      {/* Cheat sheet on completion */}
      {lesson?.cheat_sheet && (
        <div className="text-left border border-foreground/10 bg-slate-50 dark:bg-slate-900/60 p-5 space-y-3">
          <div className="text-[10px] font-bold tracking-[0.2em] text-slate-500">YOUR CHEAT SHEET</div>
          {[
            { label: "PURPOSE", value: lesson.cheat_sheet.purpose },
            { label: "TIP", value: lesson.cheat_sheet.tip },
            { label: "SHORTCUT", value: lesson.cheat_sheet.shortcut },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-3 text-sm">
              <span className="text-[10px] font-bold tracking-[0.12em] text-[#002FA7] w-20 shrink-0 mt-0.5">{label}</span>
              <span className="text-slate-700 dark:text-slate-200">{value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <button onClick={restart} className="border border-foreground/20 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          ↺ Restart
        </button>
        <Link to="/chat">
          <button className="bg-[#002FA7] text-white px-5 py-2 text-sm font-bold hover:bg-[#002FA7]/90 transition-colors">
            Ask AI a question →
          </button>
        </Link>
      </div>
    </div>
  );

  if (!total) return (
    <div className="py-10 text-center text-slate-400 text-sm">No steps available for this topic.</div>
  );

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span className="font-bold">Step {stepIdx + 1} of {total}</span>
          <span>{pct}% complete</span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 w-full">
          <div
            className="h-2 bg-[#002FA7] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* All steps mini-map */}
      <div className="flex gap-1.5 flex-wrap">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setStepIdx(i)}
            className={`text-[10px] font-bold px-2.5 py-1 border transition-all ${
              i === stepIdx
                ? "bg-[#002FA7] text-white border-[#002FA7]"
                : i < stepIdx
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                : "bg-white dark:bg-slate-900 text-slate-500 border-foreground/15"
            }`}
          >
            {i < stepIdx ? "✓" : i + 1}
          </button>
        ))}
      </div>

      {/* Current step card */}
      <div className="border-2 border-[#002FA7] bg-[#002FA7]/5 dark:bg-[#002FA7]/10">
        <div className="flex items-start gap-4 p-5">
          <div className="w-9 h-9 bg-[#002FA7] text-white font-black text-base flex items-center justify-center shrink-0">
            {stepIdx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-base text-slate-900 dark:text-white mb-1">{current.title}</div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-6">{current.instruction}</p>
          </div>
        </div>

        {/* AI says */}
        {current.ai_says && (
          <div className="border-t border-[#002FA7]/20 bg-white/60 dark:bg-slate-950/50 px-5 py-3 flex items-start gap-3">
            <span className="text-lg shrink-0">🤖</span>
            <div>
              <span className="text-[10px] font-bold tracking-[0.15em] text-[#002FA7] block mb-0.5">AI COACH</span>
              <p className="text-sm text-slate-700 dark:text-slate-200 italic">"{current.ai_says}"</p>
            </div>
            <button
              onClick={() => speak(current.ai_says)}
              className="ml-auto shrink-0 text-slate-400 hover:text-[#002FA7] transition-colors"
              title="Hear it"
            >
              🔊
            </button>
          </div>
        )}
      </div>

      {/* Formula building up */}
      {current.formula_so_far && (
        <div>
          <div className="text-[10px] font-bold tracking-[0.15em] text-slate-500 mb-1.5">FORMULA BUILDING UP</div>
          <div className="bg-[#0f1629] text-[#7AA0FF] font-mono text-sm px-4 py-3 flex items-center gap-2 overflow-x-auto">
            <span className="text-white/40 text-xs shrink-0">ƒx</span>
            <span>{current.formula_so_far}</span>
            <span className="animate-pulse text-white">|</span>
          </div>
        </div>
      )}

      {/* Interactive Excel */}
      <InteractiveExcel
        formulaSoFar={current.formula_so_far || ""}
        stepIndex={stepIdx}
        totalSteps={total}
        onEnter={() => setEnteredFormula(true)}
      />

      {/* Navigation */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={goPrev}
          disabled={stepIdx === 0}
          className="text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors"
        >
          ← Previous
        </button>
        <button
          onClick={goNext}
          className="bg-[#002FA7] text-white px-6 py-2.5 text-sm font-bold hover:bg-[#002FA7]/90 transition-colors flex items-center gap-2"
        >
          {stepIdx >= total - 1 ? "Complete lesson ✓" : "Next step →"}
        </button>
      </div>
    </div>
  );
}

// ─── FLOW DIAGRAM ─────────────────────────────────────────────────────────────

function FlowDiagram({ steps, activeStep, onStep }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mt-4">
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          <button
            onClick={() => onStep(i)}
            className={`px-4 py-2.5 text-sm font-semibold border transition-all ${
              i === activeStep
                ? "border-[#002FA7] bg-[#002FA7] text-white shadow"
                : i < activeStep
                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                : "border-foreground/15 bg-white dark:bg-slate-900 text-slate-500"
            }`}
          >
            {i < activeStep ? "✓ " : ""}{label}
          </button>
          {i < steps.length - 1 && (
            <span className={`text-lg ${i < activeStep ? "text-emerald-400" : "text-slate-300 dark:text-slate-600"}`}>→</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export function LearningExperience({ topic, summary, category, kind = "function" }) {
  const [goal, setGoal] = useState("steps");
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flowStep, setFlowStep] = useState(0);
  const [quizChoice, setQuizChoice] = useState(null);
  const [practiceRevealed, setPracticeRevealed] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const flowTimer = useRef(null);

  useEffect(() => {
    setLoading(true);
    setLesson(null);
    setError(null);
    setQuizChoice(null);
    setPracticeRevealed(false);
    setFlowStep(0);

    api.post("/learning/generate", { topic, summary: summary || "", kind })
      .then(r => setLesson(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [topic, kind]);

  // Auto-advance flow animation
  useEffect(() => {
    if (!lesson || goal !== "learn") return;
    clearInterval(flowTimer.current);
    setFlowStep(0);
    flowTimer.current = setInterval(() => {
      setFlowStep(prev => {
        const max = (lesson.flow_steps?.length || 4) - 1;
        if (prev >= max) { clearInterval(flowTimer.current); return prev; }
        return prev + 1;
      });
    }, 1300);
    return () => clearInterval(flowTimer.current);
  }, [lesson, goal]);

  const domainStyle = DOMAIN_COLORS[lesson?.business_example?.domain] || DOMAIN_COLORS.Sales;

  const handleVoice = () => {
    if (!lesson?.explanation) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    setSpeaking(true);
    const u = new SpeechSynthesisUtterance(lesson.explanation);
    u.rate = 0.92; u.lang = "en-IN";
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  // ── LEARN PANEL ─────────────────────────────────────────────

  const renderLearn = () => (
    <div className="space-y-6">
      {/* 30-second explanation with voice */}
      <div className="border-l-4 border-[#002FA7] bg-[#002FA7]/5 dark:bg-[#002FA7]/10 p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-bold tracking-[0.2em] text-[#002FA7]">30-SECOND EXPLANATION</div>
          <button
            onClick={handleVoice}
            title={speaking ? "Stop" : "Listen"}
            className={`text-xs font-bold px-2.5 py-1 border transition-colors flex items-center gap-1.5 ${
              speaking
                ? "border-[#002FA7] bg-[#002FA7] text-white"
                : "border-foreground/20 text-slate-500 hover:border-[#002FA7] hover:text-[#002FA7]"
            }`}
          >
            {speaking ? "⏹ Stop" : "🔊 Listen"}
          </button>
        </div>
        {loading
          ? <div className="space-y-2"><Skel /><Skel w="w-3/4" /></div>
          : <p className="text-base leading-7 text-slate-800 dark:text-slate-100">{lesson?.explanation}</p>
        }
        {!loading && lesson?.best_for?.length > 0 && (
          <ul className="mt-3 space-y-1">
            {lesson.best_for.map((item, i) => (
              <li key={i} className="text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span> {item}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Animated flow */}
      <div className="border border-foreground/10 bg-slate-50 dark:bg-slate-900/60 p-5">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold tracking-[0.2em] text-slate-500">VISUAL FLOW — HOW IT WORKS</div>
          <button onClick={() => setFlowStep(0)} className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors">↺ Replay</button>
        </div>
        {loading
          ? <div className="flex gap-3 mt-4"><Skel w="w-24" h="h-10" /><Skel w="w-4" h="h-4" extra="mt-3" /><Skel w="w-24" h="h-10" /></div>
          : <>
              <FlowDiagram
                steps={lesson?.flow_steps || ["Input", "Formula", "Result", "Apply"]}
                activeStep={flowStep}
                onStep={setFlowStep}
              />
              {lesson?.flow_description && (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{lesson.flow_description}</p>
              )}
            </>
        }
      </div>

      {/* Interactive Excel preview */}
      <div className="border border-foreground/10 bg-white dark:bg-slate-950 p-5">
        <div className="text-[10px] font-bold tracking-[0.2em] text-slate-500 mb-1">INTERACTIVE EXCEL PREVIEW</div>
        <p className="text-xs text-slate-400 mt-0.5 mb-1">
          Click any cell to select it. Click <strong>↵ Enter</strong> to see the result.
        </p>
        <InteractiveExcel
          formulaSoFar={`=${topic.toUpperCase()}(`}
          stepIndex={0}
          totalSteps={1}
        />
      </div>

      {/* Cheat sheet */}
      {!loading && lesson?.cheat_sheet && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-foreground/10">
          {[
            { label: "PURPOSE",  value: lesson.cheat_sheet.purpose },
            { label: "KEY TIP",  value: lesson.cheat_sheet.tip },
            { label: "SHORTCUT", value: lesson.cheat_sheet.shortcut },
          ].map(({ label, value }) => (
            <div key={label} className="border-r last:border-r-0 border-foreground/10 p-4 bg-white dark:bg-slate-950">
              <div className="text-[10px] font-bold tracking-[0.18em] text-slate-400 mb-2">{label}</div>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-5">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── PRACTICE PANEL ──────────────────────────────────────────

  const renderPractice = () => (
    <div className="space-y-5">
      <div className="border border-foreground/10 bg-slate-50 dark:bg-slate-900/60 p-5">
        <div className="text-[10px] font-bold tracking-[0.2em] text-slate-500 mb-3">YOUR CHALLENGE</div>
        {loading
          ? <Skel w="w-3/4" h="h-5" />
          : <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{lesson?.practice_prompt}</p>
        }
        <InteractiveExcel
          formulaSoFar=""
          stepIndex={0}
          totalSteps={1}
        />
      </div>

      {!practiceRevealed ? (
        <button
          onClick={() => setPracticeRevealed(true)}
          className="w-full border-2 border-[#002FA7] bg-[#002FA7] text-white font-bold py-3 text-sm hover:bg-[#002FA7]/90 transition-colors"
        >
          Reveal the answer
        </button>
      ) : (
        <div className="border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl">🤖</span>
            <div>
              <div className="text-[10px] font-bold tracking-[0.2em] text-emerald-700 dark:text-emerald-300 mb-1">AI FEEDBACK</div>
              {loading
                ? <Skel />
                : <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
                    <strong>Correct approach:</strong> {lesson?.practice_hint}
                  </p>
              }
            </div>
          </div>
        </div>
      )}

      {/* Common mistakes */}
      {!loading && lesson?.mistakes?.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-bold tracking-[0.2em] text-slate-500">COMMON MISTAKES</div>
          {lesson.mistakes.map((m, i) => (
            <div key={i} className="border border-red-200 dark:border-red-900/40 bg-white dark:bg-slate-950">
              <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/30 px-4 py-2">
                <span className="font-mono text-sm font-bold text-red-600 dark:text-red-400">{m.error}</span>
              </div>
              <div className="px-4 py-3 grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[10px] font-bold tracking-[0.12em] text-slate-400 mb-1">WHY</div>
                  <p className="text-slate-700 dark:text-slate-200">{m.reason}</p>
                </div>
                <div>
                  <div className="text-[10px] font-bold tracking-[0.12em] text-emerald-600 mb-1">FIX</div>
                  <p className="text-emerald-700 dark:text-emerald-300">{m.fix}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Business example */}
      {!loading && lesson?.business_example && (
        <div className={`border ${domainStyle.border} ${domainStyle.bg} p-5`}>
          <div className={`text-[10px] font-bold tracking-[0.2em] mb-2 ${domainStyle.text}`}>
            {domainStyle.icon} REAL BUSINESS USE — {lesson.business_example.domain?.toUpperCase()}
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">{lesson.business_example.task}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">{lesson.business_example.description}</p>
        </div>
      )}
    </div>
  );

  // ── QUIZ PANEL ──────────────────────────────────────────────

  const renderQuiz = () => (
    <div className="space-y-5">
      <div className="border border-foreground/10 bg-white dark:bg-slate-950 p-5">
        <div className="text-[10px] font-bold tracking-[0.2em] text-slate-500 mb-4">QUESTION</div>
        {loading
          ? <div className="space-y-3"><Skel h="h-5" /><Skel w="w-2/3" h="h-5" /></div>
          : <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-5">{lesson?.quiz_question}</p>
        }

        {loading
          ? <div className="space-y-2">{[1,2,3,4].map(i => <Skel key={i} h="h-11" />)}</div>
          : (
            <div className="space-y-2">
              {Object.entries(lesson?.quiz_options || {}).map(([key, value]) => {
                const isCorrect = key === lesson?.quiz_correct;
                const isChosen = quizChoice === key;
                const revealed = !!quizChoice;
                return (
                  <button
                    key={key}
                    onClick={() => !quizChoice && setQuizChoice(key)}
                    disabled={!!quizChoice}
                    className={`w-full text-left px-4 py-3 text-sm border transition-all flex items-center gap-3 ${
                      !revealed
                        ? "border-foreground/15 bg-white dark:bg-slate-900 hover:border-[#002FA7] hover:bg-[#002FA7]/5"
                        : isCorrect
                        ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200"
                        : isChosen
                        ? "border-red-400 bg-red-50 dark:bg-red-950/40 text-red-700"
                        : "border-foreground/10 bg-white dark:bg-slate-900 opacity-50"
                    }`}
                  >
                    <span className={`w-6 h-6 flex items-center justify-center text-xs font-bold border shrink-0 ${
                      !revealed ? "border-foreground/20"
                      : isCorrect ? "border-emerald-500 bg-emerald-500 text-white"
                      : isChosen ? "border-red-400 bg-red-400 text-white"
                      : "border-foreground/15"
                    }`}>{key}</span>
                    {value}
                  </button>
                );
              })}
            </div>
          )
        }

        {quizChoice && lesson?.quiz_explanation && (
          <div className="mt-4 border-l-4 border-[#002FA7] bg-[#002FA7]/5 dark:bg-[#002FA7]/10 p-4">
            <div className="text-[10px] font-bold tracking-[0.18em] text-[#002FA7] mb-1">
              {quizChoice === lesson.quiz_correct ? "✓ CORRECT" : "✗ NOT QUITE — here's why:"}
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200">{lesson.quiz_explanation}</p>
          </div>
        )}
      </div>
      {quizChoice && (
        <button onClick={() => setQuizChoice(null)} className="text-xs font-bold text-[#002FA7] underline">Try again</button>
      )}
    </div>
  );

  const panels = {
    steps:    () => <StepsPanel topic={topic} lesson={lesson} loading={loading} />,
    learn:    renderLearn,
    practice: renderPractice,
    quiz:     renderQuiz,
  };

  // ── RENDER ─────────────────────────────────────────────────

  return (
    <section className="mt-8 border border-foreground/10 bg-white/95 dark:bg-slate-950/90 shadow-sm">

      {/* Header */}
      <div className="px-6 py-5 border-b border-foreground/10 bg-slate-50/70 dark:bg-slate-900/70">
        <div className="overline text-emerald-700 dark:text-emerald-300/90 mb-1">INTERACTIVE LESSON</div>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">
          Learn {topic} — no videos, no waiting
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Step-by-step guide · Interactive Excel · AI coach · Quiz · Voice explanation
        </p>
      </div>

      {/* Goal tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-foreground/10">
        {GOALS.map(g => (
          <button
            key={g.id}
            onClick={() => setGoal(g.id)}
            className={`flex flex-col items-start gap-0.5 px-5 py-4 text-left border-r last:border-r-0 border-foreground/10 transition-colors ${
              goal === g.id
                ? "bg-[#002FA7] text-white"
                : "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900"
            }`}
          >
            <span className="text-base">{g.icon}</span>
            <span className={`text-sm font-bold ${goal === g.id ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>{g.label}</span>
            <span className={`text-xs ${goal === g.id ? "text-white/70" : "text-slate-400"}`}>{g.desc}</span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="px-6 py-10 text-center text-sm text-slate-500">
          Could not load lesson.{" "}
          <button className="text-[#002FA7] underline font-medium" onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {/* Active panel */}
      {!error && (
        <div className="p-6 lg:p-8">
          {panels[goal]?.()}
        </div>
      )}

      {/* Footer CTA */}
      <div className="px-6 py-4 border-t border-foreground/10 bg-slate-50/70 dark:bg-slate-900/70 flex flex-wrap gap-3 items-center justify-between">
        <p className="text-xs text-slate-400">
          {loading ? "Generating lesson with AI…" : `AI lesson ready for ${topic}`}
        </p>
        <div className="flex gap-2">
          <Link to="/chat">
            <button className="bg-[#002FA7] text-white text-xs font-bold px-4 py-2 hover:bg-[#002FA7]/90 transition-colors">
              Ask AI coach →
            </button>
          </Link>
          <Link to="/formula-generator">
            <button className="border border-foreground/20 text-xs font-bold px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Generate formula
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
