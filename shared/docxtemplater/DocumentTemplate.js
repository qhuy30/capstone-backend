const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const DocxTemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');

const imageModuleOption = {
    centered: false,
    fileType: 'docx',
    getImage: function (tagValue, tagName) {
        const object = JSON.parse(tagValue);
        return Buffer.from(object.base64Buffer, 'base64');
    },
    getSize: function (img, tagValue, tagName) {
        const object = JSON.parse(tagValue);
        return [object.width, object.height];
    },
};

function nullGetter(part, scopeManager) {
    if (!part.module) {
        return '{' + part.value + '}';
    }
    if (part.module === 'rawxml') {
        return '';
    }
    return '';
}

function processTagObject(tags = {}) {
    const object = {};
    for (const key in tags) {
        Object.assign(object, { [key]: `${tags[key].value}` });
    }
    return object;
}

class DocumentTemplate {
    constructor(buffer, options = {}) {
        this.buff = buffer;
        this.dbname_prefix = options.dbname_prefix || null;
        this.initialize();
    }

    initialize() {
        const zip = new PizZip(this.buff);
        this.template = new DocxTemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            modules: [new ImageModule(imageModuleOption)],
            nullGetter: nullGetter,
        });
    }

    prepareTemplateTag(tags = {}) {
        const object = {};
        for (const key in tags) {
            const tagName = key;
            const tagType = tags[key].type;
            if (tagType === 'image') {
                Object.assign(object, { [tagName]: `{%${tagName}}` });
            }
        }
        this.template.render(object);
        this.buff = this.getAsBuffer();
        this.initialize();
    }

    processTagsValue(tagsValue = {}) {
        this.prepareTemplateTag(tagsValue);
        const objectToRender = processTagObject(tagsValue);
        this.template.render(objectToRender);
    }

    processPreviewTag(customTag = []) {
        const listTagVal = customTag.reduce((prev, tag) => {
            Object.assign(prev, {
                [tag.name]: tag.type === 'signature' ? '' : tag.value,
            });
            return prev;
        }, {});
        this.template.render(listTagVal);
    }

    appendImage(buffer, options = {}) {}

    writeToFile(fileName, filePath = __dirname) {
        fs.writeFileSync(path.resolve(filePath, fileName), this.getAsBuffer());
    }

    getAsBuffer() {
        return this.template.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });
    }
}

module.exports = DocumentTemplate;
