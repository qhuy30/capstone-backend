const q = require("q");

const { MongoDBProvider } = require("../../../shared/mongodb/db.provider");

class SendingPlaceService {
  constructor() {}

  loadList(dbname_prefix, filter, top, offset, sort) {
    return MongoDBProvider.load_onOffice(
      dbname_prefix,
      "sending_place",
      filter,
      top,
      offset,
      sort
    );
  }

  countList(dbname_prefix, filter) {
    return MongoDBProvider.count_onOffice(
      dbname_prefix,
      "sending_place",
      filter
    );
  }

  insert(dbname_prefix, username, name, email, phoneNumber, address) {
    const dfd = q.defer();
    MongoDBProvider.insert_onOffice(dbname_prefix, "sending_place", username, {
      name,
      email,
      phoneNumber,
      address,
    })
      .then((result) => {
        dfd.resolve(result);
      })
      .catch((error) => {
        dfd.reject(error);
      });

    return dfd.promise;
  }

  update(dbname_prefix, username, id, name, email, phoneNumber, address) {
    const dfd = q.defer();

    MongoDBProvider.update_onOffice(
      dbname_prefix,
      "sending_place",
      username,
      { _id: { $eq: new require("mongodb").ObjectId(id) } },
      {
        $set: {
          name,
          email,
          phoneNumber,
          address,
        },
      }
    )
      .then((data) => {
        dfd.resolve(data);
      })
      .catch((error) => {
        dfd.reject(error);
      });
    return dfd.promise;
  }

  delete(dbname_prefix, id, username) {
    let dfd = q.defer();
    MongoDBProvider.delete_onOffice(dbname_prefix, "sending_place", username, {
      _id: { $eq: new require("mongodb").ObjectID(id) },
    }).then(
      function () {
        dfd.resolve(true);
        dfd = undefined;
      },
      function (err) {
        dfd.reject(err);
        err = undefined;
      }
    );

    return dfd.promise;
  }
}

exports.SendingPlaceService = new SendingPlaceService();
