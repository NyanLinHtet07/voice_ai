"use client";

import { useEffect, useRef, useState } from "react";

const GEMINI_API_KEY = "AIzaSyCbI-jtHuAweqlGN4usH3F9LDq6Q1YDJuM";

export default function Page() {
  const [categories, setCategories] = useState<any[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef<any>(null);

  /* -------------------- FETCH API DATA -------------------- */
  useEffect(() => {
    fetch("https://www.thexnova.com/api/category-for-web")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(console.error);
  }, []);

  /* -------------------- VOICE INPUT -------------------- */
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = "my-MM"; // Burmese
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    recognitionRef.current?.start();
  };

  /* -------------------- TEXT TO SPEECH -------------------- */
  const speak = (text: string) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "my-MM";
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const myVoice = voices.find((v) => v.lang === "my-MM");
    if (myVoice) utterance.voice = myVoice;

    window.speechSynthesis.speak(utterance);
  };

  /* -------------------- ASK GEMINI -------------------- */
  const askAI = async () => {
    if (!question || categories.length === 0) return;

    setLoading(true);
    setAnswer("");

    const prompt = `
You are a knowledge assistant.
Answer ONLY using the DATA below.
If not found, say EXACTLY in Burmese:

"ဒီမေးခွန်းအတွက် အချက်အလက် မတွေ့ရှိပါ။ Admin ကို ဆက်သွယ်ပေးပါမည်။"

DATA:
${JSON.stringify(categories, null, 2)}

QUESTION:
${question}

RULES:
- Answer in Burmese
- No external knowledge
- Short and clear
`;

  const res = await fetch(
  `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    }),
  }
);




    const data = await res.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "AI အဖြေ မရရှိပါ";

    setAnswer(text);
    speak(text); // 🔊 AUTO VOICE REPLY
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 24 }}>
      <h2>🎤 AI Voice Knowledge POC (Gemini)</h2>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="မေးခွန်းရေးပါ သို့မဟုတ် အသံဖြင့် ပြောပါ"
        style={{ width: "100%", height: 80, padding: 10 }}
      />

      <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
        <button onClick={askAI} disabled={loading}>
          {loading ? "စဉ်းစားနေသည်..." : "မေးမည်"}
        </button>

        <button onClick={startListening}>
          {listening ? "🎙 နားထောင်နေသည်..." : "🎤 အသံဖြင့် မေးမည်"}
        </button>
      </div>

      {answer && (
        <>
          <pre style={{ marginTop: 20, whiteSpace: "pre-wrap" }}>
            {answer}
          </pre>

          <button onClick={() => speak(answer)}>
            🔊 အသံဖြင့် ပြန်ဖတ်မည်
          </button>
        </>
      )}
    </div>
  );
}
