import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MagnifyingGlass, BookOpen, ArrowRight, MicrosoftExcelLogo, Lock } from "@phosphor-icons/react";

const CATEGORY_COLORS = {
  "Lookup": "from-blue-600 to-blue-800",
  "Data Analysis": "from-violet-600 to-violet-800",
  "Formatting": "from-emerald-600 to-emerald-800",
  "Finance": "from-amber-600 to-amber-800",
  "Advanced Formulas": "from-rose-600 to-rose-800",
  "Power BI": "from-yellow-500 to-orange-600",
  "Data Entry": "from-teal-600 to-teal-800",
  "Automation": "from-slate-600 to-slate-800",
};

export default function Tutorials() {
  const navigate = useNavigate();
  const [tuts, setTuts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/tutorials").then((r) => setTuts(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = tuts.filter((t) => {
    const s = search.trim().toLowerCase();
    return !s || t.title.toLowerCase().includes(s) || t.summary.toLowerCase().includes(s) || t.category.toLowerCase().includes(s);
  });

  return (
    <div className="min-h-screen page-bg dark:text-white">
      <Header />
      <main className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10 lg:py-14" data-testid="tutorials-page">

        {/* Hero */}
        <div className="relative mb-10 overflow-hidden border border-foreground/10 bg-gradient-to-br from-[#002FA7] to-[#1a3fcf] p-8 lg:p-12 text-white">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 70% 50%, #fff 0%, transparent 60%)"}} />
          <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="overline mb-3 text-white/70 flex items-center gap-2">
                <MicrosoftExcelLogo size={15} weight="fill" /> TUTORIALS
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-2">Learn Excel with guided AI lessons.</h1>
              <p className="text-white/80 max-w-2xl">
                {filtered.length > 0 ? `${filtered.length} guided lessons` : "26 guided lessons"} · Short explanations, practice, quizzes, and business examples.
              </p>
            </div>
            <div className="relative max-w-sm w-full">
              <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
              <Input
                data-testid="tutorials-search-input"
                placeholder="Search tutorials..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-none border-white/20 bg-white/10 text-white placeholder:text-white/50 h-12 pl-12 text-base backdrop-blur-sm"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="overline text-slate-500 dark:text-slate-400">Loading tutorials...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((t, i) => (
              <button
                key={t.id}
                onClick={() => navigate(`/tutorials/${t.id}`)}
                data-testid={`tutorial-card-${i}`}
                className="text-left bg-white dark:bg-gray-900 border border-foreground/10 lift group overflow-hidden flex flex-col"
              >
                {/* Thumbnail */}
                {t.image_url ? (
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={t.image_url}
                      alt={t.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.closest(".relative").className = `relative h-40 bg-gradient-to-br ${CATEGORY_COLORS[t.category] || "from-blue-600 to-blue-800"} flex items-center justify-center`;
                        e.target.replaceWith(Object.assign(document.createElement("span"), {className:"text-white/30 text-5xl font-black", textContent: t.category?.[0] || "E"}));
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                      AI LESSON
                    </div>
                    {t.is_pro && (
                      <div className="absolute top-3 left-3 bg-amber-500 text-black text-xs font-bold px-2 py-0.5 flex items-center gap-1">
                        <Lock size={10} weight="fill" /> PRO
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`h-40 bg-gradient-to-br ${CATEGORY_COLORS[t.category] || "from-blue-600 to-blue-800"} flex items-center justify-center relative overflow-hidden`}>
                    <span className="text-white/20 text-7xl font-black">{t.category?.[0] || "E"}</span>
                    <BookOpen size={36} weight="duotone" className="absolute text-white/80" />
                    <div className="absolute top-3 right-3 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                      AI LESSON
                    </div>
                    {t.is_pro && (
                      <div className="absolute top-3 left-3 bg-amber-500 text-black text-xs font-bold px-2 py-0.5 flex items-center gap-1">
                        <Lock size={10} weight="fill" /> PRO
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex gap-2 mb-3">
                    <Badge variant="outline" className="rounded-none border-foreground/20 text-xs">{t.category}</Badge>
                    <Badge className="rounded-none bg-klein text-white text-xs">{t.level}</Badge>
                  </div>
                  <h3 className="font-bold text-base text-gray-950 dark:text-slate-100 group-hover:text-blue-600 transition-colors mb-2 leading-snug">{t.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 flex-1">{t.summary}</p>
                  <div className="overline flex items-center gap-2 text-blue-600 dark:text-blue-400 mt-4 pt-4 border-t border-foreground/10">
                    READ GUIDE <ArrowRight size={14} weight="bold" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
