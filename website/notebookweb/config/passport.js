//http://scotch.io/tutorials/javascript/easy-node-authentication-facebook

// load all the things we need
var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy  = require('passport-twitter').Strategy;
var GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;

var nano = require('nano')('http://54.249.245.7/');
var crypto = require('crypto');
http = require('http');

// load up the user model
var User       = require('../app/models/user');

// load the auth variables
var configAuth = require('./auth'); // use this one for testing

function getUser(email, password, callback_result){
    var db = nano.db.use('notebook');
    var doc_id = crypto.createHash('md5').update(email+"-"+password).digest('hex');
    console.log("fetching document id " + doc_id);

    db.get(doc_id, function(err, body){
        if(err){
            console.info(JSON.stringify(err));
            //return done(err);
            callback_result(null);
            
        }else{
            callback_result(body);
        }
    });
}

function addUser (doc_id, doc, done){
    var db = nano.db.use('notebook');
    console.log("creating document id " + doc_id);
    doc.hash = doc_id;
    doc.feeds = {};
    doc.image_width = null;
    db.insert(doc, doc_id, function(err, body){
        if(err){
            console.info(JSON.stringify(err));
            //return done(err);
            throw err;
            
        }else{
            return done(null, doc);
        }
    });    
}

function getUserById(username, callback_result){
    var url = "http://54.249.245.7/notebook/_design/list/_view/userid?key=%22"+username+"%22";
    http.get(url, function(res) {
        var _callback_result = callback_result;
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });
        res.on('end', function() {
            var resp = JSON.parse(body);
            _callback_result(resp.rows);
        });
    }).on('error', function(e) {
          console.log("Got error: ", e);
    });
}

function setDocument(id, obj, success, failure){
    var db = nano.db.use('notebook');
    db.get(id, function(err, doc){
        if(err){failure(err);
        }else{
            for (var key in obj) { doc[key] = obj[key]; }
            db.insert(doc, id, function(err, changed_doc){
                if(err){failure(err);}
                else{success(changed_doc);}
            });
        }
        
    }); 
}

module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        //done(null, user.id);
        //console.log("----->>>>-----" + JSON.stringify(user));
        done(null, user);
    });

    // used to deserialize the user
    passport.deserializeUser(function(doc, done) {
        /*User.findById(id, function(err, user) {
            done(err, user);
        });
        */
        //console.log("-----<<<<-----" + JSON.stringify(doc));
        return done(null, doc);
        /*
        var db = nano.db.use('notebook');
        db.get(doc._id, {
            success:function(body){
                return done(null, body);
            },failure:function(){
                return done(true, null);
            }
        });
        */
    });

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done){
        // asynchronous
        process.nextTick(function(){
            getUserById(email, function(rows){
                if(rows.length){
                    user = rows[0].value;
                    if(user.auth.local.password == crypto.createHash('md5').update(password).digest('hex')){
                        return done(null, user); //, req.flash('loginMessage', 'Ok'));
                    }
                    return done(null, false, req.flash('loginMessage', 'Wrong password.'));
                }else{
                    return done(null, false, req.flash('loginMessage', 'No user found.'));
                }
            });
        });

    }));

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done) {

        // asynchronous
        process.nextTick(function() {
            // check if the user is already logged ina
            if (!req.user) {
                // check to see if theres already a user with that email
                getUserById(email, function(users){
                    if(users.length){
                        return done(null, false, req.flash('loginMessage', 'That email is already taken.'));
                    }else{
                        //create the new user
                        var doc_id = crypto.createHash('md5').update(email).digest('hex');
                        addUser(doc_id, {
                            auth:{
                                local: {
                                    id: email,
                                    username: email,
                                    password: crypto.createHash('md5').update(password).digest('hex')
                                }
                            }
                        }, done);
                    }
                });

                /*
                User.findOne({ 'local.email' :  email }, function(err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // check to see if theres already a user with that email
                    if (user) {
                        return
                         done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                    } else {

                        // create the user
                        var newUser            = new User();

                        newUser.local.email    = email;
                        newUser.local.password = newUser.generateHash(password);

                        newUser.save(function(err) {
                            if (err)
                                throw err;

                            return done(null, newUser);
                        });
                    }
                });
                */
            } else {

                var user            = req.user;
                user.local.email    = email;
                user.local.password = user.generateHash(password);
                user.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });

            }
        });

    }));

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({

        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL,
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },
    function(req, token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // check if the user is already logged in
            if (!req.user) {
                getUserById(profile.id, function(users){
                    var user = {};
                    if(users.length){
                        user = rows[0].value;
                        if(!user.auth){ user.auth = {}; }
                        if(!user.auth.facebook){ user.auth.facebook = {}; }
                        if(user.auth.facebook.token){
                            console.log("found facebook user");
                            return done(null, user);
                        }
                    }
                    console.log("creating / updating facebook user");
                    if(!user.auth){ user.auth = {}; }
                    if(!user.auth.facebook){ user.auth.facebook = {}; }
                    user.auth.facebook.id = profile.id;
                    user.auth.facebook.token = token;
                    user.auth.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                    user.auth.facebook.email = profile.emails[0].value;
                    addUser(user._id, user, done);
                });

                /*
                User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {

                        // if there is a user id already but no token (user was linked at one point and then removed)
                        if (!user.facebook.token) {
                            user.facebook.token = token;
                            user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                            user.facebook.email = profile.emails[0].value;

                            user.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, user);
                            });
                        }

                        return done(null, user); // user found, return that user
                    } else {
                        // if there is no user, create them
                        var newUser            = new User();

                        newUser.facebook.id    = profile.id;
                        newUser.facebook.token = token;
                        newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                        newUser.facebook.email = profile.emails[0].value;

                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });
                */

            } else {
                // user already exists and is logged in, we have to link accounts
                var user            = req.user; // pull the user out of the session

                user.facebook.id    = profile.id;
                user.facebook.token = token;
                user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                user.facebook.email = profile.emails[0].value;

                user.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });

            }
        });

    }));

    // =========================================================================
    // TWITTER =================================================================
    // =========================================================================
    passport.use(new TwitterStrategy({

        consumerKey     : configAuth.twitterAuth.consumerKey,
        consumerSecret  : configAuth.twitterAuth.consumerSecret,
        callbackURL     : configAuth.twitterAuth.callbackURL,
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },
    function(req, token, tokenSecret, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // check if the user is already logged in
            if (!req.user) {

                User.findOne({ 'twitter.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {
                        // if there is a user id already but no token (user was linked at one point and then removed)
                        if (!user.twitter.token) {
                            user.twitter.token       = token;
                            user.twitter.username    = profile.username;
                            user.twitter.displayName = profile.displayName;

                            user.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, user);
                            });
                        }

                        return done(null, user); // user found, return that user
                    } else {
                        // if there is no user, create them
                        var newUser                 = new User();

                        newUser.twitter.id          = profile.id;
                        newUser.twitter.token       = token;
                        newUser.twitter.username    = profile.username;
                        newUser.twitter.displayName = profile.displayName;

                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });

            } else {
                // user already exists and is logged in, we have to link accounts
                var user                 = req.user; // pull the user out of the session

                user.twitter.id          = profile.id;
                user.twitter.token       = token;
                user.twitter.username    = profile.username;
                user.twitter.displayName = profile.displayName;

                user.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });
            }

        });

    }));

    // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
    passport.use(new GoogleStrategy({

        clientID        : configAuth.googleAuth.clientID,
        clientSecret    : configAuth.googleAuth.clientSecret,
        callbackURL     : configAuth.googleAuth.callbackURL,
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },
    function(req, token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // check if the user is already logged in
            if (!req.user) {

                User.findOne({ 'google.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {

                        // if there is a user id already but no token (user was linked at one point and then removed)
                        if (!user.google.token) {
                            user.google.token = token;
                            user.google.name  = profile.displayName;
                            user.google.email = profile.emails[0].value; // pull the first email

                            user.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, user);
                            });
                        }

                        return done(null, user);
                    } else {
                        var newUser          = new User();

                        newUser.google.id    = profile.id;
                        newUser.google.token = token;
                        newUser.google.name  = profile.displayName;
                        newUser.google.email = profile.emails[0].value; // pull the first email

                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });

            } else {
                // user already exists and is logged in, we have to link accounts
                var user               = req.user; // pull the user out of the session

                user.google.id    = profile.id;
                user.google.token = token;
                user.google.name  = profile.displayName;
                user.google.email = profile.emails[0].value; // pull the first email

                user.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });

            }

        });

    }));

};
