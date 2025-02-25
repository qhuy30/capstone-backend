const { Storage } = require('@google-cloud/storage')
const { StoreConst } = require('./store.const');

const storage = new Storage({
  projectId: StoreConst.projectId,
  credentials: {
    private_key: StoreConst.googlePrivateKey,
    client_email: StoreConst.googleClientEmail,
  }
});
class bucketGoogleCloud {
  constructor() { }

  createBucket() {
    return storage.bucket(StoreConst.bucketName);
  }

  deleteFile(filePath) {
    const bucket = this.createBucket();
    const file = bucket.file(filePath);
    file.delete().then(() => {
      return filePath;
    }).catch(err => {
      return err;
    });
  }

}

exports.bucketGoogleCloud = new bucketGoogleCloud();