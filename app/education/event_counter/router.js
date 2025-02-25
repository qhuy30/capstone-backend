const express = require('express');
const router = express.Router();
const { EventCounterController } = require('./controller');
const { validation } = require('./validation');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const { MultiTenant } = require('../../../shared/multi_tenant/provider');




module.exports = router;