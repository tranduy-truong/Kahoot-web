import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import HostScreen from "./components/HostScreen";
import PlayerScreen from "./components/PlayerScreen";
import QuizEditor from "./components/QuizEditor";
import AdminDashboard from "./components/AdminDashboard";
import LoginModal from "./components/LoginModal";
import { socket } from "./services/socket";

export default function App() {
  const [currentView, setCurrentView] = useState("home"); // home, host, player, editor, admin
  const [roomData, setRoomData] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("kahoot_teacher_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);

  useEffect(() => {
    socket.on("room_created", (data) => {
      setRoomData(data);
      setCurrentView("host");
    });

    socket.on("join_success", (data) => {
      setPlayerData(data);
      setCurrentView("player");
    });

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
    setEditingQuiz(null);
    setCurrentView("home");
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem("kahoot_teacher_user", JSON.stringify(user));

    // Phân quyền theo vai trò (Role-based Routing):
    if (user.role === "TEACHER") {
      setCurrentView("admin"); // Giáo viên vào thẳng trang Quản trị
    } else {
      setCurrentView("home");  // Học sinh ở trang chủ sẵn sàng nhập PIN
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("kahoot_teacher_user");
    setCurrentView("home");
  };

  const handleOpenEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setCurrentView("editor");
  };

  const handleOpenCreateQuiz = () => {
    setEditingQuiz(null);
    setCurrentView("editor");
  };

  return (
    <div className="min-h-screen bg-[#46178f] text-white flex flex-col font-sans select-none">
      {currentView !== "host" && currentView !== "player" && (
        <Navbar
          currentView={currentView}
          setView={setCurrentView}
          currentUser={currentUser}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
        />
      )}

      <main className="flex-1 flex flex-col">
        {currentView === "home" && (
          <Home
            onJoinGame={handleJoinGame}
            onHostGame={handleHostGame}
            onOpenEditor={handleOpenCreateQuiz}
            currentUser={currentUser}
          />
        )}

        {/* Chỉ Giáo viên mới được vào trang Admin */}
        {currentView === "admin" && currentUser?.role === "TEACHER" && (
          <AdminDashboard
            user={currentUser}
            onHostQuiz={handleHostGame}
            onEditQuiz={handleOpenEditQuiz}
            onCreateQuiz={handleOpenCreateQuiz}
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
            editQuizData={editingQuiz}
            onBack={() => setCurrentView(currentUser?.role === "TEACHER" ? "admin" : "home")}
            onSaved={() => setCurrentView(currentUser?.role === "TEACHER" ? "admin" : "home")}
          />
        )}
      </main>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
