const allLanguageItemsVi = require('@shared/localization/vi-VN.concern');
const allLanguageItemsEn = require('@shared/localization/en-US.concern');
const cluster = require('cluster');
var trycatch = require('trycatch');

var stringToKeys = function (keys_req, show) {
    var keys_ = keys_req;
    var keys;
    trycatch(function () {
        var key_array = keys_.split("|");
        keys = {};
        key_array.forEach(function (item) {
            keys[item.toString()] = show;
            if (item.toString() == "_id") {
                keys[item.toString()] = false;
            }
        })
    }, function (err) {
        keys = null;
        console.log(err);
    });
    return keys;
};

var getIP = function (req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

var reques_log = function (request) {
    var clientIPaddr = null,
        clientProxy = null;

    // is client going through a proxy?
    if (request.headers['via']) { // yes
        clientIPaddr = request.headers['x-forwarded-for'];
        clientProxy = request.headers['via'];
    } else { // no
        clientIPaddr = request.connection.remoteAddress;
        clientProxy = "none";
    }
    //var pathname = url.parse(request.url).pathname;
    //if (pathname != "/favicon.ico") {
    //    console.log("&gt;&gt; Request for " + pathname);
    //    console.log("&gt;&gt;&gt; Client : " + request.headers['user-agent']);
    //    console.log("&gt;&gt;&gt; IP address " + clientIPaddr + " via proxy " + clientProxy);
    //}

    console.log("&gt;&gt;&gt; Client : " + request.headers['user-agent']);
    console.log("&gt;&gt;&gt; IP address " + clientIPaddr + " via proxy " + clientProxy);

    // rest of request handling code
}

function objectIsRealValue(obj) {
    return obj && obj !== 'null' && obj !== 'undefined';
}

function objectIsEmpty(obj) {

    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0) return false;
    if (obj.length === 0) return true;

    // If it isn't an object at this point
    // it is empty, but it can't be anything *but* empty
    // Is it empty?  Depends on your application.
    if (typeof obj !== "object") return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}

var JObjectSort = function (JObject) {
    var myObj = JObject;
    var keys = Object.keys(myObj),
        i, len = keys.length;

    keys.sort();

    var ordered = {};

    for (i = 0; i < len; i++) {
        ordered[keys[i]] = myObj[keys[i]];
        //alert(k + ':' + myObj[k]);
    }

    return ordered;
}

var removeUnicode = function (value) {
    if (typeof value === 'number') { value = value.toString(); }
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
}
var removeUnicode_UpperCase = function (value) {
    if (typeof value === 'number') { value = value.toString(); }
    if (typeof value !== "string") return value;
    var str = value;
    str = str.toUpperCase();
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, " ");
    str = str.replace(/ + /g, " ");
    str = str.trim();
    return str;
}

var generateSearchText = function (value) {
    if (typeof value === 'number') { value = value.toString(); }
    if (typeof value !== "string") return value;
    let result = "";
    result += removeUnicode(value);
    // result += " "+removeUnicode_UpperCase(value);
    return result;
}

const countFilter = function (body, fieldSearchAr) {
    let count = 0;
    for (var i in fieldSearchAr) {
        if (body[fieldSearchAr[i]] !== undefined && body[fieldSearchAr[i]] !== "") {
            count++;
        }
    }
    return count;
}

const genFilter = function (body, count, fieldSearchAr) {
    if (count == 0) { return {}; }
    if (count == 1) {
        let filter = {};
        for (var i in fieldSearchAr) {
            if (body[fieldSearchAr[i]] !== undefined && body[fieldSearchAr[i]] !== "") {
                switch (fieldSearchAr[i]) {
                    case "search":
                        filter = {
                            $text: { $search: body[fieldSearchAr[i]] }
                        };
                        break;
                    default:
                        filter[fieldSearchAr[i]] = { $eq: body[fieldSearchAr[i]] };
                }
            }
        }
        return filter;
    }

    let filter = { $and: [] };
    for (var i in fieldSearchAr) {
        if (body[fieldSearchAr[i]] !== undefined && body[fieldSearchAr[i]] !== "") {
            switch (fieldSearchAr[i]) {
                case "search":
                    filter.$and.push({
                        $text: { $search: body[fieldSearchAr[i]] }
                    });
                    break;
                default:
                    let item = {};
                    item[fieldSearchAr[i]] = { $eq: body[fieldSearchAr[i]] };
                    filter.$and.push(item);
            }
        }
    }

    return filter;
}

const NumberToStringForDate = function (input) {
    input = input + "";
    input = parseInt(input);
    if (input > 9) {
        return input + "";
    } else {
        return "0" + input;
    }
}
const generateDBName = function (domain) {
    domain = domain.replace(/[.:]/g, "_");
    return domain;
}

if (Array.prototype.equals) {
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
}

// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l = this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}

const getCurrentDate = function () {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
}

const praseStringToObject = function (value, defaultVal = null) {
    try {
        return JSON.parse(value);
    } catch (error) {
        return defaultVal || value;
    }
};

const isValidValue = function (value) {
    if (!value) return false;
    if (["undefined", "null"].includes(value)) return false;
    return true;
};

const getValidValue = function (value, defaultValue = null) {
    if (isValidValue(value)) {
        return value;
    } else {
        return defaultValue;
    }
};

const getDbNamePrefix = function (request) {
    return request.body._service[0].dbname_prefix;
};

const isMasterCluster = function () {
    // Handle for pm2 cluster mode
    if (process.env.NODE_APP_INSTANCE === '0') {
        return true;
    }

    // Handle for node cluster mode
    return cluster.isMaster;
};

const generateParent = function (parents, parent) {
    let max = 0;

    let thisParents = JSON.parse(JSON.stringify(parents));
    for (let x of thisParents) {
        if (x.order > max) { max = x.order }
        delete x["$$hashKey"];
    }

    if (parent && (parent.id || parent.code)) {
        thisParents.push({
            order: max + 1,
            code: parent.code,
            id: parent.id,
            object: parent.object
        });
    }
    return thisParents;
}

const removeHashKey = function(arr){
    if(Array.isArray(arr)){
        for (let x of arr) {
            delete x["$$hashKey"];
        }
    }
    return arr
}

const generateLocalizeTitle = function (title) {
    if (!title) {
        return null;
    }

    if (typeof title === "string") {
        return {
            "vi-VN": title,
            "en-US": title,
        };
    }

    if (title["vi-VN"] && title["en-US"]) {
        return title;
    }

    return title;
};

const filterLanguage = function(key, languageCurrent) {
    if(languageCurrent === 'vi-VN'){
        const rs = allLanguageItemsVi.find(item => item.key === key);
        if(rs){
            return rs.value;
        }
    }
    if(languageCurrent === 'en-US'){
        const rs = allLanguageItemsEn.find(item => item.key === key);
        if(rs){
            return rs.value;
        }
    }
    return null;
}

function convertToEndOfDay(timestamp) {
    // Tạo một đối tượng Date từ timestamp
    const date = new Date(timestamp);
  
    date.setHours(23, 59, 59, 999);
  
    return date.getTime();
}

function convertToStartOfDay(timestamp) {
    // Tạo một đối tượng Date từ timestamp
    const date = new Date(timestamp);
  
    // Đặt giờ, phút, giây và mili giây về 0
    date.setHours(0, 0, 0, 0);
  
    return date.getTime();
} 

function genFilterRuleUser(rule, itemDepartment, anyCondition = []) {
    if (!Array.isArray(rule)){
        rule = [rule];
    }

    const filterNotify = [
        // Stage 1: Lookup để lấy thông tin từ bảng group
        {
          $lookup: {
            from: "group",
            let: { user_name: "$username" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$$user_name", "$user"]
                  }
                }
              }
            ],
            as: "group_info"
          }
        },
      
        // Stage 2: Unwind group_info (nếu user không thuộc group nào thì vẫn giữ lại)
        {
          $unwind: {
            path: "$group_info",
            preserveNullAndEmptyArrays: true
          }
        },
      
        // Stage 3: Match các điều kiện về rule và department
        {
          $match: {
            $or: [
                ...anyCondition,
              // Kiểm tra rule từ user
              {
                $or: [
                  // Case 1: type = working -> check department = 1
                  {
                    rule: {
                      $elemMatch: {
                        rule: { $in: rule },
                        "details.type": "Working",
                      }
                    },
                    department: { $eq: itemDepartment }
                  },
                  // Case 2: type = all -> không check department
                  {
                    rule: {
                      $elemMatch: {
                        rule: { $in: rule },
                        "details.type": "All"
                      }
                    }
                  },
                  // Case 3: type = custom -> check department trong array
                  {
                    rule: {
                      $elemMatch: {
                        rule: { $in: rule },
                        "details.type": "Specific",
                        "details.department": { $eq: itemDepartment }
                      }
                    }
                  },
                  // Case 4: No details -> chỉ cần check rule
                    {
                        rule: {
                            $elemMatch: {
                                rule: { $in: rule },
                                details: { $exists: false } // Check if details field is missing
                            }
                        }
                    }
                ]
              },
              
              // Kiểm tra rule từ group
              {
                $or: [
                  // Case 1: type = working -> check department = 1  
                  {
                    "group_info.rule": {
                      $elemMatch: {
                        rule: { $in: rule },
                        "details.type": "Working"
                      }
                    },
                    department: { $eq: itemDepartment }
                  },
                  // Case 2: type = all -> không check department
                  {
                    "group_info.rule": {
                      $elemMatch: {
                        rule: { $in: rule }, 
                        "details.type": "All"
                      }
                    }
                  },
                  // Case 3: type = custom -> check department trong array
                  {
                    "group_info.rule": {
                      $elemMatch: {
                        rule: { $in: rule },
                        "details.type": "Specific",
                        "details.department": { $eq: itemDepartment }
                      }
                    }
                  },
                  {
                    "group_info.rule": {
                        $elemMatch: {
                            rule: { $in: rule },
                            details: { $exists: false } // Check if details field is missing
                        }
                    }
                    }
                ]
              }
            ]
          }
        },
      
        // Stage 4: Project kết quả
        {
          $project: {
            _id: 0,
            username: 1,
            department: 1,
            user_rules: "$rule",
            group_rules: "$group_info.rule"
          }
        }
    ];

    return filterNotify;
}

const genFilterByRule = ({offset, top, rule, search, anyCondition = []}) => {
    // Ensure rule is always an array
    if (!Array.isArray(rule)) {
        rule = [rule];
    }

    const matchConditions = {
        $or: [
            ...anyCondition,
            // Check user's direct rules
            {
                $or: [
                    // Case 1: type !== None
                    {
                        rule: {
                            $elemMatch: {
                                rule: { $in: rule },
                                "details.type": { $ne: "None" },
                            }
                        },
                    },
                    // Case 2: No details field
                    {
                        rule: {
                            $elemMatch: {
                                rule: { $in: rule },
                                details: { $exists: false }
                            }
                        }
                    }
                ]
            },
            // Check group rules
            {
                $or: [
                    // Case 1: type !== None
                    {
                        "group_info.rule": {
                            $elemMatch: {
                                rule: { $in: rule },
                                "details.type": { $ne: "None" }
                            }
                        },
                    },
                    // Case 2: No details field
                    {
                        "group_info.rule": {
                            $elemMatch: {
                                rule: { $in: rule },
                                details: { $exists: false }
                            }
                        }
                    }
                ]
            }
        ],
        isactive: true
    };

    // Add text search if search parameter exists
    if (search) {
        matchConditions.$text = { $search: search };
    }

    const pipeline = [
        // Stage 1: Lookup group information
        {
            $lookup: {
                from: "group",
                let: { user_name: "$username" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $in: ["$$user_name", "$user"]
                            }
                        }
                    }
                ],
                as: "group_info"
            }
        },

        // Stage 2: Add first group info instead of unwind
        {
            $addFields: {
                group_info: { 
                    $cond: {
                        if: { $eq: [{ $size: "$group_info" }, 0] },
                        then: null,
                        else: { $arrayElemAt: ["$group_info", 0] }
                    }
                }
            }
        },

        // Stage 3: Match conditions
        {
            $match: matchConditions
        },

        // Stage 4: Project to select specific fields
        // {
        //     $project: {
        //         _id: 1,
        //         username: 1,
        //         rule: 1,
        //         isactive: 1,
        //         group_info: 1,
        //         // Add other fields you need
        //     }
        // },

        // Stage 5: Pagination
        {
            $skip: offset
        },
        {
            $limit: top
        }
    ];

    return pipeline;
};

const genFilterCountByRule = ({ rule, search, anyCondition = [] }) => {
    if (!Array.isArray(rule)) {
        rule = [rule];
    }

    const matchConditions = {
        $or: [
            ...anyCondition,
            // Kiểm tra rule từ user
            {
                $or: [
                    // Case 1: type !== None
                    {
                        rule: {
                            $elemMatch: {
                                rule: { $in: rule },
                                "details.type": { $ne: "None" },
                            }
                        },
                    },
                    // Case 2: No details -> chỉ cần check rule
                    {
                        rule: {
                            $elemMatch: {
                                rule: { $in: rule },
                                details: { $exists: false }
                            }
                        }
                    }
                ]
            },
            // Kiểm tra rule từ group
            {
                $or: [
                    // Case 1: type !== None
                    {
                        "group_info.rule": {
                            $elemMatch: {
                                rule: { $in: rule },
                                "details.type": { $ne: "None" }
                            }
                        },
                    },
                    {
                        "group_info.rule": {
                            $elemMatch: {
                                rule: { $in: rule },
                                details: { $exists: false }
                            }
                        }
                    }
                ]
            }
        ],
        isactive: true // Thêm điều kiện isactive vào đây
    };

    // Thêm điều kiện $text search nếu có biến search
    if (search) {
        matchConditions.$text = { $search: search };
    }

    const filterCount = [
        // Stage 1: Lookup để lấy thông tin từ bảng group
        {
            $lookup: {
                from: "group",
                let: { user_name: "$username" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $in: ["$$user_name", "$user"]
                            }
                        }
                    }
                ],
                as: "group_info"
            }
        },

        // Stage 2: Unwind group_info (nếu user không thuộc group nào thì vẫn giữ lại)
        {
            $unwind: {
                path: "$group_info",
                preserveNullAndEmptyArrays: true
            }
        },

        // Stage 3: Match các điều kiện về rule và department
        {
            $match: matchConditions
        },

        // Stage 4: Count tổng số kết quả
        {
            $count: "count"
        }
    ];

    return filterCount;
};

const genFilterGetUsersByRule = (rule) => {
    if (!Array.isArray(rule)) {
        rule = [rule];
    }

    return [
        // Bước 1: Nối với collection 'group'
        {
            $lookup: {
                from: 'group',
                localField: 'username', // Trường trong 'user' để nối
                foreignField: 'user', // Trường trong 'group' chứa danh sách user
                as: 'groupInfo' // Kết quả nối sẽ nằm trong 'groupInfo'
            }
        },
        // Bước 2: Lọc các document có `rule` khớp trong `user.rule` hoặc `group.rule`
        {
            $match: {
                $or: [
                    { 
                        rule: { 
                            $elemMatch: { rule: { $in: rule } }
                        } 
                    },
                    { 
                        'groupInfo.rule': { 
                            $elemMatch: { rule: { $in: rule } }
                        }
                    }
                ]
            }
        },
        // Bước 3: Chỉ lấy các trường cần thiết
        {
            $project: {
                username: 1,
                _id: 0
            }
        }
    ];
}

const genFilterGetUsersByRuleAndDepartment = (rule, departments) => {
    if (!Array.isArray(rule)) {
        rule = [rule];
    }
    if (!Array.isArray(departments)) {
        departments = [departments];
    }


    return [
        // Bước 1: Kết nối với collection 'group'
        {
            $lookup: {
                from: 'group',
                localField: 'username', // Trường trong 'user' để nối
                foreignField: 'user', // Trường trong 'group' chứa danh sách user
                as: 'groupInfo' // Kết quả nối sẽ nằm trong 'groupInfo'
            }
        },
        // Bước 2: Áp dụng các điều kiện lọc
        {
            $match: {
                $or: [
                    // Điều kiện lọc trong 'user.rule'
                    {
                        $or: [
                            // Case 1: type = Working -> kiểm tra department
                            {
                                rule: {
                                    $elemMatch: {
                                        rule: { $in: rule },
                                        "details.type": "Working"
                                    }
                                },
                                department: { $in: departments }
                            },
                            // Case 2: type = All -> không kiểm tra department
                            {
                                rule: {
                                    $elemMatch: {
                                        rule: { $in: rule },
                                        "details.type": "All"
                                    }
                                }
                            },
                            // Case 3: type = Specific -> kiểm tra department trong array
                            {
                                rule: {
                                    $elemMatch: {
                                        rule: { $in: rule },
                                        "details.type": "Specific",
                                        "details.department": { $in: departments } 
                                    }
                                }
                            },
                            // Case 4: Không có details -> chỉ kiểm tra rule và department
                            {
                                rule: {
                                    $elemMatch: {
                                        rule: { $in: rule },
                                        details: { $exists: false }
                                    }
                                },
                                department: { $in: departments }
                            }
                        ]
                    },
                    // Điều kiện lọc trong 'group.rule'
                    {
                        $or: [
                            // Case 1: type = Working -> kiểm tra department
                            {
                                "groupInfo.rule": {
                                    $elemMatch: {
                                        rule: { $in: rule },
                                        "details.type": "Working"
                                    }
                                },
                                department: { $in: departments }
                            },
                            // Case 2: type = All -> không kiểm tra department
                            {
                                "groupInfo.rule": {
                                    $elemMatch: {
                                        rule: { $in: rule },
                                        "details.type": "All"
                                    }
                                }
                            },
                            // Case 3: type = Specific -> kiểm tra department trong array
                            {
                                "groupInfo.rule": {
                                    $elemMatch: {
                                        rule: { $in: rule },
                                        "details.type": "Specific",
                                        "details.department": { $in: departments } 
                                    }
                                }
                            },
                            // Case 4: Không có details -> chỉ kiểm tra rule
                            {
                                "groupInfo.rule": {
                                    $elemMatch: {
                                        rule: { $in: rule },
                                        details: { $exists: false }
                                    }
                                },
                                department: { $in: departments }
                            }
                        ]
                    }
                ]
            }
        },
        // Bước 3: Lựa chọn các trường cần thiết
        {
            $project: {
                username: 1,
                _id: 0
            }
        }
    ];
};



const getWeekNumber = function(timestamp) {
    // Tạo Date object từ timestamp
    let d = new Date(timestamp);
  
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return weekNo;
}

function removeNullKeys(obj) {
    if (Array.isArray(obj)) {
        // Xử lý nếu là mảng: chỉ lọc undefined và NaN
        return obj
            .map(item => (typeof item === 'object' ? removeNullKeys(item) : item))
            .filter(item => item !== undefined && !Number.isNaN(item));
    } else if (typeof obj === 'object' && obj !== null) {
        // Xử lý nếu là đối tượng: đệ quy vào từng key
        return Object.keys(obj).reduce((acc, key) => {
            const value = obj[key];
            if (value !== undefined && !Number.isNaN(value)) {
                // Nếu là object, gọi lại hàm
                acc[key] = (typeof value === 'object') ? removeNullKeys(value) : value;
            }
            return acc;
        }, {});
    }
    return obj;
}

function renameKeysDeep(data, keyMap) {
    // Helper: Hàm đổi key theo keyMap cho một object đơn
    const renameObjectKeys = (obj, keyMap) => {
        const newObj = {};
        for (const key in obj) {
            // Tìm key mới trong keyMap
            const mapping = keyMap.find(({ old_key }) => old_key === key);
            const newKey = mapping ? mapping.new_key : key;

            // Gán giá trị mới, xử lý đệ quy nếu giá trị là object hoặc array
            newObj[newKey] = (typeof obj[key] === 'object' && obj[key] !== null)
                ? renameKeysDeep(obj[key], keyMap)
                : obj[key];
        }
        return newObj;
    };

    // Xử lý cho array
    if (Array.isArray(data)) {
        return data.map(item => renameKeysDeep(item, keyMap));
    }

    // Xử lý cho object
    if (typeof data === 'object' && data !== null) {
        return renameObjectKeys(data, keyMap);
    }

    // Trả về nếu data không phải là object hoặc array
    return data;
}

function extractStringBetweenSlashes(path) {
    const match = path.match(/\/([^\/]+)\//);
    return match ? match[1] : null;
}

// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", { enumerable: false });
exports.generateParent = generateParent;
exports.NumberToStringForDate = NumberToStringForDate;
exports.countFilter = countFilter;
exports.genFilter = genFilter;
exports.removeUnicode = removeUnicode;
exports.removeUnicode_UpperCase = removeUnicode_UpperCase;
exports.generateSearchText = generateSearchText;
exports.stringToKeys = stringToKeys;
exports.getIP = getIP;
exports.reques_log = reques_log;
exports.objectIsRealValue = objectIsRealValue;
exports.objectIsEmpty = objectIsEmpty;
exports.JObjectSort = JObjectSort;
exports.generateDBName = generateDBName;
exports.getCurrentDate = getCurrentDate;
exports.praseStringToObject = praseStringToObject;
exports.isValidValue = isValidValue;
exports.getValidValue = getValidValue;
exports.getDbNamePrefix = getDbNamePrefix;
exports.isMasterCluster = isMasterCluster;
exports.generateLocalizeTitle = generateLocalizeTitle;
exports.filterLanguage = filterLanguage;
exports.convertToEndOfDay = convertToEndOfDay;
exports.convertToStartOfDay = convertToStartOfDay;
exports.genFilterRuleUser = genFilterRuleUser;
exports.getWeekNumber = getWeekNumber;
exports.genFilterByRule = genFilterByRule;
exports.genFilterCountByRule = genFilterCountByRule;
exports.removeNullKeys = removeNullKeys;
exports.genFilterGetUsersByRule = genFilterGetUsersByRule;
exports.genFilterGetUsersByRuleAndDepartment = genFilterGetUsersByRuleAndDepartment
exports.removeHashKey = removeHashKey;
exports.renameKeysDeep = renameKeysDeep;
exports.extractStringBetweenSlashes = extractStringBetweenSlashes;
