"use client";

import { useEffect, useState } from "react";
import app from "../../../lib/firebase";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { format } from "date-fns";

export default function PressPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const db = getFirestore(app);
      try {
        const snap = await getDocs(collection(db, "press"));
        setArticles(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.date || "").localeCompare(a.date || "")));
      } catch { /* press collection may not exist yet */ }
      setLoading(false);
    }
    fetch();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Press & Media</h1>
        <p className="text-muted-foreground mt-2">Read about YouDemonia in the news and media.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
          </div>
          <h3 className="text-lg font-semibold">No press articles yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Check back soon for news coverage!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <a key={article.id} href={article.link || "#"} target="_blank" rel="noopener noreferrer" className="group block bg-white rounded-xl border border-border/60 shadow-sm p-6 hover:shadow-md transition-all">
              <div className="flex items-start gap-5">
                {article.image_url && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0 hidden sm:block">
                    <img src={article.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span className="font-semibold text-primary">{article.source}</span>
                    {article.date && (
                      <>
                        <span>•</span>
                        <span>{(() => { try { return format(new Date(article.date), "MMMM d, yyyy"); } catch { return article.date; } })()}</span>
                      </>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">{article.title}</h3>
                  {article.summary && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>}
                </div>
                <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" /></svg>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
