require('dotenv').config();

// dependencies required to setup HTTPS://localhost:3000
const fs = require('fs');
const https = require('https');
const path = require('path');

//3rd party middleware
const session = require('express-session');
const { passport } = require( './middleware/auth')
const cors = require('cors');
//server
const express = require('express');
const app = express();
app.use(cors())
app.use( session( {
    secret: process.env.SESSION_KEY, // A secret key for signing the session ID cookie
    resave: false,             // Forces the session to be saved back to the session store
    saveUninitialized: false,  // Forces a session that is "uninitialized" to be saved to the store
    cookie: {
        secure: true,         // Set true if using https
        maxAge: 1000 * 60 * 60 * 24 * 365 // e.g., 1 hour
    }
} ) );
app.use(passport.initialize());
app.use(passport.session());

//our own defined middleware
const { isAuthenticated, getPlayers, getUpdates, getGamelogs } = require('./controllers/yahoo');

app.get('/auth', isAuthenticated )
app.get('/', ( req, res, next ) => {
    res.send('success!');
} )
app.get('/players', 
    isAuthenticated,
    getPlayers
);

app.get('/updates',
    getUpdates
);

app.get('/gamelogs', getGamelogs);

app.get('/callback', 
    passport.authenticate( 'oauth2', { failureRedirect: '/login' } ), 
    ( req, res ) => {
        res.redirect( '/' );
    }
);

app.get('/login', 
    ( req, res ) => {  
        res.send('failed to login and expecitng login route' );
    } 
);

//setting port and server options
const port = 3000;
const options = {
    key: fs.readFileSync( path.join( __dirname, 'localhost.key' ) ),
    cert: fs.readFileSync( path.join( __dirname, 'localhost.cert' ) )
};

https.createServer( options, app ).listen( port, () => {
  console.log( `HTTPS server running at https://localhost:${ port }` );
} );