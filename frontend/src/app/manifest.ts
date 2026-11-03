import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LaMP for pharmacies",
    short_name: "LaMP",
    description: "See your cash for the weeks ahead, sell stock before it expires, and pay for the next order the cheapest way.",
    start_url: "/",
    display: "standalone",
    background_color: "#eef1f3",
    theme_color: "#1e5bb8",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
