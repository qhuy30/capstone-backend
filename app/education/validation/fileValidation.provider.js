const xlsx = require('xlsx');

const readExcelFile = (req) => {
    const excelData = req.file.buffer;
    return xlsx.read(excelData, { type: 'buffer' });
}

function fileValidate (workbooks) {
    let errMsgList = [];
    let errCodeList = [];
    
    const worksheetForSchedule = workbooks.Sheets['LICHGIANG'];
    const worksheetForSubjectDetail = workbooks.Sheets['DMHP'];

    // 1st, workbooks include 2 sheet with name: LICHGIANG and DMHP
    if (!worksheetForSchedule) {
        errMsgList.push(`File không bao gồm sheet có tên \"LICHGIANG\"`);
    }

    if (!worksheetForSubjectDetail) {
        errMsgList.push(`File không bao gồm sheet có tên \"DMHP\"`);
    }

    const sheetSchedule = xlsx.utils.sheet_to_json(worksheetForSchedule);
    const sheetScheduleFormulae = xlsx.utils.sheet_to_formulae(worksheetForSchedule);

    // 2nd, the value in A1 is class ID
    if (Object.keys(sheetSchedule[0])[0] === '__EMPTY' || !worksheetForSchedule['A1'].v) {
        errMsgList.push(`Dữ liệu tại vị trí A1 không chứa \"Mã Lớp Học\"`);
    }

    // 3rd, the value in A2 is a study year
    const regexOfStudyYear = /^\d{4}-\d{4}$/;
    if (!regexOfStudyYear.test(Object.values(sheetSchedule[0])[0]) || !regexOfStudyYear.test(worksheetForSchedule['A2'].v)) {
        errMsgList.push(`Dữ liệu tại vị trí A2 không phải là năm học hoặc sai format: YYYY-YYYY, ví dụ: \"2023-2024\"`);
    }
    
    // 4th, the value in B1 and B2 is "Giờ Học"
    if ((worksheetForSchedule['B1'] && worksheetForSchedule['B1'].v !== 'Giờ Học' && !worksheetForSchedule['B2'] && worksheetForSchedule['B3'].v === '07g30 - 08g20') || worksheetForSchedule['B2']) {
        errMsgList.push(`Dữ liệu tại vị trí B1 và B2 phải được hợp nhất lại với nhau với dữ liệu chuẩn là \"Giờ Học\"`)
    }

    // 5th, verify the data in the first row
    const firstRow = sheetSchedule[0];
    let arr = Object.keys(firstRow).map(key => [key, firstRow[key]]);
    const WeekAndTime = arr.slice(1);
    const regexForWeek = /^Tuần ?\d{2}$/;
    const regexForTime = /^\d{2}\/\d{2}(\-\d{2}\/\d{2})?$/;
    WeekAndTime.forEach(item => {
        // Validate for week format
        if (!regexForWeek.test(item[0])) {
            errMsgList.push(`Định dạng của tuần học không đúng với giá trị hiện tại là \"${item[0]}\" tại vị trí KEY_WEEK`);
            errCodeList.push({ key: 'KEY_WEEK', value: item[0] });
        }

        // Validate for time format
        if (!regexForTime.test(item[1])) {
            errMsgList.push(`Định dạng của giờ học không đúng với giá trị hiện tại là \"${item[1]}\" tại vị trí KEY_TIME`);
            errCodeList.push({ key: 'KEY_TIME', value: item[1] });
        }
    });

    // 6th, verify the data in the first column with day of week
    const dayOfWeekFromData = [];
    const classId = worksheetForSchedule['A1'].v;
    const standardOfDOW = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    sheetSchedule.forEach(item => {
        if (item[classId]) {
            dayOfWeekFromData.push(item[classId]);
        }
    });

    dayOfWeekFromData.splice(0, 1);
    if (standardOfDOW.length !== dayOfWeekFromData.length 
        || !standardOfDOW.every(item => dayOfWeekFromData.includes(item)) 
        || JSON.stringify(standardOfDOW) !== JSON.stringify(dayOfWeekFromData)) {
        errMsgList.push(`Dữ liệu của cột đầu tiên \(Cột A\) không phải là ngày trong tuần hoặc sai format, dữ liệu đúng là từ Thứ Hai đến Thứ Bảy`);
    }

    const regexForDOW = /^Thứ (Hai|Ba|Tư|Năm|Sáu|Bảy)$/;
    dayOfWeekFromData.forEach(item => {
        if (!regexForDOW.test(item)) {
            errMsgList.push(`Định dạng dữ liệu của ngày trong tuần không đúng với giá trị hiện tại là \"${item}\" tại vị trí KEY_DOW`);
            errCodeList.push({ key: 'KEY_DOW', value: item });
        }
    });

    errCodeList.forEach(code => {
        sheetScheduleFormulae.forEach(item => {
            const value = item.split("='");
            const place = value[0];
            const actualValue = value[1];
            if (actualValue === code.value) {
                let indexOfCode = errMsgList.indexOf(errMsgList.find(err => { return err.includes(code.key) }));
                let errMsg = errMsgList[indexOfCode];
                errMsgList[indexOfCode] = errMsg.replace(code.key, place);
            }
        });
    });

    // 7th, verify data in DMHP
    let column_B = [];
    let column_I = [];
    let column_J = [];
    for (const cellAddress in worksheetForSubjectDetail) {
        if (cellAddress.startsWith('B')) {
            const cell = worksheetForSubjectDetail[cellAddress];
            column_B.push(cell.v);
        } else if (cellAddress.startsWith('I')) {
            const cell = worksheetForSubjectDetail[cellAddress];
            column_I.push(cell.v);
        } else if (cellAddress.startsWith('J')) {
            const cell = worksheetForSubjectDetail[cellAddress];
            column_J.push(cell.v);
        }
    }
    if (!column_B[0] || !column_I[0] || !column_J[0] 
        ||column_B[0].toUpperCase() !== 'TÊN HỌC PHẦN'
        || column_I[0].toUpperCase() !== 'DANH MỤC TỪ VIẾT TẮT'
        || column_J[0].toUpperCase() !== 'MÃ HỌC PHẦN') {
        errMsgList.push(`Trong sheet DMHP, thứ tự các cột không đúng vị trí. Mặc định như sau: cột B - TÊN HỌC PHẦN, cột I - DANH MỤC TỪ VIẾT TẮT, cột J - MÃ HỌC PHẦN`);
    }

    return errMsgList;
}

class FileValidationProvider{

    constructor() {};

    validationRules(req, res, next) {
        const workbooks = readExcelFile(req);

        const fileValidateRules = fileValidate(workbooks);
        if (fileValidateRules.length > 0) {
            res.status(422).json({
                status: 'error',
                message: 'Something error in the inputing file',
                data: fileValidateRules
            });

            res.end();
        } else {
            next();
        }

    }

}

exports.FileValidationProvider = new FileValidationProvider();