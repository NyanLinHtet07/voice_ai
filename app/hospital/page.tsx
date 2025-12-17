"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, MessageSquare, Phone, Volume2, Square, PlayCircle, Loader2, Play } from 'lucide-react';

const HospitalReceptionistPreview = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<any>(null);

  // 1. Load System Voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // 2. HIGH QUALITY VOICE ENGINE (Web Speech API)
  const speakText = (text: string) => {
    if (!text) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Look for the "Good" Burmese voices
    // 'NanDa' is the high-quality Microsoft Neural voice
    const bestVoice = voices.find(v => 
      (v.lang.includes('my-MM') || v.lang.includes('burmese')) && 
      (v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Natural'))
    ) || voices.find(v => v.lang.includes('my-MM'));

    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.lang = 'my-MM';
    utterance.rate = 0.95; // Slightly slower sounds more natural
    utterance.pitch = 1;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = (e) => {
      console.error("Speech error:", e);
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopAudio = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  // 3. SPEECH RECOGNITION (STT)
  const startRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert('Browser not supported');

    const recognition = new SpeechRecognition();
    recognition.lang = 'my-MM';
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTranscribedText(transcript);
      fetchAIResponse(transcript);
    };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  // 4. GEMINI API CALL (Fixed Model Version)
  const fetchAIResponse = async (question: string) => {
    setIsProcessing(true);
    setAiResponse('');
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            question,
            // Ensure you use gemini-1.5-flash in your route.ts
            model: "gemini-1.5-flash" 
        })
      });
      
      const data = await res.json();
      if (data.answer) {
        setAiResponse(data.answer);
        speakText(data.answer); 
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      const errorMsg = "ဆာဗာ ချိတ်ဆက်မှု အဆင်မပြေပါ။ ခေတ္တစောင့်ပေးပါ။";
      setAiResponse(errorMsg);
      speakText(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!hasInteracted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
        <div className="text-center space-y-6">
          <div className="bg-blue-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-bounce">
            <Volume2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold myanmar">AI ဆေးရုံလက်ထောက်</h1>
          <button 
            onClick={() => setHasInteracted(true)}
            className="bg-white text-blue-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-all shadow-xl"
          >
            စတင်အသုံးပြုမည် (Start)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Myanmar:wght@400;700&display=swap');
        .myanmar { font-family: 'Noto Sans Myanmar', sans-serif; }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-4">
        <header className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white"><Phone size={20}/></div>
            <h1 className="font-bold text-slate-800 myanmar">Hospital Reception AI</h1>
          </div>
          <button 
            onClick={() => speakText("မင်္ဂလာပါ၊ ကျွန်မက ရန်လင်း ဆေးရုံ AI လက်ထောက် ဖြစ်ပါတယ်။ ဘာများ ကူညီပေးရမလဲရှင်။")}
            className="text-xs bg-slate-100 px-4 py-2 rounded-full font-bold hover:bg-slate-200 transition-all myanmar"
          >
            🔊 Test Voice
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center shadow-sm">
            <button
              onClick={() => isRecording ? recognitionRef.current?.stop() : startRecognition()}
              className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all ${
                isRecording ? 'bg-red-500 animate-pulse shadow-red-200 shadow-2xl' : 'bg-blue-600 shadow-blue-200 shadow-xl'
              }`}
            >
              {isRecording ? <MicOff className="text-white w-10 h-10" /> : <Mic className="text-white w-10 h-10" />}
            </button>
            <p className="mt-6 myanmar text-slate-600 font-medium">
                {isRecording ? "နားထောင်နေသည်..." : "ခလုတ်နှိပ်ပြီး စကားပြောပါ"}
            </p>
            {transcribedText && <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-2xl text-sm font-bold myanmar">{transcribedText}</div>}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col min-h-75">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold myanmar text-slate-400 text-sm uppercase tracking-wider">AI Answer</h2>
              {aiResponse && (
                <button 
                  onClick={() => isPlaying ? stopAudio() : speakText(aiResponse)}
                  className={`p-3 rounded-2xl ${isPlaying ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}
                >
                  {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Volume2 className="w-5 h-5" />}
                </button>
              )}
            </div>
            <div className="grow myanmar text-slate-800 text-lg leading-relaxed">
              {isProcessing ? (
                <div className="flex items-center gap-2 text-slate-300 animate-pulse">
                   <Loader2 className="animate-spin" /> စဉ်းစားနေပါသည်...
                </div>
              ) : aiResponse}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalReceptionistPreview;