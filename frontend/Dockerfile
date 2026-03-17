FROM node:18-alpine

WORKDIR /app

# Copy cả package.json và package-lock.json (nếu có)
COPY package*.json ./

# Cài đặt dependencies (bao gồm cả sweetalert2 nếu đã có trong package.json)
RUN npm install
RUN npm install sweetalert2

# Copy mã nguồn
COPY . .

EXPOSE 3000

# Chạy lệnh start của React
CMD ["npm", "start"]