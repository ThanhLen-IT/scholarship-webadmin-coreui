# Scholarship Gateway Web Admin

## Chạy local

1. Chạy backend `schoolarship-backend-app`, cấu hình PostgreSQL và JWT trong `.env` của backend. Cổng mặc định: 5000.
2. Kiểm tra `http://localhost:5000/health/ready` trả `status: ready`.
3. Trong repo frontend: `npm ci`, sau đó `npm start`.
4. Mở `http://localhost:3000/#/authentication/login`.
5. Đăng nhập bằng tài khoản có `role = 'admin'` và `is_active = true`. Dùng mật khẩu thật của tài khoản đã được backend mã hóa bcrypt. Không có tài khoản/mật khẩu mặc định trong frontend.

Vite chuyển `/api` đến `http://localhost:5000`. Nếu backend dùng cổng khác, sửa `server.proxy` trong `vite.config.mjs`. Không đặt mật khẩu DB hay JWT_SECRET vào frontend.

## Các chức năng

- Đăng nhập bằng email hoặc username; kiểm tra phiên qua `/auth/me`; đăng xuất; chuyển về đăng nhập khi backend từ chối quyền/phiên.
- Học bổng: tìm kiếm; lọc trạng thái, quốc gia, loại, bậc học và khoảng deadline; sắp xếp; phân trang; tạo, xem/sửa đầy đủ các trường API cho phép; duyệt, từ chối, lưu trữ, xóa với xác nhận.
- Học bổng mới ở trạng thái chờ duyệt. Chỉ hồ sơ pending có nút duyệt/từ chối; backend là nguồn quyết định quyền và chuyển trạng thái.
- Crawler: chọn nguồn đang bật, khởi chạy, theo dõi trạng thái mỗi 5 giây và lịch sử mỗi 10 giây, phân trang lịch sử, mở danh sách học bổng chờ duyệt.
- Mentor: lọc/phân trang hồ sơ; tải PDF bằng request có Bearer token; duyệt/từ chối kèm ghi chú.
- Tổng quan: các đường dẫn quản trị, không hiển thị số liệu giả.

Chưa thêm quản lý toàn bộ người dùng, hỗ trợ, analytics hoặc quản lý kết quả mentoring vì backend chưa có đủ API đọc/quản trị cho các trang này.

## Build và deploy

`npm run build` xuất file vào `build/`. Proxy Vite chỉ dùng lúc phát triển. Khi deploy cùng host, cấu hình Nginx phục vụ `build/` và chuyển `/api/` sang Node.js, giữ nguyên tiền tố `/api/`. HashRouter dùng URL `/#/...`.

Nếu deploy khác host, đặt `VITE_API_BASE_URL` trước khi build (ví dụ `https://api.example.com/api`, không có dấu `/` cuối) và cấu hình CORS backend. Biến VITE là công khai trong bundle.

## Kiểm tra thủ công với backend thật

- Mở route quản trị khi chưa đăng nhập phải quay lại login. Tài khoản user không được vào admin.
- Đăng nhập admin, tải lại trang, đăng xuất; token hết hạn hoặc tài khoản bị khóa phải bị backend từ chối.
- Tạo học bổng có nhiều bậc học, sửa deadline/ngành/nội dung; tải lại và kiểm tra dữ liệu; lọc/phân trang; kiểm tra lỗi API hiển thị rõ.
- Duyệt/từ chối/lưu trữ học bổng; hủy dialog không gửi request; xóa chỉ bằng dữ liệu thử.
- Chạy crawler trên môi trường thử, theo dõi hoàn thành và tìm học bổng chờ duyệt.
- Tải PDF mentor, duyệt/từ chối hồ sơ pending; hồ sơ đã quyết định không còn nút quyết định.

Không chạy crawler hoặc sửa dữ liệu production trong kiểm tra tự động.
