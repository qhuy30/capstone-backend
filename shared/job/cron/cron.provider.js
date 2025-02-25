const q = require('q');
const cron = require('node-cron');
const {QuestionAnswerService} = require('../../../app/education/question_answer/service')
class cronProvider {
    constructor() {}
    // # ┌────────────── second (optional)
    // # │ ┌──────────── minute
    // # │ │ ┌────────── hour
    // # │ │ │ ┌──────── day of month
    // # │ │ │ │ ┌────── month
    // # │ │ │ │ │ ┌──── day of week
    // # │ │ │ │ │ │
    // # │ │ │ │ │ │
    // # * * * * * *
    closeExpireQnA() {
        cron.schedule(
            '0 0 * * *',
            () => {
                QuestionAnswerService.handleExpireQnA('localhost_3005');
            },
            {
                scheduled: true,
                timezone: 'Asia/Ho_Chi_Minh',
            }
        );
    }
}

exports.cronProvider = new cronProvider();
