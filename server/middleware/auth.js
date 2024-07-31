require('dotenv').config();
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;

passport.use( new OAuth2Strategy( {

        authorizationURL: 'https://api.login.yahoo.com/oauth2/request_auth',
        tokenURL: 'https://api.login.yahoo.com/oauth2/get_token',
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "https://localhost:3000/callback"

    },
    ( accessToken, refreshToken, _, cb ) => {

        cb(null, { accessToken, refreshToken } );

    }
) );

passport.serializeUser( ( user, cb ) => {
    cb( null, user );
} );

passport.deserializeUser( ( user, cb ) => {
    cb( null, user );
} );

module.exports = { passport };