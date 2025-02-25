const {adminDomain} = require('../../../utils/setting');
const maps=[ 
    {   
        key:"QuestionAnswer",
        path:"question-answer",
        js:["/modules/education/question_answer/service.js","/modules/education/question_answer/controller.js", 
        "/modules/education/question_answer/controller_common_questions.js", "/modules/education/question_answer/controller_setting_question_answer.js",        "/modules/education/question_answer/controller_student_answer.js"],
        html:"/modules/education/question_answer/view/question_answer.html",
        rule:["Education.QnA.Use"],
        icon:'<i class="fas fa-question-circle"></i>',
        canStick:true
    },
    {   
        key:"QuestionDetails",
        path:"question-details",
        js:["/modules/education/question_answer/details/service.js","/modules/education/question_answer/details/controller.js"],
        html:"/modules/education/question_answer/details/views/details.html",
        rule:["Education.QnA.Use"],
        icon:'<i class="cui-graph"></i>'
    },
    {   
        key:"StudentQuestionDetails",
        path:"student-question-details",
        js:["/modules/education/question_answer/details/service.js","/modules/education/question_answer/details/controller_student_question.js"],
        html:"/modules/education/question_answer/details/views/student_question_details.html",
        rule:["Education.QnA.Use"],
        icon:'<i class="cui-graph"></i>'
    },
];

module.exports = (function() {
    var temp = [];
    for (let i in maps) {
        for (let j in maps[i].js) {
            maps[i].js[j] = adminDomain + maps[i].js[j];
        }
        maps[i].html = adminDomain + maps[i].html;
        if(maps[i].toolbar){
            for(let j in maps[i].toolbar.js){
                maps[i].toolbar.js[j] = adminDomain + maps[i].toolbar.js[j];
            }
            maps[i].toolbar.html = adminDomain + maps[i].toolbar.html;
        }
        temp.push(maps[i]);
    }
    return temp;
})()