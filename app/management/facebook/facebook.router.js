const express = require('express');
const router = express.Router();
const passport = require('passport');
//Login
router.get(
    '/oauth/get',
    passport.authenticate(
        'facebook', 
        { 
            scope:['email']
        }
    ));

router.get(
    '/oauth/callback',
    passport.authenticate(
        'facebook',
        { 
            scope: ['email'],
            successRedirect: '/home',
            failureRedirect: '/login'
        })
    );

module.exports = router;