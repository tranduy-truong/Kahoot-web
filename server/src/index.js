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

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Helper đọc và ghi quizzes từ file JSON bền vững
function readQuizzes() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Lỗi đọc file quizzes.json:", err);
  }
  return [];
}

function saveQuizzes(quizzes) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(quizzes, null, 2), "utf-8");
  } catch (err) {
    console.error("Lỗi ghi file quizzes.json:", err);
  }
}

let quizzes = readQuizzes();

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const gameManager = new GameManager(io);

// === REST APIs ===

// Lấy danh sách câu hỏi
app.get("/api/quizzes", (req, res) => {
  quizzes = readQuizzes();
  res.json(quizzes);
});

// Lấy chi tiết 1 quiz
app.get("/api/quizzes/:id", (req, res) => {
  quizzes = readQuizzes();
  const quiz = quizzes.find((q) => q.id === req.params.id);
  if (!quiz) return res.status(404).json({ error: "Quiz not found" });
  res.json(quiz);
});

// Tạo hoặc cập nhật quiz mới -> Lưu vĩnh viễn vào file JSON
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

// Xuất file Excel báo cáo trận đấu (>30% tính năng mới cho giáo viên)
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
  });

  socket.on("disconnect", () => {
    gameManager.removePlayer(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Kahoot Clone Realtime Server running on http://localhost:${PORT}`);
});
