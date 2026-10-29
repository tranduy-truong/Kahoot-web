import React from "react";
import { PlusCircle, User, LogOut, ShieldCheck, LogIn } from "lucide-react";

export default function Navbar({ currentView, setView, currentUser, onOpenLogin, onLogout }) {
  return (
    <header className="bg-[#381072] border-b-2 border-[#2b085a] shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo Kahoot Style */}
        <div
          onClick={() => setView("home")}
          className="flex items-center gap-1 cursor-pointer select-none group"
        >
          <span className="text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.3)]">
            Class<span className="text-[#ffa602]">Play</span>
          </span>
          <span className="text-3xl font-black text-[#e21b3c] animate-bounce">!</span>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("home")}
            className={`px-3.5 py-2 rounded-lg font-black text-xs uppercase tracking-wider btn-kahoot-3d ${
              currentView === "home"
                ? "bg-white text-[#333333] shadow-[0_4px_0_#cccccc]"
                : "bg-[#46178f] text-white hover:bg-[#521da7] shadow-[0_4px_0_#2b085a]"
            }`}
          >
            Vào chơi (PIN)
          </button>

          {/* Nếu là giáo viên đã đăng nhập -> Hiện nút Quản trị & Tạo Quiz */}
          {currentUser ? (
            <>
              <button
                onClick={() => setView("admin")}
                className={`px-3.5 py-2 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-1.5 btn-kahoot-3d ${
                  currentView === "admin"
                    ? "bg-white text-[#333333] shadow-[0_4px_0_#cccccc]"
                    : "bg-[#1368ce] text-white shadow-[0_4px_0_#0a4691]"
                }`}
              >
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                Quản trị
              </button>

              <button
                onClick={() => setView("editor")}
                className={`px-3.5 py-2 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-1.5 btn-kahoot-3d ${
                  currentView === "editor"
                    ? "bg-white text-[#333333] shadow-[0_4px_0_#cccccc]"
                    : "btn-kahoot-green"
                }`}
              >
                <PlusCircle className="w-4 h-4 stroke-[3]" />
                Tạo Quiz
              </button>

              {/* Thông tin giáo viên & nút Đăng xuất */}
              <div className="flex items-center gap-2 pl-2 border-l border-white/20">
                <span className="hidden md:inline font-bold text-xs text-purple-200">
                  {currentUser.name}
                </span>
                <button
                  onClick={onLogout}
                  title="Đăng xuất"
                  className="p-2 rounded-lg bg-black/20 hover:bg-black/40 text-red-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-1.5 btn-kahoot-white shadow-[0_4px_0_#cccccc]"
            >
              <LogIn className="w-4 h-4 stroke-[2.5]" />
              Đăng nhập Giáo viên
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
