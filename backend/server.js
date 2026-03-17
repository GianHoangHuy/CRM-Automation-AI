const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const passport = require('./config/passport');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');

connectDB();
const app = express();

// Cấu hình CORS
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
    })
);

app.use(express.json());

// Cấu hình Session
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'change_this_now',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            ttl: 60 * 60,
        }),
        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 60,
        },
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// --- TẠO HTTP SERVER VÀ SOCKET.IO ---
const server = http.createServer(app); // Bọc app bằng http server

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ['GET', 'POST'],
        credentials: true,
    }
});

app.set('io', io);

// Xử lý kết nối Socket
io.on('connection', (socket) => {
    console.log('Client đã kết nối socket:', socket.id);

    // Lắng nghe sự kiện client join vào room sản phẩm
    socket.on('join', (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} đã vào phòng: ${room}`);
    });

    socket.on('disconnect', () => {
        console.log('Client đã ngắt kết nối socket');
    });
});

// Routes
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

const PORT = process.env.PORT || 5000;

// --- KHỞI ĐỘNG SERVER BẰNG HTTP SERVER (QUAN TRỌNG) ---
server.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
    console.log(`Socket.io đã sẵn sàng!`);
});

module.exports = { io };