const {adminDomain} = require('../../../utils/setting');
const maps=[ 
    {   
        key:"PDFToExcel",
        path:"pdf-to-excel",
        js:["/modules/utilies_tools/pdf_to_excel/service.js","/modules/utilies_tools/pdf_to_excel/controller.js"],
        html:"/modules/utilies_tools/pdf_to_excel/views/pdf_to_excel.html",
        rule:["UtilitiesTool.PDFToExcel.Use"],
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