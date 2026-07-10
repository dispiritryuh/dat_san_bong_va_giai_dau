"use client";

import { useState, useEffect } from 'react';
import { getRevenueApi, getAllPitchesApi } from '../../service/admin.service';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function AdminDashboardPage() {
  const [fromDate, setFromDate] = useState('');
  const [inDate, setInDate] = useState('');
  const [filterType, setFilterType] = useState<'hour' | 'day' | 'month'>('day');
  
  const [loading, setLoading] = useState(false);
  const [revenueData, setRevenueData] = useState({ totalRevenue: 0, chartData: [] });

  const [pitchStats, setPitchStats] = useState({ active: 0, total: 0 });
  const [totalBookings, setTotalBookings] = useState(0);

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const firstDayStr = firstDay.toISOString().split('T')[0];
    
    setInDate(todayStr); 
    setFromDate(firstDayStr);

    const initDashboardData = async () => {
      setLoading(true);
      try {
        const resPitch = await getAllPitchesApi();
        let pitchArray = [];
        if (Array.isArray(resPitch)) pitchArray = resPitch;
        else if (resPitch?.data && Array.isArray(resPitch.data)) pitchArray = resPitch.data;
        else if (resPitch?.result?.data && Array.isArray(resPitch.result.data)) pitchArray = resPitch.result.data;

        setPitchStats({
          active: pitchArray.filter((p: any) => p.status === 'ACTIVE').length,
          total: pitchArray.length
        });

        const response = await getRevenueApi(firstDayStr, todayStr, 'day');
        const actualData = response?.result?.data || response?.result || response?.data || response?.metadata || response;
        
        // 📍 BÓC LỚP VỎ revenueData ĐỂ LẤY LÕI
        const finalData = actualData?.revenueData || actualData;

        setRevenueData({
          totalRevenue: finalData?.totalRevenue || 0,
          chartData: finalData?.chartData || [] 
        });
        setTotalBookings(finalData?.totalBookings || finalData?.totalOrders || actualData?.totalBookings || 0);

      } catch (error) {
        console.error("Lỗi khởi tạo dữ liệu Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    initDashboardData();
  }, []);

  const handleFetchRevenue = async () => {
    if (!fromDate || !inDate) {
      alert("Chọn ngày bắt đầu và kết thúc");
      return;
    }

    setLoading(true);
    try {
      const response = await getRevenueApi(fromDate, inDate, filterType);
      const actualData = response?.result?.data || response?.result || response?.data || response?.metadata || response;
      
      // 📍 BÓC LỚP VỎ revenueData ĐỂ LẤY LÕI
      const finalData = actualData?.revenueData || actualData;

      setRevenueData({
        totalRevenue: finalData?.totalRevenue || 0,
        chartData: finalData?.chartData || [] 
      });
      setTotalBookings(finalData?.totalBookings || finalData?.totalOrders || actualData?.totalBookings || 0);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800 uppercase">Báo cáo Doanh Thu</h2>
        <p className="text-sm text-slate-500">.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Từ ngày</label>
          <input 
            type="date" 
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-slate-300 rounded p-2 text-sm text-slate-900 font-bold focus:ring-emerald-500 focus:border-emerald-500 outline-none" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Đến ngày</label>
          <input 
            type="date" 
            value={inDate}
            onChange={(e) => setInDate(e.target.value)}
            className="border border-slate-300 rounded p-2 text-sm text-slate-900 font-bold focus:ring-emerald-500 focus:border-emerald-500 outline-none" 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kiểu nhóm</label>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="border border-slate-300 rounded p-2 text-sm text-slate-900 font-bold focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer outline-none"
          >
            <option value="hour">Theo Giờ</option>
            <option value="day">Theo Ngày</option>
            <option value="month">Theo Tháng</option>
          </select>
        </div>
        <button 
          onClick={handleFetchRevenue}
          disabled={loading}
          className="bg-emerald-600 text-white font-bold px-6 py-2 rounded shadow-sm hover:bg-emerald-700 disabled:bg-slate-400 transition"
        >
          {loading ? 'Đang lọc...' : 'Lọc dữ liệu'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 border-l-4 border-l-emerald-500">
          <p className="text-xs font-bold text-slate-400 uppercase">Tổng Doanh Thu</p>
          <p className="text-3xl font-black text-emerald-600 mt-2">
            {Number(revenueData.totalRevenue || 0).toLocaleString('vi-VN')} <span className="text-sm text-slate-500">VND</span>
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 border-l-4 border-l-blue-500">
          <p className="text-xs font-bold text-slate-400 uppercase">Sân đang hoạt động</p>
          <p className="text-3xl font-black text-slate-800 mt-2">
            {pitchStats.active}/{pitchStats.total} <span className="text-sm text-slate-500">sân</span>
          </p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[450px] flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Biểu đồ tăng trưởng doanh thu</h3>
        
        {revenueData.chartData && revenueData.chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData.chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${value}`} dx={-10} />
              <Tooltip 
                cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '3 3' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')} VND`, 'Doanh thu']}
                labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-slate-400">
            <p className="font-medium text-slate-500">Chưa có dữ liệu giao dịch trong khoảng thời gian này</p>
            <p className="text-sm mt-1">Hãy thử chọn mốc thời gian khác</p>
          </div>
        )}
      </div>
    </div>
  );
}