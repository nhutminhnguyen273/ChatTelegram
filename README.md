# Tour Booking Bot - Telegram Bot Đặt Tour Du Lịch

Bot Telegram hỗ trợ đặt tour du lịch với các tính năng đăng ký, đăng nhập và thanh toán.

## Tính Năng Chính

- 👤 Quản lý tài khoản người dùng (đăng ký, đăng nhập)
- 🔒 Bảo mật với JWT
- 🎯 Xem danh sách và chi tiết tour
- 💳 Xử lý thanh toán (tiền mặt và thẻ)
- 🎫 Lịch sử đặt tour
- 👤 Thông tin cá nhân người dùng

## Yêu Cầu Hệ Thống

- Node.js
- MongoDB
- Token Bot Telegram (lấy từ @BotFather)
- Tài khoản Stripe (cho thanh toán qua thẻ)

## Hướng Dẫn Cài Đặt

### 1. Chuẩn Bị Môi Trường

1. Cài đặt Node.js:
   - Tải và cài đặt Node.js từ: https://nodejs.org/
   - Kiểm tra cài đặt thành công bằng lệnh:
   ```bash
   node --version
   npm --version
   ```

2. Cài đặt MongoDB:
   - Tải và cài đặt MongoDB từ: https://www.mongodb.com/try/download/community
   - Khởi động MongoDB service

3. Tạo Bot Telegram:
   - Mở Telegram, chat với @BotFather
   - Gõ lệnh /newbot và làm theo hướng dẫn
   - Lưu lại token bot được cấp

### 2. Cài Đặt Project

1. Tải source code về máy:
   ```bash
   git clone <đường-dẫn-repository>
   cd ChatTelegram
   ```

2. Cài đặt các thư viện:
   ```bash
   npm install / npm update
   ```

3. Tạo file môi trường:
   - Tạo file `.env` trong thư mục gốc
   - Thêm các thông tin sau:
   ```
   BOT_TOKEN=<token-bot-telegram>
   MONGODB_URI=mongodb://localhost:27017/tour_booking_bot
   JWT_SECRET=<khóa-bí-mật-cho-jwt>
   STRIPE_SECRET_KEY=<khóa-bí-mật-stripe>
   ```

### 3. Khởi Chạy Bot

1. Khởi động MongoDB:
   - Đảm bảo service MongoDB đang chạy
   - Kiểm tra kết nối MongoDB

2. Chạy bot:
   ```bash
   node bot.js
   ```

3. Kiểm tra bot hoạt động:
   - Mở Telegram
   - Tìm bot theo username đã đăng ký
   - Nhấn Start để bắt đầu sử dụng

## Hướng Dẫn Sử Dụng

### 1. Đăng Ký Tài Khoản

1. Nhấn nút "📝 Register"
2. Bot sẽ yêu cầu tạo mật khẩu
3. Nhập theo format: `/setpassword YOUR_PASSWORD`
4. Lưu ý ghi nhớ mật khẩu để đăng nhập lần sau

### 2. Đăng Nhập

1. Nhấn nút "🔑 Login"
2. Nhập mật khẩu theo format: `/verify YOUR_PASSWORD`
3. Nếu đúng mật khẩu, bot sẽ hiển thị menu chính

### 3. Xem và Đặt Tour

1. Từ menu chính, chọn "🎯 View Tours"
2. Xem thông tin chi tiết tour bằng cách nhấn vào tour
3. Đặt tour bằng nút "Book Now"
4. Chọn phương thức thanh toán (Cash/Card)

### 4. Quản Lý Đặt Tour

1. Xem đơn đặt tour tại "🎫 My Bookings"
2. Kiểm tra trạng thái thanh toán
3. Thanh toán các đơn chưa thanh toán
4. Xem lịch sử đặt tour

### 5. Thông Tin Cá Nhân

1. Vào mục "👤 Profile"
2. Xem thông tin tài khoản
3. Kiểm tra số đơn đặt tour
4. Đăng xuất khi cần

## Xử Lý Sự Cố

1. Bot không phản hồi:
   - Kiểm tra bot đang chạy
   - Kiểm tra kết nối internet
   - Thử khởi động lại bot

2. Lỗi đăng ký/đăng nhập:
   - Đảm bảo định dạng lệnh chính xác
   - Kiểm tra mật khẩu không chứa ký tự đặc biệt

3. Lỗi thanh toán:
   - Kiểm tra thông tin thẻ (với thanh toán Stripe)
   - Đảm bảo đơn hàng chưa hết hạn

## Bảo Mật

- Mật khẩu được mã hóa với bcrypt
- Sử dụng JWT cho xác thực
- Bảo vệ thông tin người dùng
- Mã hóa dữ liệu thanh toán

## Phát Triển

Để thêm tour mới hoặc chỉnh sửa dữ liệu:
1. Truy cập MongoDB
2. Thêm/sửa dữ liệu trong collection tours
3. Khởi động lại bot nếu cần

## Lưu Ý

- Đảm bảo bảo mật thông tin token và key
- Backup dữ liệu thường xuyên
- Cập nhật các package khi có phiên bản mới
- Kiểm tra log để phát hiện lỗi 