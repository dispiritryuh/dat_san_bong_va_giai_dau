"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateTeamPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMsg('Sếp chưa đăng nhập!');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8080/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });

      const textData = await response.text();
      let data;
      try {
        data = JSON.parse(textData);
      } catch (err) {
        console.error("Lỗi trả về từ Backend:", textData);
        setErrorMsg('Lỗi đường dẫn API hoặc Backend');
        setLoading(false);
        return;
      }
      if (!response.ok) {
        setErrorMsg(data.message || data.error || 'Lỗi không tạo được đội!');
        setLoading(false);
        return;
      }
      localStorage.setItem('hasTeam', 'true');
      
      if (data.team && data.team.id) {
        localStorage.setItem('teamId', data.team.id.toString());
      }
      
      alert('Tạo đội bóng thành công!');
      router.push('/'); 

    } catch (error: any) {
      setErrorMsg(`Lỗi mạng: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="h-screen w-screen bg-cover bg-center bg-no-repeat font-sans flex items-center justify-center p-4 relative overflow-hidden"
      style={{ 
        backgroundImage: "url('/san-c1.jpg')" 
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0"></div>

      <div className="relative z-10 w-full max-w-md bg-white/95 p-8 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white/20">
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight uppercase">
            Tạo <span className="text-emerald-600">Đội Bóng</span>
          </h2>
          <button 
            type="button"
            onClick={() => router.back()} 
            className="text-xs font-bold text-gray-500 hover:text-emerald-600 transition"
          >
            ← Quay lại
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 mb-5 rounded-lg bg-red-50 text-red-600 border border-red-100 text-sm font-semibold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCreateTeam} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Tên Đội Bóng</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="..."
              className="w-full bg-gray-50 text-gray-900 placeholder:text-gray-400 border border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Mô tả lối đá / Khẩu hiệu</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="...."
              className="w-full bg-gray-50 text-gray-900 placeholder:text-gray-400 border border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 bg-emerald-600 text-white font-bold uppercase text-sm py-3.5 rounded-lg hover:bg-emerald-700 transition-all shadow-[0_8px_20px_rgba(16,185,129,0.3)] disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? "ĐANG LẬP ĐỘI..." : "tạo đội"}
          </button>
        </form>
      </div>
    </div>
  );
}