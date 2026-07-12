import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MagnifyingGlass, Function as FunctionIcon, Lock, Crown } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";

export default function Functions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [funcs, setFuncs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/functions/categories"),
      api.get("/functions"),
    ]).then(([cats, fns]) => {
      setCategories(["All", ...cats.data]);
      setFuncs(fns.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (searchParams.get("focus") === "search") {
      const el = document.getElementById("functions-search");
      el?.focus();
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    return funcs.filter((f) => {
      const catOk = activeCat === "All" || f.category === activeCat;
      const s = search.trim().toLowerCase();
      const sOk = !s || f.name.toLowerCase().includes(s) ||
                       f.description.toLowerCase().includes(s) ||
                       f.use_case.toLowerCase().includes(s);
      return catOk && sOk;
    });
  }, [funcs, activeCat, search]);

  return (
    <div className="min-h-screen page-bg dark:bg-[#030712]">
      <Header />
      <main className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10 lg:py-14" data-testid="functions-page">

        {/* Hero banner */}
        <div className="relative mb-10 rounded-none overflow-hidden border border-foreground/10 bg-gradient-to-br from-[#002FA7] to-[#1a3fcf] p-8 lg:p-12 text-white">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 70% 50%, #fff 0%, transparent 60%)"}} />
          <div className="relative">
            <div className="overline mb-3 text-white/70">FUNCTIONS LIBRARY</div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-2">All Excel functions.</h1>
            <p className="text-white/80 max-w-2xl">
              {funcs.length > 0 ? `${funcs.length} formulas` : "100+"} · Browse by category, search by name or use case.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-2xl search-glow">
          <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="functions-search"
            data-testid="functions-search-input"
            placeholder="Search SUM, VLOOKUP, error, formula…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-none border-foreground/20 h-12 pl-12 text-base bg-white dark:bg-gray-900 shadow-sm"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8" data-testid="functions-categories">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              data-testid={`cat-${c.toLowerCase().replace(/[^a-z]/g, '-')}`}
              className={`text-sm font-semibold px-4 py-2 rounded-full border transition-all ${
                activeCat === c
                  ? "bg-klein text-white border-transparent shadow-md shadow-blue-200"
                  : "bg-white dark:bg-gray-900 border-foreground/20 hover:border-klein hover:text-[#2563eb]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="overline text-muted-foreground">Loading functions…</div>
        ) : filtered.length === 0 ? (
          <div className="border border-foreground/15 p-12 text-center">
            <div className="overline mb-2">NO RESULTS</div>
            <div className="text-muted-foreground">No functions match your filters.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((f) => {
              const isLocked = f.is_pro && !user?.is_pro && !user?.is_admin;
              return (
              <button
                key={f.id}
                onClick={() => navigate(`/functions/${f.id}`)}
                data-testid={`func-card-${f.name.toLowerCase()}`}
                className={`text-left p-6 bg-white dark:bg-gray-900 border lift relative group rounded-sm shadow-sm transition-all ${
                  isLocked
                    ? "border-amber-200 hover:border-amber-400"
                    : "border-foreground/10 hover:border-[#2563eb]/40 hover:shadow-blue-100 dark:hover:shadow-none"
                }`}
              >
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity ${isLocked ? "from-amber-400 to-yellow-300" : "from-[#2563eb] to-[#818cf8]"}`} />
                {isLocked && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <Lock size={9} weight="fill" /> PRO
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLocked ? "bg-amber-50 dark:bg-amber-950" : "bg-blue-50 dark:bg-blue-950"}`}>
                      {isLocked
                        ? <Crown size={16} className="text-amber-500" weight="fill" />
                        : <FunctionIcon size={16} className="klein" weight="bold" />
                      }
                    </div>
                    <span className="font-extrabold text-lg tracking-tight">{f.name}</span>
                  </div>
                  <Badge variant="outline" className="rounded-full border-foreground/20 text-xs px-3">{f.category}</Badge>
                </div>
                <code className={`block text-xs border border-foreground/10 p-2 mb-3 truncate rounded ${isLocked ? "bg-amber-50/50 dark:bg-amber-950/30" : "bg-gray-50 dark:bg-gray-800"}`}>{f.syntax}</code>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{f.description}</p>
              </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
