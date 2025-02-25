const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const q = require('q');
const reader = require('xlsx');

function convertToEpochTime(dateString) {
    const date = new Date(dateString);
    return date.getTime();
}
function foundKey(jsonData, searchValue) {
    const result = Object.keys(jsonData).find((key) => {
        return jsonData[key].toLowerCase() === searchValue.toLowerCase();
    });
    return result;
}

function numberToColumn(number) {
    let column = '';
    while (number > 0) {
        let remainder = (number - 1) % 26;
        column = String.fromCharCode(65 + remainder) + column;
        number = Math.floor((number - 1) / 26);
    }
    return column;
}

function compareExcelColumns(a, b) {
    const colA = a.length;
    const colB = b.length;

    if (colA !== colB) {
        return colA - colB;
    }

    return a.localeCompare(b);
}

function addMinutes(time, minutes) {
    let date = new Date('1970-01-01T' + time);
    date.setMinutes(date.getMinutes() + minutes);
    let result = date.toTimeString().slice(0, 5);
    return result;
}

class ExamScheduleService {
    constructor() {}

    insert_study_plans(dbname_prefix, username, data) {
        let dfd = q.defer();

        MongoDBProvider.insertMany_onEducation(dbname_prefix, 'exam_schedule', username, data).then(
            function () {
                dfd.resolve(true);
            },
            function (err) {
                dfd.reject(err);
            }
        );
        return dfd.promise;
    }

    getAndUpdateOrInsertExamSchedule(dbname_prefix, username, data) {
        let dfd = q.defer();
        MongoDBProvider.load_onEducation(dbname_prefix, 'exam_schedule', {
            $and: [{ class_id: { $eq: data.class_id } }, { exam_date: { $eq: data.exam_date } }, { time_start: { $eq: data.time_start } }, { time_end: { $eq: data.time_end } }],
        }).then(
            function (response) {
                if (response.length > 0) {
                    MongoDBProvider.update_onEducation(
                        dbname_prefix,
                        'exam_schedule',
                        username,
                        { _id: { $eq: new require('mongodb').ObjectID(response[0]._id) } },
                        {
                            $set: {
                                data,
                            },
                        }
                    )
                        .then((ress) => {
                            dfd.resolve(true);
                            response = undefined;
                        })
                        .catch((error) => {
                            dfd.reject(error);
                            error = undefined;
                            response = undefined;
                        });
                } else {
                    MongoDBProvider.insert_onEducation(dbname_prefix, 'exam_schedule', username, data)
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

    convertXlsxToJson(sheetLichThi, sheetDMHT) {
        let dfd = q.defer();

        try {
            let dataDMMT = reader.utils.sheet_to_json(sheetDMHT, { raw: false, header: 'A', blankrows: false });

            dataDMMT.splice(0, 3);
            const keysDMMT = Object.keys(dataDMMT[0]);

            // Convert first dataLichThi
            const dataLichThi = reader.utils.sheet_to_json(sheetLichThi, { raw: false, header: 'A', blankrows: false });
            // Get all key of first column
            let keysLichThi = Object.keys(dataLichThi[0]);
            const merges = sheetLichThi['!merges'] || [];

            const mergesColumn = merges.filter((merge) => merge.s.r === merge.e.r);
            mergesColumn.sort((a, b) => a.s.c - b.s.c);

            // Handle merge multiple column
            let count = 0;

            mergesColumn.forEach((merge) => {
                if (merge.s.r === merge.e.r) {
                    // Get start and end of merge
                    const start = merge.s.c;
                    const end = merge.e.c;
                    const row = merge.s.r;
                    const dataStart = dataLichThi[row][keysLichThi[start - count]];
                    for (let i = merge.s.c; i < end; i++) {
                        let charCode = numberToColumn(i + 2);

                        if (!(charCode in dataLichThi[row])) {
                            dataLichThi[row][charCode] = dataStart;
                        }
                        count++;
                    }
                }
            });

            // Set new keys
            keysLichThi = Object.keys(dataLichThi[0]);
            keysLichThi.sort(compareExcelColumns);
            // Handle merge multiple cell
            merges.forEach((merge) => {
                // handle merge cell
                if (merge.s.c === merge.e.c) {
                    const start = merge.s.r;
                    const end = merge.e.r;
                    const column = keysLichThi[merge.s.c];
                    let dataStart = dataLichThi[start][column];
                    if (!dataStart) {
                        const loopIndex = end - start;
                        for (var index = 1; index <= loopIndex; index++) {
                            if (dataLichThi[start + 1][column]) {
                                dataStart = dataLichThi[start + 1][column];
                                break;
                            }
                        }
                    }

                    for (let i = start; i < end; i++) {
                        if (!dataLichThi[i + 1][column]) {
                            dataLichThi[i + 1][column] = dataStart;
                        }
                    }
                }
            });
            const dataConvert = [];

            for (let item = 1; item < dataLichThi.length; item++) {
                // get all key of item
                let keysItem = Object.keys(dataLichThi[item]);
                // Remove key A for time column
                let newKeysItem = keysItem.filter((ki) => ki !== keysLichThi[0] && dataLichThi[item][ki]);
                if (newKeysItem.length > 0) {
                    for (const i in newKeysItem) {
                        const keyExamScheduleId = foundKey(dataDMMT[0], 'Mã Môn Thi');
                        const keyClasId = foundKey(dataDMMT[0], 'MÃ LỚP');
                        const keySubjectTitle = foundKey(dataDMMT[0], 'TÊN HỌC PHẦN');
                        const keyLocation = foundKey(dataDMMT[0], 'Địa điểm');
                        const keySupervisor = foundKey(dataDMMT[0], 'Giám thị');
                        const descriptionExamSchedule = dataDMMT.find((de) => de[keyExamScheduleId].toUpperCase().trim() === dataLichThi[item][newKeysItem[i]].toUpperCase().trim()) || {};

                        if (Object.keys(descriptionExamSchedule).length > 0) {
                            let dataItem = {
                                start_time: dataLichThi[item][keysLichThi[0]],
                                end_time: dataLichThi[item][keysLichThi[0]],
                                exam_date: convertToEpochTime(dataLichThi[0][newKeysItem[i]]),
                                exam_schedule_id: descriptionExamSchedule[keyExamScheduleId],
                                class_id: descriptionExamSchedule[keyClasId],
                                subject_title: descriptionExamSchedule[keySubjectTitle] || '',
                                location: descriptionExamSchedule[keyLocation] || '',
                                supervisor: descriptionExamSchedule[keySupervisor] || '',
                            };
                            dataConvert.push(dataItem);
                        }
                    }
                }
            }
            const map = new Map();
            dataConvert.forEach((item) => {
                const key = item.exam_schedule_id + '_' + item.exam_date;
                if (!map.has(key)) {
                    map.set(key, { ...item });
                } else {
                    const existing = map.get(key);

                    if (existing.end_time < item.end_time) {
                        existing.end_time = item.end_time;
                    }
                }
            });
            const resultLichThi = Array.from(map.values());
            let isFirst = true;

            for (const key in dataLichThi[0]) {
                if (isFirst) {
                    delete dataLichThi[0][key];
                    isFirst = false;
                }
            }

            const dateValues = Object.values(dataLichThi[0]).map((value) => convertToEpochTime(value));
            dfd.resolve({ data: resultLichThi, listDate: dateValues });
        } catch (error) {
            console.log('===<<>>=== ~ file: service.js:206 ~ convertXlsxToJson ~ error:', error);
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

exports.ExamScheduleService = new ExamScheduleService();
