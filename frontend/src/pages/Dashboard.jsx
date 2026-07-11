import React from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { ChartLine, BookOpen, ChatCircleDots, MagnifyingGlass, BookmarkSimple, ArrowUpRight, Sparkle } from "@phosphor-icons/react";

export default function Dashboard() {
  const { user } = useAuth();

  const tiles = [
    { to: "/functions", title: "Functions Library", desc: "Browse 60+ Excel functions by category. Syntax, examples, and real use cases.", icon: ChartLine, accent: "white" },
    { to: "/chat", title: "AI Assistant", desc: "Ask Claude Sonnet anything about Excel — formulas, errors, best practices.", icon: ChatCircleDots, accent: "black" },
    { to: "/tutorials", title: "Tutorials", desc: "Curated guides for pivots, lookups, conditional formatting, errors, and more.", icon: BookOpen, accent: "white" },
    { to: "/bookmarks", title: "Bookmarks", desc: "Quick access to functions and tutorials you've saved.", icon: BookmarkSimple, accent: "secondary" },
    { to: "/formula-generator", title: "Formula Generator", desc: "Describe what you want in plain English — get the exact Excel formula instantly.", icon: Sparkle, accent: "klein" },
    { to: "/functions?focus=search", title: "Quick Search", desc: "Find any function in less than a second by name or use case.", icon: MagnifyingGlass, accent: "secondary" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-950 dark:to-gray-900">
      <Header />
      <main className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8 lg:py-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white p-8 lg:p-12 mb-10 shadow-xl">
          <div className="text-sm uppercase tracking-widest opacity-80 mb-3">XLSBUDDY</div>
          <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
            <div className="text-[300px] font-black">XLS</div>
          </div>
          <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Welcome back, {user?.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl">
            Search Excel formulas, learn tutorials, and get AI-powered Excel help in seconds.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <Link to="/functions" className="bg-white/90 backdrop-blur-sm text-blue-700 px-5 py-3 rounded-xl font-semibold">
              Browse Functions
            </Link>
            <Link to="/chat" className="bg-white/20 px-5 py-3 rounded-xl font-semibold">
              Ask AI
            </Link>
            <Link to="/tutorials" className="bg-white/20 px-5 py-3 rounded-xl font-semibold">
              Tutorials
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiles.map((t, i) => {
            const Icon = t.icon;
            const isBlack = t.accent === "black";
            const isSecondary = t.accent === "secondary";
            return (
              <Link
                to={t.to}
                key={t.to}
                data-testid={`tile-${t.title.toLowerCase().replace(/[^a-z]/g, '-')}`}
                style={{ animationDelay: `${i * 0.05}s` }}
                className={`relative group border border-foreground/10 rounded-2xl p-8 lg:p-10 lift slide-in shadow-sm hover:shadow-xl transition-all duration-300 ${
                  isBlack ? "bg-black text-white" : isSecondary ? "bg-secondary dark:bg-gray-800" : "bg-white dark:bg-gray-900 dark:text-white"
                }`}
              >
                <Icon size={36} weight="duotone" className={isBlack ? "text-[#7AA0FF]" : "klein"} />
                <div className={`overline mt-6 mb-2 ${isBlack ? "text-white/60" : "text-muted-foreground"}`}>0{i + 1}</div>
                <h3 className="section-title mb-3">{t.title}</h3>
                <p className={`text-sm leading-relaxed ${isBlack ? "text-white/75" : "text-muted-foreground"}`}>{t.desc}</p>
                <ArrowUpRight size={22} className="absolute top-6 right-6 opacity-60 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 border-l border-t border-foreground/15">
          {[
            { k: "60+", v: "FUNCTIONS" },
            { k: "8", v: "TUTORIALS" },
            { k: "AI", v: "ASSISTANT" },
            { k: "24/7", v: "AI SUPPORT" },
          ].map((s) => (
            <div key={s.v} className="rounded-2xl border border-slate-200 dark:border-gray-700 p-6 lg:p-8 bg-white dark:bg-gray-900 shadow-sm">
              <div className="metric-title klein">{s.k}</div>
              <div className="overline mt-2 dark:text-gray-400">{s.v}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
