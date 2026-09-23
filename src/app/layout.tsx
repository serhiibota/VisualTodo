import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";

// Антиква только для крупных заголовков; основной текст — системный SF Pro:
// он уже есть на iPhone, ничего не качаем и не тратим время на рендер шрифта.
const display = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Структура — план дня",
  description: "Минималистичный планировщик дня с тайм-блокингом",
  applicationName: "Структура",
  appleWebApp: {
    capable: true,
    title: "Структура",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F7F5F0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={display.variable}>
      <body>{children}</body>
    </html>
  );
}
