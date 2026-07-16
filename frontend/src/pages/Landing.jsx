import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { ArrowRight, ChartLine, BookOpen, Table, MagnifyingGlass, Lightning, Sparkle, Star, Quotes } from "@phosphor-icons/react";

const FEATURE_IMG = "https://images.unsplash.com/photo-1770816306252-b970806ebdf1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMHdoaXRlJTIwZ3JpZCUyMGFyY2hpdGVjdHVyZXxlbnwwfHx8fDE3NzgxNjYzNjJ8MA&ixlib=rb-4.1.0&q=85";

function ExcelMockup() {
  const rows = [
    { n: 1, a: "Sales Rep", b: "Region", c: "Revenue", d: "Status", header: true },
    { n: 2, a: "Alice Chen", b: "East", c: "₹48,200", d: "✓ Met", green: true },
    { n: 3, a: "Bob Kumar", b: "West", c: "₹31,500", d: "✗ Below" },
    { n: 4, a: "Carol Singh", b: "East", c: "₹62,800", d: "✓ Met", green: true },
    { n: 5, a: "David Rao", b: "North", c: "₹29,100", d: "✗ Below" },
    { n: 6, a: "", b: "", c: "=SUM(C2:C5)", d: "", sum: true },
  ];
  return (
    <div className="select-none rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 text-[12px]">
      {/* Excel green title bar */}
      <div className="bg-[#1D6F42] px-4 py-2.5 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-white/20" />
          <div className="w-3 h-3 rounded-full bg-white/20" />
          <div className="w-3 h-3 rounded-full bg-white/20" />
        </div>
        <span className="text-white text-xs font-medium opacity-90 ml-1">SalesTracker.xlsx — Microsoft Excel</span>
      </div>
      {/* Ribbon hint */}
      <div className="bg-[#f3f2f1] border-b border-gray-300 px-4 py-1 flex gap-4 text-[10px] text-gray-500">
        {["File","Home","Insert","Page Layout","Formulas","Data","Review"].map(t=>(
          <span key={t} className={t==="Formulas"?"text-[#1D6F42] font-semibold":""}>{t}</span>
        ))}
      </div>
      {/* Formula bar */}
      <div className="bg-[#f3f2f1] border-b border-gray-300 px-3 py-1.5 flex items-center gap-2">
        <span className="bg-white border border-gray-300 px-2 py-0.5 font-mono text-gray-700 text-[11px] min-w-[40px] text-center">C6</span>
        <span className="text-gray-400 font-bold text-sm">ƒx</span>
        <span className="font-mono text-[#7030A0] text-[11px] flex-1">=SUM(C2:C5)</span>
      </div>
      {/* Sheet */}
      <div className="bg-white">
        {/* Col headers */}
        <div className="flex border-b border-gray-300 bg-[#f3f2f1] text-[10px] font-semibold text-gray-500">
          <div className="w-8 shrink-0 border-r border-gray-300 py-1" />
          {["A","B","C","D"].map((c,i)=>(
            <div key={c} className={`flex-1 text-center py-1 border-r border-gray-300 ${i===2?"bg-[#dce6f1] text-[#17375e]":""}`}>{c}</div>
          ))}
        </div>
        {rows.map(row=>(
          <div key={row.n} className={`flex border-b border-gray-200 ${row.header?"bg-[#1D6F42] text-white font-semibold":""} ${row.sum?"bg-[#f3f2f1] font-bold":""}`}>
            <div className={`w-8 shrink-0 text-center border-r border-gray-300 py-2 text-[10px] ${row.header?"bg-[#155734] text-white/70":"text-gray-400"}`}>{row.n}</div>
            <div className={`flex-1 px-2 py-2 border-r border-gray-200 ${row.header?"text-white":""}`}>{row.a}</div>
            <div className={`flex-1 px-2 py-2 border-r border-gray-200 ${row.header?"text-white":""}`}>{row.b}</div>
            <div className={`flex-1 px-2 py-2 border-r border-gray-200 font-medium ${row.sum?"text-[#7030A0] font-mono":""} ${!row.header&&!row.sum?"bg-[#dce6f1] text-[#17375e]":""} ${row.header?"text-white":""}`}>{row.c}</div>
            <div className={`flex-1 px-2 py-2 ${row.green?"text-[#1D6F42] font-semibold":""} ${row.header?"text-white":""} ${!row.green&&!row.header&&row.d?"text-red-500":""}`}>{row.d}</div>
          </div>
        ))}
      </div>
      {/* Status bar */}
      <div className="bg-[#1D6F42] px-4 py-1.5 flex items-center text-white/80 text-[10px]">
        <span>READY</span>
        <div className="ml-auto flex gap-5">
          <span>Average: ₹42,900</span>
          <span>Sum: ₹1,71,600</span>
          <span>Count: 4</span>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    api.get("/reviews").then((r) => setReviews(r.data.slice(0, 6))).catch(() => {});
  }, []);

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen page-bg text-foreground dark:text-white">
      <Header />

      {/* HERO — lavender gradient with floating cards */}
      <section className="hero-bg relative overflow-hidden border-b border-foreground/15">
        {/* Decorative floating dots */}
        {[[120,80],[300,160],[80,300],[500,100],[420,280],[180,400],[560,340],[650,180]].map(([x,y],i)=>(
          <div key={i} className="absolute rounded-full pointer-events-none" style={{
            left:x, top:y,
            width: i%3===0?10:i%3===1?6:8,
            height: i%3===0?10:i%3===1?6:8,
            background: i%2===0?"rgba(99,102,241,0.25)":"rgba(59,130,246,0.20)"
          }} />
        ))}
        {/* dot grid bottom-left */}
        <div className="absolute bottom-8 left-6 grid grid-cols-5 gap-2 opacity-30 pointer-events-none">
          {Array(25).fill(0).map((_,i)=><div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400"/>)}
        </div>
        {/* dot grid bottom-right */}
        <div className="absolute bottom-8 right-6 grid grid-cols-5 gap-2 opacity-30 pointer-events-none">
          {Array(25).fill(0).map((_,i)=><div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>)}
        </div>

        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* LEFT — text */}
            <div>
              <div className="flex flex-wrap gap-2 mb-8">
                {["=VLOOKUP()","=SUMIFS()","=XLOOKUP()","=LAMBDA()"].map(f=>(
                  <span key={f} className="font-mono text-xs px-3 py-1.5 rounded-full bg-white/80 shadow-sm text-indigo-600 border border-indigo-100 backdrop-blur">{f}</span>
                ))}
              </div>
              <p className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-3">EXCEL · DECODED</p>
              <h1 className="text-5xl sm:text-6xl lg:text-[4rem] font-black tracking-tight leading-[1.05] mb-6 text-gray-900 dark:text-white">
                Every Excel<br/>formula.<br/>
                <span className="text-indigo-600 dark:text-indigo-400">Solved.</span>
              </h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-md leading-relaxed">
                Browse 60+ functions with live examples, curated tutorials, and AI-powered help — all in one place.
              </p>
              <div className="flex flex-wrap items-center gap-3 mb-10">
                <Link to="/signup" data-testid="hero-cta-signup">
                  <Button size="lg" className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white h-13 px-8 text-base font-bold shadow-lg shadow-indigo-200">
                    Start Free <ArrowRight size={18} className="ml-2" />
                  </Button>
                </Link>
                <Link to="/login" data-testid="hero-cta-login">
                  <Button size="lg" variant="outline" className="rounded-full border-gray-300 bg-white/60 backdrop-blur h-13 px-8 text-base text-gray-700 hover:bg-white">
                    Sign in
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
                <span>100+ Functions</span>
                <span>Live Excel Preview</span>
                <span>Free to Start</span>
                {avg && <span>⭐ {avg} Rated</span>}
              </div>
            </div>

            {/* RIGHT — floating 3D-style cards */}
            <div className="hidden lg:block relative h-[420px]">
              {/* Line chart card — top right */}
              <div className="absolute top-0 right-0 w-72 bg-white dark:bg-[#1a1f35] rounded-2xl shadow-xl p-5 z-20">
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Functions Learned</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white mb-3">60+ <span className="text-emerald-500 text-sm font-bold">↑ Growing</span></p>
                <svg viewBox="0 0 200 60" className="w-full h-14">
                  <defs>
                    <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d="M0,50 C30,45 40,30 70,25 C100,20 120,35 150,15 C170,5 190,8 200,5" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M0,50 C30,45 40,30 70,25 C100,20 120,35 150,15 C170,5 190,8 200,5 L200,60 L0,60Z" fill="url(#lg1)"/>
                  <circle cx="200" cy="5" r="4" fill="#6366f1"/>
                </svg>
              </div>

              {/* Excel icon + users stat — bottom left */}
              <div className="absolute bottom-8 left-0 bg-white dark:bg-[#1a1f35] rounded-2xl shadow-xl p-4 flex items-center gap-4 z-20 min-w-[200px]">
                <div className="w-14 h-14 rounded-xl bg-[#1D6F42] flex items-center justify-center shadow-lg shrink-0">
                  <span className="text-white font-black text-2xl">X</span>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-widest">Total Users</p>
                  <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">2,847</p>
                  <p className="text-xs text-emerald-500 font-semibold mt-0.5">↑ 12.5%</p>
                </div>
              </div>

              {/* Donut chart card — middle */}
              <div className="absolute top-28 left-10 bg-white dark:bg-[#1a1f35] rounded-2xl shadow-lg p-4 z-10">
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-widest mb-2">Category Mix</p>
                <svg viewBox="0 0 80 80" className="w-20 h-20 mx-auto">
                  <circle cx="40" cy="40" r="28" fill="none" stroke="#e0e7ff" strokeWidth="12"/>
                  <circle cx="40" cy="40" r="28" fill="none" stroke="#6366f1" strokeWidth="12" strokeDasharray="60 116" strokeDashoffset="-10" strokeLinecap="round"/>
                  <circle cx="40" cy="40" r="28" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray="35 141" strokeDashoffset="-70" strokeLinecap="round"/>
                  <circle cx="40" cy="40" r="28" fill="none" stroke="#f59e0b" strokeWidth="12" strokeDasharray="21 155" strokeDashoffset="-105" strokeLinecap="round"/>
                  <text x="40" y="44" textAnchor="middle" className="text-[10px]" fill="#374151" fontWeight="800" fontSize="12">60+</text>
                </svg>
              </div>

              {/* Bar chart card — bottom right */}
              <div className="absolute bottom-0 right-4 bg-white dark:bg-[#1a1f35] rounded-2xl shadow-lg p-4 z-20">
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-widest mb-3">Usage</p>
                <div className="flex items-end gap-1.5 h-16">
                  {[40,65,50,80,60,90,75].map((h,i)=>(
                    <div key={i} className="w-5 rounded-t-sm" style={{
                      height:`${h}%`,
                      background: i===5?"#6366f1":i===3?"#10b981":"#c7d2fe"
                    }}/>
                  ))}
                </div>
              </div>

              {/* Floating + badge */}
              <div className="absolute top-2 left-36 w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg z-30">
                <span className="text-white font-black text-lg leading-none">+</span>
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
            <div className="md:col-span-7 border-r border-b border-foreground/15 p-8 lg:p-12 lift bg-white dark:bg-[#111827]">
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

            <div className="md:col-span-5 border-r border-b border-foreground/15 p-8 lg:p-12 lift bg-[#0a1628] text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
                backgroundSize: "28px 18px"
              }} />
              <div className="relative">
                <Table size={36} weight="duotone" className="mb-6" style={{ color: "#7AA0FF" }} />
                <div className="overline mb-2 text-blue-300/70">02 / LIVE EXCEL PREVIEW</div>
                <h3 className="text-2xl lg:text-3xl font-bold tracking-tight mb-4">See every formula in a real spreadsheet.</h3>
                <p className="text-blue-100/70 leading-relaxed">
                  Each function shows a live Excel-style grid with your data, formula bar,
                  and highlighted result — exactly as it appears in Excel.
                </p>
              </div>
            </div>

            <div className="md:col-span-4 border-r border-b border-foreground/15 p-8 lg:p-12 lift bg-white dark:bg-[#111827]">
              <BookOpen size={36} weight="duotone" className="klein mb-6" />
              <div className="overline mb-2">03 / TUTORIALS</div>
              <h3 className="text-xl lg:text-2xl font-bold tracking-tight mb-3">Pivots, lookups, charts, errors.</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Curated guides for the tasks you actually do every week.</p>
            </div>

            <div className="md:col-span-4 border-r border-b border-foreground/15 p-8 lg:p-12 lift bg-secondary dark:bg-[#1a2235]">
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
        <section className="border-b border-foreground/15 bg-secondary dark:bg-[#0d1117]">
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
                <div key={r.id} className="border-r border-b border-foreground/15 p-8 bg-white dark:bg-[#111827] lift">
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
                Start <span style={{ color: "#7AA0FF" }}>mastering</span>.
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
            <svg width="24" height="24" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="30" height="30" fill="#002FA7"/>
              <text x="15" y="21" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic">ƒx</text>
            </svg>
            <span className="font-bold tracking-tight whitespace-nowrap">XLSBUDDY</span>
          </div>
          <div className="overline text-white/50">© 2026 · Built with rigor</div>
        </div>
      </footer>
    </div>
  );
}
