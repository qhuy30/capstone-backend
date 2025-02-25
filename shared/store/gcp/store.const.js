const { PROJECT_ID, GOOGLE_PRIVATE_KEY, GOOGLE_CLIENT_EMAIL, BUCKET_NAME, STORAGE_BASE_PATH, RECOVER_FOUND } =
  process.env;

var obj = {
  projectId: PROJECT_ID,
  googlePrivateKey: GOOGLE_PRIVATE_KEY,
  googleClientEmail: GOOGLE_CLIENT_EMAIL,
  bucketName: BUCKET_NAME,
  basePath: STORAGE_BASE_PATH,
  recoverFound: RECOVER_FOUND,
};
exports.StoreConst = obj;
