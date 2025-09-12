// app/i18n-provider.jsx
"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";

export default function I18nProvider({ children }) {
  useEffect(() => {
    // ensure i18n language matches stored value (useful on navigation)
    const lang = localStorage.getItem("cc_lang") || "en";
    if (i18n.language !== lang) i18n.changeLanguage(lang);
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
