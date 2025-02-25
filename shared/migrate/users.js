const fs = require('fs');
const XLSX = require('xlsx');

const path_user = 'C:/Users/toan/Desktop/cty/data_migrate/users.xlsx';

const path = path_user;
// Đọc file Excel dưới dạng nhị phân
const data = fs.readFileSync(path, 'binary');

// Phân tích dữ liệu Excel
var workbook = XLSX.read(data, { type: "binary" });
var firstSheetName = workbook.SheetNames[0];
var jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { range: 2 });
console.log([...new Set(jsonData.map(item => item['Nhiệm vụ']))]);
// const users = jsonData.map(item=>item.department);
