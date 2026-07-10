"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';

export default function HomePage() {
  const router = useRouter();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasTeam, setHasTeam] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false); 

  const [quickMessage, setQuickMessage] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [feedPosts, setFeedPosts] = useState<any[]>([
    {  },
  ]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setIsLoggedIn(true);

    const teamCheck = localStorage.getItem('hasTeam');
    if (teamCheck === 'true') setHasTeam(true);
    const fetchChallenges = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/booking/list'); 
        setFeedPosts(res.data.result);
      } catch (err) {
        console.error("Lỗi tải feed:", err);
      }
    };
    fetchChallenges();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('hasTeam');
    localStorage.removeItem('teamId');
    setIsLoggedIn(false);
    setHasTeam(false);
    router.refresh(); 
  };
  const handleQuickPost = async () => {
    if (!isLoggedIn) return alert(" phải đăng nhập mới được đăng tin!");
    if (!hasTeam) return alert("Sếp phải tạo đội bóng trước khi gạ kèo!");
    if (!quickMessage.trim()) return;

    setIsPosting(true);

    try {
      const token = localStorage.getItem('token');
      const newPost = {
        id: Date.now(),
        teamName: localStorage.getItem('teamName') || "Đội của bạn",
        message: quickMessage,
        time: "Vừa xong"
      };
      
      setFeedPosts([newPost, ...feedPosts]);
      setQuickMessage(""); 
      
    } catch (error) {
      alert("Lỗi đăng tin, thử lại sau!");
    } finally {
      setIsPosting(false);
    }
  };
const handleChallenge = async (opponentTeamId: number) => {
    if (!isLoggedIn) return alert("Vui lòng đăng nhập!");
    if (!hasTeam) return alert("Bạn cần tạo đội để thách đấu!");
    try {
      await axios.post('http://localhost:8080/api/challenge/send', {
        opponentId: opponentTeamId, 
        message: "thách đấ"
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert("Đã gửi lời thách đấu thành công!");
    } catch (error) {
      alert("Gửi thách đấu thất bại!");
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-200 selection:text-emerald-900">
      <Toaster />
      
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="font-black text-2xl tracking-tight uppercase flex items-center gap-1">
            <span className="text-slate-800">Match</span>
            <span className="text-emerald-500">Finder</span>
          </Link>
          
          {/* Thanh điều hướng */}
          <div className="flex items-center space-x-3">
            {!isLoggedIn ? (
              <>
                <Link href="/login" className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition">Đăng nhập</Link>
                <Link href="/register" className="px-4 py-2 text-sm font-bold text-white bg-emerald-500 rounded-md hover:bg-emerald-600 transition shadow-sm">Đăng ký</Link>
              </>
            ) : (
              <>
                {hasTeam ? (
                  <Link href="/user" className="px-4 py-2 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition shadow-sm">Đội của bạn</Link>
                ) : (
                  <Link href="/team" className="px-4 py-2 text-sm font-bold text-white bg-blue-500 rounded-md hover:bg-blue-600 transition shadow-sm">Tạo Đội</Link>
                )}
                
                {/* Chuông thông báo */}
                <div className="relative ml-1">
                  <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="p-2 text-gray-500 hover:text-emerald-600 transition-colors relative">
                    🔔 <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  </button>
                  
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 shadow-xl rounded-xl z-50 overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 font-bold text-sm text-gray-700 flex justify-between items-center">
                        Thông báo <button onClick={() => setIsNotifOpen(false)} className="text-gray-400 hover:text-red-500">✖</button>
                      </div>
                      <div className="p-4 text-sm text-gray-500 text-center">chưa có kèo đấu sắp tới</div>
                    </div>
                  )}
                </div>

                <Link href="/profile" className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition">Hồ sơ</Link>
                <button onClick={handleLogout} className="px-4 py-2 text-sm font-bold text-red-500 bg-red-50 rounded-md hover:bg-red-100 transition">Đăng xuất</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Banner */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 uppercase tracking-tight">Nền tảng Cáp Kèo Bóng Đá</h1>
          <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto">Hệ thống tìm đối giao lưu, tham gia giải đấu và theo dõi bảng xếp hạng Elo minh bạch.</p>
          <div className="flex justify-center gap-4">
            <Link href="/matches" className="px-8 py-3 text-sm font-bold text-white bg-slate-800 rounded-md hover:bg-slate-700 transition shadow-md">BẢNG XẾP HẠNG ELO</Link>
          </div>
        </div>
      </section>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-lg font-black text-slate-800 uppercase flex items-center gap-2">Tin tìm đối</h2>
              <Link href="/matches" className="text-xs font-bold text-emerald-600 hover:underline">Xem tất cả</Link>
            </div>
            
            {/*tin nhắn */}
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                value={quickMessage}
                onChange={(e) => setQuickMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickPost()}
                placeholder="..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
              <button 
                onClick={handleQuickPost}
                disabled={isPosting}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-2.5 rounded-full text-sm transition disabled:opacity-50"
              >
                {isPosting ? '...' : 'Đăng'}
              </button>
            </div>

            {/*tin vừa đăng */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
       {feedPosts.map((post) => (
  <div key={post.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-4">
    <div className="flex justify-between items-center mb-3">
      <h3 className="font-bold text-slate-800">{post.challenger?.name || "Đội bóng"}</h3>
      <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Đang tìm đối</span>
    </div>

    {/* Thông tin tối giản */}
    <div className="text-sm text-slate-600 space-y-1 mb-4">
      <p>Sân: <span className="font-semibold text-slate-900">{post.pitchname || "Chưa cập nhật"}</span></p>
      
      {/* Fix lỗi Invalid Date bằng cách check xem post.startTime có tồn tại không */}
      <p>Thời gian: <span className="font-semibold text-slate-900">
        {post.startTime 
          ? new Date(post.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
          : "Chưa cập nhật"}
      </span></p>
      
      <p>Ngày: <span className="font-semibold text-slate-900">
        {post.startTime 
          ? new Date(post.startTime).toLocaleDateString('vi-VN') 
          : "Chưa cập nhật"}
      </span></p>
    </div>

    <button 
      onClick={() => handleChallenge(post.id)} 
      className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg text-sm hover:bg-emerald-700 transition"
    >
      Thách đấu ngay
    </button>
  </div>
))}
            </div>
          </section>

          {/*Giải đấu */}
          <section>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                <h2 className="text-lg font-black text-slate-800 uppercase flex items-center gap-2">Giải Đấu</h2>
                <Link href="/tournaments" className="text-xs font-bold text-blue-600 hover:underline">Xem tất cả</Link>
              </div>
              <div className="text-center py-10 text-slate-400 text-sm font-medium">
                Chưa có giải đấu nào đang diễn ra.
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}