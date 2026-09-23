import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Структура — план дня",
    short_name: "Структура",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F5F0",
    theme_color: "#F7F5F0",
    lang: "ru",
    icons: [{ src: "/apple-icon", sizes: "180x180", type: "image/png" }],
  };
}
