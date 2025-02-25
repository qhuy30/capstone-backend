const { adminDomain } = require("../../../utils/setting");
const maps = [
  {
    key: "BriefCase",
    path: "briefcase",
    js: [
      "/modules/office/briefcase/service.js",
      "/modules/office/briefcase/controller.js",
    ],
    html: "/modules/office/briefcase/views/briefcase.html",
    rule: ["Office.BriefCase.Use"],
    canStick: true,
  },
  {
    key: "BCDetails",
    path: "briefcase-details",
    js: [
      "/modules/office/briefcase/details/service.js",
      "/modules/office/briefcase/details/controller.js",
    ],
    html: "/modules/office/briefcase/details/views/details.html",
    rule: ["Office.BriefCase.Use"],
  },
];

module.exports = (function () {
  var temp = [];
  for (let i in maps) {
    for (let j in maps[i].js) {
      maps[i].js[j] = adminDomain + maps[i].js[j];
    }
    maps[i].html = adminDomain + maps[i].html;
    if (maps[i].toolbar) {
      for (let j in maps[i].toolbar.js) {
        maps[i].toolbar.js[j] = adminDomain + maps[i].toolbar.js[j];
      }
      maps[i].toolbar.html = adminDomain + maps[i].toolbar.html;
    }
    temp.push(maps[i]);
  }
  return temp;
})();
