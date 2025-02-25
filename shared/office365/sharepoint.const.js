const {
    SHAREPOINT_DOMAIN,
    SHAREPOINT_USERNAME,
    SHAREPOINT_PASSWORD
} = process.env;

exports.SharepointConst ={
    domain: SHAREPOINT_DOMAIN,
    username: SHAREPOINT_USERNAME,
    password: SHAREPOINT_PASSWORD,
    filesize: 5*1024*1024
};