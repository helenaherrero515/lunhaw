"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/Header";
import { AuthDialog } from "@/components/AuthDialog";
import { SavedItemsDrawer } from "@/components/saved/SavedItemsDrawer";

const ExploreView = dynamic(
  () => import("@/components/explore/ExploreView").then((mod) => mod.ExploreView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-[#F4F1EA] text-stone-600">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-700 border-t-transparent" />
          <span className="text-sm font-semibold text-stone-700">Loading Metro Manila Havens Map...</span>
        </div>
      </div>
    ),
  }
);

export default function ExplorePage() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#F4F1EA]">
      <Header />
      <main className="flex-1 overflow-hidden pt-16">
        <ExploreView className="h-full w-full min-h-0" />
      </main>
      <AuthDialog />
      <SavedItemsDrawer />
    </div>
  );
}
