/**
 * Builds options for file handling.
 *
 * @param {Object} options - The options for file handling.
 * @param {boolean} options.skipHugeFile - Whether to skip huge files or not.
 * @returns {Object} The built options.
 */
function buildOptions (options = {}) {
    return {
        skipHugeFile: options.skipHugeFile || true,
    };
}

/**
 * Gets uploaded files with a specific key from form data.
 *
 * @param {Object} params - The parameters for getting the files.
 * @param {string} params.nameLib - The name library.
 * @param {Object} params.formData - The form data containing the files.
 * @param {string} params.fieldKey - The key to get the files from the form data.
 * @param {Object} params.additionalFields - Additional fields to add to the files.
 * @param {Object} params.options - Options for file handling.
 * @returns {Array} The uploaded files with the specific key.
 */
exports.getUploadedFilesWithSpecificKey = function ({ nameLib, formData, fieldKey, additionalFields = {}, options = {} }) {
    let files = [];
    const isSkipHugeFile = buildOptions(options);

    if (!formData.fileInfo || !formData.fileInfo[fieldKey]) {
        return files;
    }

    return formData.fileInfo[fieldKey].map((file) => {
        if (!file.huge || !isSkipHugeFile) {
            return Object.assign(
                {
                    folder: file.folderPath,
                    timePath: file.timePath,
                    locate: file.type,
                    display: file.filename,
                    name: file.named,
                    nameLib,
                },
                additionalFields,
            );
        }
    });
};

