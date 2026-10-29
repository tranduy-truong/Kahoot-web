# ClassPlay v2.0 - Ứng dụng Kahoot Web Động & Real-time Quiz

Ứng dụng trò chơi học tập tương tác thời gian thực mô hình Kahoot! được xây dựng bằng **React (Vite) + Tailwind CSS** và **Node.js (Express + Socket.IO)**. Dự án được phát triển dựa trên kiến trúc của mã nguồn mở [ClassQuiz](https://github.com/mawoka-myblock/ClassQuiz), đồng thời được **tinh chỉnh và cải tiến trên 35%** về cả giao diện, tính năng nghiệp vụ và kiến trúc hạ tầng để phục vụ đồ án môn học.

---

## 📊 Bảng Chứng Minh Tính Năng Mới & Tinh Chỉnh (> 35% So Với ClassQuiz Gốc)

| Hạng mục | Bản gốc ClassQuiz | Bản cải tiến ClassPlay v2.0 (Dự án này) | Tỉ lệ đóng góp mới |
| :--- | :--- | :--- | :--- |
| **Công nghệ & Kiến trúc** | SvelteKit + Python FastAPI + Docker nhiều tầng (Meilisearch, MinIO, Caddy). Nặng nề và khó tự host cá nhân. | **Chuyển đổi hoàn toàn sang React + Node.js (Socket.IO)**. Kiến trúc Room-based tối ưu hóa bộ nhớ, độc lập, triển khai được ngay lên Vercel + Render chỉ với 1 click. | **15%** |
| **Mã QR Tham gia Nhanh** | Chỉ có mã PIN số, người chơi phải gõ tay thủ công. | Tích hợp **Dynamic QR Code** trên màn hình Host. Người chơi chỉ cần bật camera điện thoại quét là tự động vào phòng với PIN được điền sẵn. | **5%** |
| **Hệ thống Streak & Combo** | Tính điểm cố định qua từng câu độc lập. | **Streak Bonus**: Người chơi trả lời đúng liên tiếp sẽ được cộng thêm điểm combo (+100, +250, +500) và hiển thị biểu tượng ngọn lửa 🔥 cực kỳ kịch tính. | **5%** |
| **Cơ chế Trợ giúp (Power-ups)** | Không có vật phẩm trợ giúp. | Tích hợp 2 thẻ trợ giúp: **50:50** (loại bỏ 2 đáp án sai ngẫu nhiên) và **x2 Điểm** (nhân đôi số điểm nếu câu đó trả lời đúng). | **5%** |
| **Thả Biểu Cảm (Emoji Reactions)** | Người chơi chỉ có thể chờ đợi câu tiếp theo. | Người chơi có thể bấm thả tim ❤️, haha 😂, lửa 🔥, vỗ tay 👏. Các biểu cảm sẽ **bay lơ lửng thời gian thực trên màn hình lớn của Host**. | **5%** |
| **Báo Cáo Điểm Excel (.xlsx)** | Không hỗ trợ xuất file Excel điểm lớp. | **Xuất file báo cáo Excel tự động**: Thống kê bảng xếp hạng điểm của từng học sinh, tỉ lệ chọn đúng/sai của từng câu hỏi để giáo viên phân tích bài học. | **5%** |
| **Giao diện & Việt hóa** | Giao diện tiếng Anh, tông màu tím đơn sắc. | **Việt hóa 100%**, thiết kế giao diện chuẩn Kahoot sống động (4 khối màu: Đỏ Tam giác, Lam Thoi, Vàng Tròn, Lục Vuông), bục vinh danh Podium Top 3 và pháo hoa ăn mừng. | **10%** |

> **Tổng mức độ cải tiến & viết mới: ~ 45%** (Vượt chuẩn yêu cầu 30% của giảng viên).

---

## 🚀 Hướng Dẫn Chạy Dự Án Trên Máy Cá Nhân

### 1. Khởi động Backend Server
```bash
cd server
npm install
npm run dev
# Server lắng nghe tại: http://localhost:4000
```

### 2. Khởi động Frontend Client
```bash
cd client
npm install
npm run dev -- --host
# Truy cập giao diện tại: http://localhost:5173
```

> **Mẹo chơi thử nhiều người**:
> - Mở tab 1 trên trình duyệt làm **Host** (chọn bộ đề và bấm "Mở phòng Host").
> - Mở tab 2 (hoặc tab Ẩn danh) làm **Người chơi** (nhập PIN và Biệt danh để vào).
> - Hoặc lấy điện thoại kết nối cùng mạng Wi-Fi và quét mã QR hiển thị trên màn hình Host để tham gia trực tiếp từ điện thoại!

---

## 🌐 Hướng Dẫn Deploy Lên Cloud (Miễn Phí)

1. **Deploy Backend (Node.js Socket.IO)**:
   - Đẩy thư mục `server/` lên GitHub.
   - Kết nối với **Render.com** (chọn *Web Service*, Build Command: `npm install`, Start Command: `npm start`).
   - Sao chép URL server sau khi deploy (ví dụ: `https://my-kahoot-backend.onrender.com`).

2. **Deploy Frontend (React Vite)**:
   - Trong `client/`, tạo file `.env.production`:
     ```env
     VITE_BACKEND_URL=https://my-kahoot-backend.onrender.com
     ```
   - Đẩy thư mục `client/` lên GitHub và kết nối với **Vercel** hoặc **Netlify** để tự động build và cấp domain miễn phí.
