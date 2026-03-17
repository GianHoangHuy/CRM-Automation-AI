# Sử dụng Node.js bản nhẹ
FROM node:18-alpine

# Cài đặt thêm các công cụ cần thiết (nếu cần debug)
RUN apk add --no-cache bash

# Tạo thư mục làm việc
WORKDIR /app

# Copy file package để cài thư viện trước (tối ưu cache)
COPY package*.json ./
RUN npm install

# Cài đặt nodemon toàn cục để chạy dev
RUN npm install -g nodemon

# Copy toàn bộ code vào
COPY . .

# Mở port 5000
EXPOSE 5000

# Chạy lệnh dev
CMD ["npm", "start"]