import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { defaultQuizzes } from "./data/defaultQuizzes.js";
import { GameManager } from "./gameManager.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// In-memory Quizzes store
let quizzes = [...defaultQuizzes];

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
  res.json(quizzes);
});

// Lấy chi tiết 1 quiz
app.get("/api/quizzes/:id", (req, res) => {
  const quiz = quizzes.find(q => q.id === req.params.id);
  if (!quiz) return res.status(404).json({ error: "Quiz not found" });
  res.json(quiz);
});

// Tạo hoặc cập nhật quiz mới
app.post("/api/quizzes", (req, res) => {
  const newQuiz = {
    id: `quiz_${Date.now()}`,
    title: req.body.title || "Bộ câu hỏi mới",
    description: req.body.description || "",
    coverImage: req.body.coverImage || "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600&auto=format&fit=crop&q=80",
    questions: req.body.questions || []
  };
  quizzes.unshift(newQuiz);
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
  // Host tạo phòng
  socket.on("create_room", ({ quizId }) => {
    const quiz = quizzes.find(q => q.id === quizId) || quizzes[0];
    const room = gameManager.createRoom(socket.id, quiz);
    socket.join(room.pin);

    socket.emit("room_created", {
      pin: room.pin,
      quizTitle: quiz.title,
      totalQuestions: quiz.questions.length,
      coverImage: quiz.coverImage
    });
  });

  // Player tham gia phòng
  socket.on("join_room", ({ pin, nickname, avatar }) => {
    const result = gameManager.addPlayer(pin, socket.id, nickname, avatar);
    if (result.error) {
      return socket.emit("join_error", { message: result.error });
    }

    socket.join(pin);
    // Báo cho chính player tham gia thành công
    socket.emit("join_success", {
      pin,
      player: result.player,
      quizTitle: result.room.quiz.title
    });

    // Báo cho Host danh sách player cập nhật
    io.to(result.room.hostSocketId).emit("player_joined", {
      player: result.player,
      players: Array.from(result.room.players.values())
    });
  });

  // Host bắt đầu game
  socket.on("start_quiz", ({ pin }) => {
    gameManager.startQuiz(pin);
  });

  // Player submit câu trả lời
  socket.on("submit_answer", ({ optionId, usedDouble }) => {
    gameManager.submitAnswer(socket.id, optionId, usedDouble);
  });

  // Player dùng trợ giúp 50:50
  socket.on("use_fifty_fifty", () => {
    gameManager.useFiftyFifty(socket.id);
  });

  // Player thả biểu cảm reaction
  socket.on("send_reaction", ({ emoji }) => {
    gameManager.handleReaction(socket.id, emoji);
  });

  // Host mở bảng xếp hạng
  socket.on("show_leaderboard", ({ pin }) => {
    gameManager.showLeaderboard(pin);
  });

  // Host chuyển sang câu tiếp theo
  socket.on("next_question", ({ pin }) => {
    gameManager.nextQuestion(pin);
  });

  // Xử lý ngắt kết nối
  socket.on("disconnect", () => {
    gameManager.removePlayer(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Kahoot Clone Realtime Server running on http://localhost:${PORT}`);
});
