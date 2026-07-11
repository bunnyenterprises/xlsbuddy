import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { ArrowRight, ChartLine, BookOpen, Table, MagnifyingGlass, Lightning, Sparkle, Star, Quotes } from "@phosphor-icons/react";

const HERO_IMG = "https://images.unsplash.com/photo-1758784092383-0b5529082731?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwzfHxhYnN0cmFjdCUyMHdoaXRlJTIwZ3JpZCUyMGFyY2hpdGVjdHVyZXxlbnwwfHx8fDE3NzgxNjYzNjJ8MA&ixlib=rb-4.1.0&q=85";
const FEATURE_IMG = "https://images.unsplash.com/photo-1770816306252-b970806ebdf1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMHdoaXRlJTIwZ3JpZCUyMGFyY2hpdGVjdHVyZXxlbnwwfHx8fDE3NzgxNjYzNjJ8MA&ixlib=rb-4.1.0&q=85";

export default function Landing() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    api.get("/reviews").then((r) => setReviews(r.data.slice(0, 6))).catch(() => {});
  }, []);

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#030712] text-foreground dark:text-white">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-foreground/15 bg-white dark:bg-[#030712]">
        {/* Background image — more vivid */}
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `url(${HERO_IMG})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.5 }}
          aria-hidden
        />
        {/* Light mode: gradient left→right so text stays readable */}
        <div
          className="absolute inset-0 dark:hidden"
          style={{ background: "linear-gradient(105deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.85) 35%, rgba(255,255,255,0.45) 65%, rgba(255,255,255,0.05) 100%)" }}
          aria-hidden
        />
        {/* Dark mode: deep navy gradient left→right */}
        <div
          className="absolute inset-0 hidden dark:block"
          style={{ background: "linear-gradient(105deg, rgba(3,7,18,0.97) 0%, rgba(3,7,18,0.85) 38%, rgba(3,7,18,0.45) 65%, rgba(3,7,18,0.05) 100%)" }}
          aria-hidden
        />
        {/* Subtle blue brand glow bottom-right */}
        <div
          className="absolute bottom-0 right-0 w-[50%] h-[70%] pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 80% 80%, rgba(37,99,235,0.18) 0%, transparent 65%)" }}
          aria-hidden
        />
        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10 pt-20 pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 slide-in">
              <div className="overline klein mb-6">EXCEL · DECODED</div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-tight mb-8">
                Every Excel formula.<br/>
                Every error.<br/>
                <span className="klein">Solved.</span>
              </h1>
              <p className="text-base sm:text-lg max-w-2xl text-muted-foreground mb-10 leading-relaxed">
                Browse 60+ Excel functions with live examples. Read curated tutorials.
                Ask our AI anything — get answers in seconds, not hours.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link to="/signup" data-testid="hero-cta-signup">
                  <Button size="lg" className="rounded-none bg-klein hover:bg-[#002FA7]/90 text-white h-14 px-8 text-base">
                    Start Free <ArrowRight size={18} className="ml-2" />
                  </Button>
                </Link>
                <Link to="/login" data-testid="hero-cta-login">
                  <Button size="lg" variant="outline" className="rounded-none border-foreground/30 h-14 px-8 text-base">
                    Sign in
                  </Button>
                </Link>
              </div>
              <div className="mt-12 flex flex-wrap gap-x-10 gap-y-3 overline text-foreground/70">
                <span>100+ FUNCTIONS</span>
                <span>LIVE EXCEL PREVIEW</span>
                <span>0$ TO START</span>
                {avg && <span>⭐ {avg} RATED</span>}
              </div>
            </div>
            <div className="lg:col-span-4 hidden lg:flex flex-col justify-end">
              <div className="border-l-4 border-klein pl-6 py-2">
                <div className="overline mb-2">PROBLEM</div>
                <div className="text-2xl font-bold tracking-tight leading-tight">
                  73% of analysts waste hours googling formulas.
                </div>
                <div className="overline mt-6 mb-2 klein">SOLUTION</div>
                <div className="text-2xl font-bold tracking-tight leading-tight">
                  One place. Searchable. Smart.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES — Tetris grid */}
      <section className="border-b border-foreground/15 dark:border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20">
          <div className="overline klein mb-3">CAPABILITIES</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-12 max-w-3xl">
            100+ formulas. Four tools. Zero spreadsheet panic.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border-l border-t border-foreground/15">
            <div className="md:col-span-7 border-r border-b border-foreground/15 p-8 lg:p-12 lift bg-white">
              <ChartLine size={36} weight="duotone" className="klein mb-6" />
              <div className="overline mb-2">01 / FUNCTIONS LIBRARY</div>
              <h3 className="text-2xl lg:text-3xl font-bold tracking-tight mb-4">60+ formulas. Categorized. Explained.</h3>
              <p className="text-muted-foreground leading-relaxed mb-6 max-w-xl">
                SUM, VLOOKUP, XLOOKUP, INDEX/MATCH, PMT, SUMIFS — every function ships
                with syntax, real-world example, and use case.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Math", "Logical", "Lookup", "Text", "Date", "Stats", "Financial"].map((t) => (
                  <span key={t} className="text-xs border border-foreground/20 px-3 py-1 font-medium">{t}</span>
                ))}
              </div>
            </div>

            <div className="md:col-span-5 border-r border-b border-foreground/15 p-8 lg:p-12 lift bg-black text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(${FEATURE_IMG})`, backgroundSize: "cover" }} />
              <div className="relative">
                <Table size={36} weight="duotone" className="mb-6" style={{ color: "#7AA0FF" }} />
                <div className="overline mb-2 text-white/70">02 / LIVE EXCEL PREVIEW</div>
                <h3 className="text-2xl lg:text-3xl font-bold tracking-tight mb-4">See every formula in a real spreadsheet.</h3>
                <p className="text-white/80 leading-relaxed">
                  Each function shows a live Excel-style grid with your data, formula bar,
                  and highlighted result — exactly as it appears in Excel.
                </p>
              </div>
            </div>

            <div className="md:col-span-4 border-r border-b border-foreground/15 p-8 lg:p-12 lift bg-white">
              <BookOpen size={36} weight="duotone" className="klein mb-6" />
              <div className="overline mb-2">03 / TUTORIALS</div>
              <h3 className="text-xl lg:text-2xl font-bold tracking-tight mb-3">Pivots, lookups, charts, errors.</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Curated guides for the tasks you actually do every week.</p>
            </div>

            <div className="md:col-span-4 border-r border-b border-foreground/15 p-8 lg:p-12 lift bg-secondary">
              <MagnifyingGlass size={36} weight="duotone" className="klein mb-6" />
              <div className="overline mb-2">04 / SEARCH</div>
              <h3 className="text-xl lg:text-2xl font-bold tracking-tight mb-3">Find any function in &lt;1 second.</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Search by name, error code, or use case.</p>
            </div>

            <div className="md:col-span-4 border-r border-b border-foreground/15 p-8 lg:p-12 lift bg-klein text-white">
              <Lightning size={36} weight="duotone" className="mb-6" />
              <div className="overline mb-2 text-white/80">05 / SPEED</div>
              <h3 className="text-xl lg:text-2xl font-bold tracking-tight mb-3">No menus. No fluff.</h3>
              <p className="text-white/80 text-sm leading-relaxed">Keyboard-first. Always one click to the answer.</p>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS SECTION */}
      {reviews.length > 0 && (
        <section className="border-b border-foreground/15 bg-secondary">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20">
            <div className="overline klein mb-3">COMMUNITY</div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">What people say.</h2>
                {avg && (
                  <div className="flex items-center gap-3 mt-3">
                    <span className="metric-title klein">{avg}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={20} weight={i <= Math.round(avg) ? "fill" : "regular"} className={i <= Math.round(avg) ? "klein" : "text-foreground/20"} />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">from {reviews.length} review{reviews.length !== 1 && "s"}</span>
                  </div>
                )}
              </div>
              <Link to="/reviews">
                <Button variant="outline" className="rounded-none border-foreground/30">
                  See all reviews <ArrowRight size={14} className="ml-2" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-foreground/15">
              {reviews.map((r) => (
                <div key={r.id} className="border-r border-b border-foreground/15 p-8 bg-white lift">
                  <Quotes size={28} className="text-foreground/15 mb-4" weight="fill" />
                  <div className="flex mb-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={14} weight={i <= r.rating ? "fill" : "regular"} className={i <= r.rating ? "klein" : "text-foreground/20"} />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-4 text-foreground/80 line-clamp-4">{r.comment}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-klein flex items-center justify-center text-white text-xs font-bold">
                      {r.user_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{r.user_name}</div>
                      <div className="overline text-muted-foreground">{r.updated_at?.slice(0, 10)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-black text-white py-24 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-8">
              <div className="overline mb-4 text-white/60">READY?</div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Stop googling.<br/>
                Start <span className="text-[#7AA0FF]">mastering</span>.
              </h2>
            </div>
            <div className="md:col-span-4">
              <Link to="/signup" data-testid="footer-cta-signup">
                <Button size="lg" className="rounded-none bg-white text-black hover:bg-white/90 h-16 px-10 text-lg w-full sm:w-auto">
                  <Sparkle size={20} weight="fill" className="mr-2" />
                  Create free account
                </Button>
              </Link>
              <div className="mt-6 overline text-white/60">NO CARD · INSTANT ACCESS</div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-white border-t border-white/10 py-10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-klein flex items-center justify-center">
              <span className="text-white font-black text-xs">X</span>
            </div>
            <span className="font-bold tracking-tight">XLSBUDDY</span>
          </div>
          <div className="overline text-white/50">© 2026 · Built with rigor</div>
        </div>
      </footer>
    </div>
  );
}
