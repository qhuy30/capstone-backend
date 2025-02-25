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
    require('./component/en-US'),
    require('./human/en-US'),
    require('./menu/en-US'),
    require('./notify/en-US'),
    require('./meeting_room/en-US'),
    require('./event_calendar/en-US'),
    require('./profile/en-US'),
    require('./generic/en-US'),
    require('./setting/en-US'),
    require('./validation/en-US'),
    require('./headers/en-US'),
    require('./management/en-US'),
    require('./office/en-US'),
    require('./utilities/en-US'),
    require('./education/en-US'),
    require('./position/en-US'),
];

const allLanguageItems = generateArrayValue(fileArrayRequire);

module.exports = allLanguageItems;
