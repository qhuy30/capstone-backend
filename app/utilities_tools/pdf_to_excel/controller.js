const pdf2table = require('pdf2table');
const xlsx = require('xlsx');
const pdf = require('pdf-parse');
const moment = require('moment-timezone');
const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();
const today = moment();
const momentTimezone = 'Asia/Ho_Chi_Minh';
const dateTZ = moment.tz(today, momentTimezone);
const date = moment(dateTZ).format('DD/MM/YYYY');
const { PDFDocument, PDFName, PDFRawStream } = require('pdf-lib');
const headerShip = 'SHIP TO:';
const headerBill = 'BILL TO:';

let combineData = [];
let isRemovedFile = false;

async function handleCommonValue(bufferValue, index, isRemovedExFatoryDate) {
    let items = [];

    async function render_page(pageData) {
        let render_options = {
            normalizeWhitespace: true,
            disableCombineTextItems: true,
        };

        const textContent = await pageData.getTextContent(render_options);

        for (let item of textContent.items) {
            if (item.str.trim() != '') {
                items.push(item.str);
            }
        }
        return items;
    }

    let options = {
        pagerender: render_page,
    };

    return new Promise((resolve, reject) => {
        let addrData = [];

        pdfExtract.extractBuffer(bufferValue, {}, (err, data) => {
            let tempHeader = [];
            let tempValue = [];
            if (err) return console.log(err);
            let shipInfo = convertAddresFromPDFExtract(data.pages[0].content, headerShip);
            let billInfo = convertAddresFromPDFExtract(data.pages[0].content, headerBill);
            tempHeader.push(headerShip, headerBill);
            tempValue.push(shipInfo, billInfo);
            addrData.push(tempHeader, tempValue);
        });
        pdf(bufferValue, options).then(() => {
            if (isRemovedExFatoryDate) {
                const indexEndAddr = items.indexOf('EX-FACTORY DATE:');
                items.splice(indexEndAddr + 1, 0, '');
                items.push('');
            }
            let resultCommonValue = [];
            let temp = [];
            let temp2 = [];
            let resultData = [];
            const indexStartPO = items.indexOf('PO#: ');
            if (indexStartPO === -1) {
                items.unshift('PO#: ', '');
                items.splice(2, items.indexOf('MASTER PO#: ') - 2);
            }

            const indexStart = items.indexOf('PO#: ');
            const indexEnd = items.indexOf('TOTAL PO UNITS:') + 2;
            const result = items.slice(indexStart, indexEnd);
            const lastTwoElements = items.slice(-2);

            const indexEndPO = result.indexOf('MASTER PO#: ');
            const selectedElementsPO = result.splice(1, indexEndPO - 1);
            const concatenatedStringPO = selectedElementsPO[0];
            result.splice(1, 0, concatenatedStringPO);

            const indexVendor = result.indexOf('VENDOR:');
            result.splice(indexVendor, 3);

            const indexStartAddr = result.indexOf('ORDER DATE:') + 2;
            const indexEndAddr = result.indexOf('EX-FACTORY DATE:');
            result.splice(indexStartAddr, indexEndAddr - indexStartAddr);

            const indexStartStyle = result.indexOf('STYLE NAME:') + 1;

            const indexStartMasterPO = result.indexOf('MASTER PO#: ');

            const selectedElementsMasterPO = result.splice(indexStartMasterPO + 1, indexStartStyle - 1 - indexStartMasterPO - 1);
            const concatenatedStringMasterPO = selectedElementsMasterPO.join('');
            const outputStringMasterPO = concatenatedStringMasterPO.replace(/\s+/g, ' ');

            result.splice(indexStartMasterPO + 1, 0, outputStringMasterPO);

            const indexStartStyle2 = result.indexOf('STYLE NAME:') + 1;
            const indexEndStyle = result.indexOf('DEVELOPMENT STYLE #:');
            const selectedElements = result.splice(indexStartStyle2, indexEndStyle - indexStartStyle2);
            const concatenatedString = selectedElements.join('');
            const outputString = concatenatedString.replace(/\s+/g, ' ');
            const indexEndStyle2 = result.indexOf('DEVELOPMENT STYLE #:');

            result.splice(indexStartStyle2, indexEndStyle2 - indexStartStyle2, outputString);

            const indexAgent = result.indexOf('AGENT:');
            if (indexAgent !== -1) {
                const indexEndStyle3 = result.indexOf('DEVELOPMENT STYLE #:') + 1;
                const developmentStyle = result.splice(indexEndStyle3, indexAgent - indexEndStyle3);
                const developmentStyleValue = developmentStyle.join('');
                const normalizedString = developmentStyleValue.split(/\s+/).filter(Boolean).join(' ');
                const indexAgent2 = result.indexOf('AGENT:');
                result.splice(indexEndStyle3, indexAgent2 - indexEndStyle3, normalizedString);
                const indexAgent3 = result.indexOf('AGENT:');
                result.splice(indexAgent3, 1);
            }

            const indexFabric = result.indexOf('FABRIC:');
            if (indexFabric !== -1) {
                const indexEndStyle3 = result.indexOf('DEVELOPMENT STYLE #:') + 1;
                const developmentStyle = result.splice(indexEndStyle3, indexFabric - indexEndStyle3);
                const developmentStyleValue = developmentStyle.join('');
                const normalizedString = developmentStyleValue.split(/\s+/).filter(Boolean).join(' ');
                const indexFabric2 = result.indexOf('FABRIC:');
                result.splice(indexEndStyle3, indexFabric2 - indexEndStyle3, normalizedString);
                const indexFabric3 = result.indexOf('FABRIC:');
                const indexHtsCode = result.indexOf('HTS CODE:');
                const rawFabric = result.splice(indexFabric3 + 1, indexHtsCode - indexFabric3 - 1);
                const fabricValue = rawFabric.join('').split(/\s+/).filter(Boolean).join(' ');
                result.splice(indexFabric3 + 1, 0, fabricValue);
            }
            

            // Find the index of "HTS CODE:" and "Retail MSRP:"
            const htsIndex = result.indexOf('HTS CODE:');
            const msrpIndex = result.indexOf('Retail MSRP:');
            // Check if "HTS CODE:" and "Retail MSRP:" are adjacent
            if (htsIndex !== -1 && msrpIndex !== -1 && msrpIndex === htsIndex + 1) {
                // Add an empty string between them
                result.splice(msrpIndex, 0, '');
            }
            const msrpIndexNew = result.indexOf('Retail MSRP:');
            const orderDateIndex = result.indexOf('ORDER DATE:');
            // Check if "ORDER DATE:" and "Retail MSRP:" are adjacent
            if (msrpIndexNew !== -1 && orderDateIndex !== -1 && orderDateIndex === msrpIndexNew + 1) {
                // Add an empty string between them
                result.splice(orderDateIndex, 0, '');
            }

            const resultCommon = result.concat(lastTwoElements);
            for (let i = 0; i < resultCommon.length; i++) {
                if (i % 2 === 0) {
                    temp.push(resultCommon[i]);
                } else {
                    temp2.push(resultCommon[i]);
                }
            }
            resultCommonValue.push(temp, temp2);

            for (let i = 0; i < resultCommonValue.length; i++) {
                const mergedArray = resultCommonValue[i].concat(addrData[i]);
                resultData.push(mergedArray);
            }
            if (index !== 0) {
                resultData.shift();
            }
            resolve(resultData);
        });
    });
}

async function updateData(file, trimmedData, commonData, index) {
    const imagesInDoc = [];
    return new Promise((resolve, reject) => {
        PDFDocument.load(file.buffer).then((data) => {
            data.context.indirectObjects.forEach((pdfObject, ref) => {
                if (!(pdfObject instanceof PDFRawStream)) return;
                const { dict } = pdfObject;
                const subtype = dict.get(PDFName.of('Subtype'));
                const filter = dict.get(PDFName.of('Filter'));

                if (subtype === PDFName.of('Image')) {
                    imagesInDoc.push({
                        ref,
                        type: filter === PDFName.of('DCTDecode') ? 'jpg' : 'png',
                    });
                }
            });
            if (imagesInDoc.length > 1) {
                isRemovedFile = true;
                if (index === 0) {
                    commonData[1][6] = '';
                    // TODO:
                    // commonData[1][10] = '';
                    for (let i = 1; i < trimmedData.length; i++) {
                        const lastIndex = trimmedData[i].length - 1;
                        const secondLastIndex = trimmedData[i].length - 2;
                        trimmedData[i][lastIndex] = '';
                        trimmedData[i][secondLastIndex] = '';
                    }
                    resolve({ trimmedData, commonData });
                } else {
                    commonData[0][6] = '';
                    // TODO:
                    // commonData[0][10] = '';
                    for (let i = 0; i < trimmedData.length; i++) {
                        const lastIndex = trimmedData[i].length - 1;
                        const secondLastIndex = trimmedData[i].length - 2;
                        trimmedData[i][lastIndex] = '';
                        trimmedData[i][secondLastIndex] = '';
                    }
                    resolve({ trimmedData, commonData });
                }
            } else {
                resolve({ trimmedData, commonData });
            }
        });
    });
}

function mergeData(trimmedData, commonData, index) {
    if (index === 0) {
        const firstEle = commonData[0];
        trimmedData[0] = [...trimmedData[0], ...firstEle, 'CONVERT DATE:'];
        for (let i = 1; i < trimmedData.length; i++) {
            trimmedData[i] = [...trimmedData[i], ...commonData[1], date];
        }
    } else {
        for (let i = 0; i < trimmedData.length; i++) {
            trimmedData[i] = [...trimmedData[i], ...commonData[0], date];
        }
    }
    return trimmedData;
}

async function convertPDFtoXLSX(file, index) {
    return new Promise((resolve, reject) => {
        pdf2table.parse(file.buffer, async (err, rows) => {
            if (err) return reject(err);
            const headerIndex = rows.findIndex((row) => row[0] === 'UPC' && row[1] === 'SKU' && row[2] === 'SIZE' && row[3] === 'QTY' && row[4] === 'PRICE' && row[5] === 'TOTAL');
            if (headerIndex !== -1) {
                const commonData = await handleCommonValue(file.buffer, index);
                let findHeaderIndex = index === 0 ? headerIndex : headerIndex + 1;

                for (let i = 0; i < rows.length; i++) {
                    // Check if current element is beyond headerIndex and has different length
                    if (i > findHeaderIndex && rows[i].length !== rows[findHeaderIndex].length && rows[i][0] !== 'TOTAL PO COST:') {
                        // Add the value to the previous element
                        rows[i - 1][1] = rows[i - 1][1] + '' + rows[i][0];
                        // Remove the current element
                        rows.splice(i, 1);
                        // Decrement the index to account for the removed element
                        i--;
                    }
                }

                const trimmedData = rows.slice(findHeaderIndex);
                trimmedData.pop();
                updateData(file, trimmedData, commonData, index).then(({ trimmedData, commonData }) => {
                    const data = mergeData(trimmedData, commonData, index);
                    resolve(data);
                });
            } else {
                let isRemovedExFatoryDate = true;
                const commonData = await handleCommonValue(file.buffer, index, isRemovedExFatoryDate);
                const headerIndex = rows.findIndex((row) => row[0] === 'UPC' && row[1] === 'SKU' && row[2] === 'SIZE' && row[3] === 'QTY');
                let findHeaderIndex = index === 0 ? headerIndex : headerIndex + 1;
                const trimmedData = rows.slice(findHeaderIndex);
                trimmedData.pop();
                if (index === 0) {
                    for (let i = 0; i < trimmedData.length; i++) {
                        if (i === 0) {
                            trimmedData[i].push('PRICE', 'TOTAL');
                        } else {
                            trimmedData[i].push('', '');
                        }
                    }
                } else {
                    for (let i = 0; i < trimmedData.length; i++) {
                        trimmedData[i].push('', '');
                    }
                }
                isRemovedFile = true;
                updateData(file, trimmedData, commonData, index).then(({ trimmedData, commonData }) => {
                    const data = mergeData(trimmedData, commonData, index);
                    resolve(data);
                });
            }
        });
    });
}

function convertAddresFromPDFExtract(dataInput, header) {
    let xValue = dataInput.find((i) => i.str === header);
    let xData = dataInput.filter((i) => i.x === xValue.x);
    let itemIndex = xData.findIndex((item) => item.str.includes(header));
    let sliced = xData.slice(itemIndex);
    sliced.shift();
    let strValues = sliced.map((item) => item.str);
    let result = strValues.join(' ');

    return result;
}

async function convertPDFs(files) {
    const pdfFiles = files.filter((item) => item.mimetype === 'application/pdf');
    let index = 0;
    for (const file of pdfFiles) {
        const dataFile = await convertPDFtoXLSX(file, index);
        combineData = [...combineData, ...dataFile];
        index++;
    }
}

class PDFToExcelController {
    constructor() {}

    convertPdf2Excel(req) {
        return new Promise((resolve, reject) => {
            convertPDFs(req.files)
                .then(() => {
                    //* Resort the column of file before convert to xlsx
                    const indexFabric = combineData[0].indexOf('FABRIC:');
                    const indexPO = combineData[0].indexOf('PO#: ');
                    const numberFabric = indexFabric === -1 ? 0 : -1;
                    const indexTotalPO = combineData[0].indexOf('TOTAL PO UNITS:') + numberFabric;
                    const indexShipTo = combineData[0].indexOf('SHIP TO:') + numberFabric;
                    const indexHtsCode = combineData[0].indexOf('HTS CODE:') + numberFabric;
                    let indexDeliveryTerm = 0;
                    for (let i = 0; i < combineData.length; i++) {
                        if (indexFabric !== -1) {
                            const moveFabric = combineData[i].splice(indexFabric, 1);
                            combineData[i].splice(combineData[i].length, 0, ...moveFabric);
                        }

                        const moveElems = combineData[i].splice(indexPO, 4);
                        combineData[i].splice(0, 0, ...moveElems);

                        const elems1 = combineData[i].splice(indexTotalPO, 2);
                        combineData[i].splice(indexHtsCode, 0, ...elems1);

                        const elems2 = combineData[i].splice(indexShipTo, 2);
                        if (indexDeliveryTerm === 0) {
                            indexDeliveryTerm = combineData[i].indexOf('DELIVERY TERMS:');
                        }
                        combineData[i].splice(indexDeliveryTerm, 0, ...elems2);
                    }
                    // remove TOTAL PO COST:
                    const indexTotalPOCost = combineData[0].indexOf('TOTAL PO COST:');
                    combineData.forEach(function(subArray) {
                        if (subArray.length >= indexTotalPOCost) {
                            subArray.splice(indexTotalPOCost, 1); 
                        }
                    });

                    const newWB = xlsx.utils.book_new();
                    const newWS = xlsx.utils.aoa_to_sheet(combineData);
                    combineData = [];

                    const formatConditions = [
                        { char: 'E', format: '##0' },
                        { char: 'H', format: '##0' },
                        { char: 'I', format: '$#,###.00' },
                        { char: 'J', format: '$#,###.00' },
                        { char: 'K', format: '#,###' },
                        // { char: 'L', format: '$#,###.00' },
                        { char: 'M', format: '$#,###.00' },
                    ];
                    let formatDateConditions;
                    if (isRemovedFile) {
                        formatDateConditions = [
                            { char: 'N', format: 'MM-DD-YYYY' },
                            { char: 'T', format: 'DD-MM-YYYY' },
                        ];
                    } else {
                        formatDateConditions = [
                            { char: 'N', format: 'MM-DD-YYYY' },
                            { char: 'O', format: 'MM-DD-YYYY' },
                            { char: 'T', format: 'DD-MM-YYYY' },
                        ];
                    }

                    for (let cell in newWS) {
                        let value = newWS[cell].v;
                        formatConditions.forEach((cond) => {
                            if (cell.includes(cond.char) && cell !== `${cond.char}1`) {
                                value = value.replace(/[\$,]/g, '');
                                newWS[cell] = {
                                    v: value,
                                    t: 'n',
                                    z: cond.format,
                                };
                            }
                        });

                        formatDateConditions.forEach((cond) => {
                            if (cell.includes(cond.char) && cell !== `${cond.char}1`) {
                                const date = moment(value, cond.format).format('YYYY-MM-DD');
                                newWS[cell] = {
                                    v: date,
                                    t: 'd',
                                };
                            }
                        });
                    }

                    if (!newWS['!cols']) newWS['!cols'] = [];

                    if (!newWS['!cols'][3]) newWS['!cols'][3] = { wch: 8 };

                    newWS['!cols'][3].wpx = 90;

                    const result = {
                        wb: newWB,
                        ws: newWS,
                    };
                    isRemovedFile = false;
                    resolve(result);
                })
                .catch((err) => {
                    console.error('Lỗi khi chuyển đổi PDF:', err);
                    isRemovedFile = false;
                    reject();
                });
        });
    }
}
exports.PDFToExcelController = new PDFToExcelController();
