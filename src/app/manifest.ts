import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Структура — план дня",
    short_name: "Структура",
    start_url: "/",
    display: "standalone",
    background_color: "#161615",
    theme_color: "#F7F5F0",
    lang: "ru",
    icons: [
      { src: "/icons/app-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/app-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/app-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
