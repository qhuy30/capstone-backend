const { SendingPlaceService } = require("./service");

const countFilterCondition = function (body) {
  let count = 0;
  if (body.search !== undefined && body.search !== "") {
    count++;
  }
  return count;
};

const genFilterData = function (body) {
  let count = countFilterCondition(body);
  if (count == 0) {
    return {};
  }
  let filter;
  if (count > 1) {
    filter = {};
    if (body.search !== undefined && body.search !== "") {
      filter = {
        name: { $regex: body.search, $options: "i" },
      };
    }
  } else {
    if (body.search !== undefined) {
      filter = {
        name: { $regex: body.search, $options: "i" },
      };
    }
  }
  return filter;
};

class SendingPlaceController {
  constructor() {}

  load(body) {
    return SendingPlaceService.loadList(
      body._service[0].dbname_prefix,
      genFilterData(body)
    );
  }
  count(body) {
    return SendingPlaceService.countList(
      body._service[0].dbname_prefix,
      genFilterData(body)
    );
  }

  insert(body) {
    return SendingPlaceService.insert(
      body._service[0].dbname_prefix,
      body.username,
      body.name,
      body.email,
      body.phoneNumber,
      body.address
    );
  }

  update(body) {
    return SendingPlaceService.update(
      body._service[0].dbname_prefix,
      body.username,
      body.id,
      body.name,
      body.email,
      body.phoneNumber,
      body.address
    );
  }

  delete(body) {
    return SendingPlaceService.delete(
      body._service[0].dbname_prefix,
      body.id,
      body.username,
    );
  }
}

exports.SendingPlaceController = new SendingPlaceController();
