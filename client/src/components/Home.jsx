import React, { useState, useEffect } from "react";
import { Play, PlusCircle, Flame, Zap, FileSpreadsheet, Users } from "lucide-react";

const AVATARS = ["🐱", "🐶", "🦊", "🦁", "🐼", "🚀", "🦄", "⚡"];

export default function Home({ onJoinGame, onHostGame, onOpenEditor }) {
  const [pin, setPin] = useState("");
  const [nickname, setNickname] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [step, setStep] = useState("PIN"); // "PIN" hoặc "NICKNAME"
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pinParam = urlParams.get("pin");
    if (pinParam) {
      setPin(pinParam);
      setStep("NICKNAME");
    }

    fetch(`${backendUrl}/api/quizzes`)
      .then((res) => res.json())
      .then((data) => {
        setQuizzes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi tải quizzes:", err);
        setLoading(false);
      });
  }, [backendUrl]);

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
    <div className="min-h-[calc(100vh-4rem)] bg-[#46178f] flex flex-col justify-between py-8 px-4 sm:px-6">
      {/* 1. MÀN HÌNH NHẬP PIN THỰC TẾ CHUẨN KAHOOT.IT */}
      <div className="w-full max-w-sm mx-auto my-auto flex flex-col items-center">
        {/* Kahoot Logo */}
        <div className="mb-6 text-center select-none">
          <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-[0_4px_0_rgba(0,0,0,0.25)]">
            Class<span className="text-[#ffa602]">Play</span>
            <span className="text-[#e21b3c]">!</span>
          </h1>
        </div>

        {/* Card trắng nhập PIN / Nickname phong cách kahoot.it */}
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

        <p className="mt-4 text-xs font-bold text-white/80 text-center">
          Tạo tài khoản hoặc mở phòng chơi bên dưới nếu bạn là Giáo viên / Host
        </p>
      </div>

      {/* 2. KHU VỰC DÀNH CHO GIÁO VIÊN / HOST (Bên dưới) */}
      <div className="max-w-6xl mx-auto w-full mt-16 pt-8 border-t-2 border-white/10 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-[#ffa602]" />
              Dành cho Giáo viên & Người tổ chức (Host)
            </h2>
            <p className="text-purple-200 text-sm mt-0.5">
              Chọn bộ đề có sẵn bên dưới hoặc tự soạn đề mới để mở phòng chiếu cho cả lớp tham gia.
            </p>
          </div>

          <button
            onClick={onOpenEditor}
            className="px-5 py-2.5 rounded-lg font-black text-sm uppercase tracking-wider flex items-center gap-2 btn-kahoot-white self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4 stroke-[3]" />
            Tạo đề thi mới
          </button>
        </div>

        {/* Danh sách các bộ Quiz có sẵn */}
        {loading ? (
          <div className="text-center py-10 font-bold text-white/70">
            Đang tải danh sách câu hỏi...
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-10 font-bold text-white/70">
            Chưa có bộ câu hỏi nào. Hãy bấm "Tạo đề thi mới" để bắt đầu!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white rounded-lg overflow-hidden shadow-lg flex flex-col justify-between border-b-4 border-gray-300"
              >
                <div className="relative h-40 bg-gray-200 overflow-hidden">
                  <img
                    src={quiz.coverImage}
                    alt={quiz.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded bg-black/75 text-white font-black text-xs">
                    {quiz.questions?.length || 0} câu hỏi
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 line-clamp-1">
                      {quiz.title}
                    </h3>
                    <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                      {quiz.description || "Bộ câu hỏi trắc nghiệm tương tác."}
                    </p>
                  </div>

                  <button
                    onClick={() => onHostGame(quiz.id)}
                    className="w-full py-3 rounded font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 btn-kahoot-green"
                  >
                    <Play className="w-4 h-4 fill-white stroke-[2]" />
                    Mở phòng Host
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tính năng mới cải tiến > 30% */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <span className="text-purple-200">Báo cáo điểm số cả lớp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
