import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import HostScreen from "./components/HostScreen";
import PlayerScreen from "./components/PlayerScreen";
import QuizEditor from "./components/QuizEditor";
import { socket } from "./services/socket";

export default function App() {
  const [currentView, setCurrentView] = useState("home"); // home, host, player, editor
  const [roomData, setRoomData] = useState(null);
  const [playerData, setPlayerData] = useState(null);

  useEffect(() => {
    // Khi Host tạo phòng thành công
    socket.on("room_created", (data) => {
      setRoomData(data);
      setCurrentView("host");
    });

    // Khi Player tham gia phòng thành công
    socket.on("join_success", (data) => {
      setPlayerData(data);
      setCurrentView("player");
    });

    // Khi có lỗi tham gia
    socket.on("join_error", ({ message }) => {
      alert(message || "Không thể tham gia phòng!");
    });

    return () => {
      socket.off("room_created");
      socket.off("join_success");
      socket.off("join_error");
    };
  }, []);

  const handleJoinGame = ({ pin, nickname, avatar }) => {
    socket.emit("join_room", { pin, nickname, avatar });
  };

  const handleHostGame = (quizId) => {
    socket.emit("create_room", { quizId });
  };

  const handleLeaveToHome = () => {
    setRoomData(null);
    setPlayerData(null);
    setCurrentView("home");
    // Xóa param query trên URL nếu có
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Ẩn Navbar khi đang trong chế độ chơi Host màn hình lớn hoặc Player màn hình nhỏ để tăng diện tích hiển thị */}
      {currentView !== "host" && currentView !== "player" && (
        <Navbar currentView={currentView} setView={setCurrentView} />
      )}

      <main className="flex-1 flex flex-col">
        {currentView === "home" && (
          <Home
            onJoinGame={handleJoinGame}
            onHostGame={handleHostGame}
            onOpenEditor={() => setCurrentView("editor")}
          />
        )}

        {currentView === "host" && (
          <HostScreen
            roomData={roomData}
            socket={socket}
            onLeave={handleLeaveToHome}
          />
        )}

        {currentView === "player" && (
          <PlayerScreen
            playerData={playerData}
            socket={socket}
            onLeave={handleLeaveToHome}
          />
        )}

        {currentView === "editor" && (
          <QuizEditor
            onBack={() => setCurrentView("home")}
            onSaved={() => setCurrentView("home")}
          />
        )}
      </main>
    </div>
  );
}
