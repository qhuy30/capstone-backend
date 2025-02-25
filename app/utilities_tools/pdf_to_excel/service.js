const pdf2table = require("pdf2table");
const xlsx = require("xlsx");
const pdf = require("pdf-parse");
const moment = require("moment-timezone");
const PDFExtract = require("pdf.js-extract").PDFExtract;
const pdfExtract = new PDFExtract();
const today = moment();
const momentTimezone = "Asia/Ho_Chi_Minh";
const dateTZ = moment.tz(today, momentTimezone);
const date = moment(dateTZ).format("DD/MM/YYYY");
const { PDFDocument, PDFName, PDFRawStream } = require("pdf-lib");
const xShip = 151;
const xBill = 265;
const headerShip = "SHIP TO:";
const headerBill = "BILL TO:";
const q = require("q");

class PDFToExcelService {
    constructor() {}

    settingConvertPdf2Excel(files) {
        const pdfFiles = files.filter((item) => item.mimetype === "application/pdf");
        let index = 0;
        for (const file of pdfFiles) {
            const dataFile = this.convertPdf2Table(file, index);
            combineData = [...combineData, ...dataFile];
            index++;
        }
    }

    convertPdf2Table(file) {
        const dfd = q.defer();
        pdf2table.parse(file, (err, rows, rowsdebug) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
        return dfd.promise;
    }
}
exports.PDFToExcelService = new PDFToExcelService();
