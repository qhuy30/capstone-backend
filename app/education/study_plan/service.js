const { forEach } = require('../../../shared/localization/office/vi-VN');
const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const q = require('q');
const moment = require('moment');

// let myDirname = __dirname;
const reader = require('xlsx');

// const file = reader.readFile(myDirname + '/file/a.xlsx');

// const sheets = file.SheetNames;

let default_date;
let ClassId;
let StudyYear;
let WeekAndTime;
let rowError = '';

const dayOfWeekVNT = [{ 'Chủ Nhật': 'Sun' }, { 'Thứ Hai': 'Mon' }, { 'Thứ Ba': 'Tue' }, { 'Thứ Tư': 'Wed' }, { 'Thứ Năm': 'Thu' }, { 'Thứ Sáu': 'Fri' }, { 'Thứ Bảy': 'Sat' }];

const DOW = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

function setDefaultDateToCompare(timerange, nk) {
    let years = nk.split('-');
    let from_to = timerange.split('-');

    let dayMonth = from_to[0].split('/');
    let day = dayMonth[0];
    let month = dayMonth[1];

    return new Date(month + '/' + day + '/' + years[0]);
}

function findDate(dayOfWeek, timerange, nk) {
    let years = nk.split('-');
    let from_to = timerange.split('-');

    let dayMonth = from_to[0].split('/');
    let day = dayMonth[0];
    let month = dayMonth[1];

    let dayMonth1 = from_to[1].split('/');
    let day1 = dayMonth1[0];
    let month1 = dayMonth1[1];

    let start = new Date(month + '/' + day + '/' + years[0]);
    let end = new Date(month1 + '/' + day1 + '/' + years[0]);

    if (start < default_date) {
        start = new Date(month + '/' + day + '/' + years[1]);
        end = new Date(month1 + '/' + day1 + '/' + years[1]);
    }

    if (end < start) {
        end = new Date(month1 + '/' + day1 + '/' + years[1]);
    }

    let endSaturday = new Date(end);
    endSaturday.setDate(endSaturday.getDate() + 1);

    let listDateOfThisWeek = [start];

    while (start < endSaturday) {
        let date = new Date(start);
        date.setDate(date.getDate() + 1);
        listDateOfThisWeek.push(date);
        start = date;
    }

    let mappingDay = dayOfWeekVNT.find(day => Object.keys(day)[0] === dayOfWeek);

    let result = listDateOfThisWeek.find(day => Object.values(mappingDay)[0] === day.toString().substring(0, 3));

    return moment.utc(result).utcOffset('+07:00').toDate().getTime();
}

function convertTime(time) {
    let times = time.split(' - ');
    let startHour = times[0].split('g')[0];
    let startMinute = times[0].split('g')[1];

    let endHour = times[1].split('g')[0];
    let endMinute = times[1].split('g')[1];

    return [`${startHour}:${startMinute}:00`, `${endHour}:${endMinute}:00`];
}

function abbGroupMapping(input) {
    const separateInput = input.split('/');
    const outputList = [];
    separateInput.forEach(item => {
        let abbName;
        if (!item.includes('.')) {
            abbName = item;
        }

        if (abbName) {
            const abbGroup = separateInput.filter(childItem => childItem.includes(abbName));

            if (abbGroup.length > 1) {
                const abb = abbGroup.find(item => { return !item.includes('.'); });
                const groups = abbGroup.filter(item => { return item != abb });
                outputList.push({abb, groups})
            } else {
                outputList.push({abb: abbGroup[0], groups: []});
            }
        }
    });

    return outputList;
}

function separateAbbreviation (input) {
    let output = [];
    if (input.includes('/')) {
        const separate = input.split('/');
        const abbOnly = separate.filter(item => !item.includes('.'));
        output = [...abbOnly];
    } else {
        output.push(input);
    }

    return output;
}

class StudyPlanService {
    constructor() {}

    insert_study_plans(dbname_prefix, username, data) {
        let dfd = q.defer();

        // for (var i in data) {
        //     MongoDBProvider.getOne_onEducation(dbname_prefix)
        // }

        MongoDBProvider.insertMany_onEducation(dbname_prefix, 'study_plan', username, data).then(
            function () {
                dfd.resolve(true);
            },
            function (err) {
                dfd.reject(err);
            }
        );
        return dfd.promise;
    }

    getAndUpdateOrInsertStudyPlan(dbname_prefix, username, data) {
        let dfd = q.defer();
        MongoDBProvider.load_onEducation(dbname_prefix, 'study_plan', {
            $and: [{ class_id: { $eq: data.class_id } }, { study_date: { $eq: data.study_date } }, { time_start: { $eq: data.time_start } }, { time_end: { $eq: data.time_end } }],
        }).then(
            function (response) {
                if (response.length > 0) {
                    MongoDBProvider.update_onEducation(
                        dbname_prefix,
                        'study_plan',
                        username,
                        { _id: { $eq: new require('mongodb').ObjectID(response[0]._id) } },
                        {
                            $set: {
                                department_in_charge: data.department_in_charge,
                                form_of_teaching: data.form_of_teaching,
                                location: data.location,
                                semester: data.semester,
                                study_year: data.study_year,
                                subject_title: data.subject_title,
                                teacher_name: data.teacher_name,
                                week_number: data.week_number,
                                abbreviation: data.abbreviation,
                                curriculum_id: data.curriculum_id,
                                groups: data.groups
                            },
                        }
                    )
                        .then((ress) => {
                            dfd.resolve(true);
                            response = undefined;
                        })
                        .catch((error) => {
                            console.log('👁️👁️  ~ file: service.js:140 ~ StudyPlanService ~ getAndUpdateOrInsertStudyPlan ~ error:', error);
                            dfd.reject(error);
                            error = undefined;
                            response = undefined;
                        });
                } else {
                    MongoDBProvider.insert_onEducation(dbname_prefix, 'study_plan', username, data)
                        .then(() => {
                            dfd.resolve(true);
                            response = undefined;
                        })
                        .catch((errr) => {
                            dfd.reject(errr);
                            errr = undefined;
                            response = undefined;
                        });
                }
                dfd.resolve(response);
            },
            function (err) {
                dfd.reject(err);
            }
        );
        return dfd.promise;
    }

    convertXlsxToJson(sheetLichGiang, sheetDMHP) {
        let dfd = q.defer();

        try {
            let ScheduleOnTime = [];
            const worksheetForSchedule = sheetLichGiang;
            const sheetSchedule = reader.utils.sheet_to_json(worksheetForSchedule);

            ClassId = Object.keys(sheetSchedule[0])[0];
            StudyYear = Object.values(sheetSchedule[0])[0];
            const firstRow = sheetSchedule[0];
            const arr = Object.keys(firstRow).map((key) => [key, firstRow[key]]);
            WeekAndTime = arr.slice(1);

            default_date = setDefaultDateToCompare(WeekAndTime[0][1], StudyYear);

            WeekAndTime.forEach((week) => {
                let dayOfWeek;
                let start;
                let close;
                let abbSubject;
                let studyWeek = week[0];
                let studyDate = week[1];
                let count = 0;
                let isSequence = 0;
                let mergedSubjectName;
                for (let j = 1; j < sheetSchedule.length; j++) {
                    const row = sheetSchedule[j];
                    rowError = row;
                    let currentSubject = row[studyWeek];

                    if (currentSubject && currentSubject === abbSubject) {
                        isSequence += 1;
                    }

                    if (!abbSubject) {
                        dayOfWeek = DOW[count];
                        abbSubject = currentSubject;
                        start = convertTime(row['Giờ Học'])[0];
                    } else if (abbSubject !== currentSubject) {
                        dayOfWeek = DOW[count];

                        if (abbSubject && abbSubject !== mergedSubjectName) {
                            let data = {
                                class_id: ClassId,
                                department_in_charge: null,
                                form_of_teaching: null,
                                location: null,
                                semester: null,
                                day_of_week: dayOfWeek,
                                study_date: findDate(dayOfWeek, studyDate, StudyYear),
                                study_year: StudyYear,
                                time_start: start,
                                time_end: close,
                                subject_title: null,
                                teacher_name: null,
                                week_number: studyWeek,
                                abbreviation: abbSubject,
                                curriculum_id: null,
                            };
                            ScheduleOnTime.push(data);
                            isSequence = 0;
                            mergedSubjectName = undefined;
                        }

                        abbSubject = currentSubject;
                        start = convertTime(row['Giờ Học'])[0];
                    } else if (abbSubject !== currentSubject && isSequence >= 1) {
                        dayOfWeek = DOW[count];

                        if (abbSubject) {
                            let data = {
                                class_id: ClassId,
                                department_in_charge: null,
                                form_of_teaching: null,
                                location: null,
                                semester: null,
                                day_of_week: dayOfWeek,
                                study_date: findDate(dayOfWeek, studyDate, StudyYear),
                                study_year: StudyYear,
                                time_start: start,
                                time_end: close,
                                subject_title: null,
                                teacher_name: null,
                                week_number: studyWeek,
                                abbreviation: abbSubject,
                                curriculum_id: null,
                            };
                            ScheduleOnTime.push(data);
                            isSequence = 0;
                        }

                        abbSubject = currentSubject;
                        start = convertTime(row['Giờ Học'])[0];
                    } else if (DOW[count] !== DOW[0] && row[ClassId] && row[ClassId] !== DOW[count]) {
                        dayOfWeek = DOW[count];
                        mergedSubjectName = abbSubject;

                        if (mergedSubjectName) {
                            let data = {
                                class_id: ClassId,
                                department_in_charge: null,
                                form_of_teaching: null,
                                location: null,
                                semester: null,
                                day_of_week: dayOfWeek,
                                study_date: findDate(dayOfWeek, studyDate, StudyYear),
                                study_year: StudyYear,
                                time_start: start,
                                time_end: close,
                                subject_title: null,
                                teacher_name: null,
                                week_number: studyWeek,
                                abbreviation: abbSubject,
                                curriculum_id: null,
                            };
                            ScheduleOnTime.push(data);
                            isSequence = 0;
                        }

                        abbSubject = currentSubject ? currentSubject : abbSubject;
                        start = convertTime(row['Giờ Học'])[0];
                    }

                    close = convertTime(row['Giờ Học'])[1];

                    // Change the next day of week
                    if (row['Giờ Học'] === '07g30 - 08g20') {
                        count += 1;
                    }

                    // Show Saturday's schedule
                    if (count === 6 && close === '17:20:00' && abbSubject) {
                        dayOfWeek = DOW[count];
                        let data = {
                            class_id: ClassId,
                            department_in_charge: null,
                            form_of_teaching: null,
                            location: null,
                            semester: null,
                            day_of_week: dayOfWeek,
                            study_date: findDate(dayOfWeek, studyDate, StudyYear),
                            study_year: StudyYear,
                            time_start: start,
                            time_end: close,
                            subject_title: null,
                            teacher_name: null,
                            week_number: studyWeek,
                            abbreviation: abbSubject,
                            curriculum_id: null,
                        };
                        ScheduleOnTime.push(data);
                    }

                    // Check the last row
                    if (dayOfWeek === 'Thứ Bảy' && close === '17:20:00') {
                        break;
                    }
                }
            });

            let listOfAbbreviations = [];
            ScheduleOnTime.forEach((item) => {
                listOfAbbreviations.push(item.abbreviation);
            });
            let listOfAbbreviationUnique = [...new Set(listOfAbbreviations)];

            let mappingAbbreviationData = [];
            const worksheetForSubjectDetail = sheetDMHP;
            const subjectDetail = reader.utils.sheet_to_json(worksheetForSubjectDetail);

            // Check existing data in DMHP
            let columnData = [];
            for (const cellAddress in worksheetForSubjectDetail) {
                if (cellAddress.startsWith('I')) {
                    const cell = worksheetForSubjectDetail[cellAddress];
                    columnData.push(cell.v);
                }
            }
            columnData.splice(0, 1);

            let copiedOfListAbbUniq = [];
            ScheduleOnTime.forEach((item) => {
                copiedOfListAbbUniq.push(...separateAbbreviation(item.abbreviation));
            });

            let listAbbNotExist = [];
            [...new Set(copiedOfListAbbUniq)].forEach(abb => {
                const mappingAbb = columnData.filter(actualAbb => actualAbb.includes(abb));
                if (mappingAbb.length === 0) {
                    listAbbNotExist.push(abb);
                }
            });

            if (listAbbNotExist.length > 0) {
                dfd.reject({ path: "StudyPlanService.convertXlsxToJson", mes: `Một số môn học trong sheet LICHGIANG không tồn tại trong sheet DMHP: ${JSON.stringify(listAbbNotExist)}` });
            }

            listOfAbbreviationUnique.forEach((item) => {
                const dataInItem = abbGroupMapping(item);
                dataInItem.forEach(data => {
                    const { abb, groups } = data;
                    let row = subjectDetail.find(item => Object.values(item).includes(abb));
                    if (row) {
                        let data = {
                            orginalAbbreviation: item,
                            abbreviation: abb,
                            curriculum_id: row.__EMPTY_8,
                            subject_title: row.__EMPTY,
                            department_in_charge: row.__EMPTY_6,
                            groups
                        };
                        mappingAbbreviationData.push(data);
                    } else {
                        // Skip for these subjects are not in the 2nd sheet
                        ScheduleOnTime.splice(ScheduleOnTime.indexOf(ScheduleOnTime.find(sc => sc.abbreviation === item)), 1);
                    }
                });
            });

            // Adding completed information
            let finalData = [];
            ScheduleOnTime.forEach(item => {
                let abb = item.abbreviation;
                let mapping = mappingAbbreviationData.filter(map => map.orginalAbbreviation === abb);
                if (mapping.length === 1) {
                    mapping.forEach(curMapping => {
                        item.abbreviation = curMapping.abbreviation;
                        item.curriculum_id = curMapping.curriculum_id;
                        item.subject_title = curMapping.subject_title;
                        item.department_in_charge = curMapping.department_in_charge;
                        item.groups = curMapping.groups;
                    });
                    finalData.push(item);
                } else if (mapping.length > 1) {
                    mapping.forEach(curMapping => {
                        let mappedData = JSON.parse(JSON.stringify(item));
                        mappedData.abbreviation = curMapping.abbreviation;
                        mappedData.curriculum_id = curMapping.curriculum_id;
                        mappedData.subject_title = curMapping.subject_title;
                        mappedData.department_in_charge = curMapping.department_in_charge;
                        mappedData.groups = curMapping.groups;
                        finalData.push(mappedData);
                    });
                }
            });

            dfd.resolve(finalData);
            rowError = '';
        } catch (error) {
            console.log('===<<>>=== ~ file: service.js:206 ~ convertXlsxToJson ~ error:', error);
            dfd.reject({ path: "StudyPlanService.convertXlsxToJson", mes: `Dữ liệu ${JSON.stringify(rowError)} đang không đúng định dạng, vui lòng kiểm tra lại file` });
            rowError = '';
        }

        return dfd.promise;
    }

    upload_file(dbname_prefix, username, data) {
        return MongoDBProvider.insert_onEducation(dbname_prefix, 'file_upload', username, data);
    }

    get_files_upload(dbname_prefix, username, filter, top, offset, sort) {
        return MongoDBProvider.load_onEducation(dbname_prefix, 'file_upload', filter, top, offset, sort);
    }

    count_files_upload(dbname_prefix, filter) {
        return MongoDBProvider.count_onEducation(dbname_prefix, 'file_upload', filter);
    }

    update_file(dbname_prefix, username, id, value, history) {
        return MongoDBProvider.update_onEducation(dbname_prefix, "file_upload", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            {
                $set: { value: value },
                $push: { "history": history }
            });
    }
}

exports.StudyPlanService = new StudyPlanService();
