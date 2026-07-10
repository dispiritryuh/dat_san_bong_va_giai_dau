"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPkDashboardApi, sendChallengeApi,rejectChallengeApi,acceptChallengeApi,cancelChallengeApi,selectPitchP2PApi } from '@/service/pk.service';

export default function TeamRankingsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(true); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [challengeMessage, setChallengeMessage] = useState("Hello, go goal");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await getPkDashboardApi();
        if (response && response.result) {
          setTeams(response.result);
          setIsGuest(response.isGuest);
        }
      } catch (error) {
        console.error("Lỗi lấy bảng xếp hạng:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleOpenChallenge = (team: any) => {
    if (isGuest) {
      alert("Vui lòng đăng nhập để thách đấu đội khác");
      return;
    }
    setSelectedTeam(team);
    setChallengeMessage("Hello, go goal");
    setIsModalOpen(true);
  };
const submitChallenge = async () => {
    if (!selectedTeam) return;
    setIsSending(true);
    
    try {
      const response = await sendChallengeApi(selectedTeam.id, challengeMessage);
      console.log("Dữ liệu tạo kèo trả về:", response);

      alert(`Đã gửi yêu cầu tới ${selectedTeam.name}! Chờ họ phản hồi.`);
      setIsModalOpen(false); 
      
      const newChallenge = response?.data?.result || response?.result || response?.data || response;
      const challengeId = newChallenge?.id;

      if (challengeId) {
        window.dispatchEvent(new CustomEvent('OPEN_GLOBAL_CHAT', { 
            detail: { 
                id: challengeId, 
                teamName: selectedTeam.name, 
                opponentId: selectedTeam.id, 
                isSender: true, 
                isAccepted: false 
            } 
        }));
      } else {
        console.error("thiếu ID", response);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Có lỗi xảy ra khi gửi lời thách đấu");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 pb-24 relative">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/user" className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition font-bold">
              ←
            </Link>
            <h1 className="font-black text-lg uppercase tracking-wide text-slate-900">Bảng Xếp Hạng ELO</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* bảng rank */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-slate-500 font-medium">Đang tải bảng xếp hạng...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <th className="p-4 font-bold text-center w-16">Hạng</th>
                    <th className="p-4 font-bold">Câu Lạc Bộ</th>
                    <th className="p-4 font-bold text-center w-32">Điểm ELO</th>
                    <th className="p-4 font-bold text-right w-36">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team, index) => {
                    const isTop1 = index === 0;
                    const isTop23 = index === 1 || index === 2;

                    return (
                      <tr 
                        key={team.id} 
                        className={`border-b border-slate-100 transition duration-200 hover:bg-slate-50 
                          ${isTop1 ? 'bg-amber-50/30' : ''}`}
                      >
                        <td className="p-4 text-center">
                          {isTop1 ? (
                            <div className="w-8 h-8 mx-auto bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-full flex items-center justify-center shadow-sm shadow-amber-200">
                              <span className="text-white font-black text-sm">1</span>
                            </div>
                          ) : isTop23 ? (
                            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-sm
                              ${index === 1 ? 'bg-slate-200 text-slate-600' : 'bg-orange-200 text-orange-700'}`}>
                              {index + 1}
                            </div>
                          ) : (
                            <span className="font-bold text-slate-400">{index + 1}</span>
                          )}
                        </td>

                        <td className="p-4">
                          <p className={`font-black text-sm uppercase ${isTop1 ? 'text-amber-600' : 'text-slate-900'}`}>
                            {team.name}
                          </p>
                        </td>

                        <td className="p-4 text-center">
                          <p className={`text-xl font-black ${isTop1 ? 'text-amber-500' : 'text-emerald-600'}`}>
                            {team.elo}
                          </p>
                        </td>

                        <td className="p-4 text-right">
                          {/*nut bam*/}
                          <button 
                            onClick={() => handleOpenChallenge(team)}
                            disabled={isGuest}
                            className={`px-5 py-2 rounded text-xs font-bold uppercase transition shadow-sm
                              ${isGuest 
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                : isTop1 
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                                  : 'bg-[#1e293b] hover:bg-[#0f172a] text-white'
                              }`}
                          >
                            {isGuest ? 'Đăng nhập để thách đấu' : 'Thách đấu'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* gui thach dau */}
      {isModalOpen && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="bg-slate-50 border-b border-slate-100 p-5">
              <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight">
                Gửi Lời Thách Đấu
              </h3>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Gạ kèo đội <span className="font-bold text-emerald-600">{selectedTeam.name}</span> (ELO: {selectedTeam.elo})
              </p>
            </div>

            {/* Body Modal */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                  Tin nhắn mở đầu
                </label>
                <textarea 
                  rows={3}
                  value={challengeMessage}
                  onChange={(e) => setChallengeMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition resize-none"
                  placeholder="lời gửi đầu tiên..."
                ></textarea>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-5 pt-0 flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                disabled={isSending}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg transition"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={submitChallenge}
                disabled={isSending || challengeMessage.trim() === ""}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-sm rounded-lg transition flex items-center justify-center gap-2"
              >
                {isSending ? 'Đang gửi...' : 'Gửi thách đấu '}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}