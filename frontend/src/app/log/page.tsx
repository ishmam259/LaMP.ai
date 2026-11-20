"use client";

import { PageTitle } from "@/components/carton";
import { LiveLog } from "@/components/live-log";

export default function LogPage() {
  return (
    <div>
      <PageTitle
        title="History"
      />
      <div className="carton h-[calc(100dvh-14rem)] overflow-hidden lg:h-[calc(100dvh-12rem)]">
        <LiveLog heading={false} />
      </div>
    </div>
  );
}
