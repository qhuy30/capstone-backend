const q = require('q');
const { FileConst } = require('@shared/file/file.const');
const { FileProvider } = require('@shared/file/file.provider');
const { LogProvider } = require('@shared/log_nohierarchy/log.provider');
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

class SupportController {
    constructor() { }

    load_FAQs() {
        const dfd = q.defer();
        const filePath = path.join(FileConst.pathLocal, "templates/faqs.xlsx");

        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                LogProvider.error('Can not access template for FAQs', err);
                return dfd.reject(err);
            }

            const workbook = new ExcelJS.Workbook();
            workbook.xlsx.readFile(filePath).then(() => {
                const worksheet = workbook.getWorksheet(1);
                if (!worksheet) {
                    const error = new Error('Sheet does not exist for FAQs');
                    LogProvider.error(error.message);
                    return dfd.reject(error);
                }

                const faqs = [];
                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber <= 2) return; // Bỏ 2 dòng đầu

                    const questionVi = row.getCell(1).text.trim();
                    const answerVi = row.getCell(2).text.trim();
                    const questionEn = row.getCell(3).text.trim();
                    const answerEn = row.getCell(4).text.trim();

                    if (questionVi && answerVi) {
                        faqs.push({ question: questionVi, answer: answerVi, language: 'vi-VN' });
                    }
                    if (questionEn && answerEn) {
                        faqs.push({ question: questionEn, answer: answerEn, language: 'en-US' });
                    }
                });

                dfd.resolve(faqs);
            }).catch((err) => {
                LogProvider.error('Can not read template for FAQs', err);
                dfd.reject(err);
            });
        });

        return dfd.promise;
    }

    load_user_manuals() {
        const dfd = q.defer();
        try {
            const directoryPath = path.join(FileConst.pathLocal, 'templates', 'user_manual');

            if (!fs.existsSync(directoryPath)) {
                LogProvider.error('Directory not found');
                return dfd.reject(new Error('Directory not found'));
            }

            const files = fs.readdirSync(directoryPath)
                .filter(file => path.extname(file).toLowerCase() === '.pdf') // Chỉ lấy file PDF
                .map(file => ({
                    title: path.basename(file, '.pdf'), // Loại bỏ phần mở rộng
                    attachment: {
                        folder: "user_manual",
                        display: "Xem hướng dẫn",
                        name: file,
                        id: "_"
                    }
                }));

            dfd.resolve(files);
        } catch (error) {
            LogProvider.error('Error reading user manual files', error);
            dfd.reject(error);
        }

        return dfd.promise;
    }

    load_file_info(body) {
        let dfd = q.defer();

        const fileInfo = body.fileInfo;
        if (fileInfo) {
            FileProvider.loadTemplateFile(
                fileInfo.name,
                fileInfo.folder
            ).then(
                function (fileinfo) {
                    fileinfo.display = fileInfo.display;
                    dfd.resolve(fileinfo);
                },
                function (err) {
                    dfd.reject(err);
                },
            );
        } else {
            dfd.reject({ path: "MeetingRoomController.load_file_info.FileIsNotExists", mes: "FileIsNotExists" });
        }

        return dfd.promise;
    }

    downloadfile(body) {
        const dfd = q.defer();

        const directoryPath = path.join(FileConst.pathLocal, 'templates', body.folder);

        if (!fs.existsSync(directoryPath)) {
            LogProvider.error('Directory not found');
            return dfd.reject(new Error('Directory not found'));
        }

        FileProvider.downloadBufferTemplateFile('templates/' + body.folder + '/' + body.name).then(
            (res) => dfd.resolve(res),
            dfd.reject,
        )

        return dfd.promise;
    }
}

exports.SupportController = new SupportController();