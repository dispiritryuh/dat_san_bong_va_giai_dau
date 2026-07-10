// src/app/profile/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentUsername, setCurrentUsername] = useState(''); 

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [bgImage, setBgImage] = useState("https://images.unsplash.com/photo-1518605368461-1e1e1141b714?q=80&w=2000");

  useEffect(() => {
    const savedCover = localStorage.getItem("matchfinder_cover_image");
    if (savedCover) setBgImage(savedCover);

    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setStatusMsg({ type: 'error', text: 'chưa đăng nhập' });
        return;
      }

      try {
        const response = await fetch('http://localhost:8080/api/user', {
          method: 'GET',
          headers: {
            'Authorization': `Token ${token}` 
          }
        });
        
        if (!response.ok) {
           const errorText = await response.text();
           setStatusMsg({ type: 'error', text: `Backend từ chối (Mã ${response.status}): ${errorText.substring(0, 50)}` });
           return;
        }

        const resData = await response.json();
        
        if (resData) {
          const name = resData.username || resData.user?.username || '';
          const mail = resData.email || resData.user?.email || '';
          
          setUsername(name);
          setEmail(mail);
          setCurrentUsername(name); 
        }
      } catch (error: any) {
        setStatusMsg({ type: 'error', text: ` mạng: ${error.message}` });
      }
    };

    fetchUserData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch('http://localhost:8080/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          logInUsername: currentUsername || username, 
          userPull: {
            username: username.trim(),
            email: email.trim(),
            ...(password ? { password: password.trim() } : {}), 
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        setStatusMsg({ type: 'error', text: `Lỗi cập nhật (Mã ${response.status}): ${errorText.substring(0, 50)}` });
        setLoading(false);
        return;
      }

      const resData = await response.json();

      setStatusMsg({ type: 'success', text: 'Hồ sơ đã được cập nh' });
      setTimeout(() => {
        router.back(); 
      }, 1500);
      
    } catch (error: any) {
      setStatusMsg({ type: 'error', text: `Lỗi mạng khi lưu: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="h-screen w-screen bg-cover bg-center bg-fixed text-gray-200 font-sans flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-0"></div>

      <div className="relative z-10 w-full max-w-md bg-black/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-white tracking-tight uppercase">Sửa hồ sơ</h2>
          <button 
            type="button"
            onClick={() => router.back()} 
            className="text-xs text-gray-400 hover:text-yellow-400 transition"
          >
            ← Quay lại
          </button>
        </div>

        {statusMsg.text && (
          <div className={`p-3 mb-5 rounded-lg text-xs font-bold text-center border ${
            statusMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tên hiển thị (Username)</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Địa chỉ Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Mật khẩu mới</label>
            <input 
              type="password" 
              placeholder="•••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm rounded-lg text-white focus:outline-none focus:border-yellow-500 transition-colors placeholder-gray-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-yellow-500 text-black font-black text-sm py-2.5 rounded-lg hover:bg-yellow-400 transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)] disabled:opacity-50"
          >
            {loading ? "đang xử lý..." : "cập nhật"}
          </button>
        </form>

      </div>
    </div>
  );
}