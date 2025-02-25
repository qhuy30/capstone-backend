const q = require("q");
const mongodb = require("mongodb");
const CodeUtil = require('../../../utils/codeUtil');
const BaseError = require("@shared/error/BaseError");
const { STATUS_CAR, STATUS_FLOW, MASTER_KEY_CARD, CARD_CREDIT_STATUS } = require('./const')
const { MongoDBProvider } = require("../../../shared/mongodb/db.provider");
const { CAR_FEATURE_NAME } = require('./const');
const { v4: uuidv4 } = require('uuid');
const {
    DISPATCH_ARRIVED_STATUS,
} = require("@utils/constant");

const DATABASE_COLLECTION = "registration";
class CarManagementService {
    constructor() { }

    executeAggregate(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, DATABASE_COLLECTION, filter);
    }

    loadByDate(dbname_prefix, inputDateTimeStamp) {
        const inputDate = new Date(inputDateTimeStamp);
        const year = inputDate.getFullYear();
        const month = inputDate.getMonth();
        const date = inputDate.getDate();
        const startDate = new Date(year, month, date);
        const endDateTime = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

        const aggregate = [
            {
                $match: {
                    $and: [
                        {
                            status: STATUS_CAR.LEAD_APPROVED_CAR
                        },
                        {
                            time_to_go: {
                                $gte: startDate.getTime(),
                                $lt: endDateTime.getTime()
                            }
                        }
                    ]

                }
            },
            {
                $addFields: {
                    "startDate": {
                        $dateToString: {
                            format: "%d/%m/%Y %H:%M",
                            date: { $toDate: "$time_to_go" },
                            timezone: "Asia/Bangkok"
                        }
                    },
                    "endDate": {
                        $dateToString: {
                            format: "%d/%m/%Y %H:%M",
                            date: { $toDate: "$pick_up_time" },
                            timezone: "Asia/Bangkok"
                        }
                    },
                }
            },
        ]

        return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, DATABASE_COLLECTION, aggregate);
    }


    insert(dbname_prefix, username, starting_place, destination, destination_search, passenger, contact_passenger,
        number_of_people, time_to_go, pick_up_time, to_department, content,
        attachments, event, department, code, status, flow_status, title) {
        return MongoDBProvider.insert_onOffice(dbname_prefix, DATABASE_COLLECTION, username, {
            username,
            starting_place, destination, destination_search, passenger, number_of_people,
            time_to_go, pick_up_time, to_department, content, attachments,contact_passenger,
            event, department, code, feature: CAR_FEATURE_NAME, status, flow_status, title
        })
    }


    loadDetails(dbname_prefix, code) {
        return MongoDBProvider.getOne_onOffice(dbname_prefix, DATABASE_COLLECTION, { code: { $eq: code } });
    }

    loadDetails_byid(dbname_prefix, id) {
        return MongoDBProvider.getOne_onOffice(dbname_prefix, DATABASE_COLLECTION, { _id: { $eq: new mongodb.ObjectID(id) } });
    }

    update(dbname_prefix, username, code, starting_place, destination, passenger, contact_passenger,
        number_of_people, time_to_go, pick_up_time, to_department, content, title, added_attachments,
        event
    ) {
        let d = new Date();
        let updateQuery = {
            $set: {
                starting_place, destination, passenger, contact_passenger,
                number_of_people, time_to_go, pick_up_time, to_department, content, title, attachments: added_attachments
            },
            $push: { event },
        };

        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            DATABASE_COLLECTION,
            username,
            {
                $and: [
                    {
                        code: { $eq: code }
                    },
                    {
                        status: { $in: [STATUS_CAR.CREATED, STATUS_CAR.LEADER_DEPARTMENT_APPROVED] }
                    },
                    {
                        flow_status: { $eq: STATUS_FLOW.REGISTER }
                    }
                ]

            },
            updateQuery,
        );
    }

    deparment_approve(dbname_prefix, username, code, starting_place, destination, passenger, contact_passenger,
        number_of_people, time_to_go, pick_up_time, to_department, content, title, attachments,
        event, status
    ) {
        let d = new Date();
        let updateQuery = {
            $set: {
                starting_place, destination, passenger,
                number_of_people, time_to_go, pick_up_time, to_department, contact_passenger, content, title, status, attachments
            },
            $push: { event },
        };

        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            DATABASE_COLLECTION,
            username,
            {
                $and: [
                    {
                        code: { $eq: code }
                    },
                    {
                        status: { $eq: STATUS_CAR.CREATED }
                    },
                ]

            },
            updateQuery
        );
    }

    assess_department_level(dbname_prefix, username, code, status, event) {
        return MongoDBProvider.update_onOffice(dbname_prefix, DATABASE_COLLECTION, username,
            { code: { $eq: code } },
            { $set: { status }, $push: { event } });
    }

    assess_car_management(dbname_prefix, username, code, status, event, assign_card, card, car, driver) {
        return MongoDBProvider.update_onOffice(dbname_prefix, DATABASE_COLLECTION, username,
            { code: { $eq: code } },
            { $set: { status, assign_card, card, car, driver }, $push: { event } });
    }

    assess_lead_level(dbname_prefix, username, code, status, event, assign_card, card, car, driver) {
        return MongoDBProvider.update_onOffice(dbname_prefix, DATABASE_COLLECTION, username,
            { code: { $eq: code } },
            { $set: { status, assign_card, card, car, driver }, $push: { event } });
    }

    assess_lead_external_level(dbname_prefix, username, code, status, event) {
        return MongoDBProvider.update_onOffice(dbname_prefix, DATABASE_COLLECTION, username,
            { code: { $eq: code } },
            { $set: { status }, $push: { event } });
    }

    assess_card_management(dbname_prefix, username, code, status, event, card) {
        return MongoDBProvider.update_onOffice(dbname_prefix, DATABASE_COLLECTION, username,
            { code: { $eq: code } },
            { $set: { status, card }, $push: { event } });
    }

    manager_assign_card(dbname_prefix, username, code, status, event, card) {
        return MongoDBProvider.update_onOffice(dbname_prefix, DATABASE_COLLECTION, username,
            { code: { $eq: code } },
            { $set: { status, card }, $push: { event } });
    }

    creator_receive_card(dbname_prefix, username, code, status, event) {
        return MongoDBProvider.update_onOffice(dbname_prefix, DATABASE_COLLECTION, username,
            { code: { $eq: code } },
            { $set: { status }, $push: { event } });
    }

    creator_return_card(dbname_prefix, username, code, status, invoices, money, number_km, event) {
        return MongoDBProvider.update_onOffice(dbname_prefix, DATABASE_COLLECTION, username,
            { code: { $eq: code } },
            { $set: { status, invoices, money, number_km }, $push: { event } });
    }

    manager_receive_card(dbname_prefix, username, code, status, event) {
        return MongoDBProvider.update_onOffice(dbname_prefix, DATABASE_COLLECTION, username,
            { code: { $eq: code } },
            { $set: { status }, $push: { event } });
    }

    creator_cancel(dbname_prefix, username, code, status, event) {
        return MongoDBProvider.update_onOffice(dbname_prefix, DATABASE_COLLECTION, username,
            { code: { $eq: code } },
            { $set: { status }, $push: { event } });
    }

    delete(dbname_prefix, username, id) {
        return MongoDBProvider.delete_onOffice(dbname_prefix, DATABASE_COLLECTION, username,
            { _id: { $eq: require('mongodb').ObjectID(id) } });
    }

    getCode(dbname_prefix, department) {
        let dfd = q.defer();
        MongoDBProvider.getAutoIncrementNumber_onManagement(dbname_prefix, `DKX-${new Date().getFullYear()}-${String(department).padStart(2, '0')}`).then(function (sequenceNumber) {
            dfd.resolve(CodeUtil.resolvePattern(`DKX-${new Date().getFullYear()}-${String(department).padStart(2, '0')}-{sequenceNumber}`, {
                sequenceNumber: String(sequenceNumber).padStart(5, '0')
            }));
        }, function (err) { dfd.reject(err) })
        return dfd.promise;
    }

    setStatusCardCredit(dbname_prefix, username, cardCode, status, event, card_holder_username, card_holder_department) {
        return MongoDBProvider.update_onManagement(
            dbname_prefix, 
            "directory", 
            username,
            { 
                $and: [
                    { master_key: { $eq: MASTER_KEY_CARD } },
                    { value: { $eq: cardCode } }
                ] 
            }, 
            { 
                $set: { status: status, card_holder_username: card_holder_username, card_holder_department: card_holder_department },
                $push: { event: event }
            }
        );
    };

    request_cancel(dbname_prefix, username, id, status, flow_status, event){
        return MongoDBProvider.update_onOffice(dbname_prefix, DATABASE_COLLECTION, username,
            { _id: { $eq: new require("mongodb").ObjectID(id) } },
            { $set: { status, flow_status }, $push: { event } });
    }

    reject_recall(dbname_prefix, username, code, status, flow_status, event){
        return MongoDBProvider.update_onOffice(dbname_prefix, DATABASE_COLLECTION, username,
            { code: { $eq: code } },
            { $set: { status, flow_status }, $push: { event } });
    }

    assess_recall(dbname_prefix, username, code, status, event) {
        return MongoDBProvider.update_onOffice(dbname_prefix, DATABASE_COLLECTION, username,
            { code: { $eq: code } },
            { $set: { status }, $push: { event } });
    }
}

class UserService {
    constructor() { }

    loadUser(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onManagement(dbname_prefix, "user", filter);
    }

    loadUsersInGroup(dbname_prefix, filter) {
        return MongoDBProvider.load_onManagement(dbname_prefix, "group", filter);
    }
}

class DirectoryService {
    constructor() { }

    loadCar(dbname_prefix, values) {
        const master_key = 'vehicle_list';
        const filter = {
            $and: [
                {
                    master_key: { $eq: master_key }
                },
                {
                    value: { $in: values }
                },
                { isactive: { $eq: true } }
            ]
        }
        return MongoDBProvider.load_onManagement(dbname_prefix, "directory", filter, 0, 0);
    }

    loadCard(dbname_prefix, values) {
        const master_key = 'card_list';
        const filter = {
            $and: [
                {
                    master_key: { $eq: master_key }
                },
                {
                    value: { $in: values }
                },
                { isactive: { $eq: true } }
            ]
        }
        return MongoDBProvider.load_onManagement(dbname_prefix, "directory", filter, 0, 0);
    }

    loadLocation(dbname_prefix, values) {
        const master_key = 'location_list';
        const filter = {
            $and: [
                {
                    master_key: { $eq: master_key }
                },
                {
                    value: { $in: values }
                },
                { isactive: { $eq: true } }
            ]
        }
        return MongoDBProvider.load_onManagement(dbname_prefix, "directory", filter, 0, 0);
    }
}

exports.UserService = new UserService();
exports.DirectoryService = new DirectoryService();
exports.CarManagementService = new CarManagementService();
