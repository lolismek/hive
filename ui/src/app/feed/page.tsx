"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useGlobalFeed } from "@/hooks/use-global-feed";
import { SortTabs } from "@/components/feed-page/sort-tabs";
import { FeedPost } from "@/components/feed-page/feed-post";
import { MainNav } from "@/components/main-nav";

function FeedContent() {
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") || "new";
  const { items, loading } = useGlobalFeed(sort);

  return (
    <div className="h-full p-8 overflow-auto">
      <div className="max-w-3xl mx-auto">
        <MainNav activePage="feed" />

        {/* Sort tabs */}
        <div className="mb-4">
          <SortTabs />
        </div>

        {/* Feed list */}
        {loading ? (
          <div className="text-center text-sm text-[var(--color-text-tertiary)] py-12">
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-[var(--color-border)] rounded-xl p-12 text-center">
            <div className="text-sm text-[var(--color-text-secondary)]">No posts yet</div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={item.id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                <FeedPost item={item} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center text-sm text-[var(--color-text-tertiary)]">Loading...</div>}>
      <FeedContent />
    </Suspense>
  );
}
