"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import i18n from "@/lib/i18n"; // requires lib/i18n.js from earlier instructions
import { useRouter } from "next/navigation";

export default function Header() {
  const [lang, setLang] = useState(typeof window !== "undefined" ? (localStorage.getItem("cc_lang") || i18n.language || "en") : (i18n.language || "en"));
  const router = useRouter();

  useEffect(() => {
    const onChange = (lng) => setLang(lng);
    i18n.on && i18n.on("languageChanged", onChange);
    return () => i18n.off && i18n.off("languageChanged", onChange);
  }, []);

  const changeLang = (v) => {
    setLang(v);
    if (i18n && i18n.changeLanguage) i18n.changeLanguage(v);
    if (typeof window !== "undefined") localStorage.setItem("cc_lang", v);
    // preserve current route (no reload) — router.refresh() if you later add server-side translations
  };

  return (
    <header className="w-full bg-white shadow-sm border-b">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* left: logo + government label */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative flex-shrink-0">
              {/* use leading slash and ensure file public/jh_logo.png exists */}
              <Image src="/jh_logo.png" alt="Govt of Jharkhand" fill style={{ objectFit: "contain" }} priority />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800">{i18n?.t?.("government") ?? "Government of Jharkhand"}</div>
              <div className="text-xs text-gray-500">State Government</div>
            </div>
          </div>

          {/* center: app name */}
          <div className="hidden md:flex md:items-center">
            <div className="text-lg font-bold text-green-700">{i18n?.t?.("appName") ?? "Civic Connect"}</div>
          </div>

          {/* right: language selector + mobile app name */}
          <div className="flex items-center gap-3">
            <label htmlFor="cc_lang" className="sr-only">Language</label>
            <select
              id="cc_lang"
              aria-label="Language"
              value={lang}
              onChange={(e) => changeLang(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="sat">ᱥᱟᱱᱛᱟᱲᱤ</option>
            </select>

            <div className="md:hidden text-sm font-semibold text-green-700">{i18n?.t?.("appName") ?? "Civic Connect"}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
