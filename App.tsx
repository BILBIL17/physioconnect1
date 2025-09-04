
import React, { useState, useCallback, useEffect, useRef } from 'react';
// FIX: Replaced non-existent 'Run' icon with 'HeartPulse' from lucide-react to resolve an import error.
import { Home, MessageCircle, FileText, Bot, User, HeartPulse, MapPin, BookOpen, Download, Camera, Upload, Bell, Dumbbell, Calendar, ArrowLeft, RefreshCw, UploadCloud } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import jsPDF from 'jspdf';
import { Tab, ChatMessage, MedicalRecord } from './types';
import { createChat, streamChatResponse, analyzePosture } from './services/geminiService';
import type { Chat } from "@google/genai";


// MOCK DATA
const barChartData = [
  { name: 'Week 1', progress: 45 },
  { name: 'Week 2', progress: 60 },
  { name: 'Week 3', progress: 80 },
  { name: 'Week 4', progress: 70 },
];

const lineChartData = [
  { name: 'Mon', duration: 20 },
  { name: 'Tue', duration: 25 },
  { name: 'Wed', duration: 22 },
  { name: 'Thu', duration: 30 },
  { name: 'Fri', duration: 28 },
];

const medicalRecordsData: MedicalRecord[] = [
    { date: '2024-07-15', doctor: 'Dr. Anya Sharma', diagnosis: 'Mild Lumbar Lordosis', notes: 'Prescribed core strengthening exercises. Follow-up in 4 weeks.' },
    { date: '2024-06-20', doctor: 'Dr. Ben Carter', diagnosis: 'Rotator Cuff Strain', notes: 'Patient responded well to ultrasound therapy. Advised to continue stretching.' },
    { date: '2024-05-10', doctor: 'Dr. Anya Sharma', diagnosis: 'Initial Consultation', notes: 'Patient reports lower back pain after prolonged sitting.' },
];

const remindersData = [
  {
    icon: Dumbbell,
    title: 'Latihan Peregangan Pagi',
    time: '08:00 WIB',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Calendar,
    title: 'Sesi Fisioterapi dengan Dr. Anya',
    time: '14:00 WIB',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: Dumbbell,
    title: 'Latihan Penguatan Core',
    time: '17:00 WIB',
    color: 'bg-orange-100 text-orange-600',
  },
];


// HELPER COMPONENTS (Defined outside main App component)

const Header: React.FC = () => (
  <header className="bg-white shadow-md sticky top-0 z-10 p-4 flex justify-between items-center">
    <div className="flex items-center gap-2">
      {/* FIX: Replaced non-existent 'Run' icon with 'HeartPulse' from lucide-react. */}
      <HeartPulse className="text-teal-600" size={28} />
      <h1 className="text-xl font-bold text-teal-700">Physio Connect</h1>
    </div>
    <div className="flex items-center gap-4">
      <div className="bg-slate-200 text-slate-600 text-sm font-semibold px-3 py-1 rounded-full">
        ID
      </div>
      <User className="text-slate-500" size={24} />
    </div>
  </header>
);

const BottomNav: React.FC<{ activeTab: Tab; onTabChange: (tab: Tab) => void }> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { tab: Tab.Home, icon: Home, label: 'Home' },
    { tab: Tab.Chat, icon: MessageCircle, label: 'Chat' },
    { tab: Tab.Records, icon: FileText, label: 'Rekam Medis' },
    { tab: Tab.Analysis, icon: Bot, label: 'Analisis AI' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_5px_rgba(0,0,0,0.1)] p-2 flex justify-around items-start">
      {navItems.map(({ tab, icon: Icon, label }) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-24 ${activeTab === tab ? 'text-teal-600' : 'text-slate-500'}`}
        >
          <Icon size={24} />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
};


// SCREEN COMPONENTS

const HomeScreen: React.FC = () => {
    return (
        <div className="p-4 space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-lg">
                <h2 className="text-3xl font-bold">Hai, Nabil!</h2>
                <p className="mt-1 opacity-90">Mari lihat progres dan jadwal latihanmu.</p>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-md">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Progress Terapimu</h3>
                <div className="grid grid-cols-2 gap-4 items-center mb-6">
                     <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                                <Bar dataKey="progress" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-slate-600 text-center font-semibold">Peningkatan Kepatuhan Latihan Mingguan</p>
                </div>

                <div className="flex items-center justify-center text-sm text-slate-500 mb-4">
                    <div className="w-4 h-4 bg-teal-100 border border-slate-300 rounded-sm mr-2"></div>
                    <span>Durasi (menit)</span>
                </div>
                
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={lineChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} domain={[20, 30]}/>
                            <Tooltip contentStyle={{ borderRadius: '0.5rem', borderColor: '#e2e8f0' }}/>
                             <defs>
                                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="duration" stroke="#0f766e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUv)" dot={{ r: 4, fill: '#0f766e', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#0f766e', stroke: '#fff', strokeWidth: 2 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-md">
                <div className="flex items-center gap-3 mb-4">
                    <Bell className="text-teal-600" size={24}/>
                    <h3 className="text-lg font-bold text-slate-800">Jadwal Hari Ini</h3>
                </div>
                <div className="space-y-3">
                    {remindersData.map((item, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                            <div className={`p-2 rounded-full ${item.color}`}>
                                <item.icon size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-slate-700">{item.title}</p>
                            </div>
                            <p className="text-sm font-medium text-slate-500">{item.time}</p>
                        </div>
                    ))}
                </div>
            </div>

             <div className="bg-white p-4 rounded-2xl shadow-md">
                <div className="flex items-center gap-3">
                    <MapPin className="text-teal-600" size={24}/>
                    <h3 className="text-lg font-bold text-slate-800">Klinik Fisioterapi Terdekat</h3>
                </div>
                <p className="text-sm text-slate-500 mt-1 mb-4">Temukan bantuan profesional di dekat Anda.</p>
                <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="font-semibold text-slate-700">Klinik Fisio Sehat</p>
                        <p className="text-sm text-slate-500">Jl. Merdeka No. 12, 1.2 km</p>
                    </div>
                     <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="font-semibold text-slate-700">Pusat Terapi Gerak</p>
                        <p className="text-sm text-slate-500">Jl. Pahlawan No. 45, 3.5 km</p>
                    </div>
                </div>
                <button className="w-full mt-4 bg-teal-500 text-white font-semibold py-2 rounded-lg hover:bg-teal-600 transition-colors">Lihat Semua</button>
            </div>

             <div className="bg-white p-4 rounded-2xl shadow-md">
                <div className="flex items-center gap-3">
                    <BookOpen className="text-teal-600" size={24}/>
                    <h3 className="text-lg font-bold text-slate-800">Jurnal Fisioterapi UMS</h3>
                </div>
                <p className="text-sm text-slate-500 mt-1 mb-4">Baca artikel dan penelitian terbaru.</p>
                <div className="space-y-3">
                    <a href="#" className="p-3 bg-slate-50 rounded-lg block hover:bg-slate-100">
                        <p className="font-semibold text-slate-700">Efektivitas Latihan Core Stability...</p>
                        <p className="text-sm text-slate-500">Dr. Hartanto, M.Fis</p>
                    </a>
                     <a href="#" className="p-3 bg-slate-50 rounded-lg block hover:bg-slate-100">
                        <p className="font-semibold text-slate-700">Pengaruh Terapi Manual pada...</p>
                        <p className="text-sm text-slate-500">Prof. Dr. Siti Aminah</p>
                    </a>
                </div>
            </div>
        </div>
    );
};

const ChatScreen: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChat(createChat());
    setMessages([{ sender: 'ai', text: 'Hai! Saya PhysioPebe, asisten fisioterapi virtual Anda. Ada yang bisa saya bantu?' }]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chat || isLoading) return;

    const userMessage: ChatMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const aiMessage: ChatMessage = { sender: 'ai', text: '' };
    setMessages(prev => [...prev, aiMessage]);

    try {
      const stream = await streamChatResponse(chat, input);
      for await (const chunk of stream) {
        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].text += chunk.text;
            return newMessages;
        });
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = "Maaf, terjadi kesalahan. Silakan coba lagi.";
          return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'ai' && <Bot className="text-teal-600 self-start flex-shrink-0" size={24} />}
            <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-teal-600 text-white rounded-br-none' : 'bg-white shadow-sm rounded-bl-none'}`}>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length-1].sender === 'ai' && (
             <div className="flex items-end gap-2 justify-start">
                <Bot className="text-teal-600 self-start flex-shrink-0" size={24} />
                 <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-white shadow-sm rounded-bl-none">
                     <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse delay-0"></span>
                        <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse delay-200"></span>
                        <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse delay-400"></span>
                     </div>
                 </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik pesan Anda..."
            className="w-full p-3 bg-slate-100 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500"
            disabled={isLoading}
          />
          <button type="submit" className="bg-teal-600 text-white p-3 rounded-full disabled:bg-slate-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="m22 2-11 11"/></svg>
          </button>
        </div>
      </form>
    </div>
  );
};

const MedicalRecordsScreen: React.FC = () => {

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Medical Records - Nabil", 14, 22);
        doc.setFontSize(12);

        let y = 30;
        medicalRecordsData.forEach((record, index) => {
            y += 10;
            doc.setFont("helvetica", "bold");
            doc.text(`Date: ${record.date}`, 14, y);
            y += 7;
            doc.setFont("helvetica", "normal");
            doc.text(`Doctor: ${record.doctor}`, 14, y);
            y += 7;
            doc.text(`Diagnosis: ${record.diagnosis}`, 14, y);
            y += 7;
            
            const notes = doc.splitTextToSize(`Notes: ${record.notes}`, 180);
            doc.text(notes, 14, y);
            y += notes.length * 5;
            y += 10;

             if (y > 250 && index < medicalRecordsData.length -1) { 
                doc.addPage();
                y = 20;
            }
        });

        doc.save("medical-records-nabil.pdf");
    };

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-slate-800">Rekam Medis</h2>
                 <button onClick={exportToPDF} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors">
                    <Download size={18}/>
                    <span>Ekspor PDF</span>
                 </button>
            </div>
           
            <div className="space-y-4">
                {medicalRecordsData.map((record, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl shadow-md">
                        <p className="font-bold text-slate-700">{record.diagnosis}</p>
                        <p className="text-sm text-slate-500">{record.doctor} - {record.date}</p>
                        <p className="mt-2 text-sm text-slate-600">{record.notes}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AIAnalysisScreen: React.FC = () => {
    type Mode = 'idle' | 'live' | 'preview' | 'analyzing' | 'result';

    const [mode, setMode] = useState<Mode>('idle');
    const [image, setImage] = useState<string | null>(null);
    const [imageMimeType, setImageMimeType] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const cleanupCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const startCamera = useCallback(async () => {
        try {
            cleanupCamera();
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
            setMode('live');
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError('Gagal mengakses kamera. Pastikan Anda telah memberikan izin.');
            setMode('idle');
        }
    }, [cleanupCamera]);

    useEffect(() => {
      // Cleanup camera on component unmount
      return () => cleanupCamera();
    }, [cleanupCamera]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Silakan pilih file gambar.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                setImage(base64String);
                setImageMimeType(file.type);
                setError(null);
                setAnalysis(null);
                setMode('preview');
            };
            reader.readAsDataURL(file);
        }
    };
    
    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const captureFrame = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if(context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                const base64String = dataUrl.split(',')[1];
                setImage(base64String);
                setImageMimeType('image/jpeg');
                setMode('preview');
                cleanupCamera();
            }
        }
    };
    
    const handleAnalyze = async () => {
        if (!image || !imageMimeType) {
            setError('Silakan siapkan gambar terlebih dahulu.');
            return;
        }
        setMode('analyzing');
        setError(null);
        setAnalysis(null);
        try {
            const result = await analyzePosture(image, imageMimeType);
            setAnalysis(result);
            setMode('result');
        } catch (err) {
            setError('Terjadi kesalahan saat analisis. Silakan coba lagi.');
            setMode('preview');
        }
    };

    const reset = () => {
        setImage(null);
        setImageMimeType(null);
        setAnalysis(null);
        setError(null);
        cleanupCamera();
        setMode('idle');
    };

    const renderContent = () => {
        switch (mode) {
            case 'idle':
                return (
                     <div className="p-4 space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-slate-800">Analisis Postur AI</h2>
                            <p className="text-slate-600 mt-2">Dapatkan analisis postur awal untuk membantu mengidentifikasi potensi masalah. Pilih metode di bawah ini.</p>
                        </div>
                        <div className="space-y-4">
                            <button onClick={startCamera} className="w-full bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow flex items-center gap-5">
                                <div className="bg-teal-100 text-teal-600 p-4 rounded-xl">
                                    <Camera size={32} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 text-left">Analisis Langsung</h3>
                                    <p className="text-slate-500 text-sm text-left">Gunakan kamera Anda untuk analisis postur instan.</p>
                                </div>
                            </button>
                             <button onClick={triggerFileUpload} className="w-full bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow flex items-center gap-5">
                                <div className="bg-blue-100 text-blue-600 p-4 rounded-xl">
                                    <UploadCloud size={32} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 text-left">Unggah Foto</h3>
                                    <p className="text-slate-500 text-sm text-left">Pilih foto punggung dari galeri Anda.</p>
                                </div>
                            </button>
                        </div>
                        {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                     </div>
                );
            case 'live':
                return (
                    <div className="h-full w-full bg-black flex flex-col items-center justify-center relative">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                            <svg viewBox="0 0 200 400" className="h-full opacity-30" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 60C77.9086 60 60 77.9086 60 100C60 122.091 77.9086 140 100 140C122.091 140 140 122.091 140 100C140 77.9086 122.091 60 100 60Z" stroke="white" strokeWidth="4"/><path d="M100 150L100 300" stroke="white" strokeWidth="4" strokeLinecap="round"/><path d="M70 170H130" stroke="white" strokeWidth="4" strokeLinecap="round"/><path d="M60 250H140" stroke="white" strokeWidth="4" strokeLinecap="round"/></svg>
                        </div>
                        <p className="absolute top-5 text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm">Posisikan punggung Anda di dalam garis bantu</p>
                        <div className="absolute bottom-5 left-0 right-0 flex justify-center items-center gap-8">
                            <button onClick={() => setMode('idle')} className="p-3 bg-white bg-opacity-20 rounded-full backdrop-blur-sm text-white"><ArrowLeft size={24}/></button>
                            <button onClick={captureFrame} className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg ring-4 ring-white ring-opacity-40">
                               <div className="w-16 h-16 rounded-full bg-white ring-2 ring-teal-500"></div>
                            </button>
                            <div className="w-12 h-12"></div>
                        </div>
                        <canvas ref={canvasRef} className="hidden"></canvas>
                    </div>
                );
            case 'preview':
                return (
                     <div className="p-4 flex flex-col items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-800">Pratinjau Gambar</h2>
                        <img src={`data:${imageMimeType};base64,${image}`} alt="Preview" className="max-h-80 w-auto rounded-lg shadow-lg" />
                        <div className="w-full grid grid-cols-2 gap-4 mt-4">
                            <button onClick={() => mode === 'preview' && image ? (cleanupCamera(), startCamera()) : reset()} className="flex items-center justify-center gap-2 bg-slate-200 text-slate-800 font-bold py-3 rounded-lg hover:bg-slate-300 transition-colors">
                                <RefreshCw size={18} />
                                <span>Ulangi</span>
                            </button>
                             <button onClick={handleAnalyze} className="flex items-center justify-center gap-2 bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition-colors">
                                <Bot size={20}/>
                                <span>Analisis Sekarang</span>
                            </button>
                        </div>
                     </div>
                );
            case 'analyzing':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <div className="relative flex items-center justify-center">
                            <div className="w-24 h-24 border-4 border-t-transparent border-teal-500 rounded-full animate-spin"></div>
                             <Bot size={40} className="absolute text-teal-600"/>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mt-6">Menganalisis Postur Anda...</h2>
                        <p className="text-slate-500 mt-2">AI sedang bekerja. Mohon tunggu sebentar.</p>
                    </div>
                );
            case 'result':
                return (
                    <div className="p-4 space-y-4">
                         <h2 className="text-2xl font-bold text-slate-800">Hasil Analisis</h2>
                         <div className="bg-white p-4 rounded-xl shadow-md">
                            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
                                {analysis?.split('\n').map((line, i) => <p key={i}>{line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>)}
                            </div>
                         </div>
                         <button onClick={reset} className="w-full bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition-colors">
                            Mulai Analisis Baru
                         </button>
                    </div>
                );
        }
    };
    
    return <div className="h-full w-full">{renderContent()}</div>;
};

// MAIN APP COMPONENT
export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Home);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.Home:
        return <HomeScreen />;
      case Tab.Chat:
        return <ChatScreen />;
      case Tab.Records:
        return <MedicalRecordsScreen />;
      case Tab.Analysis:
        return <AIAnalysisScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="h-screen w-screen max-w-md mx-auto bg-slate-100 flex flex-col font-sans">
      <Header />
      <main className="flex-1 overflow-y-auto pb-24">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
