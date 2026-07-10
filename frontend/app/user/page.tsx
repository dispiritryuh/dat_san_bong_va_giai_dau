"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserProfileApi } from '@/service/pitch.service';

export default function UserDashboardPage() {
  const router = useRouter();
  

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [hasTeam, setHasTeam] = useState(false);
  const [teamName, setTeamName] = useState(""); 
  const [teamElo, setTeamElo] = useState(0); 
  const [balance, setBalance] = useState(0);

  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Vui lòng đăng nhập để tiếp tục!");
      router.push('/login');
      return;
    }
    setIsLoggedIn(true);
    const storedName = localStorage.getItem('username');
    if (storedName) {
      setUsername(storedName);
    }

   
    const teamCheck = localStorage.getItem('hasTeam');
    if (teamCheck === 'true') {
      setHasTeam(true);
      setTeamName(localStorage.getItem('teamName') || "Chưa cập nhật tên đội");
      setTeamElo(Number(localStorage.getItem('teamElo')) || 0);
    }
    const fetchRealProfile = async () => {
      try {
        const response = await getUserProfileApi();
        const userData = response?.result || response?.data || response;
        
        if (userData) {
          if (userData.balance !== undefined) setBalance(Number(userData.balance)); 
          if (userData.username) setUsername(userData.username);
          if (userData.manageTeam) {
        setHasTeam(true);
        setTeamName(userData.manageTeam.name);
        setTeamElo(Number(userData.manageTeam.elo)); 
      }
if (userData.bookings && Array.isArray(userData.bookings)) {
            const formattedSchedules = userData.bookings.map((booking: any) => {
              const start = new Date(booking.startTime || booking.start_time);
              const end = new Date(booking.endTime || booking.end_time);
              
              const dateStr = start.toLocaleDateString('vi-VN');
              const timeStr = `${start.getHours()}:00 - ${end.getHours()}:00`;
              let opponentName = "Giao hữu / Chờ đối thủ";
              const myTeamName = userData.manageTeam?.name;
              if (booking.match) {
                  if (booking.match.teamA?.name === myTeamName) {
                      opponentName = booking.match.teamB?.name || "Chưa xác định";
                  } else {
                      opponentName = booking.match.teamA?.name || "Chưa xác định";
                  }
              }

              return {
                id: booking.id,
                time: `${timeStr} | ${dateStr}`,
                pitch: booking.pitch?.name || "Sân chưa cập nhật", 
                opponent: opponentName, 
              };
            });
            setSchedules(formattedSchedules);
          }
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin ví từ Backend:", error);
      }
    };

    fetchRealProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.clear(); 
    router.push('/login');
  };

  if (!isLoggedIn) return <div className="p-8 text-center font-medium">Đang tải dữ liệu...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 selection:bg-emerald-200 selection:text-emerald-900 pb-12">
      
      {/* diieu huong */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-black text-xl tracking-tight uppercase flex items-center gap-1.5">
            <span className="text-slate-900">Match</span>
            <span className="text-emerald-500">Finder</span>
          </Link>
          
          <div className="flex items-center space-x-6">
            <button onClick={handleLogout} className="px-4 py-1.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition flex items-center gap-2">
              Đăng xuất
            </button>
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        
        {/* ho so*/}
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden border border-slate-300">
               <svg className="w-8 h-8 text-slate-400 mt-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
            </div>
            <div>
              {/*ten tai khoan*/}
              <h1 className="text-xl font-bold text-slate-900">{username}</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {hasTeam ? `Đội bóng: ${teamName}` : "Tài khoản cá nhân / Chưa có đội bóng"}
              </p>
            </div>
          </div>
          <Link href="/profile" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition border border-slate-200">
            đổi thông tin đăng nhập
          </Link>
        </div>

        {/*dashboard*/}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/*t+g*/}
          <div className="lg:col-span-2 space-y-6">
            
            {/*trang thai*/}
            {!hasTeam ? (
              <div className="bg-white border border-slate-200 p-6 rounded-xl flex flex-col items-center justify-center text-center space-y-4 py-12">
                <h2 className="text-lg font-bold text-slate-800 uppercase">Bạn chưa sở hữu đội bóng</h2>
                <Link href="/team" className="bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded hover:bg-emerald-800 transition text-sm">
                  Tạo đội bóng ngay
                </Link>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-bold text-base text-slate-900 uppercase tracking-wide">Đội bóng của tôi</h2>
                  <Link href="/team/manage" className="text-xs font-semibold text-slate-500 hover:text-slate-800">V</Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#f8fafc] p-4 rounded-lg border border-slate-100">
                    <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Tên CLB</p>
                    <p className="text-base font-bold text-slate-800 uppercase">{teamName}</p>
                  </div>
                  <div className="bg-[#f0fdf4] p-4 rounded-lg border border-emerald-50">
                    <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">ĐIỂM ELO</p>
                    <p className="text-xl font-bold text-emerald-700">{teamElo} <span className="text-sm font-semibold text-emerald-600">PTS</span></p>
                  </div>
                </div>
              </div>
            )}

            {/* lich thi dau */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4">
              <h2 className="font-bold text-base text-slate-900 uppercase tracking-wide">
                Lịch thi đấu đã lên lịch ({schedules.length})
              </h2>
              
              <div className="space-y-3">
                {schedules.map((match) => (
                  <div key={match.id} className="p-4 border border-slate-100 bg-[#f8fafc] rounded-lg">
                     <p className="text-sm font-semibold text-slate-800">
                        {match.opponent} <span className="text-slate-300 mx-2">|</span> {match.time} <span className="text-slate-300 mx-2">|</span> {match.pitch}
                     </p>
                  </div>
                ))}
                {schedules.length === 0 && (
                  <p className="text-sm text-slate-500 py-2">Chưa có lịch thi đấu nào.</p>
                )}
              </div>
            </div>

          </div>

          {/* cot phai*/}
          <div className="space-y-6">
            
            {/* dat san */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path></svg>
                </div>
                <h3 className="font-bold text-base text-slate-900 uppercase tracking-wide">Đặt Sân</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                </p>
              </div>
              <Link href="/pitch" className="block text-center w-full mt-5 bg-[#1e6b4d] hover:bg-[#16553d] text-white font-semibold text-xs py-2.5 rounded transition">
                TÌM SÂN TRỐNG NGAY
              </Link>
            </div>

            {/* doi thu*/}
            <div className="bg-white border border-slate-200 p-6 rounded-xl">
              <h3 className="font-bold text-base text-slate-900 uppercase tracking-wide">
                Đối thủ
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              </p>
              <Link href="/matches" className="block text-center w-full mt-5 bg-[#1e293b] hover:bg-[#0f172a] text-white font-semibold text-xs py-2.5 rounded transition">
                XEM XẾP HẠNG CÁC ĐỘI
              </Link>
            </div>

            {/* so du */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Số dư</p>
              <div className="flex items-baseline gap-1 mb-4">
                {/* tien */}
                <span className="text-2xl font-bold text-slate-900">{balance.toLocaleString('vi-VN')}</span>
                <span className="text-xs font-bold text-slate-600 uppercase">VND</span>
              </div>
              <button className="w-full bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-semibold py-2.5 rounded border border-slate-200 transition">
                + Nạp tiền 
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}