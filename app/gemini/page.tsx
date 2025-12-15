// app/ui/GeminiPage.tsx

"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------ Utility Functions ------------------ */
function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
}

function formatCategory(category: any) {
  return `
အမျိုးအစား: ${category.name}
${category.description}
ဝန်ဆောင်မှုများ: ${category.services.map((s: any) => s.title).join(", ")}
`;
}

// Function to search local data based on the user's query
const searchCategories = (query: string, categories: any[]) => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  const matched = categories.filter((category) => {
    const nameMatch = normalize(category.name).includes(normalizedQuery);
    const descriptionMatch = normalize(category.description).includes(normalizedQuery);
    const serviceMatch = category.services.some((service: any) =>
      normalize(service.title).includes(normalizedQuery)
    );
    
    return nameMatch || descriptionMatch || serviceMatch;
  });

  return matched.slice(0, 3);
};


/* ------------------ Page ------------------ */
export default function GeminiPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [listening, setListening] = useState(false);

  // Fetch Category data on load
  useEffect(() => {
    fetch("https://www.thexnova.com/api/category-for-web", {
      headers: { "Accept-Language": "my" },
    })
      .then((res) => res.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  /* --- Voice Input (Speech-to-Text) --- */
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
    recognition.onstart = () => setListening(true);

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setQuestion(text);
      sendToGemini(text);
    };

    recognition.onend = () => setListening(false);
    recognition.start();
  };
  
  /* --- Securely Call Server API --- */
  const sendToGemini = async (text: string) => {
    if (!text.trim()) return;
    setAnswer("..."); 
    
    // 1. Search local categories based on the question
    const matchedCategories = searchCategories(text, categories);
    const context = matchedCategories.map(formatCategory).join("\n---\n");
    
    try {
      // 2. Send both the question AND the context to the server
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: text, 
          context: context // Send the matched categories as context
        }),
      });
      
      if (!res.ok) throw new Error("API call failed");

      const data = await res.json();
      setAnswer(data.answer);
      speakBrowser(data.answer);
    } catch (err) {
      console.error(err);
      const errorMessage = "အမှားဖြစ်ခဲ့ပါသည်။"; // Burmese: "An error occurred."
      setAnswer(errorMessage);
      speakBrowser(errorMessage);
    }
  };

  /* --- Voice Output (Text-to-Speech) --- */
  const speakBrowser = (text: string) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "my-MM"; 
    window.speechSynthesis.speak(utter);
  };

  /* ------------------ UI (JSX) ------------------ */
  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>🤖 AI Knowledge POC + Gemini (Burmese)</h2>

      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="မေးလိုက်ပါ (Enter your Burmese question)"
        style={{ padding: 10, width: "100%", marginBottom: 10 }}
        onKeyDown={(e) => {
          if (e.key === "Enter") sendToGemini(question);
        }}
      />

      <div style={{ display: "flex", gap: 10 }}>
        <button 
          onClick={() => sendToGemini(question)}
          disabled={listening || answer === "..."}
        >
          မေးမည် (Ask)
        </button>
        <button
          onClick={startListening}
          disabled={listening || answer === "..."}
          style={{
            background: listening ? "#ff4d4f" : "#1677ff",
            color: "#fff",
          }}
        >
          🎤 {listening ? "နားထောင်နေ..." : "အသံဖြင့်မေးမည် (Ask by Voice)"}
        </button>
      </div>
      
      {/* Display the Answer/Loading state */}
      <pre style={{ 
        marginTop: 20, 
        padding: 15,
        border: '1px solid #ccc',
        borderRadius: '4px',
        minHeight: '100px',
        backgroundColor: '#f9f9f9',
        whiteSpace: 'pre-wrap' 
      }}>
        {answer || "အဖြေကို ဤနေရာတွင် ပြသပါမည်။ (The answer will be shown here.)"}
      </pre>
    </div>
  );
}