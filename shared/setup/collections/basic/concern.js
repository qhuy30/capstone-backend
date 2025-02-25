function generateArrayValue(ar) {
    let results = [];
    for (var i in ar) {
        for (var j in ar[i]) {
            results.push(ar[i][j]);
        }
    }
    return results;
}

collectionArray =[
    require('./basic.const')
];

module.exports = generateArrayValue(collectionArray);