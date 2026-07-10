"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { bookPitchApi,searchPitchesApi,getUserProfileApi } from '@/service/pitch.service';

const TIME_SLOTS = [
  "05:00 - 06:00", "06:00 - 07:00", "07:00 - 08:00",
  "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00",
  "11:00 - 12:00", "12:00 - 13:00", "13:00 - 14:00",
  "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00",
  "17:00 - 18:00", "18:00 - 19:00", "19:00 - 20:00",
  "20:00 - 21:00", "21:00 - 22:00", "22:00 - 23:00"
];

export default function PitchBookingPage() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [balance, setBalance] = useState(0);
  
  const [isSearching, setIsSearching] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [availablePitches, setAvailablePitches] = useState<any[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
   setSelectedDate(today);
   const fetchRealBalance=async()=>{
    try{
      const response=await getUserProfileApi();
      const userData= response?.result;
      if (userData && userData.balance !== undefined) {
          setBalance(Number(userData.balance)); 
        }
    }catch(error){
console.log("ko lay dc thong tin balance",error);
    }
   };
   fetchRealBalance();
  }, []);
  const getStartEndTime = () => {
    const [startHour, endHour] = selectedTime.split(' - '); 
    const startTime = new Date(`${selectedDate}T${startHour}:00+07:00`).toISOString();
    const endTime = new Date(`${selectedDate}T${endHour}:00+07:00`).toISOString();
    return { startTime, endTime };
  };

  const handleSearch = async () => {
    if (!selectedDate || !selectedTime) {
      alert("Vui lòng chọn đầy đủ ngày và ca đá để tìm sân!");
      return;
    }

    setIsSearching(true);
    try {
      const { startTime, endTime } = getStartEndTime();
      const response = await searchPitchesApi(startTime, endTime);
      
      let pitchArray = [];
      if (Array.isArray(response)) {
        pitchArray = response;
      } else if (response?.data && Array.isArray(response.data)) {
        pitchArray = response.data;
      } else if (response?.result?.data && Array.isArray(response.result.data)) {
        pitchArray = response.result.data;
      } else if (response?.result && Array.isArray(response.result)) {
        pitchArray = response.result;
      }
      setAvailablePitches(pitchArray);
      setHasSearched(true);
    } catch (error: any) {
      alert("Lỗi tải sân: " + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleBookPitch = async (pitchId: number, pitchName: string, price: number) => {
    if (balance < price) {
      alert(`Số dư không đủ! Bạn cần ${price.toLocaleString('vi-VN')}₫ , ví chỉ còn ${balance.toLocaleString('vi-VN')}₫.`);
      return;
    }

    const confirmMsg = `XÁC NHẬN CHỐT SÂN:\n- Sân: ${pitchName}\n- Ca: ${selectedTime} | Ngày: ${selectedDate}\n- Số tiền: ${price.toLocaleString('vi-VN')} VND\n\nBạn có chắc chắn muốn đặt?`;
    if (!window.confirm(confirmMsg)) return;

    setIsBooking(true);
    try {
      const { startTime, endTime } = getStartEndTime();
      
      await bookPitchApi(pitchId, startTime, endTime);
      
      alert("đặt sân thành công");
      
      const newBalance = balance - price;
      setBalance(prevBalance => prevBalance - price);
      
      await handleSearch(); 

    } catch (error: any) {
      alert(` lỗi đặt sân:\n${error.message}`);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 pb-24">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/user" className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition font-bold">
              ←
            </Link>
            <h1 className="font-black text-lg uppercase tracking-wide text-slate-900">Tìm & Đặt Sân</h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        
        {/* data */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Chọn ngày đá</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setHasSearched(false); }}
                className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-900 font-bold focus:ring-emerald-500 focus:border-emerald-500 outline-none" 
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Chọn Ca (Khung giờ)</label>
              <select 
                value={selectedTime}
                onChange={(e) => { setSelectedTime(e.target.value); setHasSearched(false); }}
                className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-900 font-bold focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer"
              >
                <option value="">-- Bấm để chọn ca --</option>
                {TIME_SLOTS.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full md:w-auto h-[46px] px-8 bg-[#1e293b] text-white font-bold text-sm uppercase rounded-lg hover:bg-slate-800 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Đang quét...' : 'Lọc danh sách'}
            </button>
          </div>
        </div>

        {/* kq lọc */}
        {hasSearched && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-700 uppercase">
                Kết quả cho: {selectedDate} (Ca {selectedTime})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <th className="p-4 font-bold">Tên Sân</th>
                    <th className="p-4 font-bold">Giá Thuê</th>
                    <th className="p-4 font-bold">Trạng thái</th>
                    <th className="p-4 font-bold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {availablePitches.length > 0 ? (
                    availablePitches.map((pitch) => (
                      <tr key={pitch.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="p-4">
                          <p className="font-bold text-slate-900 text-sm">{pitch.name}</p>
                        </td>
                        <td className="p-4 font-black text-emerald-600 text-sm">
                          {pitch.price.toLocaleString('vi-VN')}₫
                        </td>
                        <td className="p-4">
                          {pitch.isAvailable ? (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase tracking-wider">Còn trống</span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase tracking-wider">Đã có người đặt</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {pitch.isAvailable ? (
                            <button 
                              onClick={() => handleBookPitch(pitch.id, pitch.name, pitch.price)}
                              disabled={isBooking}
                              className="bg-[#1e6b4d] hover:bg-[#16553d] disabled:bg-slate-400 disabled:cursor-wait text-white px-5 py-2 rounded text-xs font-bold uppercase transition shadow-sm"
                            >
                              {isBooking ? 'Đang khóa...' : 'Chốt sân'}
                            </button>
                          ) : (
                            <button disabled className="bg-slate-100 text-slate-400 px-5 py-2 rounded text-xs font-bold uppercase cursor-not-allowed">
                              Kín lịch
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-slate-400 font-medium text-sm">
                        Không tìm thấy sân nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}