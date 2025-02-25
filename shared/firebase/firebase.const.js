module.exports = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    maxTokensPerRequest: 500,
    maxTopicsPerRequest: 1000,
    maxPayloadSize: 4096, // 4KB
    messageTimeout: 60000, // 60 seconds
    retryCount: 3
};
