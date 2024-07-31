const axios = require('axios');

const xml2js = require('xml2js');
const parser = new xml2js.Parser( { explicitArray: false } );
const xmlToJson = async ( xml ) => {

    const result = await parser.parseStringPromise( xml );
    return result;

};

const isAuthenticated = async ( req, res, next ) => {
    if ( req.isAuthenticated() ) { // req.isAuthenticated() is provided by passport
        next()
    }

    delete req.session.leagueKey;
    res.redirect('/callback'); // Redirect to authentication route if not authenticated
};

const getLeagueKey = async ( req, res, next ) => {
    const url = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues';
    try {
    
        const resp = await axios.get( url, {
            headers: {
                'Authorization': `Bearer ${ req.session.passport.user.accessToken }`,
                'Content-Type': 'application/json'
            }
        } );

        const jsonData = await xmlToJson( resp.data );
        
        const leagues = jsonData.fantasy_content.users.user.games.game.leagues.league;
        const leagueKey = leagues[ 1 ].league_key;
        return leagueKey

    } catch ( error ) {
    
        console.error( 'Error in getLeagues', error );
        throw error;
    
    } 
    
};

const getPlayers = async ( req, res, next ) => {

    if( req.isAuthenticated() ) {

    

        if( !( 'leagueKey' in req.session) ) {

            const leagueKey = await getLeagueKey( req );
            req.session.leagueKey = leagueKey;

        }

        const url = `https://fantasysports.yahooapis.com/fantasy/v2/league/${ req.session.leagueKey }/players;sort=PTS/stats`;
        const resp = await axios.get( url, {
            headers: {
                'Authorization': `Bearer ${ req.session.passport.user.accessToken }`,
                'Content-Type': 'application/json'
            }
        } );

        const json = await xmlToJson( resp.data );
        const players = json.fantasy_content.league.players.player;
        res.send( { data: { players } } );
    } 
    res.redirect('/callback')
   
};

const getUpdates = async ( req, res, next ) => {

    // if( !( 'leagueKey' in req.session) ) {

    //     const leagueKey = await getLeagueKey( req );
    //     req.session.leagueKey = leagueKey;

    // }

    const url = `https://fantasysports.yahooapis.com/fantasy/v2/league/${ req.session.leagueKey }/players;sort_type=week;sort_week=18`;
    const resp = await axios.get( url, {
        headers: {
            'Authorization': `Bearer ${ req.session.passport.user.accessToken }`,
            'Content-Type': 'application/json'
        }
    } );

    const json = await xmlToJson( resp.data );
    res.send( { data: { json } } );

};

const getGamelogs = async ( req, res, next ) => {

    const url = `https://fantasysports.yahooapis.com/fantasy/v2/league/${ req.session.leagueKey }/players;sort_type=week;sort_week=18`;
    const resp = await axios.get( url, {
        headers: {
            'Authorization': `Bearer ${ req.session.passport.user.accessToken }`,
            'Content-Type': 'application/json'
        }
    } );

    const json = await xmlToJson( resp.data );
    res.send( { data: { json } } );

};

module.exports = { isAuthenticated, getPlayers, getUpdates, getGamelogs };