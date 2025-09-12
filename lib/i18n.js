// lib/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import JSON translation files directly
import en from "../public/locales/en/common.json";
import hi from "../public/locales/hi/common.json";
import sat from "../public/locales/sat/common.json";

const resources = {
  en: { common: en },
  hi: { common: hi },
  sat: { common: sat },
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: typeof window !== "undefined" ? (localStorage.getItem("cc_lang") || "en") : "en",
      fallbackLng: "en",
      ns: ["common"],
      defaultNS: "common",
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
}

export default i18n;
