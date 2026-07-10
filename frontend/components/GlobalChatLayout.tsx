"use client";

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { io } from 'socket.io-client';
import axios from 'axios';
import Link from 'next/link';

export default function GlobalChatLayout() {
  const pathname = usePathname();
  const hiddenRoutes = ['/login', '/register', '/admin'];
  const isHidden = hiddenRoutes.some(route => pathname?.startsWith(route));

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [socketInstance, setSocketInstance] = useState<any>(null);

  // 📍 TẠO MỘT BỘ NHỚ TẠM (REF) ĐỂ SOCKET BIẾT CHÍNH XÁC PHÒNG NÀO ĐANG MỞ
  const activeChatRef = useRef(activeChat);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ================= 1. HÀM CHUYỂN PHÒNG CHAT (SIÊU QUAN TRỌNG) =================
  const changeChatRoom = (newChatInfo: any) => {
    setActiveChat((prev: any) => {
      // NẾU LÀ PHÒNG MỚI HOÀN TOÀN -> XÓA TRẮNG TIN NHẮN CŨ NGAY LẬP TỨC
      if (!prev || prev.id !== newChatInfo.id) {
        setMessages([]); 
      }
      return newChatInfo;
    });
    setIsNotifOpen(false);
  };

  // ================= 2. KHỞI TẠO TỪ LOCAL STORAGE =================
  useEffect(() => {
    if (isHidden) return;
    const savedNotifs = localStorage.getItem('chat_notifications');
    if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
    
    const savedActiveChat = localStorage.getItem('active_chat_room');
    if (savedActiveChat) {
      changeChatRoom(JSON.parse(savedActiveChat));
    }
  }, [isHidden]);

  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('chat_notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // ================= 3. SOCKET LẮNG NGHE CHUNG (CHẠY 1 LẦN) =================
  useEffect(() => {
    if (isHidden) return;
    
    const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (!userIdStr) return;
    const currentUserId = parseInt(userIdStr, 10); 

    const socket = io('http://localhost:8080');
    setSocketInstance(socket);
    socket.emit('join_user_room', currentUserId);
    
    socket.on('new_challenge', (data) => {
      setNotifications(prev => {
        const newList = [{
            id: data.ChallengeId || data.challengeId,
            type: "NEW_CHALLENGE",
            teamName: data.Aname || "Một đội bóng",
            message: data.status || "Có người muốn gạ kèo",
            isSender: false,
            opponentId: data.challengerId 
        }, ...prev];
        localStorage.setItem('chat_notifications', JSON.stringify(newList));
        return newList;
      });
    });

    socket.on('challenge_accepted', (data) => {
      setActiveChat((prev: any) => {
        if (prev) {
          const updated = { ...prev, isAccepted: true };
          localStorage.setItem('active_chat_room', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });

      const challengeId = data?.ChallengeId || data?.challengeId || data?.id;
      if (challengeId) {
         setNotifications(prev => {
            const newList = [{
               id: Number(challengeId),
               type: "CHALLENGE_ACCEPTED",
               teamName: data?.TeamName || "Đối thủ", 
               message: "Đã chốt. Vào chat để chọn sân.",
               isSender: true,
               isAccepted: true 
            }, ...prev];
            localStorage.setItem('chat_notifications', JSON.stringify(newList));
            return newList;
         });
      }
    });

    // 📍 ĐIỂM ĂN TIỀN LÀ ĐÂY: CHẶN TIN NHẮN RÁC TỪ PHÒNG KHÁC!
    socket.on('receive_message', (savedMessage) => {
      const myId = parseInt(localStorage.getItem('userId') || '0', 10);
      const senderId = savedMessage.senderId || savedMessage.sender_id;
      const msgChallengeId = savedMessage.challengeId || savedMessage.challenge_id;

      const currentChat = activeChatRef.current; // Lấy phòng đang mở hiện tại

      // CHỈ HIỂN THỊ NẾU ID TIN NHẮN TRÙNG VỚI ID PHÒNG ĐANG MỞ
      if (currentChat && Number(currentChat.id) === Number(msgChallengeId)) {
        if (Number(senderId) !== myId) {
          const content = savedMessage.content || savedMessage.text || savedMessage.message;
          setMessages(prev => [...prev, { text: content, isMine: false }]);
        }
      }
    });
    
    return () => { socket.disconnect(); };
  }, [isHidden]); 

  // ================= 4. LOAD LỊCH SỬ KHI ĐỔI PHÒNG CHAT =================
  useEffect(() => {
    // Mỗi khi `activeChat.id` thay đổi, hệ thống sẽ tự động gọi API lấy chat của phòng đó
    if (activeChat && activeChat.id) {
      localStorage.setItem('active_chat_room', JSON.stringify(activeChat));
      if (socketInstance) {
        socketInstance.emit('join_challenge_room', Number(activeChat.id));
      }

      const loadHistory = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          const response = await axios.get(`http://localhost:8080/api/pk/chat-history/${activeChat.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const rawData = response.data?.data || response.data?.result || response.data || [];
          if (Array.isArray(rawData)) {
            const myId = parseInt(localStorage.getItem('userId') || '0', 10);
            const historyMessages = rawData.map((msg: any) => ({
              text: msg.content || msg.text || msg.message,
              isMine: Number(msg.senderId || msg.sender_id) === myId,
              isSystem: msg.isSystem || false
            }));
            setMessages(historyMessages);
          }
        } catch (err) {
          console.error("Không thể lấy lịch sử chat:", err);
        }
      };

      loadHistory();
    }
  }, [activeChat?.id, socketInstance]);

  // Bắt sự kiện bấm nút Chat từ các giao diện bên ngoài
  useEffect(() => {
    const handleOpenChatEvent = (e: any) => changeChatRoom(e.detail);
    window.addEventListener('OPEN_GLOBAL_CHAT', handleOpenChatEvent);
    return () => window.removeEventListener('OPEN_GLOBAL_CHAT', handleOpenChatEvent);
  }, []);

  if (isHidden) return null;

  // ================= CÁC HÀM NÚT BẤM =================
  const closeAndClearChat = () => {
    setActiveChat(null);
    setMessages([]);
    localStorage.removeItem('active_chat_room'); 
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('chat_notifications');
  };

  const handleAccept = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:8080/api/pk/accept`, {
        challengeIdC: Number(activeChat.id), challengerIdC: Number(activeChat.opponentId)
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setActiveChat((prev: any) => {
        const updated = { ...prev, isAccepted: true };
        localStorage.setItem('active_chat_room', JSON.stringify(updated));
        return updated;
      });
      setNotifications(prev => {
        const updatedList = prev.map(n => n.id === activeChat.id ? { ...n, isAccepted: true } : n);
        localStorage.setItem('chat_notifications', JSON.stringify(updatedList));
        return updatedList;
      });

      setMessages(prev => [...prev, { text: "đã nhận kèo", isMine: false, isSystem: true }]);
    } catch {
      setMessages(prev => [...prev, { text: "lỗi hệ thống", isMine: false, isSystem: true }]);
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !socketInstance || !activeChat) return;
    const currentUserId = parseInt(localStorage.getItem('userId') || '0', 10);

    socketInstance.emit('send_message', {
      challengeId: activeChat.id,
      senderId: currentUserId,
      content: chatMessage
    });

    setMessages(prev => [...prev, { text: chatMessage, isMine: true }]);
    setChatMessage(""); 
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[9999]">
        <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative p-4 bg-white shadow-2xl rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition">
          <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          {notifications.length > 0 && <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white"></span>}
        </button>

        {isNotifOpen && (
          <div className="absolute bottom-16 right-0 mb-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in origin-bottom-right">
            <div className="bg-slate-50 border-b p-3 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Thông báo</h3>
              <button onClick={clearAllNotifications} className="text-xs text-slate-400 hover:text-red-500 font-bold">Xóa hết</button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 font-medium">Không có thông báo nào.</div>
              ) : (
                notifications.map(notif => (
                  // 📍 GỌI HÀM changeChatRoom KHI BẤM VÀO THÔNG BÁO CHAT
                  <div key={notif.id} onClick={() => changeChatRoom(notif)} className="p-4 border-b hover:bg-slate-50 cursor-pointer transition flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-lg">⚽</div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{notif.isSender ? 'Hệ thống:' : 'Thách đấu:'} {notif.teamName}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{notif.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {activeChat && (
        <div className="fixed bottom-6 right-24 mr-2 w-80 bg-white shadow-2xl border border-slate-200 z-[9999] rounded-t-xl rounded-b-md flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="bg-[#0f172a] p-3 text-white flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">{activeChat.isAccepted ? "ĐÃ CHỐT KÈO" : "ĐANG CÁP KÈO"}</p>
              <h4 className="text-sm font-black">{activeChat.teamName || 'Đối thủ'}</h4>
            </div>
            <button onClick={closeAndClearChat} className="text-slate-400 hover:text-white p-1 text-lg font-bold">✕</button>
          </div>

          <div className="h-64 bg-[#f8fafc] p-4 overflow-y-auto flex flex-col gap-3">
             {messages.map((msg, idx) => (
                <div key={idx} className={`max-w-[85%] p-2.5 rounded-xl text-[12px] shadow-sm flex flex-col
                  ${msg.isSystem 
                    ? 'mx-auto bg-amber-100 text-amber-800 font-bold border border-amber-200 text-center text-[11px]' 
                    : msg.isMine ? 'bg-emerald-100 text-emerald-900 self-end rounded-tr-sm' : 'bg-white border border-slate-300 text-slate-900 self-start rounded-tl-sm'
                  }`}>
                  {msg.text}
                </div>
             ))}
             <div ref={messagesEndRef} />
          </div>

          <div className="p-2 border-t flex gap-2 bg-white items-center">
            <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Nhắn tin..." className="flex-1 text-sm text-slate-900 border border-slate-300 rounded-full px-4 py-2 focus:outline-none focus:border-emerald-500 placeholder:text-slate-400 transition" />
            <button onClick={handleSendMessage} className="bg-emerald-600 text-white rounded-full p-2 hover:bg-emerald-700 transition flex items-center justify-center w-10 h-10 shadow-sm font-bold">➤</button>
          </div>

          {!activeChat.isAccepted && (
            <div className="bg-slate-50 p-2 flex gap-2 border-t">
              {activeChat.isSender ? (
                <button className="flex-1 bg-red-100 text-red-700 text-[11px] font-bold py-2.5 rounded uppercase tracking-wide cursor-not-allowed">Đang chờ phản hồi...</button>
              ) : (
                <>
                  <button className="flex-1 bg-slate-200 text-slate-700 hover:bg-slate-300 transition text-[11px] font-bold py-2.5 rounded uppercase tracking-wide">Từ Chối</button>
                  <button onClick={handleAccept} className="flex-1 bg-amber-500 hover:bg-amber-600 transition text-white text-[11px] font-bold py-2.5 rounded uppercase tracking-wide shadow-sm">Chấp nhận</button>
                </>
              )}
            </div>
          )}

          {activeChat.isAccepted && (
            <div className="bg-slate-50 p-2 flex gap-2 border-t border-slate-200">
               <Link 
                 href={`/pitch2p/${activeChat.id}`} 
                 onClick={() => setIsNotifOpen(false)} 
                 className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded transition uppercase tracking-wide shadow-sm flex items-center justify-center gap-2"
               >
                 <span></span> chọn sân/thanh toán/nhập tỉ số
               </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}