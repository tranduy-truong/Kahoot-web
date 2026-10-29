import React, { useState } from "react";
import { Plus, Trash2, ArrowLeft, Clock, Award, Check } from "lucide-react";

export default function QuizEditor({ onBack, onSaved }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState(
    "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600&auto=format&fit=crop&q=80"
  );
  const [questions, setQuestions] = useState([
    {
      id: `q_${Date.now()}`,
      question: "Câu hỏi mẫu đầu tiên của bạn là gì?",
      timeLimit: 15,
      points: 1000,
      options: [
        { id: 0, text: "Lựa chọn Đỏ", isCorrect: true },
        { id: 1, text: "Lựa chọn Lam", isCorrect: false },
        { id: 2, text: "Lựa chọn Vàng", isCorrect: false },
        { id: 3, text: "Lựa chọn Lục", isCorrect: false }
      ]
    }
  ]);
  const [activeQIndex, setActiveQIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  const handleAddQuestion = () => {
    const newQ = {
      id: `q_${Date.now()}`,
      question: "Nhập câu hỏi của bạn tại đây...",
      timeLimit: 15,
      points: 1000,
      options: [
        { id: 0, text: "", isCorrect: true },
        { id: 1, text: "", isCorrect: false },
        { id: 2, text: "", isCorrect: false },
        { id: 3, text: "", isCorrect: false }
      ]
    };
    setQuestions([...questions, newQ]);
    setActiveQIndex(questions.length);
  };

  const handleDeleteQuestion = (index, e) => {
    e.stopPropagation();
    if (questions.length <= 1) {
      alert("Bộ đề thi cần có tối thiểu ít nhất 1 câu hỏi!");
      return;
    }
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
    setActiveQIndex(Math.max(0, index - 1));
  };

  const updateCurrentQuestion = (field, value) => {
    const updated = [...questions];
    updated[activeQIndex][field] = value;
    setQuestions(updated);
  };

  const updateOptionText = (optIdx, text) => {
    const updated = [...questions];
    updated[activeQIndex].options[optIdx].text = text;
    setQuestions(updated);
  };

  const setCorrectOption = (optIdx) => {
    const updated = [...questions];
    updated[activeQIndex].options.forEach((opt, idx) => {
      opt.isCorrect = idx === optIdx;
    });
    setQuestions(updated);
  };

  const handleSaveQuiz = async () => {
    if (!title.trim()) {
      alert("Vui lòng nhập tiêu đề cho bộ đề thi!");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${backendUrl}/api/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          coverImage,
          questions
        })
      });

      if (res.ok) {
        alert("Đã lưu bộ đề thành công!");
        onSaved();
      } else {
        alert("Có lỗi xảy ra khi lưu!");
      }
    } catch (err) {
      console.error(err);
      alert("Không thể kết nối đến server backend!");
    } finally {
      setIsSaving(false);
    }
  };

  const currentQ = questions[activeQIndex] || questions[0];

  const optionColorConfigs = [
    { bg: "bg-[#e21b3c]", icon: "▲", name: "Đỏ" },
    { bg: "bg-[#1368ce]", icon: "◆", name: "Lam" },
    { bg: "bg-[#d89e00]", icon: "●", name: "Vàng" },
    { bg: "bg-[#26890c]", icon: "■", name: "Lục" }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f2f2f2] text-gray-900 flex flex-col justify-between">
      {/* Top Header thanh công cụ Kahoot Creator */}
      <div className="bg-white border-b-2 border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <input
              type="text"
              placeholder="Nhập tiêu đề bộ đề thi (ví dụ: Ôn tập môn Web)..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-black text-xl text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-black focus:outline-none px-1 py-0.5 w-72 sm:w-96"
            />
          </div>
        </div>

        <button
          onClick={handleSaveQuiz}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-lg font-black text-sm uppercase tracking-wider btn-kahoot-green"
        >
          {isSaving ? "Đang lưu..." : "Lưu bộ đề"}
        </button>
      </div>

      {/* Vùng soạn thảo chính */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 sm:p-6 gap-6">
        {/* Cột trái: Slide các câu hỏi */}
        <div className="w-full md:w-64 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="font-black text-xs uppercase text-gray-500">
              Câu hỏi ({questions.length})
            </span>
            <button
              onClick={handleAddQuestion}
              className="px-3 py-1.5 rounded font-black text-xs uppercase bg-[#46178f] text-white flex items-center gap-1 shadow-sm hover:bg-[#381072]"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm câu
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[600px] pr-1">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                onClick={() => setActiveQIndex(idx)}
                className={`p-3 rounded-lg border-2 flex items-center justify-between cursor-pointer transition-all ${
                  activeQIndex === idx
                    ? "bg-white border-[#46178f] shadow-md scale-[1.02]"
                    : "bg-white/80 border-gray-200 hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="font-black text-sm text-gray-500">{idx + 1}</span>
                  <span className="text-xs font-bold text-gray-800 truncate max-w-[130px]">
                    {q.question || "Chưa có nội dung"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDeleteQuestion(idx, e)}
                  className="text-gray-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Khu vực giữa: Khung soạn thảo câu hỏi chi tiết */}
        <div className="flex-1 flex flex-col justify-between space-y-4">
          {/* Ô nhập câu hỏi lớn ở trên */}
          <div className="bg-white rounded-lg p-6 shadow-md border-b-4 border-gray-200 text-center">
            <textarea
              rows={2}
              value={currentQ.question}
              onChange={(e) => updateCurrentQuestion("question", e.target.value)}
              placeholder="Bắt đầu nhập câu hỏi của bạn tại đây..."
              className="w-full text-center text-xl sm:text-2xl font-black text-gray-900 placeholder-gray-400 border-0 focus:outline-none resize-none"
            />
          </div>

          {/* Thanh cài đặt thời gian & điểm */}
          <div className="flex items-center justify-center gap-6 bg-white py-2.5 px-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-black uppercase text-gray-500">Thời gian:</span>
              <select
                value={currentQ.timeLimit}
                onChange={(e) => updateCurrentQuestion("timeLimit", Number(e.target.value))}
                className="font-black text-sm text-gray-900 bg-gray-100 rounded px-2 py-1 focus:outline-none"
              >
                <option value={10}>10 giây</option>
                <option value={15}>15 giây</option>
                <option value={20}>20 giây</option>
                <option value={30}>30 giây</option>
                <option value={60}>60 giây</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-black uppercase text-gray-500">Điểm số:</span>
              <select
                value={currentQ.points}
                onChange={(e) => updateCurrentQuestion("points", Number(e.target.value))}
                className="font-black text-sm text-gray-900 bg-gray-100 rounded px-2 py-1 focus:outline-none"
              >
                <option value={1000}>Tiêu chuẩn (1000)</option>
                <option value={2000}>Gấp đôi (2000)</option>
              </select>
            </div>
          </div>

          {/* 4 Khối màu nhập đáp án chuẩn Kahoot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            {currentQ.options.map((opt, idx) => (
              <div
                key={opt.id}
                className={`${optionColorConfigs[idx]?.bg} rounded-lg p-4 flex items-center gap-3 shadow-md min-h-[90px]`}
              >
                <span className="text-2xl text-white font-black select-none">
                  {optionColorConfigs[idx]?.icon}
                </span>

                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => updateOptionText(idx, e.target.value)}
                  placeholder={`Nhập đáp án ${idx + 1}`}
                  className="flex-1 bg-transparent text-white font-black text-lg placeholder-white/60 focus:outline-none border-b border-white/20 focus:border-white py-1"
                />

                {/* Nút tích chọn tròn làm đáp án ĐÚNG */}
                <button
                  type="button"
                  onClick={() => setCorrectOption(idx)}
                  className={`w-9 h-9 rounded-full border-4 flex items-center justify-center transition-all ${
                    opt.isCorrect
                      ? "bg-white border-white text-[#26890c]"
                      : "border-white/50 hover:border-white text-transparent"
                  }`}
                >
                  <Check className="w-5 h-5 stroke-[4]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
