const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const q = require('q');
const { RingBellItemService } = require('../../management/ringbell_item/service');

function findMaxDateObject(arr) {
    let maxDateObject = arr[0];

    arr.forEach((item) => {
        if (item.create_date > maxDateObject.create_date) {
            maxDateObject = item;
        }
    });

    return maxDateObject;
}

class QuestionAnswerService {
    constructor() {}
    createFrequentlyQuestions(body) {
        let dfd = q.defer();

        MongoDBProvider.load_onEducation(body._service[0].dbname_prefix, 'frequently_questions', { question: { $eq: body.question } })
            .then((data) => {
                if (data[0]) {
                    dfd.reject({ path: 'createFrequentlyQuestions', mes: 'Câu hỏi đã tồn tại' });
                } else {
                    let date = new Date();
                    let now = date.getTime();
                    let item = {
                        question: body.question,
                        answer: body.answer,
                        subject: body.subject || '',
                        type_question: body.type_question || '',
                        create_date: now,
                        username: body.username,
                        department: body.department || '',
                        status: body.status || '',
                        fullName: body.fullName || '',
                        event: [{ username: body.username, time: now, action: 'Created' }],
                    };
                    MongoDBProvider.insert_onEducation(body._service[0].dbname_prefix, 'frequently_questions', body.username, item)
                        .then(() => {
                            dfd.resolve(true);
                            body = undefined;
                            data = undefined;
                        })
                        .catch((e) => {
                            dfd.reject(false);
                            e = undefined;
                            body = undefined;
                            data = undefined;
                        });
                }
            })
            .catch((error) => {
                dfd.reject(false);
                body = undefined;
                error = undefined;
            });

        return dfd.promise;
    }

    createListQuestions(body) {
        let dfd = q.defer();

        MongoDBProvider.load_onEducation(body._service[0].dbname_prefix, 'types_question', { title_vi: { $eq: body.title_vi } })
            .then((data) => {
                if (data[0]) {
                    dfd.reject({ path: 'createListQuestions', mes: 'This type of question is exists' });
                } else {
                    let date = new Date();
                    let now = date.getTime();
                    let item = {
                        id: body.id,
                        title_vi: body.title_vi,
                        title_en: body.title_en || '',
                        value: body.value || '',
                        active: body.active || true,
                        create_date: now,
                        event: [{ username: body.username, time: now, action: 'Created' }],
                    };
                    MongoDBProvider.insert_onEducation(body._service[0].dbname_prefix, 'types_question', body.username, item)
                        .then(() => {
                            dfd.resolve(true);
                            body = undefined;
                            data = undefined;
                        })
                        .catch((e) => {
                            dfd.reject(false);
                            e = undefined;
                            body = undefined;
                            data = undefined;
                        });
                }
            })
            .catch((error) => {
                dfd.reject(false);
                body = undefined;
                error = undefined;
            });

        return dfd.promise;
    }

    loadListFrequentlyQuestions(dbname_prefix, filter, top, offset, sort) {
        return MongoDBProvider.load_onEducation(dbname_prefix, 'frequently_questions', filter, top, offset, sort, { _id: true, question: true, answer: true, type_question: true, create_date: true, event: true, entity: true });
    }

    loadListTypeOfQuestions(dbname_prefix, filter, top, offset, sort) {
        return MongoDBProvider.load_onEducation(dbname_prefix, 'types_question', filter, top, offset, sort, { _id: true, title_vi: true, title_en: true, value: true, active: true, create_date: true, event: true });
    }

    loadDetailsFrequentlyQuestionById(dbname_prefix, qaID) {
        let dfd = q.defer();
        MongoDBProvider.load_onEducation(dbname_prefix, 'frequently_questions', { _id: { $eq: new require('mongodb').ObjectId(qaID) } }, 0, 0, {}, { _id: true, question: true, answer: true, type_question: true, create_date: true, event: true, entity: true }).then(
            (data) => {
                dfd.resolve(data[0]);
            },
            (err) => {
                dfd.reject(err);
            }
        );
        return dfd.promise;
    }

    updateFrequentlyQuestions(body) {
        let dfd = q.defer();
        let item = {
            question: body.question,
            answer: body.answer,
            type_question: body.type_question || '',
            username: body.username,
        };
        let date = new Date();
        MongoDBProvider.update_onEducation(
            body._service[0].dbname_prefix,
            'frequently_questions',
            body.username,
            { _id: { $eq: new require('mongodb').ObjectID(body.id) } },
            {
                $set: item,
                $push: { event: { username: body.username, time: date.getTime(), action: 'UpdatedInformation' } },
            }
        ).then(
            function () {
                dfd.resolve(true);
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            }
        );
        return dfd.promise;
    }

    updateListTypeOfQuestions(body) {
        let dfd = q.defer();
        let item = {
            id: body.id,
            title_vi: body.title_vi,
            title_en: body.title_en || '',
            value: body.value || '',
            active: body.active || true,
        };
        let date = new Date();
        MongoDBProvider.update_onEducation(
            body._service[0].dbname_prefix,
            'types_question',
            body.username,
            { _id: { $eq: new require('mongodb').ObjectID(body.id) } },
            {
                $set: item,
                $push: { event: { username: body.username, time: date.getTime(), action: 'UpdatedInformation' } },
            }
        ).then(
            function () {
                dfd.resolve(true);
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            }
        );
        return dfd.promise;
    }

    deleteFrequentlyQuestions(body) {
        let dfd = q.defer();
        let item = {
            question: body.question,
            answer: body.answer,
            type_question: body.type_question || '',
        };
        let date = new Date();
        MongoDBProvider.delete_onEducation(body._service[0].dbname_prefix, 'frequently_questions', body.username, { _id: { $eq: new require('mongodb').ObjectID(body.id) } }).then(
            function () {
                dfd.resolve(true);
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            }
        );
        return dfd.promise;
    }

    deleteListTypeOfQuestions(body) {
        let dfd = q.defer();
        MongoDBProvider.delete_onEducation(body._service[0].dbname_prefix, 'types_question', body.username, { _id: { $eq: new require('mongodb').ObjectID(body.id) } }).then(
            function () {
                dfd.resolve(true);
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            }
        );
        return dfd.promise;
    }
    countFrequentlyQuestions(dbname_prefix, filter) {
        return MongoDBProvider.count_onEducation(dbname_prefix, 'frequently_questions', filter);
    }

    countTypeQuestions(dbname_prefix, filter) {
        return MongoDBProvider.count_onEducation(dbname_prefix, 'types_question', filter);
    }

    answerQuestion(dbname_prefix, body) {
        let dfd = q.defer();
        let date = new Date();
        MongoDBProvider.update_onEducation(
            dbname_prefix,
            'question_and_answer',
            body.username,
            { _id: { $eq: new require('mongodb').ObjectID(body._id) } },
            {
                $set: { status: 'answered' },
                $push: { answers: { username: body.username, answer: body.answer, create_date: date.getTime(), attachments: [] }, event: { username: body.username, create_date: date.getTime(), action: 'TeacherAnswer' } },
            }
        ).then(
            function () {
                dfd.resolve(true);
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            }
        );
        return dfd.promise;
    }

    loadListStudentQuestions(dbname_prefix, filter, top, offset) {
        let dfd = q.defer();
        let dfdArr =[];
        let tqsArr = [];
        MongoDBProvider.load_onEducation(dbname_prefix, 'question_and_answer', filter).then(
            function (data) {
                for (var i in data) {
                    if (data[i].department) {
                        dfdArr.push(
                            MongoDBProvider.load_onOffice(dbname_prefix, "organization", { id: data[i].department }, undefined, undefined, { ordernumber: 1 })
                        );
                    }
                        if (data[i].type_question) {
                            MongoDBProvider.load_onEducation(dbname_prefix,"types_question",{ id: data[i].type_question }, undefined, undefined, { ordernumber: 1 }).then(
                                function (dataType) {
                                    const currentTitle = {
                                              "vi-VN": dataType[0].title_vi,
                                              "en-US": dataType[0].title_en,
                                            };
                                    dataType[0].title = currentTitle;
                                    delete dataType[0].title_vi;
                                    delete dataType[0].title_en;
                                    delete data[i].type_question;
                                    data[i].type_question = dataType[0];
                                }
                            );
                        }
                }
                if (dfdArr.length > 0) {
                    q.all(dfdArr).then(
                        (items) => {
                            const listOfImageUrls = items.filter(item => typeof(item) === 'string');
                            let listOfDepartments = [];
                            items.filter(item => {
                                if (!listOfImageUrls.includes(item) && item[0]) {
                                    listOfDepartments.push(item[0]);
                                }
                            });

                            let count = 0;
                            
                            for (const i in data) {
                                if (data[i].department) {
                                    const currentDep = listOfDepartments.find(dep => dep.id === data[i].department);
                                    // if (currentDep) {
                                    //     data[i].departmentName = currentDep.title;
                                    // } else {
                                    //     data[i].departmentName = {
                                    //       "vi-VN": "",
                                    //       "en-US": "",
                                    //     };
                                    // }
                                    // delete data[i].department;
                                    data[i].department = currentDep;
                                }
                            }
                            dfd.resolve(data);
                            data = undefined;
                            count = undefined;
                        },
                        (err) => {
                            dfd.reject(err);
                            data = undefined;
                            err = undefined;
                        }
                    );
                } else {
                    dfd.resolve(data);
                    data = undefined;
                }
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            }
        );
        return dfd.promise;
    }

    countStudentQuestions(dbname_prefix, filter) {
        return MongoDBProvider.count_onEducation(dbname_prefix, 'question_and_answer', filter);
    }

    loadStudentQuestionsDetails(dbname_prefix, qaID) {
        let dfd = q.defer();
        let dfdArr = [];
        MongoDBProvider.load_onEducation(dbname_prefix, 'question_and_answer', { _id: { $eq: new require('mongodb').ObjectId(qaID) } }).then(
            function (data) {
                if (data[0].department) {
                    dfdArr.push(
                        MongoDBProvider.load_onOffice(dbname_prefix, "organization", { id: data[0].department }, undefined, undefined, { ordernumber: 1 })
                    );
                }
                if (dfdArr.length > 0) {
                    q.all(dfdArr).then(
                        (items) => {
                            const listOfImageUrls = items.filter(item => typeof (item) === 'string');
                            let listOfDepartments = [];
                            items.filter(item => {
                                if (!listOfImageUrls.includes(item) && item[0]) {
                                    listOfDepartments.push(item[0]);
                                }
                            });
                            if (data[0].department) {
                                const currentDep = listOfDepartments.find(dep => dep.id === data[0].department);
                                data[0].department = currentDep;
                            }
                            dfd.resolve(data[0]);
                            data = undefined;
                        },
                        (err) => {
                            dfd.reject(err);
                            data = undefined;
                            err = undefined;
                        }
                    );
                } else {
                    dfd.resolve(data[0]);
                    data = undefined;
                }
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            }
        );
        return dfd.promise;
    }

    forwardQuestion(dbname_prefix, body) {        
        let dfd = q.defer();                
        MongoDBProvider.update_onEducation(
            dbname_prefix,
            'question_and_answer',
            body.username,
            { _id: { $eq: new require('mongodb').ObjectID(body._id) } },
            {
                $set: { department: body.department },                
            }
        ).then(
            function () {
                dfd.resolve(true);
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            }
        );
        return dfd.promise;
    }

    handleExpireQnA(dbname_prefix) {
        let dfd = q.defer();
        let dfdArrayItem = [];
        const filter = {
            status: { $nin: ['resolve', 'reject'] },
        };
        MongoDBProvider.load_onEducation(dbname_prefix, 'question_and_answer', filter).then(
            (data) => {
                for (const i in data) {
                    const latestEvent = findMaxDateObject(data[i].event);
                    if (latestEvent.action === 'TeacherAnswer') {
                        const currentDate = new Date().getTime();
                        const millisecondsInADay = 1000 * 60 * 60 * 24;
                        const daysElapsed = Math.floor((currentDate - latestEvent.create_date) / millisecondsInADay);
                        console.log('🚀🚀 ~ file: service.js:286 ~ QuestionAnswerService ~ handleExpireQnA ~ daysElapsed:', daysElapsed);
                        // Expire soon -> Send notification
                        if (daysElapsed === 7) {
                            const params = {
                                qnaId: data[i]._id.toString(),
                                subject: data[i].subject,
                                username_create_task: data[i].fullName,
                            };
                            let toStudents = [data[i].username];
                            const date = new Date();
                            dfdArrayItem.push(RingBellItemService.insert(dbname_prefix, 'job', 'qna_expire_soon', params, [], [], 'expireSoonQnA', date.getTime(), toStudents));
                            // Close QnA
                        } else if (daysElapsed === 8) {
                            dfdArrayItem.push(
                                MongoDBProvider.update_onEducation(
                                    dbname_prefix,
                                    'question_and_answer',
                                    'job',
                                    { _id: { $eq: new require('mongodb').ObjectID(data[i]._id) } },
                                    {
                                        $set: { status: 'resolve' },
                                    }
                                )
                            );
                        }
                    }
                }
                if (dfdArrayItem.length > 0) {
                    q.all(dfdArrayItem).then(() => {
                        dfd.resolve(true);
                    });
                } else {
                    dfd.resolve(true);
                }
            },
            (err) => {
                dfd.reject(err);
            }
        );
        return dfd.promise;
    }
}

exports.QuestionAnswerService = new QuestionAnswerService();
