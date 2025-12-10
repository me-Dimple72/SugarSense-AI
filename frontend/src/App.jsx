import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [sugar, setSugar] = useState("");
  const [medication, setMedication] = useState("");
  const [activity, setActivity] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your AI-powered diabetes management assistant. Feel free to ask me anything about diabetes management,lifestyle adjustments or specific concerns about your readings."
   }
  ]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const analyze = async () => {
    if (!sugar && !medication && !activity) {
      alert("Please enter at least one field!");
      return;
    }

    setLoading(true);
    setAnalysis("");

    try {
      const res = await axios.post(`${API_URL}/analyze`, {
        sugar,
        medication,
        activity,
      });
      setAnalysis(res.data.analysis);
    } catch (error) {
      console.error(error);
      setAnalysis("❌ Error: Make sure backend is running on http://127.0.0.1:8000");
    } finally {
      setLoading(false);
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages([...messages, userMsg]);
    setInput("");
    setChatLoading(true);

    try {
      const res = await axios.post(`${API_URL}/chat`, {
        message: input,
      });
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: res.data.reply 
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "❌ Error: Cannot connect to backend. Make sure it's running on port 8000." 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                🏥 SugarSense AI
              </h1>
              <p className="text-gray-600 text-lg">
                AI-powered diabetes management with real-time analysis
              </p>
            </div>
            <div className="bg-green-100 px-4 py-2 rounded-full">
              
            </div>
          </div>
        </div>

        {/* Input Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Blood Sugar */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <span className="text-3xl">🩸</span>
              </div>
              <h2 className="text-xl font-bold">Blood Sugar</h2>
            </div>
            <input
              type="number"
              value={sugar}
              onChange={(e) => setSugar(e.target.value)}
              placeholder="Enter blood sugar (mg/dL)"
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg"
            />
          </div>

          {/* Medication */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-3xl">💊</span>
              </div>
              <h2 className="text-xl font-bold">Medication</h2>
            </div>
            <textarea
              value={medication}
              onChange={(e) => setMedication(e.target.value)}
              placeholder="List medications"
              rows="3"
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-lg"
            />
          </div>

          {/* Activities */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-3xl">🏃</span>
              </div>
              <h2 className="text-xl font-bold">Activities</h2>
            </div>
            <textarea
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="Activities and meals"
              rows="3"
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-lg"
            />
          </div>
        </div>

        {/* Analyze Button */}
        <div className="text-center mb-6">
          <button
            onClick={analyze}
            disabled={loading}
            className="bg-gradient-to-r from-pink-500 to-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:from-pink-600 hover:to-pink-700 disabled:opacity-50 transition-all"
          >
            {loading ? "🤖 AI Analyzing..." : "🔍 Health Analysis"}
          </button>
        </div>

        {/* Analysis Result */}
        {analysis && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 mb-6 border-2 border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">🤖 AI Health Analysis</h2>
              <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                ✓ Complete
              </span>
            </div>
            <div className="bg-white p-6 rounded-xl whitespace-pre-line text-gray-700">
              {analysis}
            </div>
          </div>
        )}

        {/* Chatbot */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-emerald-700 p-5">
            <div className="flex items-center gap-3">
              <div className="bg-white p-3 rounded-full">
                <span className="text-3xl">💬</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">AI Chat Assistant</h2>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[500px] overflow-y-auto p-6 bg-gray-50 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl shadow-md ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    : 'bg-white text-gray-800 border border-gray-100'
                }`}>
                  <p className="leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl shadow-md border">
                  <div className="flex gap-2">
                    <span className="w-3 h-3 bg-gray-400 rounded-full loading-dot"></span>
                    <span className="w-3 h-3 bg-gray-400 rounded-full loading-dot"></span>
                    <span className="w-3 h-3 bg-gray-400 rounded-full loading-dot"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={send} className="p-5 bg-white border-t-2">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about diabetes management..."
                disabled={chatLoading}
                className="flex-1 p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 text-lg disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;