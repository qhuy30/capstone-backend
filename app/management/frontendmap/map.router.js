const express = require('express');
const router = express.Router();
const trycatch = require('trycatch');
const {MapController} = require('./map.controller');
const {SessionProvider} = require('../../../shared/redis/session.provider');
const {PermissionProvider} = require('../../../shared/permission/permission.provider');
const {statusHTTP } = require('../../../utils/setting');
const {Router} = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');

router.get('/public',MultiTenant.match(),Router.trycatchFunction("get/management/map/public",function(req,res){
    return function(){
        let publicValue =  MapController.public();
        if (publicValue.status){
             res.send({data:publicValue.data});
             res.end();
        }else{
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"get/management/map/public",{path:publicValue.err.path,err:publicValue.err.err});
            res.end();
        }
        res = undefined;
        req = undefined;
        publicValue = undefined;
        return;
    }
}));

router.get('/private',MultiTenant.match(),SessionProvider.match,Router.trycatchFunction("get/management/map/private",function(req,res){
    return function(){
        let privateValue =  MapController.private(req.body.session.rule);
        if (privateValue.status){
             res.send({data:privateValue.data});
             res.end();
        }else{
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"get/management/map/private",{path:privateValue.err.path,err:privateValue.err.err});
            res.end();
        }
        res = undefined;
        req = undefined;
        privateValue = undefined;
        return;
    }
}));

router.get('/all',MultiTenant.match(),PermissionProvider.check("Management.Menu.Use"),Router.trycatchFunction("get/management/map/all",function(req,res){
    return function(){
        let allValue =  MapController.all();
        if (allValue.status){
             res.send({data:allValue.data});
             res.end();
        }else{
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"get/management/map/all",{path:allValue.err.path,err:allValue.err.err});
            res.end();
        }
        res = undefined;
        req = undefined;
        allValue = undefined;
        return;
    }
}));


module.exports = router;