
const q = require('q');
const { CardVehicalService } = require('./service');
const { ItemSetup } = require('../../../shared/setup/items.const');
const countFilterCondition = function (body) {
    let count = 0;
    if (body.isactive !== undefined) {
        count++;
    }
    if (body.search !== undefined && body.search !== "") {
        count++;
    }
    return count;
}

const genFilterData = function (body, count) {
    if (count == 0) { return {}; }
    let filter = {};

    if (body.search !== undefined && body.search !== "") {
        const searchFilter = {
            $or: [
                { name: { $regex: body.search, $options: "i" } },
                { code: { $regex: body.search, $options: "i" } }
            ]
        };

        if (count > 1) {
            filter = { $and: [searchFilter] };
        } else {
            filter = searchFilter;
        }
    }
    return filter;
}


class CardVehicalController {
    constructor() { }

    checkExist(body) {
        return CardVehicalService.checkExist(body._service[0].dbname_prefix, body.code);
    }

    load(body) {
        let count = countFilterCondition(body);
        let filter = genFilterData(body, count);
        return CardVehicalService.load(body._service[0].dbname_prefix, filter, body.top, body.offset, body.sort);
    }

    count(body) {
        let count = countFilterCondition(body);
        let filter = genFilterData(body, count);
        return CardVehicalService.count(body._service[0].dbname_prefix, filter);
    }


    insert(body) {
        return CardVehicalService.insert(body._service[0].dbname_prefix, body.username, body.name, body.code);
    }

    update(body) {
        return CardVehicalService.update(
            body._service[0].dbname_prefix,
            body.username,
            body.id,
            body.name,
        );
    }

    delete(body) {
        return CardVehicalService.delete(body._service[0].dbname_prefix, body.id, body.username);
    }

}

exports.CardVehicalController = new CardVehicalController();
