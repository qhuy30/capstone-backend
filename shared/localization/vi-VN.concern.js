function generateArrayValue(ar) {
    let results = [];
    for (var i in ar) {
        for (var j in ar[i]) {
            results.push(ar[i][j]);
        }
    }
    return results;
}

const fileArrayRequire = [
    require('./component/vi-VN'),
    require('./human/vi-VN'),
    require('./menu/vi-VN'),
    require('./notify/vi-VN'),
    require('./meeting_room/vi-VN'),
    require('./event_calendar/vi-VN'),
    require('./profile/vi-VN'),
    require('./generic/vi-VN'),
    require('./setting/vi-VN'),
    require('./validation/vi-VN'),
    require('./headers/vi-VN'),
    require('./management/vi-VN'),
    require('./office/vi-VN'),
    require('./utilities/vi-VN'),
    require('./education/vi-VN'),
    require('./position/vi-VN')
];

const allLanguageItems = generateArrayValue(fileArrayRequire);

module.exports = allLanguageItems;
