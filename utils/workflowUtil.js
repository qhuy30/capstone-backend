const { CUSTOM_TEMPLATE_TAG_TYPE, WORKFLOW_FILE_TYPE } = require("./constant");

function validateTagsInWorkflow(workflow) {
    const result = {
        valid: true,
        message: '',
        tags: []
    };

    for (const node of workflow.flow) {
        const validateResult = validateTagsInNode(node, result.tags);
        if (validateResult.valid === false) {
            result.valid = false;
            result.message = validateResult.message;
            break;
        }
        result.tags = result.tags.concat(validateResult.tagNode);
    }

    return result;
}

function validateTagsInNode(node, tagInFlow = []) {
    const result = {
        valid: true,
        message: '',
        tagNode: []
    };

    result.tagNode = node.items.reduce((prev, item) => {
        if (item.signature) {
            prev.push(item.signature);
        }
        if (item.quotationMark) {
            prev.push(item.quotationMark);
        }
        return prev;
    }, []);

    if (node.type === 'all') {
        //Check tag in tagNode is duplicate use filter
        const duplicateTag = result.tagNode.filter((tag, index) => {
            return result.tagNode.indexOf(tag) !== index;
        });
        if (duplicateTag.length > 0) {
            result.valid = false;
            result.message = `Duplicate tag ${duplicateTag.join(', ')} in node ${node.id}`;
        }

        //Check tag in tagNode is exist in tagInFlow
        const tagExist = result.tagNode.filter((tag) => {
            return tagInFlow.indexOf(tag) !== -1;
        });
        if (tagExist.length > 0) {
            result.valid = false;
            result.message = `Tag ${tagExist.join(', ')} exist in previous flow`;
        }
    } else if (node.type === 'one') {
        //Check tag in tagNode is exist in tagInFlow
        const tagExist = result.tagNode.filter((tag) => {
            return tagInFlow.indexOf(tag) !== -1;
        });
        if (tagExist.length > 0) {
            result.valid = false;
            result.message = `Tag ${tagExist.join(
                ', ',
            )} exist in previous flow`;
        }
    }

    return result;
}

function validateTagsNodeWithTemplate(workflow, tagsInNode = []) {
    const result = {
        valid: true,
        message: '',
    };
    const templateTags = workflow.templateTags.reduce(function (prev, tag) {
        if (
            tag.type === CUSTOM_TEMPLATE_TAG_TYPE.SIGNATURE ||
            tag.type === CUSTOM_TEMPLATE_TAG_TYPE.QUOTATION_MARK
        ) {
            prev.push(tag.name);
        }
        return prev;
    }, []);
    // Check is customTemplateTags is not exist in tagsInNode
    const tagNotExist = templateTags.filter((tag) => {
        return tagsInNode.indexOf(tag) === -1;
    });
    if (tagNotExist.length > 0) {
        result.valid = false;
        result.message = `Tag ${tagNotExist.join(
            ', ',
        )} is not exist in workflow`;
    }
    if (result.valid === false) {
        return result;
    }

    // Check is tagsInNode is not exist in customTemplateTags
    const tagExist = tagsInNode.filter((tag) => {
        return templateTags.indexOf(tag) === -1;
    });
    if (tagExist.length > 0) {
        result.valid = false;
        result.message = `Tag ${tagExist.join(', ')} is not exist in template`;
    }

    return result;
}

function isWorkflowUseCustomTemplate(workflow) {
    return workflow.file_type === WORKFLOW_FILE_TYPE.CUSTOM_TEMPLATE;
}

function getTemplateTagFromWorkflow(workflow, options = {}) {
    const excludeTagTypes = options.excludeTagTypes || [];
    const includeTagTypes = options.includeTagTypes || [];

    if (excludeTagTypes.length === 0 && includeTagTypes.length === 0) {
        return workflow.templateTags;
    }
    return workflow.templateTags.reduce(function (prev, tag) {
        if (excludeTagTypes.indexOf(tag.type) !== -1) {
            return prev;
        }

        if (
            includeTagTypes.length === 0 ||
            includeTagTypes.indexOf(tag.type) !== -1
        ) {
            prev.push(tag);
            return prev;
        }
        return prev;
    }, []);
}

module.exports = {
    validateTagsInWorkflow,
    validateTagsNodeWithTemplate,
    isWorkflowUseCustomTemplate,
    getTemplateTagFromWorkflow,
};
