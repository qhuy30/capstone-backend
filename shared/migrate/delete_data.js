const fs = require('fs');
const XLSX = require('xlsx');
require('dotenv').config();
const { MongoDBProvider } = require('../mongodb/db.provider.js');
const { MongoDBCore } = require('../mongodb/mongodb.core.js');
const settings = require('../mongodb/mongodb.const');
const PNT_TENANT = require('../multi_tenant/pnt-tenant');
var _initResource = require('../init').init;
function initResource() {
    // initResource.initIO();
    return Promise.all([
        _initResource.initMongoDB(),
        _initResource.initRedis(),
    ]);
}


async function deleteUser(){
    // Đường dẫn tới file Excel
    const path = path_delete;
    const dbname_prefix = PNT_TENANT['dbname_prefix'];
    // Đọc file Excel dưới dạng nhị phân
    const data = fs.readFileSync(path, 'binary');

    // Phân tích dữ liệu Excel
    var workbook = XLSX.read(data, { type: "binary" });
    var firstSheetName = workbook.SheetNames[0];
    var jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);

    const users = jsonData.map(item=>item.username);
   
    initResource().then(function(){
        try{
            console.log(users)
            MongoDBProvider.delete_onManagement(
                dbname_prefix,
                'user',
                'sonbm',
                {username: { $in:users }}
            ).then(function(rs){
            }, function(err){ console.log(err) })

            MongoDBProvider.delete_onOffice(
                dbname_prefix,
                'employee',
                'sonbm',
                {username: { $in:users }}
            ).then(function(rs){
            }, function(err){ console.log(err) })
        }catch(e){
            console.log(e)
        }
    });
}

async function deleteDepartment(){
    // Đường dẫn tới file Excel
    const path_delete = process.env.PATH_DELETE_DEPARTMENT;

    const path = path_delete;
    const dbname_prefix = PNT_TENANT['dbname_prefix'];
    // Đọc file Excel dưới dạng nhị phân
    const data = fs.readFileSync(path, 'binary');

    // Phân tích dữ liệu Excel
    var workbook = XLSX.read(data, { type: "binary" });
    var firstSheetName = workbook.SheetNames[0];
    var jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);

    const departments = jsonData.map(item=>item.department);
   
    initResource().then(function(){
        try{
            MongoDBProvider.delete_onOffice(
                dbname_prefix,
                'organization',
                'sonbm',
                { abbreviation: { $in:departments } }
            ).then(function(rs){
            }, function(err){ console.log(err) })
        }catch(e){
            console.log(e)
        }
    });
}

exports.deleteUser = deleteUser;
exports.deleteDepartment = deleteDepartment;