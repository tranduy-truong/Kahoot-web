import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GameManager } from "./gameManager.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "data", "quizzes.json");
const USERS_FILE = path.join(__dirname, "data", "users.json");

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Helper đọc/ghi Quizzes
function readQuizzes() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("Lỗi đọc quizzes.json:", err);
  }
  return [];
}

function saveQuizzes(quizzes) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(quizzes, null, 2), "utf-8");
  } catch (err) {
    console.error("Lỗi ghi quizzes.json:", err);
  }
}

// Helper đọc/ghi Users
function readUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("Lỗi đọc users.json:", err);
  }
  return [];
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Lỗi ghi users.json:", err);
  }
}

let quizzes = readQuizzes();
let matchHistory = []; // Lưu lịch sử các phòng đã kết thúc để Admin xem lại

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const gameManager = new GameManager(io);

// === AUTHENTICATION APIS ===

// Đăng nhập giáo viên
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Email hoặc mật khẩu không chính xác!" });
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
});

// Đăng ký tài khoản giáo viên mới
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin!" });
  }

  const users = readUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "Email này đã được đăng ký trong hệ thống!" });
  }

  const newUser = {
    id: `user_${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password.trim(),
    role: "TEACHER",
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  res.status(201).json({
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role
  });
});

// === QUIZ MANAGEMENT APIS ===

// Lấy danh sách câu hỏi
app.get("/api/quizzes", (req, res) => {
  quizzes = readQuizzes();
  res.json(quizzes);
});

// Lấy chi tiết 1 quiz
app.get("/api/quizzes/:id", (req, res) => {
  quizzes = readQuizzes();
  const quiz = quizzes.find((q) => q.id === req.params.id);
  if (!quiz) return res.status(404).json({ error: "Không tìm thấy bộ đề!" });
  res.json(quiz);
});

// Tạo mới quiz
app.post("/api/quizzes", (req, res) => {
  quizzes = readQuizzes();
  const newQuiz = {
    id: `quiz_${Date.now()}`,
    title: req.body.title || "Bộ câu hỏi mới",
    description: req.body.description || "",
    coverImage:
      req.body.coverImage ||
      "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600&auto=format&fit=crop&q=80",
    questions: req.body.questions || []
  };
  quizzes.unshift(newQuiz);
  saveQuizzes(quizzes);
  res.status(201).json(newQuiz);
});

// Cập nhật quiz cũ
app.put("/api/quizzes/:id", (req, res) => {
  quizzes = readQuizzes();
  const index = quizzes.findIndex((q) => q.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Không tìm thấy bộ đề để cập nhật!" });

  quizzes[index] = {
    ...quizzes[index],
    title: req.body.title || quizzes[index].title,
    description: req.body.description || quizzes[index].description,
    coverImage: req.body.coverImage || quizzes[index].coverImage,
    questions: req.body.questions || quizzes[index].questions
  };
  saveQuizzes(quizzes);
  res.json(quizzes[index]);
});

// Xóa quiz
app.delete("/api/quizzes/:id", (req, res) => {
  quizzes = readQuizzes();
  quizzes = quizzes.filter((q) => q.id !== req.params.id);
  saveQuizzes(quizzes);
  res.json({ message: "Đã xóa bộ đề thành công!" });
});

// === ADMIN STATS & HISTORY APIS ===

app.get("/api/admin/stats", (req, res) => {
  quizzes = readQuizzes();
  const totalQuestions = quizzes.reduce((acc, q) => acc + (q.questions?.length || 0), 0);
  res.json({
    totalQuizzes: quizzes.length,
    totalQuestions,
    totalMatches: matchHistory.length
  });
});

app.get("/api/admin/history", (req, res) => {
  res.json(matchHistory);
});

// Xuất file Excel báo cáo trận đấu
app.get("/api/reports/:pin/export", (req, res) => {
  const { pin } = req.params;
  const buffer = gameManager.exportExcelReport(pin);
  if (!buffer) {
    return res.status(404).json({ error: "Không tìm thấy dữ liệu trận đấu hoặc phòng chưa kết thúc!" });
  }

  res.setHeader("Content-Disposition", `attachment; filename=Bao_Cao_Kahoot_Room_${pin}.xlsx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
});

// === SOCKET.IO EVENTS ===
io.on("connection", (socket) => {
  socket.on("create_room", ({ quizId }) => {
    quizzes = readQuizzes();
    const quiz = quizzes.find((q) => q.id === quizId) || quizzes[0];
    const room = gameManager.createRoom(socket.id, quiz);
    socket.join(room.pin);

    socket.emit("room_created", {
      pin: room.pin,
      quizTitle: quiz.title,
      totalQuestions: quiz.questions.length,
      coverImage: quiz.coverImage
    });
  });

  socket.on("join_room", ({ pin, nickname, avatar }) => {
    const result = gameManager.addPlayer(pin, socket.id, nickname, avatar);
    if (result.error) {
      return socket.emit("join_error", { message: result.error });
    }

    socket.join(pin);
    socket.emit("join_success", {
      pin,
      player: result.player,
      quizTitle: result.room.quiz.title
    });

    io.to(result.room.hostSocketId).emit("player_joined", {
      player: result.player,
      players: Array.from(result.room.players.values())
    });
  });

  socket.on("start_quiz", ({ pin }) => {
    gameManager.startQuiz(pin);
  });

  socket.on("submit_answer", ({ optionId, usedDouble }) => {
    gameManager.submitAnswer(socket.id, optionId, usedDouble);
  });

  socket.on("use_fifty_fifty", () => {
    gameManager.useFiftyFifty(socket.id);
  });

  socket.on("send_reaction", ({ emoji }) => {
    gameManager.handleReaction(socket.id, emoji);
  });

  socket.on("show_leaderboard", ({ pin }) => {
    gameManager.showLeaderboard(pin);
  });

  socket.on("next_question", ({ pin }) => {
    gameManager.nextQuestion(pin);

    // Khi game kết thúc -> Ghi lại lịch sử trận đấu cho Admin
    const room = gameManager.getRoom(pin);
    if (room && room.status === "GAME_OVER") {
      matchHistory.unshift({
        pin: room.pin,
        quizTitle: room.quiz.title,
        playerCount: room.players.size,
        endedAt: new Date().toISOString()
      });
    }
  });

  socket.on("disconnect", () => {
    gameManager.removePlayer(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Kahoot Clone Realtime Server running on http://localhost:${PORT}`);
});
