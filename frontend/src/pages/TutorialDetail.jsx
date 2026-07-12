import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookmarkSimple,
  MicrosoftExcelLogo,
  YoutubeLogo,
  Play,
  Crown,
  Lock,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";

function getYouTubeEmbedId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function escapeHtml(str) {
  return str.replace(/[&<>"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));
}

function renderMarkdown(md) {
  if (!md) return "";
  let html = escapeHtml(md);
  html = html.replace(/```([a-z]*)\n([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code class="lang-${escapeHtml(lang)}">${escapeHtml(code)}</code></pre>`);
  html = html.replace(/^### (.*)$/gm, (_, inner) => `<h3>${escapeHtml(inner)}</h3>`);
  html = html.replace(/^## (.*)$/gm, (_, inner) => `<h2>${escapeHtml(inner)}</h2>`);
  html = html.replace(/\*\*([^*]+)\*\*/g, (_, inner) => `<strong>${escapeHtml(inner)}</strong>`);
  html = html.replace(/`([^`]+)`/g, (_, inner) => `<code>${escapeHtml(inner)}</code>`);
  html = html.replace(/((?:^\|.*\|\s*\n)+)/gm, (block) => {
    const rows = block.trim().split("\n");
    if (rows.length < 2) return escapeHtml(block);
    const headerCells = rows[0].split("|").slice(1, -1).map(c => `<th>${escapeHtml(c.trim())}</th>`).join("");
    const bodyRows = rows.slice(2).map(r => {
      const cells = r.split("|").slice(1, -1).map(c => `<td>${escapeHtml(c.trim())}</td>`).join("");
      return `<tr>${cells}</tr>`;
    }).join("");
    return `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
  });
  html = html.replace(/(?:^- .*(?:\n|$))+/gm, (block) => {
    const items = block.trim().split("\n").map(l => `<li>${escapeHtml(l.replace(/^- /, "").trim())}</li>`).join("");
    return `<ul>${items}</ul>`;
  });
  html = html.replace(/(?:^\d+\. .*(?:\n|$))+/gm, (block) => {
    const items = block.trim().split("\n").map(l => `<li>${escapeHtml(l.replace(/^\d+\. /, "").trim())}</li>`).join("");
    return `<ol>${items}</ol>`;
  });
  html = html.split(/\n{2,}/).map(chunk =>
    /^<(h\d|ul|ol|pre|table)/.test(chunk.trim()) ? chunk : `<p>${chunk.replace(/\n/g, " ")}</p>`
  ).join("\n");
  return html;
}

export default function TutorialDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tut, setTut] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  useEffect(() => {
    api.get(`/tutorials/${id}`).then((r) => setTut(r.data)).finally(() => setLoading(false));
    api.get("/bookmarks").then((r) => {
      setBookmarked(r.data.some((b) => b.item_id === id));
    }).catch(() => {});
  }, [id]);

  const toggleBookmark = async () => {
    if (bookmarkLoading) return;
    setBookmarkLoading(true);
    try {
      if (bookmarked) {
        await api.delete(`/bookmarks/${id}`);
        setBookmarked(false);
        toast("Bookmark removed");
      } else {
        await api.post("/bookmarks", { item_type: "tutorial", item_id: id });
        setBookmarked(true);
        toast.success("Bookmarked!");
      }
    } catch {
      toast.error("Could not update bookmark");
    } finally {
      setBookmarkLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen page-bg dark:text-white"><Header />
      <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-12 overline text-slate-500 dark:text-slate-400">Loading...</div>
    </div>
  );

  if (!tut) return (
    <div className="min-h-screen page-bg dark:text-white"><Header />
      <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-12 text-gray-950 dark:text-white">Tutorial not found.</div>
    </div>
  );

  if (tut.gated) return (
    <div className="min-h-screen page-bg dark:text-white">
      <Header />
      <main className="max-w-[860px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
        <button onClick={() => navigate(-1)} className="overline mb-6 flex items-center gap-2 text-slate-600 hover:klein dark:text-slate-400">
          <ArrowLeft size={14} /> BACK
        </button>
        {tut.image_url && (
          <div className="relative w-full h-52 lg:h-64 overflow-hidden mb-6">
            <img src={tut.image_url} alt={tut.title} className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full">
              <Lock size={11} weight="fill" /> PRO
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="rounded-none border-foreground/20">{tut.category}</Badge>
          {tut.level && <Badge className="rounded-none bg-klein text-white">{tut.level}</Badge>}
          {!tut.image_url && (
            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock size={9} weight="fill" /> PRO
            </span>
          )}
        </div>
        <h1 className="page-title mt-3 mb-3 text-slate-950 dark:text-slate-100">{tut.title}</h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-7 mb-10">{tut.summary}</p>
        <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-10 text-center">
          <Crown size={44} weight="fill" className="text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold tracking-tight mb-2">Pro content</h2>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            This in-depth guide is only available on the Pro plan. Upgrade to read the full content, step-by-step examples, and video walkthrough.
          </p>
          <Link to="/pricing">
            <button className="bg-[#002FA7] text-white font-bold px-8 py-3 hover:bg-[#002FA7]/90 transition-colors">
              Upgrade to Pro — ₹299/mo
            </button>
          </Link>
          <p className="text-xs text-muted-foreground mt-4">UPI · Cards · Netbanking · Cancel anytime</p>
        </div>
      </main>
    </div>
  );

  const embedId = getYouTubeEmbedId(tut.video_url);

  return (
    <div className="min-h-screen page-bg dark:text-white">
      <Header />
      <main className="max-w-[860px] mx-auto px-6 lg:px-10 py-10 lg:py-14" data-testid="tutorial-detail-page">
        <button onClick={() => navigate(-1)} className="overline mb-6 flex items-center gap-2 text-slate-600 hover:klein dark:text-slate-400" data-testid="back-button">
          <ArrowLeft size={14} /> BACK
        </button>

        <article className="bg-white/95 dark:bg-slate-950/90 border border-foreground/10 shadow-sm overflow-hidden">

          {/* Hero image */}
          {tut.image_url && (
            <div className="relative w-full h-52 lg:h-72 overflow-hidden">
              <img
                src={tut.image_url}
                alt={tut.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.closest(".relative").style.display = "none"; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-6 flex gap-2">
                <Badge variant="outline" className="rounded-none border-white/40 bg-black/40 text-white backdrop-blur-sm">{tut.category}</Badge>
                {tut.level && <Badge className="rounded-none bg-klein text-white">{tut.level}</Badge>}
              </div>
            </div>
          )}

          <div className="p-6 lg:p-8">
            {/* Badges (when no image) */}
            {!tut.image_url && (
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex gap-2">
                  <Badge variant="outline" className="rounded-none border-foreground/20 bg-white dark:bg-gray-900 dark:text-slate-200">{tut.category}</Badge>
                  {tut.level && <Badge className="rounded-none bg-klein text-white">{tut.level}</Badge>}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleBookmark}
                  disabled={bookmarkLoading}
                  className="rounded-none border-foreground/20 bg-white dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
                >
                  {bookmarked
                    ? <><BookmarkSimple size={15} className="mr-1.5 klein" /> Saved</>
                    : <><BookmarkSimple size={15} className="mr-1.5" /> Bookmark</>
                  }
                </Button>
              </div>
            )}

            {/* Bookmark button (when image exists) */}
            {tut.image_url && (
              <div className="flex justify-end mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleBookmark}
                  disabled={bookmarkLoading}
                  className="rounded-none border-foreground/20 bg-white dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
                >
                  {bookmarked
                    ? <><BookmarkSimple size={15} className="mr-1.5 klein" /> Saved</>
                    : <><BookmarkSimple size={15} className="mr-1.5" /> Bookmark</>
                  }
                </Button>
              </div>
            )}

            <div className="overline text-emerald-700 dark:text-emerald-300/90 mb-3 flex items-center gap-2 tracking-[0.16em]">
              <MicrosoftExcelLogo size={16} weight="fill" />
              Spreadsheet lesson
            </div>
            <h1 className="max-w-3xl page-title mb-4 text-slate-950 dark:text-slate-100">{tut.title}</h1>
            <p className="text-base lg:text-[1.0625rem] text-slate-600 dark:text-slate-300 leading-7 mb-6 border-l-2 border-blue-600 pl-4">{tut.summary}</p>

            {/* YouTube video embed */}
            {embedId && (
              <div className="mb-8">
                {!videoPlaying ? (
                  <button
                    onClick={() => setVideoPlaying(true)}
                    className="relative w-full aspect-video bg-black overflow-hidden group border border-foreground/10"
                    style={{ display: "block" }}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${embedId}/maxresdefault.jpg`}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                        <Play size={28} weight="fill" className="text-white ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      <YoutubeLogo size={16} weight="fill" className="text-red-500" />
                      Watch video tutorial
                    </div>
                  </button>
                ) : (
                  <div className="w-full aspect-video border border-foreground/10">
                    <iframe
                      src={`https://www.youtube.com/embed/${embedId}?autoplay=1`}
                      title="Tutorial video"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
                {/* YouTube credit attribution */}
                <div className="flex items-center justify-between gap-3 mt-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                  <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                    <YoutubeLogo size={18} weight="fill" className="text-red-600 shrink-0" />
                    <span>Video credit: Original creator on YouTube. All rights belong to the respective creator.</span>
                  </div>
                  <a
                    href={tut.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-bold text-red-600 dark:text-red-400 hover:underline whitespace-nowrap"
                  >
                    View on YouTube ↗
                  </a>
                </div>
              </div>
            )}

            {/* Video search link (no embed ID but has video_url) */}
            {tut.video_url && !embedId && (
              <a
                href={tut.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 mb-8 p-4 border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
              >
                <YoutubeLogo size={24} weight="fill" className="text-red-600 shrink-0" />
                <div>
                  <div className="font-bold text-sm">Watch video tutorials on YouTube</div>
                  <div className="text-xs opacity-70">Opens in a new tab</div>
                </div>
              </a>
            )}

            <div className="markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(tut.content) }} />
          </div>
        </article>
      </main>
    </div>
  );
}
