"use client";

import { useEffect, useRef, useState } from "react";

function normalize(text: string) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").trim();
}

function formatCategory(category: any) {
  return `
အမျိုးအစား: ${category.name}

${category.description}

ဝန်ဆောင်မှုများ:
${category.services.map((s: any) => `• ${s.title}`).join("\n")}
`;
}

function fakeAI(question: string, categories: any[]) {
  if (!categories || categories.length === 0) {
    return "ဒေတာ မရရှိပါ။ API ကို စစ်ဆေးပါ။";
  }

  const q = normalize(question);

  for (const category of categories) {
    const keywords = [
      normalize(category.slug || ""),
      normalize(category.name || ""),
      normalize(category.description || ""),
      ...(category.services || []).map((s: any) => normalize(s.title || "")),
    ].join(" ");

    // 🔹 Website
    if (
      (q.includes("web") || q.includes("website") || q.includes("ဝက်ဘ်") || q.includes("ဝက်ဘ်ဆိုက်")) &&
      (keywords.includes("website") || keywords.includes("ဝက်ဘ်"))
    ) {
      return formatCategory(category);
    }

    // 🔹 Software
    if (
      (q.includes("software") || q.includes("erp") || q.includes("pos") || q.includes("ဆော့ဖ်ဝဲ") || q.includes("လစာ")) &&
      (keywords.includes("software") || keywords.includes("ဆော့ဖ်"))
    ) {
      return formatCategory(category);
    }

    // 🔹 Mobile
    if (
      (q.includes("mobile") || q.includes("app") || q.includes("android") || q.includes("ios") || q.includes("မိုဘိုင်း")) &&
      (keywords.includes("mobile") || keywords.includes("မိုဘိုင်း"))
    ) {
      return formatCategory(category);
    }

    // 🔹 Design
    if (
      (q.includes("design") || q.includes("ui") || q.includes("ux") || q.includes("ဒီဇိုင်း")) &&
      (keywords.includes("design") || keywords.includes("ဒီဇိုင်း"))
    ) {
      return formatCategory(category);
    }

    // 🔹 IT Consultation
    if (
      (q.includes("consult") || q.includes("it") || q.includes("အကြံ")) &&
      (keywords.includes("consult") || keywords.includes("အကြံ"))
    ) {
      return formatCategory(category);
    }
  }

  return "ဒီမေးခွန်းအတွက် အချက်အလက် မတွေ့ရှိပါ။ Admin ကို ဆက်သွယ်ပေးပါမည်။";
}

export default function Page() {
  const [categories, setCategories] = useState<any[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  /* ------------------ Fetch API ------------------ */
  useEffect(() => {
    fetch("https://www.thexnova.com/api/category-for-web", {
      headers: { "Accept-Language": "en" },
    })
      .then((res) => res.json())
      .then(setCategories)
      .catch((err) => console.error("API ERROR:", err));
  }, []);

  /* ------------------ Speech Recognition ------------------ */
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Browser does not support voice recognition");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "my-MM";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event: any) => {
      const voiceText = event.results[0][0].transcript;
      setQuestion(voiceText);
      handleAsk(voiceText);
    };

    recognition.onend = () => setListening(false);

    recognition.start();
    recognitionRef.current = recognition;
  };

  /* ------------------ Text To Speech ------------------ */
  const speak = (text: string) => {
    if (!window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "my-MM";
    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  /* ------------------ Ask AI ------------------ */
  const handleAsk = (q?: string) => {
    const result = fakeAI(q || question, categories);
    setAnswer(result);
    speak(result);
  };

  /* ------------------ UI ------------------ */
  return (
    <div className="max-w-2xl mx-auto p-6 font-sans">
      <h2 className="text-2xl font-bold mb-4 text-center">Xnova Knowlodge Sharing (Burmese)</h2>

      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="မေးခွန်းရေးပါ (သို့) မိုက်ကိုနှိပ်ပါ"
        className="w-full p-3 mb-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <div className="flex gap-3 mb-4">
        <button
          onClick={() => handleAsk()}
          className="flex-1 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition"
        >
          မေးမည်
        </button>

        <button
          onClick={startListening}
          className={`flex-1 py-3 font-medium rounded-lg transition ${
            listening ? "bg-red-500 text-white" : "bg-green-500 text-white"
          }`}
        >
          🎤 {listening ? "နားထောင်နေသည်..." : "အသံဖြင့်မေးမည်"}
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg shadow-sm whitespace-pre-wrap min-h-30">
        {answer || "အဖြေသည် ဤနေရာတွင် ပြပါမည်။"}
      </div>
    </div>
  );
}
