import xlsx from "xlsx";

export class GameManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // pin -> roomObject
    this.playerSocketMap = new Map(); // socketId -> { pin, playerId }
  }

  generatePin() {
    let pin;
    do {
      pin = Math.floor(100000 + Math.random() * 900000).toString();
    } while (this.rooms.has(pin));
    return pin;
  }

  createRoom(hostSocketId, quiz) {
    const pin = this.generatePin();
    const room = {
      pin,
      hostSocketId,
      quiz,
      status: "LOBBY", // LOBBY, QUESTION_INTRO, QUESTION_ACTIVE, QUESTION_RESULT, LEADERBOARD, GAME_OVER
      currentQuestionIndex: -1,
      players: new Map(), // playerId -> playerInfo
      questionTimer: null,
      questionRemainingTime: 0,
      questionStartTime: 0,
      currentAnswers: new Map(), // playerId -> { optionId, timeSpent, pointsEarned, isCorrect, usedDoublePoints }
      historyLogs: [], // Log từng câu để xuất báo cáo Excel
      reactions: []
    };

    this.rooms.set(pin, room);
    return room;
  }

  getRoom(pin) {
    return this.rooms.get(pin);
  }

  addPlayer(pin, socketId, nickname, avatar) {
    const room = this.rooms.get(pin);
    if (!room) return { error: "Không tìm thấy phòng với mã PIN này!" };
    if (room.status !== "LOBBY") return { error: "Trò chơi đã bắt đầu hoặc đã kết thúc!" };

    // Kiểm tra trùng nickname
    for (const player of room.players.values()) {
      if (player.nickname.trim().toLowerCase() === nickname.trim().toLowerCase()) {
        return { error: "Tên biệt danh này đã có người sử dụng trong phòng!" };
      }
    }

    const playerId = `p_${socketId}`;
    const player = {
      id: playerId,
      socketId,
      nickname,
      avatar: avatar || "🐱",
      score: 0,
      streak: 0,
      powerUps: {
        fiftyFifty: 1, // 1 lần sử dụng 50:50
        doublePoints: 1 // 1 lần nhân đôi điểm
      },
      lastAnswer: null
    };

    room.players.set(playerId, player);
    this.playerSocketMap.set(socketId, { pin, playerId });

    return { room, player };
  }

  removePlayer(socketId) {
    const mapping = this.playerSocketMap.get(socketId);
    if (!mapping) return;

    const { pin, playerId } = mapping;
    const room = this.rooms.get(pin);
    this.playerSocketMap.delete(socketId);

    if (room) {
      if (room.hostSocketId === socketId) {
        // Host thoát phòng -> Đóng phòng
        this.io.to(pin).emit("room_closed", { message: "Chủ phòng đã thoát trò chơi!" });
        if (room.questionTimer) clearInterval(room.questionTimer);
        this.rooms.delete(pin);
      } else {
        // Người chơi thoát phòng
        room.players.delete(playerId);
        this.io.to(room.hostSocketId).emit("player_left", {
          playerId,
          players: Array.from(room.players.values())
        });
      }
    }
  }

  startQuiz(pin) {
    const room = this.rooms.get(pin);
    if (!room || room.status !== "LOBBY") return;

    room.currentQuestionIndex = 0;
    this.showQuestionIntro(room);
  }

  showQuestionIntro(room) {
    room.status = "QUESTION_INTRO";
    const currentQ = room.quiz.questions[room.currentQuestionIndex];
    room.currentAnswers.clear();

    this.io.to(room.pin).emit("question_intro", {
      questionNumber: room.currentQuestionIndex + 1,
      totalQuestions: room.quiz.questions.length,
      questionTitle: currentQ.question,
      timeLimit: currentQ.timeLimit
    });

    // Sau 3 giây giới thiệu -> chính thức bắt đầu câu hỏi
    setTimeout(() => {
      if (this.rooms.has(room.pin) && room.status === "QUESTION_INTRO") {
        this.activateQuestion(room);
      }
    }, 3000);
  }

  activateQuestion(room) {
    room.status = "QUESTION_ACTIVE";
    const currentQ = room.quiz.questions[room.currentQuestionIndex];
    room.questionRemainingTime = currentQ.timeLimit;
    room.questionStartTime = Date.now();

    // Gửi cho Host đầy đủ câu hỏi và 4 lựa chọn
    this.io.to(room.hostSocketId).emit("question_start_host", {
      question: currentQ,
      questionNumber: room.currentQuestionIndex + 1,
      totalQuestions: room.quiz.questions.length,
      timeLimit: currentQ.timeLimit
    });

    // Gửi cho Player 4 lựa chọn màu để click
    for (const player of room.players.values()) {
      this.io.to(player.socketId).emit("question_start_player", {
        questionNumber: room.currentQuestionIndex + 1,
        totalQuestions: room.quiz.questions.length,
        timeLimit: currentQ.timeLimit,
        optionsCount: currentQ.options.length,
        powerUps: player.powerUps
      });
    }

    // Bộ đếm thời gian
    if (room.questionTimer) clearInterval(room.questionTimer);
    room.questionTimer = setInterval(() => {
      room.questionRemainingTime -= 1;
      this.io.to(room.pin).emit("timer_tick", { remaining: room.questionRemainingTime });

      if (room.questionRemainingTime <= 0) {
        clearInterval(room.questionTimer);
        this.endCurrentQuestion(room);
      }
    }, 1000);
  }

  submitAnswer(socketId, optionId, usedDouble = false) {
    const mapping = this.playerSocketMap.get(socketId);
    if (!mapping) return;

    const { pin, playerId } = mapping;
    const room = this.rooms.get(pin);
    if (!room || room.status !== "QUESTION_ACTIVE") return;

    if (room.currentAnswers.has(playerId)) return; // Không cho trả lời 2 lần

    const player = room.players.get(playerId);
    if (!player) return;

    const currentQ = room.quiz.questions[room.currentQuestionIndex];
    const timeSpent = (Date.now() - room.questionStartTime) / 1000;
    const selectedOption = currentQ.options.find(opt => opt.id === optionId);
    const isCorrect = selectedOption ? selectedOption.isCorrect : false;

    let pointsEarned = 0;
    if (isCorrect) {
      // Công thức tính điểm Kahoot: Điểm tối đa * (1 - (thời gian trả lời / (thời gian tối đa * 2)))
      const speedFactor = Math.max(0.5, 1 - (timeSpent / (currentQ.timeLimit * 2)));
      let basePoints = Math.round(currentQ.points * speedFactor);

      // Tính thưởng Streak combo
      player.streak += 1;
      let streakBonus = 0;
      if (player.streak >= 2) streakBonus = 100;
      if (player.streak >= 3) streakBonus = 250;
      if (player.streak >= 5) streakBonus = 500;

      pointsEarned = basePoints + streakBonus;

      if (usedDouble && player.powerUps.doublePoints > 0) {
        pointsEarned *= 2;
        player.powerUps.doublePoints -= 1;
      }

      player.score += pointsEarned;
    } else {
      player.streak = 0; // Đứt chuỗi streak
    }

    room.currentAnswers.set(playerId, {
      optionId,
      timeSpent: Number(timeSpent.toFixed(2)),
      pointsEarned,
      isCorrect,
      usedDouble
    });

    // Thông báo cho Host cập nhật số lượng người đã trả lời
    this.io.to(room.hostSocketId).emit("answer_submitted_update", {
      answeredCount: room.currentAnswers.size,
      totalPlayers: room.players.size
    });

    // Nếu tất cả người chơi đều đã trả lời -> kết thúc câu hỏi sớm
    if (room.currentAnswers.size >= room.players.size && room.players.size > 0) {
      if (room.questionTimer) clearInterval(room.questionTimer);
      this.endCurrentQuestion(room);
    }
  }

  useFiftyFifty(socketId) {
    const mapping = this.playerSocketMap.get(socketId);
    if (!mapping) return;

    const { pin, playerId } = mapping;
    const room = this.rooms.get(pin);
    if (!room || room.status !== "QUESTION_ACTIVE") return;

    const player = room.players.get(playerId);
    if (!player || player.powerUps.fiftyFifty <= 0) return;

    player.powerUps.fiftyFifty -= 1;

    const currentQ = room.quiz.questions[room.currentQuestionIndex];
    // Tìm các đáp án sai và loại ngẫu nhiên 2 đáp án
    const wrongOptions = currentQ.options.filter(opt => !opt.isCorrect).map(opt => opt.id);
    const shuffled = wrongOptions.sort(() => 0.5 - Math.random());
    const eliminated = shuffled.slice(0, 2);

    this.io.to(socketId).emit("fifty_fifty_result", { eliminatedOptions: eliminated });
  }

  endCurrentQuestion(room) {
    room.status = "QUESTION_RESULT";
    const currentQ = room.quiz.questions[room.currentQuestionIndex];

    // Thống kê số lượng người chọn từng đáp án
    const stats = [0, 0, 0, 0];
    for (const ans of room.currentAnswers.values()) {
      if (ans.optionId >= 0 && ans.optionId < 4) {
        stats[ans.optionId]++;
      }
    }

    // Lưu log lịch sử cho câu này (dùng xuất Excel)
    room.historyLogs.push({
      questionNumber: room.currentQuestionIndex + 1,
      questionTitle: currentQ.question,
      correctOption: currentQ.options.find(o => o.isCorrect)?.text || "",
      stats,
      playerAnswers: Array.from(room.players.values()).map(p => {
        const ans = room.currentAnswers.get(p.id);
        return {
          nickname: p.nickname,
          answered: ans ? true : false,
          isCorrect: ans ? ans.isCorrect : false,
          timeSpent: ans ? ans.timeSpent : 0,
          pointsEarned: ans ? ans.pointsEarned : 0,
          totalScore: p.score
        };
      })
    });

    // Gửi kết quả cho Host
    this.io.to(room.hostSocketId).emit("question_result_host", {
      question: currentQ,
      stats,
      totalAnswers: room.currentAnswers.size
    });

    // Gửi kết quả riêng cho từng Player
    for (const player of room.players.values()) {
      const ans = room.currentAnswers.get(player.id);
      this.io.to(player.socketId).emit("question_result_player", {
        isCorrect: ans ? ans.isCorrect : false,
        pointsEarned: ans ? ans.pointsEarned : 0,
        totalScore: player.score,
        streak: player.streak
      });
    }
  }

  showLeaderboard(pin) {
    const room = this.rooms.get(pin);
    if (!room) return;

    room.status = "LEADERBOARD";
    const sortedPlayers = Array.from(room.players.values())
      .sort((a, b) => b.score - a.score);

    this.io.to(room.pin).emit("leaderboard_update", {
      topPlayers: sortedPlayers.slice(0, 5),
      isLastQuestion: room.currentQuestionIndex >= room.quiz.questions.length - 1
    });
  }

  nextQuestion(pin) {
    const room = this.rooms.get(pin);
    if (!room) return;

    room.currentQuestionIndex += 1;
    if (room.currentQuestionIndex < room.quiz.questions.length) {
      this.showQuestionIntro(room);
    } else {
      this.endGame(room);
    }
  }

  endGame(room) {
    room.status = "GAME_OVER";
    const sortedPlayers = Array.from(room.players.values())
      .sort((a, b) => b.score - a.score);

    this.io.to(room.pin).emit("game_over", {
      podium: {
        first: sortedPlayers[0] || null,
        second: sortedPlayers[1] || null,
        third: sortedPlayers[2] || null
      },
      allPlayers: sortedPlayers
    });
  }

  handleReaction(socketId, emoji) {
    const mapping = this.playerSocketMap.get(socketId);
    if (!mapping) return;

    const { pin, playerId } = mapping;
    const room = this.rooms.get(pin);
    if (!room) return;

    const player = room.players.get(playerId);
    const reaction = {
      id: Math.random().toString(36).substring(7),
      emoji,
      nickname: player ? player.nickname : "",
      createdAt: Date.now()
    };

    // Broadcast tới Host để hiện animation bay lên màn hình lớn
    this.io.to(room.hostSocketId).emit("floating_reaction", reaction);
  }

  exportExcelReport(pin) {
    const room = this.rooms.get(pin);
    if (!room) return null;

    const workbook = xlsx.utils.book_new();

    // 1. Sheet Tổng kết điểm học sinh
    const leaderboardData = Array.from(room.players.values())
      .sort((a, b) => b.score - a.score)
      .map((p, idx) => ({
        "Hạng": idx + 1,
        "Biệt danh / Học sinh": p.nickname,
        "Tổng điểm": p.score,
        "Chuỗi đúng kỷ lục": p.streak
      }));
    const wsLeaderboard = xlsx.utils.json_to_sheet(leaderboardData);
    xlsx.utils.book_append_sheet(workbook, wsLeaderboard, "Bảng Điểm Xếp Hạng");

    // 2. Sheet Chi tiết câu hỏi
    const questionSummary = room.historyLogs.map(log => ({
      "Câu số": log.questionNumber,
      "Nội dung câu hỏi": log.questionTitle,
      "Đáp án đúng": log.correctOption,
      "Số người chọn Đỏ (1)": log.stats[0],
      "Số người chọn Lam (2)": log.stats[1],
      "Số người chọn Vàng (3)": log.stats[2],
      "Số người chọn Lục (4)": log.stats[3]
    }));
    const wsQuestions = xlsx.utils.json_to_sheet(questionSummary);
    xlsx.utils.book_append_sheet(workbook, wsQuestions, "Thống Kê Câu Hỏi");

    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
    return buffer;
  }
}
