import React, { useState, useEffect, useRef } from 'react';

type Mode = 'chat' | 'video';
interface Message {
    sender: 'user' | 'physio';
    text: string;
}

const TelePhysio: React.FC = () => {
    const [mode, setMode] = useState<Mode>('video');
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const startSession = (selectedMode: Mode) => {
        setMode(selectedMode);
        setIsSessionActive(true);
        if (selectedMode === 'chat') {
            setMessages([{ sender: 'physio', text: 'Hello! How are you feeling today?' }]);
        }
    };

    const endSession = () => {
        setIsSessionActive(false);
        setMessages([]);
        setInputValue('');
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() === '') return;

        const userMessage: Message = { sender: 'user', text: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');

        // Simulate physiotherapist's reply
        setTimeout(() => {
            const physioReply: Message = { sender: 'physio', text: 'Thank you for sharing. Could you tell me more about that?' };
            setMessages(prev => [...prev, physioReply]);
        }, 1500);
    };

    const renderWelcomeScreen = () => (
        <div className="text-center p-8 bg-gray-50 rounded-2xl">
            <i className="fas fa-headset text-5xl text-[#00bfa5] mb-4"></i>
            <h2 className="text-2xl font-bold text-[#37474f] mb-2">Virtual Consultation</h2>
            <p className="text-[#78909c] mb-6">
                Connect with a physiotherapist through live chat or video call.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button
                    className="bg-[#00838f] text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-800 transition-colors"
                    onClick={() => startSession('chat')}
                >
                    <i className="fas fa-comments mr-2"></i>
                    Start Chat Session
                </button>
                <button
                    className="bg-[#00838f] text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-800 transition-colors"
                    onClick={() => startSession('video')}
                >
                    <i className="fas fa-video mr-2"></i>
                    Start Video Call
                </button>
            </div>
        </div>
    );
    
    const renderVideoCall = () => (
         <>
            <div className="bg-black rounded-lg h-96 flex items-center justify-center mb-4 shadow-lg relative">
                <video className="w-full h-full object-cover rounded-lg" poster="https://picsum.photos/800/450?grayscale">
                    {/* Video streams would be attached here in a real implementation */}
                </video>
                <div className="absolute text-white text-center">
                    <i className="fas fa-video text-5xl mb-2"></i>
                    <p>Live Video Feed Area</p>
                </div>
            </div>
            <div className="flex justify-center">
                <button onClick={endSession} className="bg-[#f44336] text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors">
                    <i className="fas fa-phone-slash mr-2"></i> End Session
                </button>
            </div>
        </>
    );

    const renderChat = () => (
        <div className="flex flex-col h-[60vh] bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-2xl py-2 px-4 max-w-xs lg:max-w-md ${msg.sender === 'user' ? 'bg-[#00838f] text-white' : 'bg-gray-200 text-[#37474f]'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#00838f]"
                />
                <button type="submit" className="bg-[#00bfa5] text-white font-bold py-2 px-5 rounded-full hover:bg-[#00a794] transition-colors">
                    Send
                </button>
            </form>
             <button onClick={endSession} className="bg-[#f44336] text-white font-bold py-2 rounded-b-lg hover:bg-red-700 transition-colors">
                End Chat
            </button>
        </div>
    );

    return (
        <div>
            <h2 className="text-2xl font-bold text-[#37474f] mb-4">TelePhysio Session</h2>
            
            {!isSessionActive ? (
                renderWelcomeScreen()
            ) : (
                mode === 'video' ? renderVideoCall() : renderChat()
            )}
            
            <div className="mt-8 p-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 rounded-r-lg">
                <p><span className="font-bold">Note:</span> Real implementation of video and chat requires WebRTC, WebSockets, and a signaling server. This is a UI mock-up for demonstration.</p>
            </div>
        </div>
    );
};

export default TelePhysio;