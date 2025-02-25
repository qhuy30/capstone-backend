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
    require('./user/user.index'),
    require('./group/index'),
    require('./department_group/index'),
    require('./recyclebin/recyclebin.index'),
    require('./directory/index'),
    require('./master_directory/index'),
    require('./config_table/config_table.index')
];
module.exports =generateArrayValue(indexAr);
