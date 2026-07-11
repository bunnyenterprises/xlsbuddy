import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  BookmarkSimple,
  BookOpen,
  Function as FunctionIcon,
  Trash
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";

export default function Bookmarks() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [items, setItems] = useState({}); // id -> full item data
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data: bms } = await api.get("/bookmarks");
      setBookmarks(bms);
      // Fetch full details for each bookmark
      const details = {};
      await Promise.all(bms.map(async (b) => {
        try {
          const endpoint = b.item_type === "function" ? `/functions/${b.item_id}` : `/tutorials/${b.item_id}`;
          const { data } = await api.get(endpoint);
          details[b.item_id] = { ...data, item_type: b.item_type };
        } catch {}
      }));
      setItems(details);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (itemId) => {
    try {
      await api.delete(`/bookmarks/${itemId}`);
      setBookmarks((prev) => prev.filter((b) => b.item_id !== itemId));
      toast("Bookmark removed");
    } catch {
      toast.error("Failed to remove bookmark");
    }
  };

  const functions = bookmarks.filter((b) => b.item_type === "function");
  const tutorials = bookmarks.filter((b) => b.item_type === "tutorial");

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />
      <main className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
        <div className="overline klein mb-3">SAVED</div>
        <h1 className="page-title mb-3">Your bookmarks.</h1>
        <p className="text-muted-foreground mb-10 max-w-2xl">Functions and tutorials you've saved for quick access.</p>

        {loading ? (
          <div className="overline text-muted-foreground">Loading…</div>
        ) : bookmarks.length === 0 ? (
          <div className="border border-foreground/15 p-16 text-center">
            <BookmarkSimple size={40} weight="fill" className="text-foreground/20 mx-auto mb-4" />
            <div className="overline mb-2">NO BOOKMARKS YET</div>
            <p className="text-muted-foreground text-sm mb-6">Browse functions and tutorials and hit Bookmark to save them here.</p>
            <div className="flex gap-4 justify-center">
              <Link to="/functions" className="text-sm font-bold klein underline">Browse Functions →</Link>
              <Link to="/tutorials" className="text-sm font-bold klein underline">Browse Tutorials →</Link>
            </div>
          </div>
        ) : (
          <>
            {functions.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                  <FunctionIcon size={20} className="klein" weight="bold" />
                  <h2 className="section-title">Functions <span className="text-muted-foreground font-normal">({functions.length})</span></h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-foreground/15">
                  {functions.map((b) => {
                    const item = items[b.item_id];
                    if (!item) return null;
                    return (
                      <div key={b.item_id} className="border-r border-b border-foreground/15 p-6 bg-white dark:bg-gray-900 group relative">
                        <button
                          onClick={() => remove(b.item_id)}
                          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all"
                          title="Remove bookmark"
                        >
                          <Trash size={16} />
                        </button>
                        <div className="flex items-center gap-2 mb-2">
                          <FunctionIcon size={16} className="klein" weight="bold" />
                          <span className="font-extrabold text-base tracking-tight">{item.name}</span>
                          <Badge variant="outline" className="rounded-none border-foreground/20 text-xs ml-auto mr-7">{item.category}</Badge>
                        </div>
                        <code className="block text-xs bg-secondary border border-foreground/10 p-2 mb-3 truncate">{item.syntax}</code>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">{item.description}</p>
                        <button
                          onClick={() => navigate(`/functions/${b.item_id}`)}
                          className="overline text-xs klein hover:underline"
                        >VIEW →</button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {tutorials.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen size={20} className="klein" weight="duotone" />
                  <h2 className="section-title">Tutorials <span className="text-muted-foreground font-normal">({tutorials.length})</span></h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-foreground/15">
                  {tutorials.map((b) => {
                    const item = items[b.item_id];
                    if (!item) return null;
                    return (
                      <div key={b.item_id} className="border-r border-b border-foreground/15 p-6 bg-white dark:bg-gray-900 group relative">
                        <button
                          onClick={() => remove(b.item_id)}
                          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all"
                          title="Remove bookmark"
                        >
                          <Trash size={16} />
                        </button>
                        <div className="overline text-muted-foreground mb-2 text-xs">{item.category}</div>
                        <h3 className="font-bold text-base leading-tight mb-2 pr-6">{item.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">{item.summary}</p>
                        <button
                          onClick={() => navigate(`/tutorials/${b.item_id}`)}
                          className="overline text-xs klein hover:underline"
                        >READ →</button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
