import React, { useState, useEffect } from "react";
import { ArrowRight, Flame, Zap, FileSpreadsheet, BookOpen, LogIn } from "lucide-react";

const AVATARS = ["🐱", "🐶", "🦊", "🦁", "🐼", "🚀", "🦄", "⚡"];

export default function Home({ onJoinGame, onOpenMyQuizzes, onOpenLogin, currentUser }) {
  const [pin, setPin] = useState("");
  const [nickname, setNickname] = useState(currentUser?.name || "");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [step, setStep] = useState("PIN");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (currentUser?.name) {
      setNickname(currentUser.name);
    }
  }, [currentUser]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pinParam = urlParams.get("pin");
    if (pinParam) {
      setPin(pinParam);
      setStep("NICKNAME");
    }
  }, []);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg("Vui lòng nhập mã PIN trò chơi!");
      return;
    }
    setErrorMsg("");
    setStep("NICKNAME");
  };

  const handleJoinFinal = (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setErrorMsg("Vui lòng nhập biệt danh của bạn!");
      return;
    }
    setErrorMsg("");
    onJoinGame({ pin: pin.trim(), nickname: nickname.trim(), avatar: selectedAvatar });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#46178f] flex flex-col justify-between py-10 px-4 sm:px-6">
      {/* 1. MÀN HÌNH NHẬP PIN THỰC TẾ CHUẨN KAHOOT.IT */}
      <div className="w-full max-w-sm mx-auto my-auto flex flex-col items-center">
        <div className="mb-6 text-center select-none">
          <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-[0_4px_0_rgba(0,0,0,0.25)]">
            Class<span className="text-[#ffa602]">Play</span>
            <span className="text-[#e21b3c]">!</span>
          </h1>
        </div>

        <div className="w-full bg-white rounded-lg p-6 shadow-2xl">
          {errorMsg && (
            <div className="mb-4 p-2.5 rounded bg-red-100 border border-red-300 text-red-700 text-sm font-bold text-center">
              {errorMsg}
            </div>
          )}

          {step === "PIN" ? (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Mã PIN trò chơi"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={6}
                  autoFocus
                  className="w-full h-12 bg-white border-2 border-gray-300 rounded font-black text-center text-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-800 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded font-black text-base uppercase tracking-wider btn-kahoot-black"
              >
                Tham gia
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinFinal} className="space-y-4">
              <div className="text-center text-xs font-black uppercase text-gray-500 mb-1">
                MÃ PIN: <span className="text-gray-900 font-extrabold">{pin}</span>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Nhập tên biệt danh"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={20}
                  autoFocus
                  className="w-full h-12 bg-white border-2 border-gray-300 rounded font-black text-center text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-800 transition-colors"
                />
              </div>

              {/* Chọn Avatar */}
              <div>
                <div className="text-xs font-bold text-gray-500 mb-2 text-center">
                  Chọn biểu tượng đại diện:
                </div>
                <div className="flex justify-center gap-1.5 flex-wrap">
                  {AVATARS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-9 h-9 text-lg rounded flex items-center justify-center transition-all ${
                        selectedAvatar === av
                          ? "bg-[#46178f] text-white scale-110 shadow"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep("PIN")}
                  className="w-1/3 h-12 rounded font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200"
                >
                  Đổi PIN
                </button>
                <button
                  type="submit"
                  className="w-2/3 h-12 rounded font-black text-base uppercase tracking-wider btn-kahoot-green"
                >
                  OK, Bắt đầu!
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Thông tin đăng nhập / Trạng thái */}
        {currentUser ? (
          <div className="mt-4 text-center space-y-2">
            <p className="text-xs font-bold text-white/90">
              Đang đăng nhập: <span className="text-[#ffa602] font-black">{currentUser.name}</span>
            </p>
            <button
              onClick={onOpenMyQuizzes}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-gray-900 font-black text-xs uppercase tracking-wider hover:bg-gray-100 shadow"
            >
              <BookOpen className="w-4 h-4 text-[#46178f]" />
              Xem câu hỏi của tôi
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="mt-5 text-center bg-black/20 p-3.5 rounded-xl border border-white/10 max-w-xs">
            <p className="text-xs text-purple-200 font-bold mb-2">
              Bạn muốn tự tạo và quản lý ngân hàng câu hỏi của mình?
            </p>
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-gray-900 font-black text-xs uppercase tracking-wider hover:bg-gray-100"
            >
              <LogIn className="w-3.5 h-3.5 text-[#46178f]" />
              Đăng nhập ngay
            </button>
          </div>
        )}
      </div>

      {/* 2. BANNER GIỚI THIỆU TÍNH NĂNG Ở ĐÁY */}
      <div className="max-w-4xl mx-auto w-full mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
        <div className="bg-[#381072] border border-[#521da7] rounded-lg p-3 flex items-center gap-3">
          <Flame className="w-6 h-6 text-[#ffa602] shrink-0" />
          <div className="text-xs">
            <span className="font-black text-white block">Streak Combo</span>
            <span className="text-purple-200">Đúng liên tiếp nhân thêm điểm</span>
          </div>
        </div>

        <div className="bg-[#381072] border border-[#521da7] rounded-lg p-3 flex items-center gap-3">
          <Zap className="w-6 h-6 text-[#1368ce] shrink-0" />
          <div className="text-xs">
            <span className="font-black text-white block">Thẻ Trợ Giúp</span>
            <span className="text-purple-200">50:50 & x2 Điểm</span>
          </div>
        </div>

        <div className="bg-[#381072] border border-[#521da7] rounded-lg p-3 flex items-center gap-3">
          <FileSpreadsheet className="w-6 h-6 text-[#26890c] shrink-0" />
          <div className="text-xs">
            <span className="font-black text-white block">Xuất File Excel</span>
            <span className="text-purple-200">Báo cáo kết quả chi tiết</span>
          </div>
        </div>
      </div>
    </div>
  );
}
