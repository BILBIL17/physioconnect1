import React, { useState } from 'react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() === '' || password.trim() === '') {
      setError('Please enter both email and password.');
      return;
    }
    // Dummy validation passed
    setError('');
    console.log('Login successful for:', email);
    onLoginSuccess();
  };

  return (
    <div className="flex items-center justify-center h-screen bg-[#f4f7f6] p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-center text-[#37474f] mb-2">
          Welcome Back!
        </h2>
        <p className="text-center text-[#78909c] mb-8">Login to your Physcio Connect account.</p>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-[#78909c] text-sm font-bold mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg border border-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#00838f]"
            />
          </div>
          <div className="mb-6">
            <label className="block text-[#78909c] text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg border border-[#e0e0e0] focus:outline-none focus:ring-2 focus:ring-[#00838f]"
            />
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="w-full bg-[#00838f] hover:bg-teal-800 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors"
            >
              Login
            </button>
          </div>
        </form>
        <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">Or</span>
            <div className="flex-grow border-t border-gray-300"></div>
        </div>
        <button
            type="button"
            onClick={onLoginSuccess}
            className="w-full bg-gray-200 hover:bg-gray-300 text-[#37474f] font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors"
        >
            Login as Guest
        </button>
      </div>
    </div>
  );
};

export default LoginPage;