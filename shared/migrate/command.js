const { deleteDepartment, deleteUser } = require("./delete_data");

const args = process.argv.slice(2);
const path = require('path');


// Xử lý command
const command = args[0]; // Lệnh đầu tiên
switch (command) {
    case 'delete_user':
        // node script.js delete userId
        deleteUser();
        break;
    case 'delete_department':
        // node script.js delete userId
        deleteDepartment();
        break;
    case '--help':
    case '-h':
        console.log(`
Hướng dẫn sử dụng:
    node script.js add <username> <email>    - Thêm user mới
    node script.js delete <userId>           - Xóa user
    node script.js update <userId> <newData> - Cập nhật thông tin user
    node script.js list                      - Xem danh sách users
    node script.js --help                    - Hiển thị hướng dẫn
        `);
        break;

    default:
        console.log('Lệnh không hợp lệ! Sử dụng --help để xem hướng dẫn.');
}