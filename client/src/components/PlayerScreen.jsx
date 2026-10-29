import React, { useState, useEffect } from "react";
import { Check, X, Flame, Zap } from "lucide-react";

export default function PlayerScreen({ playerData, socket, onLeave }) {
  const [playerState, setPlayerState] = useState("LOBBY"); // LOBBY, INTRO, PLAYING, SUBMITTED, RESULT, WAITING_NEXT, GAME_OVER
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [remainingTime, setRemainingTime] = useState(15);
  const [powerUps, setPowerUps] = useState(playerData?.player?.powerUps || { fiftyFifty: 1, doublePoints: 1 });
  const [eliminatedOptions, setEliminatedOptions] = useState([]);
  const [useDoublePointsThisRound, setUseDoublePointsThisRound] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  const EMOJIS = ["❤️", "😂", "🔥", "👏", "⚡"];

  useEffect(() => {
    socket.on("question_intro", ({ questionNumber }) => {
      setPlayerState("INTRO");
      setCurrentQuestionNumber(questionNumber);
      setEliminatedOptions([]);
      setUseDoublePointsThisRound(false);
    });

    socket.on("question_start_player", ({ questionNumber, timeLimit, powerUps: pUps }) => {
      setPlayerState("PLAYING");
      setCurrentQuestionNumber(questionNumber);
      setRemainingTime(timeLimit);
      if (pUps) setPowerUps(pUps);
    });

    socket.on("timer_tick", ({ remaining }) => setRemainingTime(remaining));
    socket.on("fifty_fifty_result", ({ eliminatedOptions }) => setEliminatedOptions(eliminatedOptions));

    socket.on("question_result_player", ({ isCorrect, pointsEarned, totalScore, streak }) => {
      setPlayerState("RESULT");
      setLastResult({ isCorrect, pointsEarned });
      setTotalScore(totalScore);
      setCurrentStreak(streak);
    });

    socket.on("leaderboard_update", () => setPlayerState("WAITING_NEXT"));
    socket.on("game_over", () => setPlayerState("GAME_OVER"));
    socket.on("room_closed", ({ message }) => {
      alert(message || "Phòng chơi đã kết thúc!");
      onLeave();
    });

    return () => {
      socket.off("question_intro");
      socket.off("question_start_player");
      socket.off("timer_tick");
      socket.off("fifty_fifty_result");
      socket.off("question_result_player");
      socket.off("leaderboard_update");
      socket.off("game_over");
      socket.off("room_closed");
    };
  }, [socket, onLeave]);

  const handleSelectAnswer = (optionId) => {
    if (playerState !== "PLAYING") return;
    setPlayerState("SUBMITTED");
    socket.emit("submit_answer", { optionId, usedDouble: useDoublePointsThisRound });
  };

  const handleUseFiftyFifty = () => {
    if (powerUps.fiftyFifty > 0 && playerState === "PLAYING") {
      setPowerUps((prev) => ({ ...prev, fiftyFifty: prev.fiftyFifty - 1 }));
      socket.emit("use_fifty_fifty");
    }
  };

  const handleToggleDouble = () => {
    if (powerUps.doublePoints > 0 && playerState === "PLAYING") {
      setUseDoublePointsThisRound((prev) => !prev);
    }
  };

  const handleSendEmoji = (emoji) => {
    socket.emit("send_reaction", { emoji });
  };

  const kahootOptions = [
    { id: 0, theme: "kahoot-card-red", icon: "▲" },
    { id: 1, theme: "kahoot-card-blue", icon: "◆" },
    { id: 2, theme: "kahoot-card-yellow", icon: "●" },
    { id: 3, theme: "kahoot-card-green", icon: "■" }
  ];

  return (
    <div className="h-screen w-screen flex flex-col justify-between select-none overflow-hidden bg-[#46178f]">
      {/* Top Header mỏng hiển thị Nickname & Điểm */}
      <div className="bg-[#381072] border-b-2 border-[#2b085a] px-4 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{playerData?.player?.avatar}</span>
          <span className="font-black text-white text-base">{playerData?.player?.nickname}</span>
        </div>

        <div className="flex items-center gap-3">
          {currentStreak >= 2 && (
            <div className="flex items-center gap-1 text-xs font-black text-[#ffa602] bg-black/30 px-2 py-1 rounded">
              <Flame className="w-3.5 h-3.5 fill-[#ffa602]" />
              <span>{currentStreak}</span>
            </div>
          )}
          <div className="bg-black/30 px-3 py-1 rounded text-white font-black text-sm">
            {totalScore} <span className="text-xs text-gray-300 font-bold">pts</span>
          </div>
        </div>
      </div>

      {/* 1. MÀN HÌNH LOBBY TRÊN ĐIỆN THOẠI */}
      {playerState === "LOBBY" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-4xl shadow-xl">
            {playerData?.player?.avatar}
          </div>

          <h2 className="text-3xl font-black text-white leading-tight">
            Bạn đã vào phòng!
          </h2>
          <p className="text-purple-200 text-sm max-w-xs font-bold">
            Hãy nhìn lên bảng chiếu của Host và chờ trận đấu bắt đầu.
          </p>

          <div className="bg-black/25 px-4 py-2 rounded font-black text-white text-xs">
            MÃ PIN: <span className="text-[#ffa602] font-black">{playerData?.pin}</span>
          </div>
        </div>
      )}

      {/* 2. MÀN HÌNH CHUẨN BỊ (INTRO) */}
      {playerState === "INTRO" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-[#381072]">
          <span className="text-xs font-black uppercase text-purple-300 tracking-wider">
            CÂU HỎI {currentQuestionNumber}
          </span>
          <h2 className="text-4xl font-black text-white">Sẵn sàng!</h2>
        </div>
      )}

      {/* 3. MÀN HÌNH 4 KHỐI MÀU HUYỀN THOẠI CỦA KAHOOT (PLAYING) */}
      {playerState === "PLAYING" && (
        <div className="flex-1 flex flex-col justify-between p-3 gap-3">
          {/* Thanh công cụ trợ giúp Power-ups phía trên */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-white/80">
              Đồng hồ: <span className="text-[#ffa602] font-black text-sm">{remainingTime}s</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUseFiftyFifty}
                disabled={powerUps.fiftyFifty <= 0 || eliminatedOptions.length > 0}
                className={`px-3 py-1 rounded font-black text-xs uppercase flex items-center gap-1 ${
                  powerUps.fiftyFifty > 0 && eliminatedOptions.length === 0
                    ? "bg-white text-gray-900 shadow"
                    : "bg-white/20 text-white/40 cursor-not-allowed"
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                50:50 ({powerUps.fiftyFifty})
              </button>

              <button
                type="button"
                onClick={handleToggleDouble}
                disabled={powerUps.doublePoints <= 0}
                className={`px-3 py-1 rounded font-black text-xs uppercase flex items-center gap-1 ${
                  useDoublePointsThisRound
                    ? "bg-[#ffa602] text-gray-900 shadow scale-105"
                    : powerUps.doublePoints > 0
                    ? "bg-white text-gray-900 shadow"
                    : "bg-white/20 text-white/40 cursor-not-allowed"
                }`}
              >
                <Flame className="w-3.5 h-3.5 fill-current" />
                x2 Điểm
              </button>
            </div>
          </div>

          {/* 4 Khối màu Kahoot chiếm trọn màn hình điện thoại */}
          <div className="grid grid-cols-2 gap-3 flex-1">
            {kahootOptions.map((btn) => {
              const isEliminated = eliminatedOptions.includes(btn.id);
              return (
                <button
                  key={btn.id}
                  disabled={isEliminated}
                  onClick={() => handleSelectAnswer(btn.id)}
                  className={`w-full h-full rounded-lg flex items-center justify-center transition-all ${
                    btn.theme
                  } ${
                    isEliminated
                      ? "opacity-15 cursor-not-allowed"
                      : "active:scale-95 cursor-pointer"
                  }`}
                >
                  <span className="text-6xl text-white drop-shadow-md select-none">{btn.icon}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. MÀN HÌNH ĐÃ GỬI LỰA CHỌN (SUBMITTED) */}
      {playerState === "SUBMITTED" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-[#381072]">
          <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white animate-spin mb-2" />
          <h2 className="text-3xl font-black text-white">Đã ghi nhận!</h2>
          <p className="text-purple-200 text-sm font-bold">
            Hãy nhìn lên màn hình chiếu của Host để xem kết quả.
          </p>
        </div>
      )}

      {/* 5. MÀN HÌNH KẾT QUẢ ĐÚNG / SAI CHUẨN MÀU KAHOOT */}
      {playerState === "RESULT" && (
        <div
          className={`flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 ${
            lastResult?.isCorrect ? "bg-[#26890c]" : "bg-[#e21b3c]"
          }`}
        >
          {lastResult?.isCorrect ? (
            <>
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-xl">
                <Check className="w-14 h-14 text-[#26890c] stroke-[4]" />
              </div>
              <h2 className="text-4xl font-black text-white">Chính xác!</h2>
              <div className="text-2xl font-black text-white">+{lastResult.pointsEarned} điểm</div>
              {currentStreak >= 2 && (
                <div className="bg-black/20 px-4 py-1.5 rounded-full text-white font-black text-sm">
                  🔥 Chuỗi đúng {currentStreak} câu liên tiếp!
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-xl">
                <X className="w-14 h-14 text-[#e21b3c] stroke-[4]" />
              </div>
              <h2 className="text-4xl font-black text-white">Chưa đúng!</h2>
              <p className="text-white/90 font-bold text-sm">Hãy cố gắng ở câu tiếp theo nhé!</p>
            </>
          )}

          <div className="mt-4 bg-black/20 px-6 py-2.5 rounded-lg text-white font-black text-lg">
            Tổng điểm: {totalScore} pts
          </div>
        </div>
      )}

      {/* 6. MÀN HÌNH BẢNG XẾP HẠNG / KẾT THÚC */}
      {(playerState === "WAITING_NEXT" || playerState === "GAME_OVER") && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-[#381072]">
          <div className="text-5xl">{playerState === "GAME_OVER" ? "🏆" : "👀"}</div>
          <h2 className="text-3xl font-black text-white">
            {playerState === "GAME_OVER" ? "Trò chơi kết thúc!" : "Bảng Xếp Hạng"}
          </h2>
          <p className="text-purple-200 text-sm font-bold max-w-xs">
            Hãy nhìn lên màn hình chiếu của Host để theo dõi thứ hạng.
          </p>

          <div className="bg-white text-gray-900 px-6 py-3 rounded-lg font-black text-xl shadow">
            Điểm của bạn: <span className="text-[#46178f]">{totalScore} pts</span>
          </div>

          {playerState === "GAME_OVER" && (
            <button
              onClick={onLeave}
              className="mt-4 px-6 py-3 rounded font-black text-sm uppercase tracking-wider btn-kahoot-white"
            >
              Thoát về Trang chủ
            </button>
          )}
        </div>
      )}

      {/* Khay Emoji Reaction ở đáy màn hình */}
      <div className="bg-[#381072] border-t-2 border-[#2b085a] px-3 py-2 flex items-center justify-around">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleSendEmoji(emoji)}
            className="text-2xl p-1 hover:scale-125 active:scale-150 transition-transform"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
