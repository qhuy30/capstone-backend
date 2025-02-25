const {adminDomain} = require('./../../../utils/setting');
const maps=[ 
    {   
        key:"LoginPage",
        path:"login",
        js:["/modules/management/user/login.service.js","/modules/management/user/login.controller.js"],
        html:"/modules/management/user/views/login.html",
        rule:null  
    },
    {   
        key:"ChangePassword",
        path:"changepassword",
        js:["/modules/management/user/changepassword.service.js","/modules/management/user/changepassword.controller.js"],
        html:"/modules/management/user/views/changepassword.html",
        rule:["Authorized"],
        canStick:true  
    },
    {   
        key:"Profile",
        path:"profile",
        js:["/modules/management/user/profile.service.js","/modules/management/user/profile.controller.js"],
        html:"/modules/management/user/views/profile.html",
        rule:["Authorized"]  
    },
    {   
        key:"UserManagement",
        path:"user",
        js:["/modules/management/user/user.service.js","/modules/management/user/user.controller.js"],
        html:"/modules/management/user/views/user.html",
        rule:["Management.User.Use"],
        icon:'<i class="fas fa-user"></i>',
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