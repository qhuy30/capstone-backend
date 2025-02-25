const {adminDomain} = require('../../../utils/setting');
const maps=[ 
    {   
        key:"CalculateDimensions",
        path:"calculate-dimensions",
        js:["/modules/utilies_tools/calculate_dimensions/service.js","/modules/utilies_tools/calculate_dimensions/controller.js"],
        html:"/modules/utilies_tools/calculate_dimensions/views/calculate_dimensions.html",
        rule:["UtilitiesTool.CalculateDimensions.Use"],
        icon:'<i class="cui-graph"></i>',
        canStick:true
    }
];

module.exports = (function() {
    var temp = [];
    for (let i in maps) {
        for (let j in maps[i].js) {
            maps[i].js[j] = adminDomain + maps[i].js[j];
        }
        maps[i].html = adminDomain + maps[i].html;
        if(maps[i].toolbar){
            for(let j in maps[i].toolbar.js){
                maps[i].toolbar.js[j] = adminDomain + maps[i].toolbar.js[j];
            }
            maps[i].toolbar.html = adminDomain + maps[i].toolbar.html;
        }
        temp.push(maps[i]);
    }
    return temp;
})()