const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// ==========================================
// CẤU HÌNH ĐƯỜNG DẪN VÀ SỐ LƯỢNG
// ==========================================
const kaggleCsvPath = path.join(__dirname, '2019-Oct.csv'); 
const usersJsonPath = path.join(__dirname, 'ecommerce.users.json');
const productsJsonPath = path.join(__dirname, 'ecommerce.products.json');
const outputPath = path.join(__dirname, 'ecommerce.behaviorlogs.json');

// Giới hạn số lượng dòng để test Database (Bạn có thể tăng lên 50000 nếu muốn)
const MAX_LOGS = 10000; 

// ==========================================
// HÀM ĐỌC ID TỪ FILE JSON CỦA BẠN
// ==========================================
function getIdsFromJson(filePath) {
    try {
        const rawData = fs.readFileSync(filePath, 'utf8');
        let parsedData;
        try {
             parsedData = JSON.parse(rawData);
        } catch (e) {
             // Tự động sửa lỗi nếu copy file JSON bị thiếu dấu ngoặc mảng [...] ở 2 đầu
             const formattedData = `[${rawData.trim().replace(/}$/gm, '},').replace(/,$/,'')}]`;
             parsedData = JSON.parse(formattedData);
        }
        // Trích xuất các ObjectId
        return parsedData.map(item => item._id.$oid);
    } catch (error) {
        console.error(`Lỗi đọc file ${filePath}:`, error.message);
        return [];
    }
}

// ==========================================
// THỰC THI CHUYỂN ĐỔI (ETL)
// ==========================================
async function convertData() {
    console.log('1. Đang đọc ID từ users.json và products.json...');
    const userIds = getIdsFromJson(usersJsonPath);
    const productIds = getIdsFromJson(productsJsonPath);

    if (userIds.length === 0 || productIds.length === 0) {
        console.error('Không tìm thấy ID nào. Hãy kiểm tra lại file JSON của bạn.');
        return;
    }

    console.log(`-> Đã load ${userIds.length} Users và ${productIds.length} Products.`);
    console.log(`2. Bắt đầu trích xuất ${MAX_LOGS} dòng từ file CSV khổng lồ...`);

    const behaviorLogs = [];
    let count = 0;

    // Stream đọc file CSV từng dòng một để tránh tràn RAM
    fs.createReadStream(kaggleCsvPath)
        .pipe(csv())
        .on('data', (row) => {
            if (count >= MAX_LOGS) return; // Đủ số lượng thì bỏ qua các dòng sau

            const getRandomId = (arr) => arr[Math.floor(Math.random() * arr.length)];

            // Mô phỏng thực tế: Không phải event nào cũng có user đăng nhập
            let userIdValue = null;
            if (Math.random() > 0.3 || row.event_type === 'purchase' || row.event_type === 'cart') {
                 userIdValue = getRandomId(userIds);
            }

            // Lắp ráp dữ liệu theo chuẩn Mongoose Schema của bạn
            const logEntry = {
                eventType: row.event_type === 'cart' ? 'add_to_cart' : row.event_type,
                user: userIdValue ? { "$oid": userIdValue } : null,
                product: { "$oid": getRandomId(productIds) }, 
                sessionId: row.user_session || 'session_default',
                metadata: {
                    price: parseFloat(row.price) || 0,
                    brand: row.brand || 'unknown',
                    category_code: row.category_code || 'unknown'
                },
                createdAt: { "$date": new Date(row.event_time).toISOString() }
            };

            behaviorLogs.push(logEntry);
            count++;
        })
        .on('end', () => {
            console.log(`3. Đã xử lý ${count} dòng. Đang lưu file JSON...`);
            fs.writeFileSync(outputPath, JSON.stringify(behaviorLogs, null, 2), 'utf8');
            console.log(`\n✅ HOÀN THÀNH! File đã được lưu tại:\n👉 ${outputPath}`);
            console.log(`Bạn có thể đưa file này vào thư mục mongo-init/ ngay bây giờ.`);
        });
}

convertData();