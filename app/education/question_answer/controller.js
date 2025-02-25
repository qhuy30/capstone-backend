const q = require('q');
const { QuestionAnswerService } = require('./service');
const { UserService } = require('./../../management/user/user.service');
const { RingBellItemService } = require('../../management/ringbell_item/service');

const genFilter = function (body) {
    let filter = {
        $and: [{ create_date: { $lte: body.to_date } }, { create_date: { $gte: body.from_date } }],
    };
    if (body.search) {
        filter.$and.push({ question: { $regex: body.search } });
    }
    return filter;
};

const genStudentQuestionsFilter = function (body) {

    let ruleQuestion = body.session.rule.filter(e => e.rule === "Education.ForwardQuestion.Use")[0];
    let filter = {};
    if (!ruleQuestion) {
        filter = {
            $and: [
                { create_date: { $lte: body.to_date } },
                { create_date: { $gte: body.from_date } },
                { department: { $eq: body.session.employee_details.department }}
            ],
        };
    } else {
        filter = {
            $and: [
                { create_date: { $lte: body.to_date } },
                { create_date: { $gte: body.from_date } }
            ],
        };
    }
    if (body.search) {
        filter.$and.push({ question: { $regex: body.search } });
    }
    return filter;
};

const countFilter = function (body) {
    let filter = { $and: [{ create_date: { $lte: body.to_date } }, { create_date: { $gte: body.from_date } }] };
    if (body.search) {
        filter = {
            $and: [{ question: { $regex: body.search } }],
        };
    }
    return filter;
};

class QuestionAnswerController {
    constructor() {}
    createFrequentlyQuestions(req) {
        let dfd = q.defer();
        QuestionAnswerService.createFrequentlyQuestions(req.body)
            .then((data) => {
                dfd.resolve(data);
                req = undefined;
            })
            .catch((error) => {
                dfd.reject(error);
                error = undefined;
                req = undefined;
            });

        return dfd.promise;
    }

    createListQuestions(req) {
        let dfd = q.defer();
        QuestionAnswerService.createListQuestions(req.body)
            .then((data) => {
                dfd.resolve(data);
                req = undefined;
            })
            .catch((error) => {
                dfd.reject(error);
                error = undefined;
                req = undefined;
            });

        return dfd.promise;
    }

    loadListFrequentlyQuestions(body) {
        let filter = genFilter(body);

        return QuestionAnswerService.loadListFrequentlyQuestions(body._service[0].dbname_prefix, filter, body.top, body.offset, body.sort);
    }

    loadListTypeOfQuestions(body) {
        let filter;
        if (body.search) {
            filter = {
                $and: [{ $text: { $search: body.search } }],
            };
        } else {
            filter = {};
        }

        return QuestionAnswerService.loadListTypeOfQuestions(body._service[0].dbname_prefix, filter, body.top, body.offset, body.sort);
    }


    loadDetailsFrequentlyQuestionById(body) {
        let dfd = q.defer();
        QuestionAnswerService.loadDetailsFrequentlyQuestionById(body._service[0].dbname_prefix, body.id)
            .then((data) => {
                dfd.resolve(data);
                // TODO: Send notification: Ringbell
                body = undefined;
            })
            .catch((error) => {
                dfd.reject(error);
                error = undefined;
                body = undefined;
            });
        return dfd.promise;
    }

    updateFrequentlyQuestions(req) {
        let dfd = q.defer();
        QuestionAnswerService.updateFrequentlyQuestions(req.body)
            .then((data) => {
                dfd.resolve(data);
                // TODO: Send notification: Ringbell
                req = undefined;
            })
            .catch((error) => {
                dfd.reject(error);
                error = undefined;
                req = undefined;
            });

        return dfd.promise;
    }

    updateListTypeOfQuestions(req) {
        let dfd = q.defer();
        QuestionAnswerService.updateListTypeOfQuestions(req.body)
            .then((data) => {
                dfd.resolve(data);
                // TODO: Send notification: Ringbell
                req = undefined;
            })
            .catch((error) => {
                dfd.reject(error);
                error = undefined;
                req = undefined;
            });

        return dfd.promise;
    }

    deleteFrequentlyQuestions(req) {
        let dfd = q.defer();
        QuestionAnswerService.deleteFrequentlyQuestions(req.body)
            .then((data) => {
                dfd.resolve(data);
                // TODO: Send notification: Ringbell
                req = undefined;
            })
            .catch((error) => {
                dfd.reject(error);
                error = undefined;
                req = undefined;
            });

        return dfd.promise;
    }

    deleteListTypeOfQuestions(req) {
        let dfd = q.defer();
        QuestionAnswerService.deleteListTypeOfQuestions(req.body)
            .then((data) => {
                dfd.resolve(data);
                // TODO: Send notification: Ringbell
                req = undefined;
            })
            .catch((error) => {
                dfd.reject(error);
                error = undefined;
                req = undefined;
            });

        return dfd.promise;
    }
    countFrequentlyQuestions(body) {
        let filter = genFilter(body);
        return QuestionAnswerService.countFrequentlyQuestions(body._service[0].dbname_prefix, filter);
    }

    countTypeQuestions(body) {
        let filter;
        if (body.search) {
            filter = {
                $and: [{ $text: { $search: body.search } }],
            };
        } else {
            filter = {};
        }
        return QuestionAnswerService.countTypeQuestions(body._service[0].dbname_prefix, filter);
    }

    answerQuestion(body) {
        let dfd = q.defer();
        let date = new Date();
        QuestionAnswerService.answerQuestion(body._service[0].dbname_prefix, body)
            .then(() => {
                return QuestionAnswerService.loadStudentQuestionsDetails(body._service[0].dbname_prefix, body._id)
            })
            .then((studentQuestionsDetails) => {
                RingBellItemService.insert(
                    body._service[0].dbname_prefix,
                    body.username,
                    'qna_answered',
                    { qnaId: body._id, question_title: studentQuestionsDetails.subject },
                    [],
                    [],
                    'answeredQnA',
                    date.getTime(),
                    [studentQuestionsDetails.username]
                );
                dfd.resolve(true);
                date = undefined;
            })
            .catch((error) => {
                dfd.reject(error);
                error = undefined;
                body = undefined;
            });
        return dfd.promise;
    }

    loadStudentQuestions(body) {
        let filter = genStudentQuestionsFilter(body);
        return QuestionAnswerService.loadListStudentQuestions(body._service[0].dbname_prefix, filter, body.top, body.offset);
    }

    countStudentQuestions(body) {
        let filter = genStudentQuestionsFilter(body);
        return QuestionAnswerService.countStudentQuestions(body._service[0].dbname_prefix, filter);
    }

    loadStudentQuestionsDetails(body) {
        let dfd = q.defer();
        QuestionAnswerService.loadStudentQuestionsDetails(body._service[0].dbname_prefix, body.id)
            .then((data) => {
                dfd.resolve(data);
                // TODO: Send notification: Ringbell
                body = undefined;
            })
            .catch((error) => {
                dfd.reject(error);
                error = undefined;
                body = undefined;
            });
        return dfd.promise;
    }
    
    forwardQuestion(body) {                        
        let dfd = q.defer();        
        let date = new Date();
        QuestionAnswerService.forwardQuestion(body._service[0].dbname_prefix, body)
            .then(() => {                                                                 
                return UserService.loadUser(body._service[0].dbname_prefix);
            })
            .then((data) => {                          
                // filter list of user with QnA auth
                const usersWithEducationQnAUse = data.filter(user => 
                    Array.isArray(user.rule) && user.departmentId === body.department && user.rule.some(item => item.rule === 'Education.QnA.Use')
                );                
                const usernameToNotify = usersWithEducationQnAUse.length > 0 
                ? usersWithEducationQnAUse.map(user => user.username) : [];                                   
                
                // find department name forwarded question                               
                const departmentFromRequest = data.find(user => user.departmentId === body.session.employee_details.department);
                const departmentNameForwarded = departmentFromRequest ? departmentFromRequest.departmentName : '';

                // find department name received question
                const departmentNameReceived = usersWithEducationQnAUse.length > 0 ? usersWithEducationQnAUse[0].departmentName : '';                

                const userData = {
                    usernameToNotify: usernameToNotify,
                    departmentNameForwarded: departmentNameForwarded,
                    departmentNameReceived: departmentNameReceived
                };                
                return q.all([
                    userData,
                    QuestionAnswerService.loadStudentQuestionsDetails(body._service[0].dbname_prefix, body._id)
                ])                                                
            })
            .then(([userData, studentQuestionsDetails]) => {       
                
                RingBellItemService.insert(
                    body._service[0].dbname_prefix,
                    body.username,
                    'qna_forwarded',
                    { qnaId: body._id, department_forwarded_question: userData.departmentNameForwarded, department_received_question: userData.departmentNameReceived, user_forwarded_question: body.session.employee_details.fullname, question_title: studentQuestionsDetails.question },
                    userData.usernameToNotify,
                    [],
                    'forwardQnA',
                    date.getTime(),
                    [studentQuestionsDetails.username]
                );                
                dfd.resolve(true);  
                date = undefined;
            })             
            .catch((error) => {
                dfd.reject(error);
                error = undefined;
                body = undefined;
            });
        return dfd.promise;
    }
}

exports.QuestionAnswerController = new QuestionAnswerController();
