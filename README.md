# Bài final môn Lập trình web với NodeJS

Đây là project website thương mại điện tử (E-Commerce) cuối kỳ cho môn Lập trình web với NodeJS.

## Các thành ien trong nhóm thực hiện ứng dụng

* Lý Tiểu Long - 52200168
* Giản Hoàng Huy - 52200147
* Lê Ngọc Sơn - 52200158

## Các công nghệ sử dụng

* **Backend:** Node.js, Express, MongoDB (Mongoose)
* **Frontend:** React (hoặc Vue/Angular)
* **Database & Devops:** Docker (MongoDB Container)
* **Xác thực:** JSON Web Tokens (JWT)

## Yêu cầu hệ thống

* **Node.js**: Phiên bản 18 trở lên.
* **Docker Desktop**: Đã cài đặt và đang bật.
* **import.sh**: Đảm bảo file import.sh trong thư mục **mongo-init** ở định dạng **LF**

---

## PHẦN 1: HƯỚNG DẪN CÀI ĐẶT (INSTALLATION)

Thực hiện các bước sau để tải mã nguồn và cài đặt các thư viện cần thiết.

### Kiểm tra File Cấu hình Docker
Đảm bảo rằng các file sau đã tồn tại trong dự án của bạn (vì Docker sẽ sử dụng chúng để xây dựng môi trường):
* **docker-compose.yml** (ở thư mục gốc)
* **backend/Dockerfile**
* **frontend/Dockerfile**

## PHẦN 2: HƯỚNG DẪN CHẠY DỰ ÁN (RUN PROJECT)
Dự án được thiết lập để chạy toàn bộ Database, Backend và Frontend chỉ với 1 lệnh Docker duy nhất.

### 1. Khởi chạy toàn bộ hệ thống
Mở terminal tại thư mục gốc của dự án và chạy lệnh sau:
```bash
docker-compose up -d --build
```

### 2. Truy cập
Sau khi lệnh chạy xong (có thể mất vài phút cho lần đầu tiên), bạn truy cập:
* Website: **http://localhost:3000**
* API Backend: **http://localhost:5000**

### 3. Xem Log (Gỡ lỗi)
Sử dụng lệnh sau để xem lỗi hoặc **console.log** của Backend/Frontend:
```bash
docker-compose logs -f
```

## Hướng dẫn chấm bài cho Giảng viên
### 1. Tài khoản đăng nhập
Dữ liệu mẫu (Users, Products...) đã được tự động import khi Docker khởi chạy.
* Tài khoản Admin: **admin@gmail.com / Admin123@**
* Tài khoản User: Giảng viên tạo ở chức năng đăng ký

### 2. Reset dữ liệu (Nếu cần)
Nếu muốn xóa sạch dữ liệu và môi trường để chấm lại từ đầu, vui lòng chạy lệnh sau tại thư mục gốc:
```bash
docker-compose down -v
docker-compose up -d --build
```