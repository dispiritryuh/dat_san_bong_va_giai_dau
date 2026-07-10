'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerApi } from '../../service/auth.service'; 

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Mật khẩu nhập không khớp');
      return;
    }

    setLoading(true);
    try {
      await registerApi({ username, email, password });
      
      alert('Tạo tài khoản thành công!');
      router.push('/login'); 
    } catch (error: any) {
      alert(error.message || 'Đăng ký thất bại, tên tài khoản hoặc email có thể đã tồn tại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-slate-50 px-4 font-sans selection:bg-emerald-200 selection:text-emerald-900">
      
      {}
      <form 
        onSubmit={handleRegister} 
        className="relative bg-white p-8 md:p-10 rounded-2xl border border-slate-200 w-full max-w-md z-10 shadow-[0_10px_40px_rgba(0,0,0,0.05)] my-8"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-3xl font-black tracking-tight uppercase mb-2">
            <span className="text-slate-900">Match</span>
            <span className="text-emerald-500">Finder</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-700">
            
          </h2>
          <p className="text-sm text-slate-500 mt-1"></p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Tên đăng nhập</label>
            <input 
              type="text" 
              placeholder="......." 
              className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Địa chỉ Email</label>
            <input 
              type="email" 
              placeholder="......." 
              className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Mật khẩu</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Nhập lại mật khẩu</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-bold uppercase p-3.5 rounded-xl hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 transition-all shadow-md mt-4"
          >
            {loading ? 'ĐANG TẠO HỒ SƠ...' : 'ĐĂNG KÝ NGAY'}
          </button>
        </div>

        {/*điều hướng */}
        <div className="mt-8 text-center text-sm text-slate-500 border-t border-slate-100 pt-6">
          Đã có tài khoản rồi?{' '}
          <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
        
        <div className="mt-4 text-center text-sm">
          <Link href="/" className="text-slate-400 hover:text-slate-600 transition-colors">
            ← Quay lại trang chủ
          </Link>
        </div>
      </form>
    </div>
  );
}