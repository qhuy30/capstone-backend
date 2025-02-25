const momentTimezone = require("moment-timezone");

const { DEFAULT_TIMEZONE, WORKFLOW_DURATION_UNIT, CUSTOM_TEMPLATE_TAG_TYPE } = require("@utils/constant");

function isWorkflowUserCustomTemplate(workflowPlay) {
    const tagValue = workflowPlay.tags_value || {};
    return Object.keys(tagValue).length > 0;
}

function isTagSigned(tagName, signatureTags) {
    for (const tag of signatureTags) {
        if (tag.name === tagName && tag.isSigned) {
            return true;
        }
    }
    return false;
}

function getCurrentNodeOfWorkflowPlay(workflowPlay) {
    const flowIndex = workflowPlay.node - 1;
    if (flowIndex < 0) return null;
    return workflowPlay.flow[flowIndex];
}

function getCurrentNodeAfterApproveWorkflowPlay(workflowPlay) {
    const flowLength = workflowPlay.flow.length;
    if (workflowPlay.node == -1){
        return workflowPlay.flow[flowLength -1];
    }
    const flowIndex = workflowPlay.node;
    if (flowIndex < 0) return null;
    return workflowPlay.flow[flowIndex];
}

function getTagsInNodeItems(items) {
    const tags = [];
    for (const item of items) {
        if (item.signature) {
            tags.push(item.signature);
        }
        if (item.quotationMark) {
            tags.push(item.quotationMark);
        }
    }
    return tags;
}

function isSignerMatchWithItem(signer, item) {
    const employeeDetails = signer.employee_details;
    if (item.methods !== 'flexible') {
        if (item.department && item.department !== employeeDetails.department) {
            return false;
        }
        if (item.competence && item.competence !== employeeDetails.competence) {
            return false;
        }
        if (item.role !== "" && !signer.role.includes(item.role)) {
            return false;
        }
    }
    return true;

}

function validateSignerCanSignNode(signer, currentNode, signatureTags) {
    const result = {
        isCanSign: true,
        isSigned: false,
    };

    const items = currentNode.items.filter((item) => {
        return isSignerMatchWithItem(signer, item);
    });

    if (items.length === 0) {
        result.isCanSign = false;
        return result;
    }

    const listTagInItems = getTagsInNodeItems(items);
    result.isSigned = listTagInItems.every((tag) => {
        if (isTagSigned(tag, signatureTags)) {
            return true;
        }
        return false;
    });

    return result;
}

function getTagsNeedSignInNode(signer, currentNode, signatureTags) {
    const nodeType = currentNode.type;
    const [itemsMatch, itemsNotMatch] = currentNode.items.reduce(
        (result, item) => {
            if (isSignerMatchWithItem(signer, item)) {
                result[0].push(item);
            } else {
                result[1].push(item);
            }
            return result;
        },
        [[], []],
    );
    switch (nodeType) {
        case "one": {
            const tags = [];
            for (const item of itemsMatch) {
                if (item.signature && !isTagSigned(item.signature, signatureTags)) {
                    tags.push({
                        name: item.signature,
                        type: CUSTOM_TEMPLATE_TAG_TYPE.SIGNATURE,
                    });
                }
                if (item.quotationMark && !isTagSigned(item.quotationMark, signatureTags)) {
                    tags.push({
                        name: item.quotationMark,
                        type: CUSTOM_TEMPLATE_TAG_TYPE.QUOTATION_MARK,
                    });
                }
            }

            for (const item of itemsNotMatch) {
                if (item.signature) {
                    tags.push({
                        name: item.signature,
                        type: CUSTOM_TEMPLATE_TAG_TYPE.SIGNATURE,
                        skip: true,
                    });
                }
                if (item.quotationMark) {
                    tags.push({
                        name: item.quotationMark,
                        type: CUSTOM_TEMPLATE_TAG_TYPE.QUOTATION_MARK,
                        skip: true,
                    });
                }
            }
            return tags;
        }

        case "all": {
            const tags = [];
            for (const item of itemsMatch) {
                if (item.signature && !isTagSigned(item.signature, signatureTags)) {
                    tags.push({
                        name: item.signature,
                        type: CUSTOM_TEMPLATE_TAG_TYPE.SIGNATURE,
                    });
                }
                if (item.quotationMark && !isTagSigned(item.quotationMark, signatureTags)) {
                    tags.push({
                        name: item.quotationMark,
                        type: CUSTOM_TEMPLATE_TAG_TYPE.QUOTATION_MARK,
                    });
                }
            }
            return tags;
        }

        default: {
            return [];
        }
    }
}

function mapUserToItem(user, flownNode) {
    const items = flownNode.items;
    const result = {
        username: user.username,
        items: [],
    };
    for (const item of items) {
        if (item.methods != 'flexible') {
            if (item.department !== user.department) {
                continue;
            }
            if (item.competence !== "" && item.competence !== user.competence) {
                continue;
            }
            if (item.role !== "" && !user.role.includes(item.role)) {
                continue;
            }
            result.items.push(item.id);
        } else {
            result.items.push(item.id);
        }
    }
    return result;
}

function getAttachmentsInWorkflowPlay(workflowPlay) {
    return workflowPlay.attachment;
}

function getAttachmentInWorkflowPlayByFileName(workflowPlay, fileName) {
    const attachments = getAttachmentsInWorkflowPlay(workflowPlay);
    for (const attachment of attachments) {
        if (attachment.name === fileName) {
            return attachment;
        }
    }
    return null;
}

function removeUsernameInPlayNow(playNow, username) {
    return playNow.filter((item) => {
        return item.username !== username;
    });
}

function countApprovalOfWorkflow(workflowPlay) {
    const currentNodeNumber = workflowPlay.node;
    const events = workflowPlay.event || [];
    return events.reduce((result, event) => {
        if (event.action.toLowerCase() === "returned") {
            result = 0;
        }
        if (event.action.toLowerCase() === "approved" && event.node === currentNodeNumber && event.valid) {
            result += 1;
        }
        return result;
    }, 1);
}

function calculateExpectedCompleteAt(startDate, amount = 0, unit = "day") {
    switch (unit) {
        case WORKFLOW_DURATION_UNIT.DAY:
            startDate += amount * 24 * 60 * 60 * 1000;
            break;
        case WORKFLOW_DURATION_UNIT.HOUR:
            startDate += amount * 60 * 60 * 1000;
            break;
        case WORKFLOW_DURATION_UNIT.MINUTE:
            startDate += amount * 60 * 1000;
            break;
        case WORKFLOW_DURATION_UNIT.BUSINESS_DAY:
            startDate += amount * 24 * 60 * 60 * 1000;
            const weekDay = momentTimezone(startDate).tz(DEFAULT_TIMEZONE).isoWeekday();
            switch (weekDay) {
                case 6:
                    startDate += 2 * 24 * 60 * 60 * 1000;
                    break;
                case 7:
                    startDate += 24 * 60 * 60 * 1000;
                    break;
                default:
                    break;
            }
            break;
        default:
            break;
    }
    return startDate;
}

function calculateFlowNodeTimes(workflowPlay, startDate, node) {
    const object = {
        startAt: startDate,
        expectedCompleteAt: null,
    };

    if (node < 1) {
        return object;
    }

    const flow = workflowPlay.flow[node - 1];
    object.expectedCompleteAt = calculateExpectedCompleteAt(object.startAt, flow.duration.amount, flow.duration.unit);

    return object;
}

module.exports = {
    isWorkflowUserCustomTemplate,
    getCurrentNodeOfWorkflowPlay,
    getCurrentNodeAfterApproveWorkflowPlay,
    validateSignerCanSignNode,
    getTagsNeedSignInNode,
    mapUserToItem,
    getAttachmentsInWorkflowPlay,
    getAttachmentInWorkflowPlayByFileName,
    removeUsernameInPlayNow,
    countApprovalOfWorkflow,
    calculateFlowNodeTimes,
};
