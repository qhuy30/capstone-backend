function generateArrayValue(ar) {
    let results = [];
    for (var i in ar) {
        for (var j in ar[i]) {
            results.push(ar[i][j]);
        }
    }
    return results;
}

let indexAr =[
    require('./request_add_friend/index'),
    require('./add_friend/index')
];
module.exports =generateArrayValue(indexAr);