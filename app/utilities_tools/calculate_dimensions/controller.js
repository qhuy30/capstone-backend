const sizeOf = require('buffer-image-size');
const q = require('q');
const { ConfigSetup } = require('../../../shared/setup/config.const');
const tiff = require('tiff');
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp', 'image/x-icon', 'image/vnd.adobe.photoshop', 'image/heif', 'image/svg+xml'];
class CalculateDimensionsController {
    constructor() {}

    calculate(req) {
        let dfd = q.defer();
        const inpWidth = req.body.width;
        const inpHeight = req.body.height;
        let arrFail = [];
        for (var i in req.files) {
            if (req.files[i].mimetype === 'image/tiff') {
                const tiffBuffer = req.files[i].buffer;
                const tiffInfo = tiff.decode(tiffBuffer);
                const dataMap = new Map(tiffInfo[0].fields);
                const width = dataMap.get(256);
                const height = dataMap.get(257);
                if (width != inpWidth && height != inpHeight) {
                    arrFail.push(req.files[i].originalname);
                }
            } else if (allowedMimeTypes.includes(req.files[i].mimetype)) {
                let dimensions = sizeOf(req.files[i].buffer);
                const orgWidth = dimensions.width;
                const orgHeight = dimensions.height;
                if (orgWidth != inpWidth || orgHeight != inpHeight) {
                    arrFail.push(req.files[i].originalname);
                }
            } else {
                arrFail.push(req.files[i].originalname);
            }
        }

        dfd.resolve(arrFail);

        return dfd.promise;
    }
}
exports.CalculateDimensionsController = new CalculateDimensionsController();
