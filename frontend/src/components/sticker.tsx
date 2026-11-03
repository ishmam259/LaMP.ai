import { cn } from "cn";

/** Official YUNet AIgnite Buildathon 2026 sticker. The rules require it near the top of every page. */
export function BuildathonSticker({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/aignite-sticker.png"
      alt="Ostad Presents YUNet AIgnite Buildathon 2026"
      className={cn("h-9 w-auto shrink-0 select-none", className)}
      draggable={false}
    />
  );
}
