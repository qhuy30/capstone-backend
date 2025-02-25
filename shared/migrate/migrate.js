require("dotenv").config();
const fs = require("fs");
const q = require("q");
const XLSX = require("xlsx");
const PNT_TENANT = require("../multi_tenant/pnt-tenant");
const settings = require("../mongodb/mongodb.const");
const { MongoDBInterface } = require("../mongodb/db.interface");
const { MongoDBProvider } = require("../mongodb/db.provider.js");
const { CollectionSetup } = require("../setup/collections.const");
var _initResource = require("../init").init;
const { MongoDBCore } = require("../mongodb/mongodb.core.js");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const ruleDetails = require("./rule/index");


const IndexConst = {
    office: require("../../app/office/indexConcern"),
    management: require("../../app/management/indexConcern"),
    basic: require("../../app/basic/indexConcern"),
    education: require("../../app/education/indexConcern"),
};

const { ItemSetup } = require("../setup/items.const");
const { ObjectID } = require("mongodb");
const { generateUsername, generateSearchText, removeUnicode, generateAbbreviation, generateId, getRulesByGroup, parseDepartmentName, parseRoleName, generateTextEn, generateValue, consolidateTypes, normalizeWhitespace, normalizeWhitespaceInArray, getCurrentYear, splitString, checkDuplicate, generateEmailLoginByDepartment, generateEmailLoginByDepartmentRole, findDuplicateEmails, generatePassword, getRule, findItemsNotInArray, getDepartmentCounts } = require("./ultil");

class Migrate {
    constructor(path, option_read = {}, filePath ='./output/DanhSach.xlsx') {
        this.path = path;
        this.option_read = option_read;
        this.data = this.readFile(path);
        this.dbname_prefix = PNT_TENANT["dbname_prefix"];
        this.username = "system";
        this.dbname = settings.connectName.management;
        this.filePath = filePath;
        this.dataExport = [];
    }

    mapKeys() {
        this.data = this.data.map(item => {
            const newItem = {};
            Object.keys(item).forEach(key => {
                if (this.columnMapping[key]) {
                    newItem[this.columnMapping[key]] = item[key];
                }
            });
            return newItem;
        });
    }

    exportToExcel() {
        try {
            // Lấy đường dẫn thư mục từ filePath
            const dir = path.dirname(this.filePath);
    
            // Kiểm tra và tạo thư mục nếu chưa tồn tại
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
    
            // Tạo worksheet từ mảng dữ liệu
            const worksheet = XLSX.utils.json_to_sheet(this.dataExport);
    
            // Tạo workbook và thêm worksheet vào
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    
            // Ghi workbook ra file Excel
            XLSX.writeFile(workbook, this.filePath);
    
            console.log(`File Excel đã được tạo thành công tại: ${this.filePath}`);
        } catch (error) {
            console.error("Đã xảy ra lỗi khi tạo file Excel:", error);
        }
    }

    readFile(path) {
        try {
            const data = fs.readFileSync(path, "binary");
            // Phân tích dữ liệu Excel
            const workbook = XLSX.read(data, { type: "binary" });
            const firstSheetName = workbook.SheetNames[0];
            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], this.option_read);
            return normalizeWhitespaceInArray(jsonData);
        } catch (err) {
            console.error("Error reading file:", err);
        }
    }

    async migrate() {
        if (!this.data) {
            console.error("No data to insert.");
            return;
        }

        try {
            const result = await MongoDBProvider.insertMany(
                this.dbname_prefix,
                this.dbname,
                this.collection,
                this.username,
                this.data,
                // options
            );

            console.log(`Insert ${this.path} done.`);
        } catch (e) {
            console.error(`Error inserting: ${JSON.stringify(e)}`);
        }
    }
}

class MigrateCar extends Migrate {
    constructor(path) {
        super(path);
        this.collection = "directory";
        this.master_key = "vehicle_list";
        this.tranformData();
    }

    tranformData() {
        //tranformData
        this.data = this.data
            .filter((item) => item["Loại xe"])
            .map((item, index) => {
                const text = item["Loại xe"];
                const regex = /^(.*)\s\(\s*(\d+)\s*chỗ\s*\)$/;
                const match = text.match(regex);
                if (!match) {
                    return null;
                }
                const name = match[1]; // Tên xe, ví dụ: "Innova BKS"
                const seats = match[2] * 1; // Số chỗ ngồi, ví dụ: "07"

                return {
                    carnanme: name,
                    licensePlate: item["Biển số"],
                    seatingCapacity: seats,
                    master_key: this.master_key,
                    ordernumber: index + 1,
                    title: {
                        "vi-VN": name,
                        "en-US": removeUnicode(name),
                    },
                    value: item["Biển số"],
                    isactive: true,
                    id: uuidv4(),
                    title_to_search: generateSearchText(name),
                };
            })
            .filter((item) => item !== null);
        return this.data;
    }
}

class MigrateCard extends Migrate {
    constructor(path) {
        super(path);
        this.collection = "directory";
        this.master_key = "card_list";
        this.tranformData();
    }

    tranformData() {
        //tranformData
        this.data = this.data
            .filter((item) => !item["Loại xe"])
            .map((item, index) => ({
                ordernumber: index + 1,
                number_card: item["Thẻ xe/Thẻ taxi"],
                status: true,
                master_key: this.master_key,
                title: {
                    "vi-VN": item["Thẻ xe/Thẻ taxi"],
                    "en-US": item["Thẻ xe/Thẻ taxi"],
                },
                value: item["Thẻ xe/Thẻ taxi"],
                isactive: true,
                id: uuidv4(),
                title_to_search: generateSearchText(item["Thẻ xe/Thẻ taxi"]),
            }));
        return this.data;
    }
}

class MigrateRoom extends Migrate {
    constructor(path) {
        super(path);
        this.collection = "directory";
        this.master_key = "meeting_room";
        this.tranformData();
    }

    tranformData() {
        //tranformData
        this.data = this.data
            .filter((item) => item["Sức chứa"])
            .map((item, index) => ({
                ordernumber: index,
                title: {
                    "vi-VN": item["Tên phòng họp"].split("tầng")[0].trim(),
                    "en-US": removeUnicode(item["Tên phòng họp"].split("tầng")[0].trim()),
                },
                title_to_search: generateSearchText(item["Tên phòng họp"].split("tầng")[0].trim()),
                size: item["Sức chứa"] * 1,
                master_key: this.master_key,
                room_type: item["Loại"] === "Phòng học" ? "LectureHallClassroom" : "MeetingRoom",
                isactive: true,
                id: uuidv4(),
                value: this.genValue(index, item),
                code: this.genValue(index, item),
            }));
        return this.data;
    }

    genValue(index, item) {
        const first = item["Loại"] === "Phòng học" ? "GD" : "PH";
        return `${first}-${index.toString().padStart(2, "0")}`;
    }
}

class MigrateDispatch extends Migrate {
    constructor(path) {
        super(path);
        this.collection = "directory";
        this.master_key = "meeting_room";
        this.processData = {};
        this.dataTypeDispathMapping = {
            'Loại sổ riêng cho từng loại văn bản được phát hành số lượng lớn': {
                code: '{{ordernumber}}/{{documenttype}}-PNTU',
                value: 'loaisoriengchotungloaivanbanduocphathanhsoluonglon'
            },
            'Loại sổ chung cho các loại văn bản không phải là công văn và được phát hành số lượng nhỏ': {
                code: '{{ordernumber}}/{{documenttype}}-PNTU',
                value: 'loaisochungchocacloaivanbankhongphailacongvanvaduocphathanhsoluongnho'
            },
            'Loại sổ giành cho văn bản là công văn': {
                code: '{{ordernumber}}/PNTU-{{department}}',
                value: 'sogianhchovanbanlacongvan'
            },
        }
        this.tranformData();

    }

    tranformData() {
        //tranformData
        this.processData.typeDispatch = [... new Set(this.data.map(item => item[Object.keys(this.data[0])[1]]))];
        this.processData.dispatch = this.data.map(item => ({name: item[Object.keys(this.data[0])[2]], type: item[Object.keys(this.data[0])[1]], typeDispatch: item[Object.keys(this.data[0])[3]]}));
        this.tranformDataTypeDispatch();
        this.tranformDataDispatch();
        
        return this.data;
    }

    tranformDataDispatch(){
        this.processData.dispatch = consolidateTypes(this.processData.dispatch, 'name', 'type');
        this.processData.dispatch = this.processData.dispatch.map((item, index)=> ({
            ordernumber: index + 1,
            id: uuidv4(),
            title: {
                'vi-VN': item.name,
                'en-US': generateTextEn(item.name)
            },
            isactive: true,
            value: generateValue(item.name),
            title_to_search: generateSearchText(item.name),
            master_key: 'outgoing_dispatch_book',
            document_type: item.types.map(type => this.dataTypeMapping[type]),
            number_and_notation: this.dataTypeDispathMapping[item.typeDispatch].code,
            year: getCurrentYear(),
            outgoing_dispatch_book_type: this.dataTypeDispathMapping[item.typeDispatch].value
        }))
    }

    tranformDataTypeDispatch() {
        this.processData.typeDispatch = this.processData.typeDispatch.map((item, index) => ({
            ordernumber: index + 1,
            id: uuidv4(),
            title: {
                'vi-VN': item,
                'en-US': generateTextEn(item)
            },
            value: generateValue(item),
            title_to_search: generateSearchText(item),
            abbreviation: generateAbbreviation(item),
            master_key: 'kind_of_dispatch_to',
            isactive: true,
        }));

        this.dataTypeMapping = this.processData.typeDispatch.map(item => ({
            name: item.title['vi-VN'],
            value: item.value
        }))

        this.dataTypeMapping = this.dataTypeMapping.reduce((acc, item) => {
            acc[item.name] = item.value;
            return acc;
        }, {});
        
    }

    async migrate(){
        const { typeDispatch, dispatch } = this.processData;
        await MongoDBProvider.insertMany(
            this.dbname_prefix,
            this.dbname,
            this.collection,
            this.username,
            dispatch,
            // options
        );

        await MongoDBProvider.insertMany(
            this.dbname_prefix,
            this.dbname,
            this.collection,
            this.username,
            typeDispatch,
            // options
        );
    }
}

class UserMigration extends Migrate {
    constructor(path, option_read) {
        super(path, option_read);
        this.collection = "user";
        this.usernames = [];
        this.processData = {};
        this.accept_departments = [];
        this.columnMapping = {
            'Stt': 'stt',
            'Họ tên':  'fullName' ,
            'Đơn vị':  'department' ,
            'Email':  'email',
            'Chức vụ': 'position',
            'Ghi chú': 'note',
            'lead': 'lead',
            'Phó phòng': 'deputy',
        };

        this.mapKeys();

        this.positionLead = [
            'Trưởng Bộ môn',
            'Trưởng phòng',
            'Trưởng Văn phòng Khoa',
            'Trưởng Trung Tâm',
            'Trưởng Khoa',
            'Trưởng Văn Phòng Khoa',
            'Trưởng Đơn vị (TTNCYS)',
            'Trưởng Trạm',
            'Trưởng Trung tâm (kiêm nhiệm)',
            'Hiệu trưởng'
        ]

        this.positionLeadForDepartment = [
            {
                department: 'Khoa Khoa học cơ bản - Y học cơ sở',
                position: 'Trưởng Khoa'
            },
            {
                department: 'Trung tâm Nghiên cứu Y sinh',
                position: 'Trưởng Trung tâm (kiêm nhiệm)'
            }
        ]
        this.infoDepartment = this.readSheet2(path);
        this.infoLeaderLevel2 = this.readSheet3(path);
        this.infoSpecialist = this.readSheet4(path);
        this.infoStaff = this.readSheet5(path);
        this.tranformData();

        // this.processedData = this.processData();
    }

    readSheet2(path) {
        try {
            const data = fs.readFileSync(path, "binary");
            // Phân tích dữ liệu Excel
            const workbook = XLSX.read(data, { type: "binary" });
            const firstSheetName = workbook.SheetNames[1];
            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {});
            return normalizeWhitespaceInArray(jsonData);
        } catch (err) {
            console.error("Error reading file:", err);
        }
    }

    readSheet3(path) {
        try {
            const data = fs.readFileSync(path, "binary");
            // Phân tích dữ liệu Excel
            const workbook = XLSX.read(data, { type: "binary" });
            const firstSheetName = workbook.SheetNames[2];
            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {});
            return normalizeWhitespaceInArray(jsonData);
        } catch (err) {
            console.error("Error reading file:", err);
        }
    }

    readSheet4(path) {
        try {
            const data = fs.readFileSync(path, "binary");
            // Phân tích dữ liệu Excel
            const workbook = XLSX.read(data, { type: "binary" });
            const firstSheetName = workbook.SheetNames[3];
            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {});
            return normalizeWhitespaceInArray(jsonData);
        } catch (err) {
            console.error("Error reading file:", err);
        }
    }

    readSheet5(path) {
        try {
            const data = fs.readFileSync(path, "binary");
            // Phân tích dữ liệu Excel
            const workbook = XLSX.read(data, { type: "binary" });
            const firstSheetName = workbook.SheetNames[4];
            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {});
            return normalizeWhitespaceInArray(jsonData);
        } catch (err) {
            console.error("Error reading file:", err);
        }
    }

    checkLead(item){
        if(item.lead){
            return true;
        }

        if(this.positionLead.includes(item.position)){
            const department = this.positionLeadForDepartment.find(i => i.department === item.department);
            if(!department){
                return true;
            }
            return department.position === item.position;
        }

        
        return false;
    }

    createObjectsFromDepartment(data) {
        // Kiểm tra dữ liệu đầu vào
        if (!data || !data.department || !Array.isArray(data.department)) {
          return [];
        }
      
        // Duyệt qua mảng department và tạo ra mảng các đối tượng
        return data.department.map(department => ({
          ...data,
          department: [department],
        }));
    }

    splitAccountByDepartment(){
        const newItem = [];
        this.data = this.data.map(item => ({
            ...item,
            department: splitString(item.department)
        }))
        const arr1 = this.data.filter(item => item.department.length === 1);
        const arr2 = this.data.filter(item => item.department.length > 1);
        arr2.forEach(item => {
            newItem.push(...this.createObjectsFromDepartment(item))
        })
        const newData = [...arr1, ...newItem].map(item => ({
            ...item,
            department: item.department[0]
        }))
        this.data = newData;
    }

    addEmailLogin(){    
        const emailDup = checkDuplicate(this.data);
        const emailDupliEmailAndDepartment = emailDup.filter(item => item.isDuplicateEmailAndDepartment).map(item => item.email)
        const emailDupliEmail = emailDup.filter(item => item.isDuplicateEmail).map(item => item.email)

        this.data = this.data.map(item => {
            let emailLogin = item.email;
            if(emailDupliEmailAndDepartment.includes(item.email)) {
                emailLogin = generateEmailLoginByDepartmentRole(item);
            }

            if(emailDupliEmail.includes(item.email)) {
                emailLogin = generateEmailLoginByDepartment(item);
            }

            return {
                ...item,
                username: emailLogin,
            }
        })
    }

    generateEmailLogin(item){
        const emailDup = checkDuplicate(this.data);
        const exist = emailDup.find(e => e.email === item.email);
        if(!exist){
            item.emailLogin = item.email;
            return item;
        }

        if(exist.isDuplicateEmail){
            item.emailLogin = generateEmailLoginByDepartment(item);
            return item;
        }

        if(exist.isDuplicateEmailAndDepartment){
            item.emailLogin = generateEmailLoginByDepartment(item);
            return item;
        }
    }

    filterDepartment(){
        this.infoDepartment.forEach(item => {
            item['Đơn vị '] = item['Đơn vị '].split(';')[0];
        })
        this.accept_departments = this.infoDepartment.map(item => item['Đơn vị ']);
        // this.accept_departments.push('Hội đồng Trường');
        this.data = this.data.filter(item => this.accept_departments.includes(item.department));
    }

    tranformData(){
        //Lọc data k hợp lệ
        this.data = this.data.filter(item => item.position);
        this.data = this.data.filter(item => item.email && item.email !== 'NULL');

        this.data = this.data.map(item => {
            const isLead = this.checkLead(item)
            return {
                ...item,
                lead: isLead,
                deputy: !!item.deputy
            }
        });

        this.filterDepartment();

        this.splitAccountByDepartment();
        this.addEmailLogin();

        const departments = {};
        
        //add department id, add user _id
        this.data = this.data.map((item, index) => {
            let department_id;
            if(departments[item.department]){
                department_id = departments[item.department];
            }else{
                department_id = `${generateId()}${index}`;
                departments[item.department] = department_id;
            }

            return {
                ...item,
                department_id: department_id,
                _id: new ObjectID(),
                _id_employee: new ObjectID(),
                value_position: generateValue(item.position) 
            }
        })

        this.processDataDepartment()
        this.processDataPosition()
        this.processDataEmployee()
        this.processDataUser()
        this.processGroup()

    }

    exportAccount(){
        this.dataExport = this.data.map((item, index) => ({
            stt: index + 1,
            'Họ và tên': item.fullName,
            email: item.email,
            'Chức vụ': item.position,
            'Phòng ban': item.department,
            username: item.username,
            password: '123456'
        }))
        this.exportToExcel()
    }

    processGroup(){
        const groups = [];
        let ordernumber = 1;

        const leaderName = this.infoLeaderLevel2.map(item => ({ fullName: item['Họ và tên'], department: item['Đơn vị '] }));
        const usernameLead = leaderName.map(item => {
            const user = this.data.find(info => info.department === item.department && info.fullName === item.fullName);
            return user.username;
        })
        const rule = ruleDetails.find(item => item.name === 'Trưởng đơn vị cấp 2');
        const groupLeadDepartment = {
            _id: new ObjectID(),
            title_search: generateSearchText('Trưởng đơn vị cấp 2'),
            title: 'Trưởng đơn vị cấp 2',
            isactive: true,
            ordernumber: ordernumber++,
            role: [],
            user: usernameLead,
            rule: [...rule.rules]
        }
        groups.push(groupLeadDepartment);
        //Chuyên viên cấp 2
        const specialistName = this.infoSpecialist.map(item => ({ fullName: item['Họ tên'], department: item['Đơn vị'], email: item['Email'] }));
        const usernameSpecialist = specialistName.map(item => {
            const user = this.data.find(info => info.department === item.department && info.fullName === item.fullName);
            return user.username
        })
        const ruleSpecialist = ruleDetails.find(item => item.name === 'Chuyên viên văn thư đơn vị cấp 2');
        const groupSpecialist = {
            _id: new ObjectID(),
            title_search: generateSearchText('Chuyên viên văn thư đơn vị cấp 2'),
            title: 'Chuyên viên văn thư đơn vị cấp 2',
            isactive: true,
            ordernumber: ordernumber++,
            role: [],
            user: usernameSpecialist,
            rule: [...ruleSpecialist.rules]
        }
        groups.push(groupSpecialist);

        //Nhân viên
        const staffName = this.infoStaff.filter(item => item['Đơn vị'] !== 'Hội đồng Trường').map(item => ({ fullName: item['Họ tên'], department: item['Đơn vị'], email: item['Email'] }));
        const usernameStaff = staffName.map(item => {
            const user = this.data.find(info => info.department === item.department && info.fullName === item.fullName);
            return user.username
        })
        const ruleStaff = ruleDetails.find(item => item.name === 'Nhân viên');
        const groupStaff = {
            _id: new ObjectID(),
            title_search: generateSearchText('Nhân viên'),
            title: 'Nhân viên',
            isactive: true,
            ordernumber: ordernumber++,
            role: [],
            user: usernameStaff,
            rule: [...ruleStaff.rules]
        }
        groups.push(groupStaff);
        
        //Lãnh đạo VPT
        const groupVPT = this.getLDVPT(ordernumber++);
        groups.push(groupVPT);

        //Quản lí phòng học
        const groupManagerClassroom = this.getManagerClassroom(ordernumber++);
        groups.push(groupManagerClassroom);

        //Quản lí phòng học
        const groupManagerMeetingroom = this.getManagerMeetingRoom(ordernumber++);
        groups.push(groupManagerMeetingroom);

        //Lãnh đạo phòng học
        const groupLeadClassroom = this.getLeadClassroom(ordernumber++);
        groups.push(groupLeadClassroom);

        //Lãnh đạo phòng họp
        const groupLeadMeetingroom = this.getLeadMeetingroom(ordernumber++);
        groups.push(groupLeadMeetingroom);

        //Lãnh hiệu trưởng
        const groupHT = this.getHT(ordernumber++);
        groups.push(groupHT);

        //Quản lí xe
        const groupManagerCar = this.getManagerCar(ordernumber++);
        groups.push(groupManagerCar);

        this.processData.groups = groups;
    }

    getLDVPT(ordernumber){
        const emails = ['danhpc@pnt.edu.vn']
        const rules = JSON.parse(JSON.stringify(ruleDetails))
        const users = this.data.filter(item => emails.includes(item.email)).map(item=>item.username);
        const ruleInfo = rules.find(item => item.name === 'Lãnh đạo VPT')
        return {
            _id: new ObjectID(),
            title_search: generateSearchText('Lãnh đạo VPT'),
            title: 'Lãnh đạo VPT',
            isactive: true,
            ordernumber: ordernumber,
            role: [],
            user: users,
            rule: [...ruleInfo.rules]
        }
    }

    getManagerMeetingRoom(ordernumber){
        const emails = ['linhttm@pnt.edu.vn']
        const users = this.data.filter(item => emails.includes(item.email)).map(item=>item.username);
        const ruleInfo = ruleDetails.find(item => item.name === 'Phụ trách quản lí phòng họp')
        return {
            _id: new ObjectID(),
            title_search: generateSearchText('Phụ trách quản lí phòng họp'),
            title: 'Phụ trách quản lí phòng họp',
            isactive: true,
            ordernumber: ordernumber,
            role: [],
            user: users,
            rule: [...ruleInfo.rules]
        }
    }

    getManagerClassroom(ordernumber){
        const emails = ['chunghh@pnt.edu.vn']
        const rules = JSON.parse(JSON.stringify(ruleDetails));
        const users = this.data.filter(item => emails.includes(item.email)).map(item=>item.username);
        const ruleInfo = rules.find(item => item.name === 'Phụ trách quản lí phòng học')
        return {
            _id: new ObjectID(),
            title_search: generateSearchText('Phụ trách quản lí phòng học'),
            title: 'Phụ trách quản lí phòng học',
            isactive: true,
            ordernumber: ordernumber,
            role: [],
            user: users,
            rule: [...ruleInfo.rules]
        }
    }

    getLeadClassroom(ordernumber){
        const emails = ['chibdp@pnt.edu.vn']
        const rules = JSON.parse(JSON.stringify(ruleDetails));
        const users = this.data.filter(item => emails.includes(item.email)).map(item=>item.username);
        const ruleInfo = rules.find(item => item.name === 'Lãnh đạo phòng học')
        return {
            _id: new ObjectID(),
            title_search: generateSearchText('Lãnh đạo phòng học'),
            title: 'Lãnh đạo phòng học',
            isactive: true,
            ordernumber: ordernumber,
            role: [],
            user: users,
            rule: [...ruleInfo.rules]
        }
    }

    getLeadMeetingroom(ordernumber){
        const emails = ['danhpc@pnt.edu.vn']
        const rules = JSON.parse(JSON.stringify(ruleDetails));
        const users = this.data.filter(item => emails.includes(item.email)).map(item=>item.username);
        const ruleInfo = rules.find(item => item.name === 'Lãnh đạo phòng họp')

        return {
            _id: new ObjectID(),
            title_search: generateSearchText('Lãnh đạo phòng họp'),
            title: 'Lãnh đạo phòng họp',
            isactive: true,
            ordernumber: ordernumber,
            role: [],
            user: users,
            rule: [...ruleInfo.rules]
        }
    }

    getHT(ordernumber){
        const emails = ['nguyenthanhhiep@pnt.edu.vn']
        // console.log(ruleDetails)

        const rules = JSON.parse(JSON.stringify(ruleDetails));

        const users = this.data.filter(item => emails.includes(item.email)).map(item=>item.username);

        const ruleInfo = rules.find(item => item.name === 'Hiệu trưởng');

        return {
            _id: new ObjectID(),
            title_search: generateSearchText('Hiệu trưởng'),
            title: 'Hiệu trưởng',
            isactive: true,
            ordernumber: ordernumber,
            role: [],
            user: users,
            rule: [...ruleInfo.rules]
        }

    }

    getManagerCar(ordernumber){
        const emails = ['linhttm@pnt.edu.vn']
        const rules = JSON.parse(JSON.stringify(ruleDetails));
        const users = this.data.filter(item => emails.includes(item.email)).map(item=>item.username);
        const ruleInfo = rules.find(item => item.name === 'Phụ trách quản lí xe/thẻ')
        return {
            _id: new ObjectID(),
            title_search: generateSearchText('Phụ trách quản lí xe/thẻ'),
            title: 'Phụ trách quản lí xe/thẻ',
            isactive: true,
            ordernumber: ordernumber,
            role: [],
            user: users,
            rule: [...ruleInfo.rules]
        }
    }

    processDataUser(){
        const dataUser = this.data.map(item =>{
            return {
                _id: item._id,
                username: item.username,
                title: item.fullName,
                title_search: generateSearchText(item.fullName),
                password: generatePassword(item),
                language:{
                    current: "vi-VN"
                },
                isactive: true,
                rule:[
                    {
                        rule: "Authorized"
                    }
                ],
                role: [],
                employee: item._id_employee,
                department: item.department_id,
                competence: item.value_position,
            }
        })

        this.processData.users = dataUser;
    }

    processDataEmployee(){
        const dataEmployee = this.data.map(item => {
            return {
                _id: item._id_employee,
                fullname: item.fullName,
                department: item.department_id,
                username: item.username,
                competence: item.value_position,
                update_mission_general: true,
                title_to_search: generateSearchText(item.fullName)
            }
        })

        this.processData.employees = dataEmployee;
    }

    processDataPosition(){
        const positions = [... new Set(this.data.map(item => item.position))]
        const dataPosition = positions.map((position, index)=>{
            const value = this.data.find(item => item.position === position).value_position
            return {
                _id: new ObjectID(),
                master_key: "competence",
                title: {
                    'vi-VN': position,
                    'en-US': generateTextEn(position),
                },
                value: value,
                ordernumber: index + 1,
                isactive: true,
                title_to_search: generateSearchText(position),
                id: `${generateId()}${index}`
            }
        })

        this.processData.positions = dataPosition;
    }

    processDataDepartment(){
        const departments = [... new Set(this.data.map(item => item.department))]
        const dataDepartment = departments.map((department, index) =>{
            const id = this.data.find(item => item.department === department).department_id;
            // const leaderDepartment = this.data.find(item => item.department === department && item.lead)
            let leader;
            let leaderExternal;

            const departmentInfo = this.infoDepartment.find(item => item['Đơn vị '] === department);
            if(departmentInfo){
                leader = this.data.find(item => item.fullName === departmentInfo['Trưởng phó đơn vị '] && item.department === departmentInfo['Đơn vị '])
                leaderExternal = this.data.find(item => item.fullName === departmentInfo['Lãnh đạo nhóm đơn vị '] && item.department === 'Phòng Ban Giám Hiệu');
            }

            return {
                _id: new ObjectID(),
                ordernumber: index + 1,
                title: {
                    'vi-VN': department,
                    'en-US': generateTextEn(department),
                },
                title_search: generateSearchText(department),
                parent: [],
                isactive: true,
                level: 1,
                id: id,
                type: "department",
                role: [],
                competence: [],
                abbreviation: generateAbbreviation(department),
                departmentLeader: leader ? leader.username : null,
                leader: leaderExternal ? leaderExternal.username : null
            }
        });
        this.processData.departments = dataDepartment;
    }


    async migrate() {
        // if (!this.processedData) {
        //     console.error("No data to insert.");
        //     return;
        // }

        const { users, employees, departments, positions, groups } = this.processData;

        try {
            // Remove role property from users before insertion
            // const cleanedUsers = usersInfo.map(({ role, ...user }) => {
            //     if(role[0] === 'tài xế xe'){
            //         user.role = ['Driver'];
            //     }
            //     return user;
            // });

            // Insert users
            await MongoDBProvider.insertMany_onManagement(this.dbname_prefix, "user", this.username, users);

            // Insert employees
            await MongoDBProvider.insertMany_onOffice(this.dbname_prefix, "employee", this.username, employees);

            // // Insert groups
            await MongoDBProvider.insertMany_onManagement(this.dbname_prefix, "group", this.username, groups);

            // // Insert department
            await MongoDBProvider.insertMany_onOffice(this.dbname_prefix, "organization", this.username, departments);

            // // Insert position
            await MongoDBProvider.insertMany_onManagement(this.dbname_prefix, "directory", this.username, positions);

            this.dataExport = this.data.map((user, index) => ({
                'STT': index + 1,
                'Họ tên': user.fullName,
                'Phòng ban': user.department,
                'Email': user.email,
                'Tài khoản': user.username,
                'password': 123456,
            }));

            // this.exportToExcel();

            console.log(`Migration completed successfully for ${this.path}`);
        } catch (error) {
            console.error(`Migration failed: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}

function initResource() {
    // initResource.initIO();
    return Promise.all([_initResource.initMongoDB(), _initResource.initRedis()]);
}

function migrateCollection() {
    const dfdAr = [];
    let collectionOffice = CollectionSetup.getOfficeCollections();
    let collectionManagement = CollectionSetup.getManagementCollections();
    let collectionBasic = CollectionSetup.getBasicCollections();
    let collectionEducation = CollectionSetup.getEducationCollections();

    collectionOffice.forEach((collection) => {
        dfdAr.push(MongoDBProvider.createCollection_onOffice(PNT_TENANT["dbname_prefix"], collection.name));
    });
    collectionManagement.forEach((collection) => {
        dfdAr.push(MongoDBProvider.createCollection_onManagement(PNT_TENANT["dbname_prefix"], collection.name));
    });
    collectionBasic.forEach((collection) => {
        dfdAr.push(MongoDBProvider.createCollection_onBasic(PNT_TENANT["dbname_prefix"], collection.name));
    });
    collectionEducation.forEach((collection) => {
        dfdAr.push(
            MongoDBProvider.createCollection(
                PNT_TENANT["dbname_prefix"],
                settings.connectName.education,
                collection.name,
            ),
        );
    });
    return q.all(dfdAr).then(
        function () {
            console.log("Migrate collection done");
        },
        function (err) {
            console.error(err);
        },
    );
}

function clearAllIndex(){
    const dfdAr = [];
    dfdAr.push(MongoDBProvider.clearAllIndexes(PNT_TENANT["dbname_prefix"], settings.connectName.office));
    dfdAr.push(MongoDBProvider.clearAllIndexes(PNT_TENANT["dbname_prefix"], settings.connectName.basic));
    dfdAr.push(MongoDBProvider.clearAllIndexes(PNT_TENANT["dbname_prefix"], settings.connectName.management));
    dfdAr.push(MongoDBProvider.clearAllIndexes(PNT_TENANT["dbname_prefix"], settings.connectName.education));

    return q.all(dfdAr);
}

function migrateIndex() {
    const dfdAr = [];

    

    // Hàm chung để tạo index cho từng nhóm collection
    function createIndexes(indexGroup, createIndexFn) {
        indexGroup.forEach((collection) => {
            for (const item of collection.items) {
                dfdAr.push(createIndexFn(PNT_TENANT["dbname_prefix"], collection.nameCollection, item.keys, item.type));
            }
        });
    }

    // Tạo index cho từng nhóm sử dụng hàm chung
    createIndexes(IndexConst.office, MongoDBProvider.createIndex_onOffice);
    createIndexes(IndexConst.education, MongoDBProvider.createIndex_onEducation);
    createIndexes(IndexConst.management, MongoDBProvider.createIndex_onManagement);
    createIndexes(IndexConst.basic, MongoDBProvider.createIndex_onBasic);

    return q.all(dfdAr).then(function () {
        console.log("Migrate index done");
    });
}

function migrateSetting() {
    const dfdAr = [];
    ItemSetup.allItems("management").forEach((item) => {
        // dfdAr.push(
        //     MongoDBProvider.insertMany_onManagement(PNT_TENANT["dbname_prefix"], item.name, "system", item.items),
        // );

        const items = ['user']
        if(items.includes(item.name)){
            dfdAr.push(
                MongoDBProvider.insertMany_onManagement(PNT_TENANT["dbname_prefix"], item.name, "system", item.items),
            );
        }
    });

    ItemSetup.allItems("office").forEach((item) => {
        dfdAr.push(MongoDBProvider.insertMany_onOffice(PNT_TENANT["dbname_prefix"], item.name, "system", item.items));
    });

    // ItemSetup.allItems("basic").forEach((item) => {
    //     dfdAr.push(MongoDBProvider.insertMany_onBasic(PNT_TENANT["dbname_prefix"], item.name, "system", item.items));
    // });
    return q.all(dfdAr).then(function () {
        console.log("Migrate setup done");
    });
}

function clearDB() {
    const dfdAr = [];
    dfdAr.push(MongoDBProvider.clearAllData(PNT_TENANT["dbname_prefix"], settings.connectName.office));
    dfdAr.push(MongoDBProvider.clearAllData(PNT_TENANT["dbname_prefix"], settings.connectName.basic));
    dfdAr.push(MongoDBProvider.clearAllData(PNT_TENANT["dbname_prefix"], settings.connectName.management));
    dfdAr.push(MongoDBProvider.clearAllData(PNT_TENANT["dbname_prefix"], settings.connectName.education));
    return q.all(dfdAr).then(
        function () {
            console.log("Clear DB");
        },
        function (err) {
            console.error(err);
        },
    );
}

function rollbackMigrate() {
    return clearDB().then(() => {
        console.log("rollback successfully");
    });
}

function clearV1(){
    const dfdAr = [];
    const managements = ['user', 'group']
    const offices = ['employee', 'organization', 'notify', 'registration']
    managements.forEach(item => {
        dfdAr.push(MongoDBProvider.delete_onManagement(PNT_TENANT["dbname_prefix"], item, "system", {}))
    })

    offices.forEach(item => {
        dfdAr.push(MongoDBProvider.delete_onOffice(PNT_TENANT["dbname_prefix"], item, "system", {}))
    })

    return q.all(dfdAr)
}

initResource().then(async function () {
    try {
        // await clearDB();
        // await clearAllIndex();
        // await migrateCollection();
        // await migrateIndex();
        // await migrateSetting();

        // const migrateRoom = new MigrateRoom(process.env.PATH_ROOM_MIGRATE);
        // await migrateRoom.migrate();

        // const migrateCar = new MigrateCar(process.env.PATH_CAR);
        // await migrateCar.migrate();

        // const migrateCard = new MigrateCard(process.env.PATH_CAR);
        // await migrateCard.migrate();
        
        const migrateUser = new UserMigration(process.env.PATH_USER, { range: 4 });
        await migrateUser.migrate();

        console.log('Migrate done')
        

        // const migrateDispatch = new MigrateDispatch(process.env.PATH_CV_DI);
        // await migrateDispatch.migrate();
    } catch (e) {
        console.error(e);
        // await rollbackMigrate();
    }

    process.exit(0);
});
