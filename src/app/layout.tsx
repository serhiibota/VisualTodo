import type { Metadata, Viewport } from "next";
import { buildFontCss } from "@/lib/appearance";
import { STORAGE_KEY } from "@/lib/constants";
import { fontVariables } from "@/lib/fonts";
import { AUTO_DARK, AUTO_LIGHT, buildThemeCss, THEMES } from "@/lib/themes";
import "./globals.css";

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
  themeColor: THEMES.milk.ui.bg,
};

const themeCss = buildThemeCss() + buildFontCss();

// Фоны схем для theme-color — чтобы панель Safari сразу была нужного цвета
const bgs: Record<string, string> = {};
for (const key in THEMES) bgs[key] = THEMES[key as keyof typeof THEMES].ui.bg;

// Выполняется до первой отрисовки: выставляет схему и шрифты из localStorage.
const bootScript =
  "(function(){try{var d=document.documentElement,a={};" +
  "try{a=(JSON.parse(localStorage.getItem(" + JSON.stringify(STORAGE_KEY) + "))||{}).state.appearance||{}}catch(e){}" +
  "var t=a.theme||'milk';d.setAttribute('data-theme',t);" +
  "d.setAttribute('data-ui-font',a.uiFont||'system');" +
  "d.setAttribute('data-display-font',a.displayFont||'cormorant');" +
  "var b=" + JSON.stringify(bgs) + ";" +
  "if(t==='auto')t=window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'" + AUTO_DARK + "':'" + AUTO_LIGHT + "';" +
  "var m=document.querySelector('meta[name=\"theme-color\"]');if(m&&b[t])m.setAttribute('content',b[t]);" +
  "}catch(e){}})()";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-* выставляет bootScript до гидратации — атрибуты на сервере и клиенте расходятся намеренно
    <html lang="ru" className={fontVariables} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
