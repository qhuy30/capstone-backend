const q = require("q");

const { BriefCaseService } = require("./service");

const { TENANT_IDENTIFIER } = process.env;
const { generateParent, removeHashKey } = require('../../../utils/util');
const { BriefcaseService } = require("../outgoing_dispatch/service");
const { FileProvider } = require("@shared/file/file.provider");
const { BuildFilterAggregate } = require("./utility");
const folderArray = ['office'];

class BriefCaseController {
    searchReferences(dbNamePrefix, currentUser, body) {
        return BriefCaseService.searchReferences(dbNamePrefix, currentUser.username, body.search);
    }

    loadAll(dbname_prefix, currentUser, body) {
        return BriefCaseService.loadAll(dbname_prefix, currentUser.username, body);
    }

    loadDetail(dbname_prefix, currentUser, body) {
        return BriefCaseService.loadDetail(dbname_prefix, currentUser.username, body);
    }

    insert(dbname_prefix, currentUser, body ) {
        let dfd = q.defer();
        body.addtional_documents = removeHashKey(body.addtional_documents);
        BriefCaseService.insert(dbname_prefix, currentUser.username, body,
            generateParent(body.parents|| [], body.parent||{}),body.parent||{}).then(
            function (data) {
                dfd.resolve(data);
            },
            function (err) {
                dfd.reject(err);
            },
        );
        return dfd.promise;
    }

    prepareData(dbname_prefix, currentUser, body) {
        let dfd = q.defer();
        BriefCaseService.generatePreviewCode(dbname_prefix)
            .then((code) => {
                dfd.resolve({
                    code,
                    organ_id: TENANT_IDENTIFIER,
                });
            })
            .catch(() => {
                dfd.resolve({});
            });
        return dfd.promise;
    }

    load_file_info_waiting_archive(body) {
        let dfd = q.defer();

        BriefcaseService.loadDetail_waiting_archive(body._service[0].dbname_prefix,body._service[0].username,body.id).then(
            function (data) {
                const fileInfo = data.addtional_documents.find((item) => item.name === body.filename);

                if (fileInfo) {
                    FileProvider.loadFile(
                        body._service[0].dbname_prefix,
                        body.session,
                        fileInfo.nameLib,
                        fileInfo.name,
                        fileInfo.timePath,
                        fileInfo.locate,
                        folderArray,
                        fileInfo.username,
                    ).then(
                        function (fileinfo) {
                            fileinfo.display = fileInfo.display;
                            dfd.resolve(fileinfo);
                        },
                        function (err) {
                            dfd.reject(err);
                        },
                    );
                } else {
                    dfd.reject({ path: "BriefCaseController.load_file_info_waiting_archive.FileIsNotExists", mes: "FileIsNotExists" });
                }
            },
            function (err) {
                dfd.reject(err);
            },
        );

        return dfd.promise;
    }

    load_file_info(body) {
        let dfd = q.defer();

        BriefcaseService.loadDetail(body._service[0].dbname_prefix,body._service[0].username,body.id).then(
            function (data) {
                const fileInfo = data.addtional_documents.find((item) => item.name === body.filename);

                if (fileInfo) {
                    FileProvider.loadFile(
                        body._service[0].dbname_prefix,
                        body.session,
                        fileInfo.nameLib,
                        fileInfo.name,
                        fileInfo.timePath,
                        fileInfo.locate,
                        folderArray,
                        fileInfo.username,
                    ).then(
                        function (fileinfo) {
                            fileinfo.display = fileInfo.display;
                            dfd.resolve(fileinfo);
                        },
                        function (err) {
                            dfd.reject(err);
                        },
                    );
                } else {
                    dfd.reject({ path: "BriefCaseController.load_file_info.FileIsNotExists", mes: "FileIsNotExists" });
                }
            },
            function (err) {
                dfd.reject(err);
            },
        );

        return dfd.promise;
    }

    update(dbname_prefix, currentUser, body) {
        let dfd = q.defer();
        BriefCaseService.update(dbname_prefix, currentUser.username, body).then(
            function (data) {
                dfd.resolve(data);
            },
            function (err) {
                dfd.reject(err);
            },
        );
        return dfd.promise;
    }

    updateReferences(dbname_prefix, currentUser, body) {
        let dfd = q.defer();
        BriefCaseService.updateReferences(dbname_prefix, currentUser.username, body).then(
            function (data) {
                dfd.resolve(data);
            },
            function (err) {
                dfd.reject(err);
            },
        );
        return dfd.promise;
    }

    cancel(dbname_prefix, currentUser, body) {
        return BriefCaseService.cancel(dbname_prefix, currentUser.username, body);
    }

    loadforarchive(body) {
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search([], body);
        const aggerationSteps = BuildFilterAggregate.generatePermissionAggregate_archive(body.username, body.session.employee_details.department, body.session.rule, body.checks, aggerationSearch);
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_loadArchive(aggerationSteps, queryCriteria);
        return BriefCaseService.executeAggregate(body._service[0].dbname_prefix, filter);
    }

    countforarchive(body) {
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search([], body);
        const aggerationSteps = BuildFilterAggregate.generatePermissionAggregate_archive(body.username, body.session.employee_details.department, body.session.rule, body.checks, aggerationSearch);
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_countArchive(aggerationSteps, queryCriteria);
        return BriefCaseService.executeAggregate(body._service[0].dbname_prefix, filter);
    }
}

exports.BriefCaseController = new BriefCaseController();
