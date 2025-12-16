"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, MessageSquare, Send, Settings, Trash2, Phone, MapPin, Clock } from 'lucide-react';

const HospitalReceptionistPreview = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // TTS state
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [autoPlayTTS, setAutoPlayTTS] = useState(false);

  // Sample hospital data
  const hospitalData = {
    hospital_name: "ရန်လင်းကျန်းမာရေးဆေးရုံ",
    departments: [
      {
        name: "နှလုံးရောဂါကုဌာန",
        doctors: ["ဒေါက်တာ အောင်မျိုးထွန်း", "ဒေါက်တာ သန်းသန်းမြင့်"],
        opening_hours: "တနင်္လာနေ့မှ စနေနေ့ - နံနက် ၈:၀၀ မှ ညနေ ၅:၀၀",
        phone: "09-123456789"
      },
      {
        name: "အရိုးရောဂါကုဌာန",
        doctors: ["ဒေါက်တာ မြင့်မြင့်ခိုင်", "ဒေါက်တာ ဇော်ဇော်ဦး"],
        opening_hours: "တနင်္လာနေ့မှ သောကြာနေ့ - နံနက် ၉:၀၀ မှ ညနေ ၄:၀၀",
        phone: "09-123456788"
      },
      {
        name: "ကလေးရောဂါကုဌာန",
        doctors: ["ဒေါက်တာ စုစုလွင်", "ဒေါက်တာ နီလာထွန်း"],
        opening_hours: "တနင်္လာနေ့မှ စနေနေ့ - နံနက် ၈:၀၀ မှ ညနေ ၆:၀၀",
        phone: "09-123456787"
      },
      {
        name: "အရေပြားရောဂါကုဌာန",
        doctors: ["ဒေါက်တာ ခင်မောင်ဝင်း"],
        opening_hours: "တနင်္လာနေ့၊ ဗုဒ္ဓဟူးနေ့၊ သောကြာနေ့ - နံနက် ၉:၀၀ မှ ညနေ ၃:၀၀",
        phone: "09-123456786"
      },
      {
        name: "အရေးပေါ်ကုဌာန",
        doctors: ["၂၄ နာရီ ဝန်ဆောင်မှု"],
        opening_hours: "၂၄ နာရီ ဖွင့်လှစ်",
        phone: "09-123456785"
      }
    ],
    general_info: {
      address: "နံပါတ် ၁၂၃၊ ပြည်လမ်း၊ ရန်ကုန်မြို့",
      emergency: "09-999888777",
      appointment: "09-111222333"
    }
  };

  // Speech recognition reference (browser Web Speech API)
  const recognitionRef = React.useRef<any>(null);

  const startRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback to simulated transcription if not supported
      alert('Your browser does not support Speech Recognition. Using simulated transcription.');
      setIsProcessing(true);
      setTimeout(() => {
        const simulated = "နှလုံးရောဂါအတွက် ဘယ်ဆရာဝန်ရှိလဲ?";
        setTranscribedText(simulated);
        setHasRecording(true);
        setIsProcessing(false);
      }, 800);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'my-MM'; // Burmese locale
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTranscribedText(transcript);
        setHasRecording(true);
        // Automatically fetch AI response for the transcribed text
        fetchAIResponse(transcript);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        setIsRecording(false);
        setHasRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('SpeechRecognition init error', err);
    }
  };

  const stopRecognition = () => {
    try {
      recognitionRef.current?.stop();
      setIsRecording(false);
      setHasRecording(true);
    } catch (err) {
      console.warn('No active recognition to stop');
    }
  };

  const handleRecord = () => {
    if (!isRecording) {
      startRecognition();
    } else {
      stopRecognition();
    }
  };

  const fetchAIResponse = async (question: string) => {
    if (!question || question.trim().length === 0) return;

    setIsProcessing(true);
    setAiResponse('');

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context: JSON.stringify(hospitalData),
          apiKey: apiKey || undefined // optional client-provided key
        }),
      });

      const data = await res.json();
      if (res.ok && data.answer) {
        setAiResponse(data.answer);
      } else if (res.status === 403 && data?.error) {
        // Location / account restriction from Gemini
        setAiResponse(`ဝမ်းနည်းပါတယ် — Gemini ဝန်ဆောင်မှုကို သင့်တည်နေရာတွင် အသုံးမပြုနိုင်ပါ။
ဤပြဿနာကို ဖြေရှင်းရန် server-side GEMINI_API_KEY သို့မဟုတ် သင့် Google Cloud account ၏ region/permission ကို စစ်ဆေးပါ။

(အချက်အလက်: ${data.error})`);
      } else if (data.error) {
        setAiResponse(`အမှား: ${data.error}`);
      } else {
        setAiResponse('အဖြေမရပါ');
      }
    } catch (err) {
      console.error('Fetch AI error', err);
      setAiResponse('AI ဖြင့် ဆက်သွားရာတွင် အမှားဖြစ်ပွားလိုက်သည်။');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGetAIResponse = () => {
    if (!transcribedText) {
      alert('ကျေးဇူးပြု၍ စာသားရှိနေစေပါ');
      return;
    }

    // Use existing transcribed text to fetch AI response
    fetchAIResponse(transcribedText);
  };

  const handleClear = () => {
    try {
      recognitionRef.current?.stop();
    } catch (err) {
      // ignore
    }
    setTranscribedText('');
    setAiResponse('');
    setHasRecording(false);
    setIsRecording(false);
    setIsProcessing(false);
  };

  // Load available speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
      if (!selectedVoice) {
        const my = v.find((voice) => voice.lang?.toLowerCase().startsWith('my') || (voice.lang || '').toLowerCase().includes('burmese'));
        if (my) setSelectedVoice(my.name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [selectedVoice]);

  // Speak the provided text in Burmese (uses browser TTS)
  const speakText = (text: string) => {
    if (typeof window === 'undefined') return;
    if (!text) return;

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'my-MM';
        u.rate = 0.98;
        if (selectedVoice) {
          const found = voices.find((v) => v.name === selectedVoice);
          if (found) u.voice = found;
        }
        window.speechSynthesis.speak(u);
      } catch (err) {
        console.error('TTS error', err);
      }
    } else {
      alert('Text-to-speech not supported in this browser.');
    }
  };

  // Auto-play when AI response changes
  useEffect(() => {
    if (aiResponse && autoPlayTTS) {
      speakText(aiResponse);
    }
  }, [aiResponse, autoPlayTTS]);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Myanmar:wght@400;700&display=swap');
        .myanmar-text {
          font-family: 'Noto Sans Myanmar', sans-serif;
          line-height: 1.8;
        }
      `}</style>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-3 rounded-lg">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 myanmar-text">
                  🏥 ဆေးရုံ Reception AI လက်ထောက်
                </h1>
                <p className="text-gray-600 myanmar-text mt-1">
                  မြန်မာဘာသာ အသံမှတ်တမ်းဖြင့် မေးမြန်းနိုင်သည့် AI လက်ထောက်
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4 myanmar-text flex items-center gap-2">
              <Settings className="w-5 h-5" />
              ⚙️ ဆက်တင်များ
            </h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Gemini API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your API key to enable AI responses
              </p>
            </div>

            <div className="mb-4 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoPlayTTS}
                  onChange={(e) => setAutoPlayTTS(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="ml-2 myanmar-text text-sm">🔊 AI ဖြေကြားချက်ကို အသံဖြင့် ဖတ်ပါ (Auto-play)</span>
              </label>

              <label className="block text-sm mt-3 myanmar-text">အသံရွေးချယ်ပါ (Voice)</label>
              <select
                value={selectedVoice ?? ''}
                onChange={(e) => setSelectedVoice(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2"
              >
                <option value="">System default</option>
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>{v.name} — {v.lang}</option>
                ))}
              </select>
            </div>

            <div className="border-t pt-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3 myanmar-text">
                📋 အသုံးပြုနည်း
              </h3>
              <ol className="space-y-2 text-sm text-gray-600 myanmar-text">
                <li>1. API Key ထည့်သွင်းပါ</li>
                <li>2. 🎤 နှိပ်၍ အသံသွင်းပါ</li>
                <li>3. ရပ်ရန် ထပ်နှိပ်ပါ</li>
                <li>4. AI က ဖြေကြားပါမည်</li>
              </ol>
            </div>

            <button
              onClick={handleClear}
              className="w-full mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span className="myanmar-text">🗑️ Clear All</span>
            </button>

            {/* Hospital Info Preview */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold text-gray-800 mb-3 myanmar-text flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                ဆေးရုံအချက်အလက်
              </h3>
              <div className="space-y-2 text-sm text-gray-600 myanmar-text">
                <p className="font-semibold">{hospitalData.hospital_name}</p>
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  {hospitalData.general_info.address}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0" />
                  အရေးပေါ်: {hospitalData.general_info.emergency}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Voice Recording Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 myanmar-text flex items-center gap-2">
              <Mic className="w-5 h-5" />
              🎤 အသံမှတ်တမ်း
            </h2>
            
            <div className="flex flex-col items-center justify-center py-8">
              <button
                onClick={handleRecord}
                className={`w-32 h-32 rounded-full flex items-center justify-center transition-all transform hover:scale-105 ${
                  isRecording 
                    ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' 
                    : 'bg-blue-500 hover:bg-blue-600 shadow-lg'
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-16 h-16 text-white" />
                ) : (
                  <Mic className="w-16 h-16 text-white" />
                )}
              </button>
              <p className="mt-4 text-gray-600 myanmar-text">
                {isRecording ? 'မှတ်တမ်းယူနေသည်... ရပ်ရန် နှိပ်ပါ' : 'နှိပ်၍ စတင်မှတ်တမ်းယူပါ'}
              </p>
            </div>

            {hasRecording && (
              <div className="mt-4">
                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Audio recorded successfully</span>
                  </div>
                  <div className="mt-2 h-12 bg-linear-to-r from-blue-400 to-blue-600 rounded flex items-center justify-center">
                    <div className="flex gap-1">
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className="w-1 bg-white rounded-full animate-pulse" style={{height: `${Math.random() * 30 + 10}px`, animationDelay: `${i * 0.1}s`}}></div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={startRecognition}
                  disabled={isProcessing}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 myanmar-text font-semibold"
                >
                  {isProcessing ? 'စာသားအဖြစ်ပြောင်းနေသည်...' : '📝 ရှေ့တဖန် သတ်မှတ်၍ မှတ်တမ်းယူမည်'}
                </button>
              </div>
            )}

            {transcribedText && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-2 myanmar-text">
                  📄 စာသားဖြစ်လာခြင်း:
                </h3>
                <div className="bg-blue-50 rounded-lg p-4 myanmar-text text-lg">
                  {transcribedText}
                </div>
                
                <button
                  onClick={handleGetAIResponse}
                  disabled={isProcessing}
                  className="w-full mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 myanmar-text font-semibold"
                >
                  {isProcessing ? 'AI က စဉ်းစားနေပါသည်...' : '🤖 AI ဖြေကြားချက်ရယူပါ'}
                </button>
              </div>
            )}
          </div>

          {/* AI Response Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 myanmar-text flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              💬 AI ဖြေကြားချက်
            </h2>
            
            {aiResponse ? (
              <div>
                <div className="bg-linear-to-br from-green-50 to-blue-50 rounded-lg p-6 myanmar-text text-base leading-relaxed whitespace-pre-wrap">
                  {aiResponse}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => speakText(aiResponse)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    🔊 Play Voice
                  </button>

                  <button
                    onClick={() => { if (typeof window !== 'undefined') window.speechSynthesis?.cancel(); }}
                    className="px-3 py-2 bg-gray-200 rounded-lg"
                  >
                    ⏹ Stop
                  </button>

                  {isProcessing && (
                    <span className="text-sm text-gray-500 myanmar-text">AI processing...</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 myanmar-text">
                  AI ဖြေကြားချက် ဤနေရာတွင် ပေါ်လာပါမည်
                </p>
              </div>
            )}
          </div>

          {/* Departments Quick View */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 myanmar-text">
              🏥 ကုဌာနများ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hospitalData.departments.map((dept, idx) => (
                <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-800 myanmar-text mb-2">
                    {dept.name}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 myanmar-text">
                    <p className="flex items-start gap-2">
                      <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                      {dept.opening_hours}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 shrink-0" />
                      {dept.phone}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalReceptionistPreview;