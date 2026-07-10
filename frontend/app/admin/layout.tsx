"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ADMIN") {
      alert("Khu vực cấm! Sếp không có quyền vào đây!");
      router.push("/"); 
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (!isAuthorized) return <div className="p-10 text-center font-bold">Đang kiểm tra thẻ ra vào...</div>;

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      {/**/}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl">
        <div className="h-16 flex items-center justify-center border-b border-slate-700 bg-slate-950">
          <h1 className="font-black text-xl text-white uppercase tracking-wider">
            Match<span className="text-emerald-500">Admin</span>
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="block px-4 py-3 hover:bg-slate-800 font-bold rounded-lg transition">
             Tổng quan & Doanh thu
          </Link>
          <Link href="/admin/pitches" className="block px-4 py-3 hover:bg-slate-800 font-bold rounded-lg transition">
             Quản lý Sân bãi
          </Link>
          <Link href="/admin/users" className="block px-4 py-3 hover:bg-slate-800 font-bold rounded-lg transition">
             Quản lý Người dùng
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => { localStorage.clear(); router.push('/login'); }}
            className="w-full px-4 py-2 bg-red-500/10 text-red-500 font-bold rounded hover:bg-red-500/20 transition"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 justify-end shadow-sm">
          <span className="font-bold text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
            admin
          </span>
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}