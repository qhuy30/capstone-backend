const { roleStructure } = require("./const");

const removeUnicode = function (value) {
    if (typeof value === "number") {
        value = value.toString();
    }
    if (typeof value !== "string") return value;
    var str = value;
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, " ");
    str = str.replace(/ + /g, " ");
    str = str.trim();
    return str;
};

function splitString(input) {
    if (!input || typeof input !== 'string') {
        return [];
    }
    return input.split(/[,;]/).map(item => item.trim()).filter(item => item !== '');
}

const generateTextEn = function (value) {
    if (typeof value === "number") {
        value = value.toString();
    }
    if (typeof value !== "string") return value;

    var str = value;

    // Thay thế các ký tự có dấu trong cả chữ thường và chữ hoa
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");

    // Thay thế các ký tự có dấu trong chữ cái in hoa
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");

    // Thay thế ký tự đặc biệt và dấu câu thành khoảng trắng
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, " ");

    // Xóa khoảng trắng dư thừa
    str = str.replace(/ +/g, " ");
    str = str.trim();

    return str;
};

const generateValue = function (value) {
    const id = generateId();
    return `${generateAbbreviation(value)}_${id}`;
};

function getCurrentYear() {
    return (new Date().getFullYear()) * 1;
}

const generateSearchText = function (value) {
    if (typeof value === "number") {
        value = value.toString();
    }
    if (typeof value !== "string") return value;
    let result = "";
    result += removeUnicode(value);
    // result += " "+removeUnicode_UpperCase(value);
    return result;
};

function consolidateTypes(inputArray, groupField = 'name', typeField = 'type') {
    return Object.entries(
        inputArray.reduce((acc, item) => {
            const groupKey = item[groupField];
            
            // Nếu nhóm chưa tồn tại, tạo nhóm mới và giữ lại tất cả các trường dữ liệu khác.
            if (!acc[groupKey]) {
                acc[groupKey] = {
                    [groupField]: groupKey,
                    types: [],
                    ...Object.keys(item).reduce((obj, key) => {
                        // Giữ các trường không phải groupField và typeField
                        if (key !== groupField && key !== typeField) {
                            obj[key] = item[key];
                        }
                        return obj;
                    }, {})
                };
            }
            
            // Thêm loại (type) nếu chưa có và loại bỏ khoảng trắng thừa
            const trimmedType = item[typeField].trim();
            if (!acc[groupKey].types.includes(trimmedType)) {
                acc[groupKey].types.push(trimmedType);
            }
            
            return acc;
        }, {})
    ).map(([, value]) => value);
}


function generateAbbreviation(input) {
    if (!input) return ""; // Kiểm tra nếu input rỗng
    
    // Xử lý trường hợp có nhiều lựa chọn được ngăn cách bởi "/"
    const parts = input.split('/').map(part => {
        const cleanedPart = part.trim()
            .normalize("NFD") // Decompose combined characters
            .replace(/[\u0300\u0301\u0303\u0309\u0323]/g, "") // Remove specific diacritical marks (grave, acute, tilde, hook above, dot below)
        
        return cleanedPart
            .split(" ") // Tách chuỗi thành mảng các từ
            .map((word) => word[0]) // Lấy chữ cái đầu của mỗi từ
            .join("") // Ghép các chữ cái đầu lại
            .toUpperCase(); // Chuyển thành chữ hoa
    });
    
    return parts.join('/');
}

function normalizeWhitespace(input) {
    return input
        .replace(/\s+/g, " ") // Thay thế nhiều khoảng trắng thành một
        .trim();               // Xóa khoảng trắng ở đầu và cuối chuỗi
}

function generateId() {
    // Tạo ngày hiện tại
    const d = new Date(Math.floor(Math.random() * 6000));
  
    // Tạo số ngẫu nhiên từ 1 đến 1000
    const randomNum = Math.floor(Math.random() * 8000);
  
    // Tăng ngày lên 1 và lấy timestamp
    d.setDate(d.getDate() + 1);
    const timestamp = d.getTime();
  
    // Kết hợp timestamp với số ngẫu nhiên
    return `${timestamp}${randomNum}`;
  }

function generateUsername(fullName, existingUsernames) {
    const nameParts = fullName.toLowerCase().split(" ");

    const lastName = nameParts[nameParts.length - 1];
    nameParts.pop();
    let username = `${lastName}${nameParts.map((item) => item[0].toLowerCase()).join("")}`;

    if (!existingUsernames.includes(username)) {
        return username;
    }

    let counter = 1;
    let newUsername = `${username}_${counter}`;

    while (existingUsernames.includes(newUsername)) {
        counter++;
        newUsername = `${username}_${counter}`;
    }

    return newUsername;
}

const getRulesByGroup = (groupName) => {
    // Luôn có rule Authorized
    const rules = [{ rule: "Authorized" }];

    // Duyệt qua từng role trong roleStructure
    for (const [role, value] of Object.entries(roleStructure)) {
        // Kiểm tra xem groupName có trong mảng groups của role không
        if (value.groups.includes(groupName)) {
            rules.push(...value.rules);
            break; // Thoát vòng lặp khi đã tìm thấy group phù hợp
        }
    }

    return rules;
};

function parseDepartmentName(text) {
    const pattern = /^(.*?)\s*\((.*?)\)$/;
    const match = text.match(pattern);

    if (match) {
        const department = match[1];
        const division = match[2];
        return [department, division];
    } else {
        return [text];
    }
}

function parseRoleName(text) {
    const pattern = /^(.*?)\s*\((.*?)\)$/;
    const match = text.match(pattern);

    if (match) {
        const name = match[1];
        const role = match[2];
        return [name, role];
    } else {
        return [text];
    }
}

function normalizeWhitespaceInArray(array) {
    return array.map(obj => {
        const newObj = {};

        // Lọc qua từng thuộc tính của đối tượng
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                // Nếu giá trị là chuỗi, loại bỏ khoảng trắng dư thừa
                if (typeof obj[key] === "string") {
                    newObj[key] = obj[key].replace(/\s+/g, " ").trim();
                } else {
                    // Nếu giá trị không phải chuỗi, giữ nguyên
                    newObj[key] = obj[key];
                }
            }
        }

        return newObj;
    });
}

function checkDuplicate(data) {
    let emails = [];
    
    data.forEach(element => {
        const checkExist = emails.find(e => e.email === element.email);
        
        if (checkExist) {
            // Nếu department đã tồn tại, đánh dấu là trùng
            if (checkExist.departments.includes(element.department)) {
                checkExist.isDuplicateEmailAndDepartment = true;
            } else {
                // Nếu chưa tồn tại department, thêm vào
                checkExist.departments.push(element.department);
            }
            // Đánh dấu email đã trùng
            checkExist.isDuplicateEmail = true;
        } else {
            // Nếu chưa có email trong mảng, thêm email và khởi tạo các trường cần thiết
            emails.push({
                email: element.email,
                departments: [element.department], // Thêm department đầu tiên
                isDuplicateEmail: false,
                isDuplicateEmailAndDepartment: false
            });
        }
    });

    
    return formatEmails(emails);
}

function formatEmails(data) {
    return data.map(item => {
      // Nếu cả isDuplicateEmail và isDuplicateEmailAndDepartment đều là false, chỉ trả về email
      if (!item.isDuplicateEmail && !item.isDuplicateEmailAndDepartment) {
        return { email: item.email };
      }
      // Nếu isDuplicateEmail là true và isDuplicateEmailAndDepartment là false, trả về email và isDuplicateEmail
      if (item.isDuplicateEmail && !item.isDuplicateEmailAndDepartment) {
        return { email: item.email, isDuplicateEmail: item.isDuplicateEmail };
      }
      // Nếu cả isDuplicateEmail và isDuplicateEmailAndDepartment đều là true, trả về email và isDuplicateEmailAndDepartment
      if (item.isDuplicateEmail && item.isDuplicateEmailAndDepartment) {
        return { email: item.email, isDuplicateEmailAndDepartment: item.isDuplicateEmailAndDepartment };
      }
    });
}

function generateEmailLoginByDepartment(data){
    return `${data.email}/${generateAbbreviation(data.department)}`
}

function generateEmailLoginByDepartmentRole(data){
    return `${data.email}/${generateAbbreviation(data.department)}/${generateAbbreviation(data.position)}`
}

function findDuplicateEmails(array, key) {
    // Đếm số lần xuất hiện của từng email
    const emailCount = array.reduce((acc, item) => {
        acc[item[key]] = (acc[item[key]] || 0) + 1;
        return acc;
    }, {});

    // Lọc ra các object có email xuất hiện từ 2 lần trở lên
    return array.filter(item => emailCount[item[key]] >= 2);
}

function generatePassword(item) {
    return '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'
}

function getRule(position){
    return [
        {
            rule: 'Authorized'
        }
    ]
}

function findItemsNotInArray(array1, array2) {
    return array1.filter(item => !array2.includes(item));
}

function getDepartmentCounts(data) {
    // Tạo một đối tượng để lưu trữ số lượng người trong từng phòng ban
    const departmentCounts = {};
  
    // Duyệt qua từng phần tử trong dữ liệu
    data.forEach(person => {
      const department = person.department;
      // Nếu phòng ban chưa tồn tại trong đối tượng, khởi tạo với giá trị 0
      if (!departmentCounts[department]) {
        departmentCounts[department] = 0;
      }
      // Tăng số lượng người trong phòng ban
      departmentCounts[department]++;
    });
  
    // Chuyển đổi đối tượng thành danh sách các phòng ban và số lượng
    const result = Object.keys(departmentCounts).map(department => {
      return {
        department,
        count: departmentCounts[department]
      };
    });
  
    return result;
  }
  

exports.removeUnicode = removeUnicode;
exports.generateSearchText = generateSearchText;
exports.generateAbbreviation = generateAbbreviation;
exports.generateId = generateId;
exports.generateUsername = generateUsername;
exports.getRulesByGroup = getRulesByGroup;
exports.parseDepartmentName = parseDepartmentName;
exports.parseRoleName = parseRoleName;
exports.generateTextEn = generateTextEn;
exports.generateValue = generateValue;
exports.consolidateTypes = consolidateTypes;
exports.normalizeWhitespace = normalizeWhitespace;
exports.normalizeWhitespaceInArray = normalizeWhitespaceInArray;
exports.getCurrentYear = getCurrentYear;
exports.splitString = splitString;
exports.checkDuplicate = checkDuplicate;
exports.generateEmailLoginByDepartment = generateEmailLoginByDepartment;
exports.generateEmailLoginByDepartmentRole = generateEmailLoginByDepartmentRole;
exports.findDuplicateEmails = findDuplicateEmails;
exports.generatePassword = generatePassword;
exports.getRule = getRule;
exports.findItemsNotInArray = findItemsNotInArray;
exports.getDepartmentCounts = getDepartmentCounts;
