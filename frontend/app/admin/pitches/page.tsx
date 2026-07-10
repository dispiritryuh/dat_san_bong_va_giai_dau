"use client";

import { useState, useEffect } from 'react';
import { 
  createPitchApi, 
  changePitchPriceApi, 
  changePitchStatusApi,
  getAllPitchesApi
} from '../../../service/admin.service';

export default function AdminPitchesPage() {
  const [newPitchName, setNewPitchName] = useState('');
  const [newPitchPrice, setNewPitchPrice] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [pitches, setPitches] = useState<any[]>([]);
  useEffect(() => {
    const fetchPitches = async () => {
      try {
        const response = await getAllPitchesApi();
        
        let pitchArray = []; 
        if (Array.isArray(response)) {
          pitchArray = response;
        } else if (response?.data && Array.isArray(response.data)) {
          pitchArray = response.data;
        } else if (response?.result?.data && Array.isArray(response.result.data)) {
          pitchArray = response.result.data;
        } else if (response?.data?.data && Array.isArray(response.data.data)) {
          pitchArray = response.data.data;
        }

        setPitches(pitchArray); 
      } catch (error) {
        console.error("Lỗi tải sân:", error);
        setPitches([]); 
      }
    };
    fetchPitches();
  }, []);

  const handleCreatePitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPitchName || !newPitchPrice) {
      alert("điền thiếu tên hoặc giá");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createPitchApi(newPitchName, Number(newPitchPrice));
      alert("Thêm sân mới thành công!");
      setPitches([...(pitches || []), result]);
      setNewPitchName('');
      setNewPitchPrice('');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleChangePrice = async (pitchId: number, oldPrice: number) => {
    const inputPrice = window.prompt("Nhập giá tiền mới cho sân này (VND):", oldPrice.toString());
    
    if (inputPrice === null || inputPrice === "") return;
    
    const newPrice = Number(inputPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      alert("Giá tiền không hợp lệ");
      return;
    }

    try {
      await changePitchPriceApi(pitchId, newPrice);
      alert("Đổi giá sân thành công!");
      setPitches(pitches?.map(p => p.id === pitchId ? { ...p, basePrice: newPrice } : p));
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleToggleStatus = async (pitchId: number, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "MAINTENANCE" : "ACTIVE";
    const confirmMsg = newStatus === "ACTIVE" 
      ? "MỞ CỬA" 
      : "ĐÓNG CỬA";

    if (!window.confirm(confirmMsg)) return;

    try {
      await changePitchStatusApi(pitchId, newStatus);
      alert(`Đã ${newStatus === "ACTIVE" ? "MỞ CỬA" : "ĐÓNG CỬA"} sân thành công!`);
      setPitches(pitches?.map(p => p.id === pitchId ? { ...p, status: newStatus } : p));
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-black text-slate-800 uppercase">Quản lý Sân </h2>
        <p className="text-sm text-slate-500">.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="text-emerald-500 text-xl"></span> Tạo sân thi đấu mới
        </h3>
        <form onSubmit={handleCreatePitch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên sân bóng</label>
            <input 
              type="text" 
              placeholder="..."
              value={newPitchName}
              onChange={(e) => setNewPitchName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-900 font-bold focus:ring-emerald-500 focus:border-emerald-500 outline-none" 
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Giá thuê mặc định (VND)</label>
            <input 
              type="number" 
              placeholder="..."
              value={newPitchPrice}
              onChange={(e) => setNewPitchPrice(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-900 font-bold focus:ring-emerald-500 focus:border-emerald-500 outline-none" 
            />
          </div>
          <button 
            type="submit"
            disabled={isCreating}
            className="w-full md:w-auto h-[46px] px-8 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
          >
            {isCreating ? 'Đang tạo...' : 'Lưu Sân Mới'}
          </button>
        </form>
      </div>

      <div>
        <h3 className="font-bold text-slate-800 mb-4">Danh sách sân đang quản lý ({pitches?.length || 0})</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* */}
          {pitches?.map((pitch, index) => (
            <div key={`${pitch.id}-${index}`} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition">
              <div className={`p-4 border-b ${pitch.status === 'ACTIVE' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-black text-slate-800 text-lg">{pitch.name}</h4>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    pitch.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {pitch.status === 'ACTIVE' ? 'Đang mở cửa' : 'Bảo trì'}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mt-1">Mã sân: #{pitch.id}</p>
              </div>

              <div className="p-4 space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Giá thuê</span>
                  <span className="font-black text-slate-800">{Number(pitch.basePrice).toLocaleString('vi-VN')} ₫</span>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleChangePrice(pitch.id, pitch.basePrice)}
                    className="flex-1 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-lg transition border border-blue-100"
                  >
                     Sửa Giá
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(pitch.id, pitch.status)}
                    className={`flex-1 py-2 font-bold text-xs rounded-lg transition border ${
                      pitch.status === 'ACTIVE' 
                        ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-100' 
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100'
                    }`}
                  >
                    {pitch.status === 'ACTIVE' ? ' Đóng bảo trì' : ' Mở cửa lại'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {(!pitches || pitches.length === 0) && (
          <div className="p-10 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl border-dashed">
            Chưa có sân bóng nào. 
          </div>
        )}
      </div>
    </div>
  );
}