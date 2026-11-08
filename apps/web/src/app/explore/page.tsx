"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /explore was an early prototype map (hardcoded places and sample routing data).
 * The app now lives at /home, which uses the live directory, so old links are sent there.
 * The ExploreView component is kept for when it moves onto live data.
 */
export default function ExplorePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/home");
  }, [router]);

  return (
    <p style={{ padding: 24, fontFamily: "Kufam, system-ui, sans-serif" }}>
      Lunhaw’s map has moved. <a href="/home">Open the app</a>.
    </p>
  );
}
