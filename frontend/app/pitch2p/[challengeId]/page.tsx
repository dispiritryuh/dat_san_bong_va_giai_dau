"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import axios from 'axios';
import { searchPitchesApi, getUserProfileApi } from '@/service/pitch.service';

const TIME_SLOTS = [
  "05:00 - 06:00", "06:00 - 07:00", "07:00 - 08:00",
  "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00",
  "11:00 - 12:00", "12:00 - 13:00", "13:00 - 14:00",
  "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00",
  "17:00 - 18:00", "18:00 - 19:00", "19:00 - 20:00",
  "20:00 - 21:00", "21:00 - 22:00", "22:00 - 23:00"
];

export default function P2PPitchBookingPage() {
  const { challengeId } = useParams();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [balance, setBalance] = useState(0);
  const [availablePitches, setAvailablePitches] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [socket, setSocket] = useState<any>(null);
  const [proposedPitch, setProposedPitch] = useState<any>(null); 
  const [isMyReady, setIsMyReady] = useState(false);
  const [isOpponentReady, setIsOpponentReady] = useState(false);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [expireTime, setExpireTime] = useState<number | null>(null);

  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [isScoreProposed, setIsScoreProposed] = useState(false); 
  const [isMyScoreReady, setIsMyScoreReady] = useState(false); 
  const [isOpponentScoreReady, setIsOpponentScoreReady] = useState(false); 
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);

  const syncDataRef = useRef({ proposedPitch, isMyReady, expireTime });
  useEffect(() => {
    syncDataRef.current = { proposedPitch, isMyReady, expireTime };
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);

    const isAlreadyPaid = localStorage.getItem(`challenge_paid_${challengeId}`);
    if (isAlreadyPaid === 'true') {
        setIsPaymentSuccess(true);
    }

    const fetchRealBalance = async () => {
      try {
        const response = await getUserProfileApi();
        if (response?.result?.balance !== undefined) setBalance(Number(response.result.balance)); 
      } catch (error) {}
    };
    fetchRealBalance();

    const newSocket = io('http://localhost:8080');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_challenge_room', Number(challengeId));
      newSocket.emit('request_current_state', { challengeId: Number(challengeId) });
    });

    newSocket.on('ask_for_state_sync_from_opponent', () => {
      const d = syncDataRef.current;
      if (d.proposedPitch) {
        let remain = 300 * 1000;
        if (d.expireTime) remain = Math.max(0, d.expireTime - Date.now());
        newSocket.emit('propose_pitch', { challengeId: Number(challengeId), pitch: { ...d.proposedPitch, syncRemain: remain } });
        if (d.isMyReady) newSocket.emit('im_ready', { challengeId: Number(challengeId) });
      }
    });

    newSocket.on('opponent_proposed_pitch', (pitchInfo) => {
      setProposedPitch(pitchInfo);
      setIsMyReady(false);
      setIsOpponentReady(false);
      setExpireTime(Date.now() + (pitchInfo.syncRemain || 300 * 1000)); 
    });

    newSocket.on('opponent_canceled_pitch_proposal', () => {
      setProposedPitch(null);
      setIsMyReady(false);
      setIsOpponentReady(false);
      setTimeLeft(null);
      setExpireTime(null); 
      alert("Đối thủ đã hủy đề xuất sân. Hãy chọn lại!");
    });

    newSocket.on('opponent_is_ready', () => setIsOpponentReady(true));
    
    newSocket.on('payment_success_broadcast', () => {
        setIsPaymentSuccess(true);
        localStorage.setItem(`challenge_paid_${challengeId}`, 'true'); 
    });

    newSocket.on('opponent_proposed_score', (data) => {
      setScoreA(data.scoreA); setScoreB(data.scoreB);
      setIsScoreProposed(true); 
      setIsMyScoreReady(false); 
      setIsOpponentScoreReady(true); 
    });
    
    newSocket.on('opponent_confirmed_score', () => setIsOpponentScoreReady(true));
    newSocket.on('opponent_canceled_score', () => {
      setIsScoreProposed(false); setIsMyScoreReady(false); setIsOpponentScoreReady(false);
      alert(" Đối thủ đã hủy đề xuất tỉ số. Hãy nhập lại!");
    });

    return () => { newSocket.disconnect(); };
  }, [challengeId]);

  useEffect(() => {
    if (!expireTime || isPaymentSuccess) return;
    const timerId = setInterval(() => {
      const remain = Math.floor((expireTime - Date.now()) / 1000);
      setTimeLeft(remain > 0 ? remain : 0);
      if (remain <= 0) clearInterval(timerId);
    }, 1000);
    return () => clearInterval(timerId);
  }, [expireTime, isPaymentSuccess]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSearch = async () => {
    if (!selectedDate || !selectedTime) return alert("Vui lòng chọn đầy đủ ngày và ca đá để tìm sân!");
    setIsSearching(true);
    try {
      const [startHour, endHour] = selectedTime.split(' - '); 
      const startTime = new Date(`${selectedDate}T${startHour}:00+07:00`).toISOString();
      const endTime = new Date(`${selectedDate}T${endHour}:00+07:00`).toISOString();
      
      const response = await searchPitchesApi(startTime, endTime);
      const pitchArray = Array.isArray(response) ? response : (response?.data || response?.result?.data || response?.result || []);
      setAvailablePitches(pitchArray);
      setHasSearched(true);
    } catch (error: any) {
      alert("Lỗi tải sân: " + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleProposePitch = (pitch: any) => {
    const halfPrice = pitch.price / 2;
    if (balance < halfPrice) return alert(`Không đủ tiền! Bạn cần tối thiểu ${halfPrice.toLocaleString('vi-VN')}₫ để đề xuất.`);

    const pitchData = { ...pitch, time: selectedTime, date: selectedDate, syncRemain: 300 * 1000 };
    setProposedPitch(pitchData);
    setIsMyReady(false); 
    setIsOpponentReady(false);
    setExpireTime(Date.now() + 300 * 1000); 
    socket.emit('propose_pitch', { challengeId: Number(challengeId), pitch: pitchData });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelPitchProposal = () => {
    setProposedPitch(null); setIsMyReady(false); setIsOpponentReady(false); setTimeLeft(null); setExpireTime(null); 
    socket.emit('cancel_pitch_proposal', { challengeId: Number(challengeId) });
  };

  const executePaymentAPI = async () => {
    if (isProcessingPay) return;
    setIsProcessingPay(true);
    try {
      const token = localStorage.getItem('token');
      
      const [startHour, endHour] = proposedPitch.time.split(' - '); 
      const startISO = new Date(`${proposedPitch.date}T${startHour}:00+07:00`).toISOString();
      const endISO = new Date(`${proposedPitch.date}T${endHour}:00+07:00`).toISOString();
      
      const pId = proposedPitch.id || proposedPitch.PitchId || proposedPitch.pitchId;
      if (!pId) {
         alert("Lỗi: Không tìm thấy ID Sân trong dữ liệu!");
         setIsProcessingPay(false); setIsMyReady(false); return;
      }

      let opponentId = 0;
      try {
        const activeChatStr = localStorage.getItem('active_chat_room');
        if (activeChatStr) {
           const activeChat = JSON.parse(activeChatStr);
           opponentId = Number(activeChat.opponentId || activeChat.challengerId || 0); 
        }
      } catch(e) {}

      const payload = {
        challengeIdC: Number(challengeId), 
        opponentIdC: opponentId || 0,
        pitchId: Number(pId), 
        PitchId: Number(pId), 
        input: { 
           id: Number(pId),       
           pitchId: Number(pId),  
           PitchId: Number(pId),  
           StartTime: startISO, 
           startTime: startISO, 
           EndTime: endISO,     
           endTime: endISO      
        }
      };

      await axios.patch(`http://localhost:8080/api/pk/select`, payload, { headers: { Authorization: `Bearer ${token}` } });

      setIsPaymentSuccess(true);
      localStorage.setItem(`challenge_paid_${challengeId}`, 'true'); 
      socket.emit('payment_success', { challengeId: Number(challengeId) });
      
      alert("CHỐT SÂN THÀNH CÔNG!");
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
      alert("Lỗi thanh toán Backend: " + errorMsg);
      setIsMyReady(false); 
    } finally {
      setIsProcessingPay(false);
    }
  };

  const handleReadyToPay = async () => {
    let currentBalance = balance;
    try {
      const res = await getUserProfileApi();
      if (res?.result?.balance !== undefined) {
        currentBalance = Number(res.result.balance);
        setBalance(currentBalance);
      }
    } catch (e) {}

    const halfPrice = proposedPitch.price / 2;
    if (currentBalance < halfPrice) return alert(`Không đủ tiền! Cần: ${halfPrice.toLocaleString('vi-VN')}₫, Ví: ${currentBalance.toLocaleString('vi-VN')}₫`);
    
    setIsMyReady(true);
    socket.emit('im_ready', { challengeId: Number(challengeId) });

    if (isOpponentReady) {
      executePaymentAPI();
    }
  };

  const handleResetPitch = () => {
    setProposedPitch(null); setIsMyReady(false); setIsOpponentReady(false); setTimeLeft(null); setExpireTime(null);
  };

  const forceSync = () => {
    if (socket) socket.emit('request_current_state', { challengeId: Number(challengeId) });
  };

  const handleProposeScore = () => {
    if (scoreA === "" || scoreB === "") return alert("phải nhập đủ tỉ số ");
    setIsScoreProposed(true); 
    setIsMyScoreReady(true); 
    socket.emit('propose_score', { challengeId: Number(challengeId), scoreA, scoreB });
  };

  const handleCancelScore = () => {
    setIsScoreProposed(false); setIsMyScoreReady(false); setIsOpponentScoreReady(false);
    socket.emit('cancel_score', { challengeId: Number(challengeId) });
  };

  const handleConfirmScore = () => {
    setIsMyScoreReady(true);
    socket.emit('confirm_score', { challengeId: Number(challengeId) });
  };

  useEffect(() => {
    if (isMyScoreReady && isOpponentScoreReady && isScoreProposed) {
      const submitFinalScore = async () => {
        if (isSubmittingScore) return;
        setIsSubmittingScore(true);
        try {
          const token = localStorage.getItem('token');
          let realMatchId;
          try {
             const matchRes = await axios.post('http://localhost:8080/api/match/create', { challengeId: Number(challengeId) }, {
                 headers: { Authorization: `Bearer ${token}` }
             });
             realMatchId = matchRes.data?.data?.id || matchRes.data?.id;
          } catch(err: any) {
             console.error("Lỗi tạo/lấy match:", err);
             alert("Lỗi đồng bộ Match ID");
             setIsSubmittingScore(false);
             return;
          }

          await axios.patch('http://localhost:8080/api/match/submit', {
            matchId: Number(realMatchId), 
            goalsA: Number(scoreA),
            goalsB: Number(scoreB)
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          alert(`KẾT QUẢ: ${scoreA} - ${scoreB}. Đã cập nhật ELO!`);
          localStorage.removeItem(`challenge_paid_${challengeId}`);
          router.push('/matches'); 
        } catch (error: any) {
          console.error(error);
          alert("Lỗi cập nhật ELO! " + (error.response?.data?.message || ""));
        } finally {
          setIsSubmittingScore(false);
        }
      };
      submitFinalScore();
    }
  }, [isMyScoreReady, isOpponentScoreReady, isScoreProposed]);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 pb-24">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition font-bold">←</button>
            <h1 className="font-black text-lg uppercase tracking-wide text-slate-900">Chốt Sân & Tỉ Số</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={forceSync} className="text-[10px] uppercase font-bold text-slate-400 hover:text-emerald-600 transition flex items-center gap-1"><span>🔄</span> Đồng bộ</button>
            <div className="text-sm font-bold bg-slate-100 px-4 py-1.5 rounded-full text-slate-600">
              Ví: <span className={`font-black ${balance === 0 ? 'text-red-500' : 'text-emerald-600'}`}>{balance.toLocaleString('vi-VN')}₫</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {proposedPitch && !isPaymentSuccess && (
          <div className="bg-white border-2 border-slate-800 p-8 rounded-2xl shadow-sm text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-top-4 mb-8 relative overflow-hidden">
            {timeLeft !== null && timeLeft > 0 && (
              <div className="absolute bottom-0 left-0 h-1 bg-red-500 transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / 300) * 100}%` }} />
            )}

            <div className="mb-6 relative">
               <button onClick={handleCancelPitchProposal} className="absolute right-0 top-0 text-xs text-slate-400 hover:text-red-500 font-bold underline">Hủy / Đổi sân</button>
               <p className="font-black text-2xl text-slate-800 uppercase tracking-tight">{proposedPitch.name}</p>
               <p className="text-sm font-bold text-emerald-600 mt-1">{proposedPitch.time} • Ngày {proposedPitch.date}</p>
            </div>

            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex-1 text-right">
                <p className="font-bold text-slate-400 uppercase text-xs mb-2">Đội Bạn</p>
                <div className={`p-4 rounded-xl border-2 ${isMyReady ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-lg font-black text-slate-800">{(proposedPitch.price / 2).toLocaleString('vi-VN')}₫</p>
                  <p className={`text-xs font-bold uppercase mt-1 ${isMyReady ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {isMyReady ? 'ĐÃ SẴN SÀNG' : 'CHỜ...'}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="text-2xl font-black text-slate-300 mb-2">VS</div>
                <div className={`font-mono font-bold text-lg px-3 py-1 rounded ${timeLeft === 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                   {timeLeft === 0 ? '00:00' : formatTime(timeLeft || 0)}
                </div>
              </div>
              
              <div className="flex-1 text-left">
                <p className="font-bold text-slate-400 uppercase text-xs mb-2">Đối Thủ</p>
                <div className={`p-4 rounded-xl border-2 ${isOpponentReady ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-lg font-black text-slate-800">{(proposedPitch.price / 2).toLocaleString('vi-VN')}₫</p>
                  <p className={`text-xs font-bold uppercase mt-1 ${isOpponentReady ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {isOpponentReady ? 'ĐÃ SẴN SÀNG' : 'CHỜ...'}
                  </p>
                </div>
              </div>
            </div>

            {timeLeft === 0 ? (
              <div className="space-y-4">
                <p className="text-red-500 font-bold uppercase tracking-wide">Đã hết 5 phút! Phiên giao dịch bị hủy.</p>
                <button onClick={handleResetPitch} className="px-8 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded uppercase text-sm">Chọn Sân Lại</button>
              </div>
            ) : (
              !isMyReady && (
                <button onClick={handleReadyToPay} disabled={isProcessingPay} className="px-10 py-3 bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white font-bold rounded-lg uppercase shadow-lg transition hover:scale-105 active:scale-95">
                  {isProcessingPay ? 'Đang xử lý...' : 'Xác Nhận Thanh Toán'}
                </button>
              )
            )}
          </div>
        )}

        {!proposedPitch && !isPaymentSuccess && (
          <>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Chọn ngày đá</label>
                  <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setHasSearched(false); }} className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-900 font-bold focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Chọn Ca (Khung giờ)</label>
                  <select value={selectedTime} onChange={(e) => { setSelectedTime(e.target.value); setHasSearched(false); }} className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-900 font-bold focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer">
                    <option value="">-- Bấm để chọn ca --</option>
                    {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                  </select>
                </div>
                <button onClick={handleSearch} disabled={isSearching} className="w-full md:w-auto h-[46px] px-8 bg-[#1e293b] text-white font-bold text-sm uppercase rounded-lg hover:bg-slate-800 transition disabled:opacity-70 disabled:cursor-not-allowed">
                  {isSearching ? 'Đang quét...' : 'Lọc danh sách'}
                </button>
              </div>
            </div>

            {hasSearched && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 mt-6">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <h2 className="text-sm font-bold text-slate-700 uppercase">Kết quả cho: {selectedDate} (Ca {selectedTime})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse"><thead>
                      <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                        <th className="p-4 font-bold">Tên Sân</th>
                        <th className="p-4 font-bold">Giá Thuê</th>
                        <th className="p-4 font-bold">Trạng thái</th>
                        <th className="p-4 font-bold text-right">Thao tác</th>
                      </tr>
                    </thead><tbody>
                      {availablePitches.length > 0 ? availablePitches.map((pitch) => (
                          <tr key={pitch.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                            <td className="p-4"><p className="font-bold text-slate-900 text-sm">{pitch.name}</p></td>
                            <td className="p-4 font-black text-emerald-600 text-sm">{pitch.price.toLocaleString('vi-VN')}₫</td>
                            <td className="p-4">
                              {pitch.isAvailable ? <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase tracking-wider">Còn trống</span> : <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase tracking-wider">Đã có người đặt</span>}
                            </td>
                            <td className="p-4 text-right">
                              {pitch.isAvailable ? <button onClick={() => handleProposePitch(pitch)} className="bg-[#1e6b4d] hover:bg-[#16553d] text-white px-5 py-2 rounded text-xs font-bold uppercase transition shadow-sm">Đề xuất sân</button> : <button disabled className="bg-slate-100 text-slate-400 px-5 py-2 rounded text-xs font-bold uppercase cursor-not-allowed">Kín lịch</button>}
                            </td>
                          </tr>
                        )) : <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-medium text-sm">Không tìm thấy sân nào</td></tr>}
                    </tbody></table>
                </div>
              </div>
            )}
          </>
        )}

        {isPaymentSuccess && (
          <div className="bg-white border-2 border-emerald-500 p-8 rounded-2xl shadow-sm text-center max-w-2xl mx-auto mt-6 animate-in zoom-in">
            <h2 className="font-black text-xl text-emerald-600 uppercase mb-6 tracking-wide">Cập Nhật Tỉ Số</h2>
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex-1 text-right">
                <p className="font-bold text-slate-400 uppercase text-xs mb-2">Đội Bạn</p>
                <input type="number" value={scoreA} onChange={e => setScoreA(e.target.value)} disabled={isScoreProposed} placeholder="0" className="w-20 h-20 text-center text-4xl font-black bg-slate-50 rounded-lg border-2 border-slate-200 focus:border-emerald-500 disabled:opacity-50 disabled:bg-transparent disabled:border-none outline-none" />
              </div>
              <div className="text-2xl font-black text-slate-300">VS</div>
              <div className="flex-1 text-left">
                <p className="font-bold text-slate-400 uppercase text-xs mb-2">Đối Thủ</p>
                <input type="number" value={scoreB} onChange={e => setScoreB(e.target.value)} disabled={isScoreProposed} placeholder="0" className="w-20 h-20 text-center text-4xl font-black bg-slate-50 rounded-lg border-2 border-slate-200 focus:border-emerald-500 disabled:opacity-50 disabled:bg-transparent disabled:border-none outline-none" />
              </div>
            </div>

            {!isScoreProposed && <button onClick={handleProposeScore} className="px-10 py-3 bg-[#1e293b] hover:bg-black text-white font-bold rounded-lg uppercase transition">Báo Cáo Kết Quả Này</button>}
            
            {isScoreProposed && (
               <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex justify-center gap-12 mb-4">
                    <div className="text-center">
                       <p className="font-bold text-[10px] uppercase text-slate-400 mb-1">Trạng thái Bạn</p>
                       <p className={`text-sm font-black uppercase ${isMyScoreReady ? 'text-emerald-600' : 'text-slate-400'}`}>{isMyScoreReady ? 'ĐÃ ĐỒNG Ý' : 'CHỜ XÁC NHẬN...'}</p>
                    </div>
                    <div className="text-center">
                       <p className="font-bold text-[10px] uppercase text-slate-400 mb-1">Trạng thái Đối thủ</p>
                       <p className={`text-sm font-black uppercase ${isOpponentScoreReady ? 'text-emerald-600' : 'text-slate-400'}`}>{isOpponentScoreReady ? 'ĐÃ ĐỒNG Ý' : 'CHỜ XÁC NHẬN...'}</p>
                    </div>
                  </div>
                  <div className="flex justify-center gap-2">
                     <button onClick={handleCancelScore} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded uppercase text-xs hover:bg-slate-300">Sửa lại</button>
                     {!isMyScoreReady && <button onClick={handleConfirmScore} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded uppercase text-xs hover:bg-emerald-700">Đồng ý</button>}
                  </div>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}