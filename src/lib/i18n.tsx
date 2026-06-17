import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "hi";

const STORAGE_KEY = "nirogi-lang";

// Translation dictionary. Keys default to their English text when a Hindi
// string is missing, so partial coverage never breaks the UI.
const DICT: Record<string, { en: string; hi: string }> = {
  // Header / nav
  "nav.tools": { en: "Tools", hi: "उपकरण" },
  "nav.how": { en: "How it works", hi: "यह कैसे काम करता है" },
  "nav.updates": { en: "Updates", hi: "अपडेट" },
  "nav.sources": { en: "Data sources", hi: "डेटा स्रोत" },
  "nav.faq": { en: "FAQ", hi: "सामान्य प्रश्न" },
  "nav.signin": { en: "Sign in", hi: "साइन इन करें" },
  "nav.dashboard": { en: "Dashboard", hi: "डैशबोर्ड" },
  "nav.history": { en: "History", hi: "इतिहास" },
  "nav.signout": { en: "Sign out", hi: "साइन आउट" },
  "common.sos": { en: "SOS", hi: "आपातकाल" },
  "common.language": { en: "Language", hi: "भाषा" },

  // Report actions
  "report.copy": { en: "Copy", hi: "कॉपी करें" },
  "report.copied": { en: "Report copied to clipboard", hi: "रिपोर्ट क्लिपबोर्ड पर कॉपी हो गई" },
  "report.download": { en: "Download PDF", hi: "PDF डाउनलोड करें" },
  "report.whatsapp": { en: "Share on WhatsApp", hi: "व्हाट्सएप पर साझा करें" },
  "report.share_note": {
    en: "WhatsApp shares the text report. Download the PDF to attach a file.",
    hi: "व्हाट्सएप टेक्स्ट रिपोर्ट साझा करता है। फ़ाइल जोड़ने के लिए PDF डाउनलोड करें।",
  },

  // Dashboard
  "dash.health_score": { en: "Health Score", hi: "हेल्थ स्कोर" },
  "dash.family": { en: "Family", hi: "परिवार" },
  "dash.reminders": { en: "Medicine Reminders", hi: "दवा रिमाइंडर" },
  "dash.overview": { en: "Family Health Overview", hi: "परिवार स्वास्थ्य अवलोकन" },

  // SOS page
  "sos.title": { en: "Emergency SOS", hi: "आपातकालीन SOS" },
  "sos.subtitle": {
    en: "Get help fast. Tap a number to call. In a life-threatening emergency, call now.",
    hi: "तुरंत मदद पाएं। कॉल करने के लिए नंबर पर टैप करें। जानलेवा आपात स्थिति में अभी कॉल करें।",
  },
  "sos.numbers": { en: "Emergency numbers", hi: "आपातकालीन नंबर" },
  "sos.hospitals": { en: "Nearest hospitals", hi: "निकटतम अस्पताल" },
  "sos.find_hospitals": { en: "Find hospitals near me", hi: "मेरे पास अस्पताल खोजें" },
  "sos.share_location": { en: "Share my location", hi: "मेरा स्थान साझा करें" },
  "sos.your_info": { en: "Your medical info for paramedics", hi: "पैरामेडिक्स के लिए आपकी चिकित्सा जानकारी" },
  "sos.disclaimer": {
    en: "Nirogi connects you to public emergency services and is not its own emergency responder. Always call emergency services directly in a life-threatening situation.",
    hi: "निरोगी आपको सार्वजनिक आपातकालीन सेवाओं से जोड़ता है और स्वयं आपातकालीन प्रतिक्रियाकर्ता नहीं है। जानलेवा स्थिति में हमेशा सीधे आपातकालीन सेवाओं को कॉल करें।",
  },
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, fallback?: string) => string;
};

const LangContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY)) as Lang | null;
    if (saved === "en" || saved === "hi") setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => {
      const entry = DICT[key];
      if (!entry) return fallback ?? key;
      return entry[lang] || entry.en || fallback || key;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LangContext);
  if (!ctx) {
    // Safe fallback if used outside provider (e.g. during SSR shell).
    return {
      lang: "en" as Lang,
      setLang: () => {},
      t: (key: string, fallback?: string) => DICT[key]?.en ?? fallback ?? key,
    };
  }
  return ctx;
}
