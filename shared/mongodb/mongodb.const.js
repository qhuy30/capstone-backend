const {
    MONGODB_CONNECT_STRING,
    MONGODB_USER,
    MONGODB_PASSWORD,
    MONGODB_SCHEMA_AUTH
} = process.env;

const settings = require('../../utils/setting');
var obj = {
    poolSize: 10,
    bufferMaxEntries: 0,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectString: MONGODB_CONNECT_STRING,
    user: MONGODB_USER,
    password: MONGODB_PASSWORD,
    schemaAuth: MONGODB_SCHEMA_AUTH,
    limitItem:5000,
    connectName:{
        management:"",
        office:"",
        basic:"basic",
        education:"education",
        host: {
            management: 'theera_management',
            business: 'theera_business',
        },
    },
    prefixHost: 'theera',
    systemUsername: [
        'system',
        'systemSetup',
        'tqvspo',
        '157vinci',
        'admin',
        'administrator',
    ],
    nameCollection: {
        user: 'user',
        group: 'group',
        recyclebin: 'recyclebin',
        backup: 'backup',
        config: 'config',
        language: 'language',
        employee: 'employee',
    },
    nameField: {
        SoftDelete: 'isdeleted',
    },
    sensetiveField: ['password'],
    sequenceId: {
        nameCollection: 'sequenceid',
        valueInc: 1,
    },
    SafeCollection: {
        host: {
            user: {
                numberversion: 5,
            },
            menu: {
                numberversion: 5,
            },
        },
        tenant: {
            user: {
                numberversion: 5,
            },
        },
    },
    NotEntityCollection: {
        host: {},
        tenant: {},
    },
    SessionCollections: ['group', 'employee', 'user'],
};

module.exports =obj;
