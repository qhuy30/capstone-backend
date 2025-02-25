const path = require('path');
const moment = require('moment-timezone');
const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();
const AdmZip = require('adm-zip');
const { PDFDocument, MissingCatalogError } = require('pdf-lib');
const sharp = require('sharp');
const date = moment();
const momentTimezone = 'Asia/Ho_Chi_Minh'; 
const dateTZ = moment.tz(date, momentTimezone);
const today = moment(dateTZ).format('DD/MM/YYYY');


async function removeFunc(files) {
    const zip = new AdmZip();
    let result = [];
    const pdfFiles = files.filter((item) => item.mimetype === 'application/pdf');

    for (const pdfFile of pdfFiles) {
        const name = pdfFile.originalname.split('.')[0];
        const date = today.replace(/\//g, '.').slice(0, 5);
        const modifiedPdfBytes = await replaceTextInPDF(pdfFile);
        if(modifiedPdfBytes) {
            zip.addFile(`${name}_${date}.pdf`, modifiedPdfBytes);
            if (pdfFiles.length === 1) {
                result.push({ buffer: [...modifiedPdfBytes] });
            }
        }
    }
    if (pdfFiles.length > 1) {
        result.push({ buffer: zip.toBuffer() });
    }
    return result;
}

async function resizeImage(inputPath, width, height, pdfDoc) {
    const imgBuffer = await sharp(inputPath).resize(width, height).toBuffer();
    return await pdfDoc.embedPng(imgBuffer);
}

async function replaceTextInPDF(inputPath) {
    try {
        const pdfDoc = await PDFDocument.load(inputPath.buffer);
        const page = pdfDoc.getPage(0);
        const rawData = await pdfExtract.extractBuffer(inputPath.buffer, {});
        const dataFirstPage = rawData.pages[0];

        // For Ex-factory date
        const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
        let yDate;
        dataFirstPage.content.forEach((item) => {
            if (item.str === 'EX-FACTORY DATE:') {
                yDate = item.y;
            }
        });

        const mappingDate = dataFirstPage.content.filter((item) => item.y === yDate && dateRegex.test(item.str));
        if (mappingDate.length === 0) {
            return;
        }
        const blankUrl = path.join(__dirname, '/file/blankForDate.png');
        const imgDate = await resizeImage(blankUrl, parseInt(mappingDate[0].width.toString(), 10) + 5, parseInt(mappingDate[0].height, 10) + 4, pdfDoc);

        page.drawImage(imgDate, {
            x: mappingDate[0].x,
            y: page.getHeight() - mappingDate[0].y - 4,
        });

        // For PRICE and TOTAL in table
        const priceRegex = /^\$/;
        let xPrice;
        dataFirstPage.content.forEach((item) => {
            if (item.str === 'PRICE') {
                xPrice = item.x;
            }
        });

        let xTotalCost;
        let yTotalCost;
        dataFirstPage.content.forEach((item) => {
            if (item.str === 'TOTAL PO COST:') {
                xTotalCost = item.x;
                yTotalCost = item.y;
            }
        });

        const lstRowsInTable = dataFirstPage.content.filter((item) => xPrice - 2 <= item.x && item.x <= xPrice + 2 && priceRegex.test(item.str));
        const maxHeightObj = lstRowsInTable.reduce((max, current) => (current.y > max.y ? current : max), lstRowsInTable[0]);
        const minHeightObj = lstRowsInTable.reduce((min, current) => (current.y < min.y ? current : min), lstRowsInTable[0]);
        const heightOfTable = maxHeightObj.y - minHeightObj.y + 40;
        const widthOfTable = 295;
        const blankForTable = path.join(__dirname, '/file/blankForTable.png');

        const imgTable = await resizeImage(blankForTable, widthOfTable, parseInt(heightOfTable.toString(), 10), pdfDoc);

        page.drawImage(imgTable, {
            x: xPrice - 5,
            y: page.getHeight() - yTotalCost + 20,
        });

        // For TOTAL PO COST
        const qtyRegex = /^\d+$/;
        let xQty;
        dataFirstPage.content.forEach((item) => {
            if (item.str === 'QTY') {
                xQty = item.x;
            }
        });

        const lstQtyInTable = dataFirstPage.content.filter((item) => xQty - 2 <= item.x && item.x <= xQty + 2 && qtyRegex.test(item.str));
        const blankForTotal = path.join(__dirname, '/file/blankForTotal.png');

        const imgTotal = await resizeImage(blankForTotal, 395, 40, pdfDoc);

        page.drawImage(imgTotal, {
            x: lstQtyInTable[0].x,
            y: page.getHeight() - yTotalCost - 20,
        });

        const modifiedPdfBytes = await pdfDoc.save();
        return modifiedPdfBytes;
    } catch (error) {
        console.log(error);
    }
}

class RemovePdfController {
    constructor() {}
    removeText(req) {
        return new Promise((resolve, reject) => {
            removeFunc(req.files)
                .then((data) => {
                    resolve(data);
                })
                .catch((err) => {
                    console.error('Lỗi khi chuyển đổi PDF:', err);
                    reject();
                });
        });
    }
}
exports.RemovePdfController = new RemovePdfController();
