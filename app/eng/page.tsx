"use client";

import { useEffect, useRef, useState } from "react";

function normalize(text: string){
    return text
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s]/gu, "") 
            .trim();
}

function formatCategory(category: any) {
  return `
အမျိုးအစား: ${category.name}

${category.description}

ဝန်ဆောင်မှုများ:
${category.services.map((s: any) => `• ${s.title}`).join("\n")}
`;
}

function fakeAI(question: string, categories: any[]){
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
      headers: {
        "Accept-Language": "en", // Burmese API
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
      })
      .catch((err) => {
        console.error("API ERROR:", err);
      });
  }, []);

  /* ------------------ Speech Recognition ------------------ */
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

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
    const finalQuestion = q || question;
    const result = fakeAI(finalQuestion, categories);
    setAnswer(result);
    speak(result);
  };

  /* ------------------ UI ------------------ */
  return (
    <div
      style={{
        padding: 20,
        maxWidth: 700,
        margin: "auto",
        fontFamily: "sans-serif",
      }}
    >
      <h2>🤖 AI Knowledge POC (Burmese)</h2>

      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="မေးခွန်းရေးပါ (သို့) မိုက်ကိုနှိပ်ပါ"
        style={{
          padding: 10,
          width: "100%",
          marginBottom: 10,
          fontSize: 16,
        }}
      />

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => handleAsk()} style={{ padding: 10 }}>
          မေးမည်
        </button>

        <button
          onClick={startListening}
          style={{
            padding: 10,
            background: listening ? "#ff4d4f" : "#1677ff",
            color: "#fff",
          }}
        >
          🎤 {listening ? "နားထောင်နေသည်..." : "အသံဖြင့်မေးမည်"}
        </button>
      </div>

      <pre
        style={{
          marginTop: 20,
          whiteSpace: "pre-wrap",
          background: "#f7f7f7",
          padding: 15,
        }}
      >
        {answer}
      </pre>
    </div>
  );
}