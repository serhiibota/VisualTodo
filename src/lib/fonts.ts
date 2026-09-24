import {
  Cormorant_Garamond,
  Golos_Text,
  Lora,
  Manrope,
  Nunito,
  Onest,
  Playfair_Display,
  Unbounded,
} from "next/font/google";

// Шрифты самохостятся next/font. @font-face объявлены, но файл качается
// только когда шрифт реально выбран (preload: false) — на iPhone 7 никто
// не платит за шрифты, которыми не пользуется. Cormorant — заголовки по
// умолчанию, поэтому только он предзагружается.

// Аргументы next/font обязаны быть литералами (их читает компилятор), поэтому без общего объекта.
const onest = Onest({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--f-onest", preload: false });
const manrope = Manrope({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--f-manrope", preload: false });
const golos = Golos_Text({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--f-golos", preload: false });
const nunito = Nunito({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--f-nunito", preload: false });

const cormorant = Cormorant_Garamond({ subsets: ["latin", "cyrillic"], display: "swap", weight: ["500", "600"], variable: "--f-cormorant" });
const playfair = Playfair_Display({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--f-playfair", preload: false });
const lora = Lora({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--f-lora", preload: false });
const unbounded = Unbounded({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--f-unbounded", preload: false });

export const fontVariables = [onest, manrope, golos, nunito, cormorant, playfair, lora, unbounded]
  .map((f) => f.variable)
  .join(" ");
