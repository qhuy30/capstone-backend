const { TrainingPointService } = require('./service');
const { removeUnicode } = require('../../../utils/util');
const q = require('q');
const QRCode = require('qrcode');

function gernerateFilter(body) {
    let filterAr = [
        { start_date: { $lt: body.end_date } },
        { end_date: { $gt: body.start_date } }
    ];

    if (body.search !== undefined && body.search !== '') {
        filterAr.push({ title_search: { $regex: removeUnicode(body.search) } });
    }

    if (body.status) {
        filterAr.push({ status: { $eq: body.status } });
    }

    if (body.studentId) {
        filterAr.push( {"members.studentId": {$eq: body.studentId}} )
    }


    return { $and: filterAr }
}

class TrainingPointController {
    constructor() { }

    loadList(body) {
        const filter = gernerateFilter(body);
        return TrainingPointService.loadList(body._service[0].dbname_prefix, filter, body.top, body.offset, body.sort);
    }

    countList(body) {
        const filter = gernerateFilter(body);
        return TrainingPointService.countList(body._service[0].dbname_prefix, filter);
    }

    insert(body) {
        const title_search = removeUnicode(body.title);
        return TrainingPointService.insert(body._service[0].dbname_prefix, body.username, body.title, title_search,
            body.content, body.quantity, body.start_registered_date, body.end_registered_date, body.start_date, body.end_date, body.point, [], "Store");
    }

    update(body) {
        const title_search = removeUnicode(body.title);
        return TrainingPointService.update(body._service[0].dbname_prefix, body.username, body.id, body.title, title_search,
            body.content, body.quantity, body.start_registered_date, body.end_registered_date, body.start_date, body.end_date, body.point, body.status);
    }

    delete(body) {
        return TrainingPointService.delete(body._service[0].dbname_prefix, body.username, body.id)
    }

    register(body) {
        return TrainingPointService.register(body._service[0].dbname_prefix, body.id, body.student);
    }

    unregister(body) {
        return TrainingPointService.unregister(body._service[0].dbname_prefix, body.id, body.student);
    }

    loadListStudent(body) {        
        const filter = gernerateFilter(body);
        return TrainingPointService.loadListStudent(body._service[0].dbname_prefix, filter, body.top, body.offset, body.sort);
    }

    loadRegisteredEventByStudentId(body) {        
        const filter = gernerateFilter(body);
        return TrainingPointService.loadRegisteredEventByStudentId(body._service[0].dbname_prefix, filter, body.top, body.offset, body.sort);
    }
    
    loadDetails(body) {
        return TrainingPointService.getById(body._service[0].dbname_prefix, body.id);
    }

    getQRCodeUrl(body) {
        let dfd = q.defer();
        TrainingPointService.getById(body._service[0].dbname_prefix, body.id)
            .then((data) => {
               return QRCode.toDataURL(
                   JSON.stringify({
                       event_id: data._id,
                       type: body.type,
                   })
               );
            })
            .then ((qrUrl) => {
                dfd.resolve(qrUrl);
            })
            .catch((error) => {
                dfd.reject(error);
                error = undefined;
                body = undefined;
            });
        return dfd.promise;
    }

    ackTrainingEvent(body) {
        return TrainingPointService.ackTrainingEvent(body._service[0].dbname_prefix, body.username, body.id, body.studentId, body.type);
    }

    exportCheckoutList(body) {
        return TrainingPointService.exportCheckoutList(body._service[0].dbname_prefix, body.id);
    }
}

exports.TrainingPointController = new TrainingPointController();