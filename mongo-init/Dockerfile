# mongo-init/Dockerfile
FROM mongo:4.4

WORKDIR /data

# Copy script và data vào trong container
# Đảm bảo file import.sh ở định dạng LF
COPY import.sh .
COPY ecommerce.*.json .

# Cấp quyền thực thi cho script
RUN chmod +x import.sh

# Chạy script khi container khởi động
CMD ["./import.sh"]