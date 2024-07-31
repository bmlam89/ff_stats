;// dependencies required to setup HTTPS://localhost:3000
const fs = require('fs');
const https = require('https');
const path = require('path');
//xml to json 
const xml2js = require('xml2js');
const parser = new xml2js.Parser();
//server
const express = require('express');
require('dotenv').config();
const axios = require('axios');
const app = express();
const port = 3000;
// HTTPS options
const options = {
  key: fs.readFileSync( path.join( __dirname, 'localhost.key' ) ),
  cert: fs.readFileSync( path.join( __dirname, 'localhost.cert' ) )
};
// utility function to convert xml to json
const xmlToJson = async ( xmlData ) => {

  const result = await parser.parseStringPromise( xmlData );
  return result;
  
};
//db 
const { insertTeam, insertPlayer } = require( './db' );


//1. get fantasy football leagues a user is participating in
const getLeagues_1 = async ( accessToken ) => {

  const url = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues';
  try {

    const response = await axios.get( url, {
      headers: {
        'Authorization': `Bearer ${ accessToken }`,
        'Content-Type': 'application/json'
      }
    } );
    const jsonData = await xmlToJson( response.data );
    const leagues = jsonData.fantasy_content.users[ 0 ].user[ 0 ].games[ 0 ].game[ 0 ].leagues[ 0 ].league;
    return leagues;

  } catch ( error ) {

    console.error( 'Error in getLeagues_1', error );
    throw error;

  } 
  
  
};
//2. get teams aka managers participating in a specific league
const getTeam_2 = async ( { leagueKey, accessToken } ) => {

  const url = `https://fantasysports.yahooapis.com/fantasy/v2/league/${ leagueKey }/teams`;
  try {

    const response = await axios.get( url, {
      headers: {
        'Authorization': `Bearer ${ accessToken }`,
        'Content-Type': 'application/json'
      }
    } );
    const jsonData = await xmlToJson( response.data );
    const team = jsonData.fantasy_content.league[ 0 ].teams[ 0 ].team;
    return team;

  } catch ( error ) {

    console.error( 'Error in getTeam_2', error );
    throw error;

  }
  
};
//3. get current players on a manager's specified team
const getRoster_3 = async ( { teamKey, accessToken } ) => {

  const url = `https://fantasysports.yahooapis.com/fantasy/v2/team/${ teamKey }/roster/players`;
  try {

    const response = await axios.get( url, {
      headers: {
        'Authorization': `Bearer ${ accessToken }`,
        'Content-Type': 'application/json'
      }
    } );
    const jsonData = await xmlToJson( response.data );
    const roster = jsonData.fantasy_content.team[ 0 ].roster[ 0 ].players[ 0 ].player;
    return roster;

  } catch ( error ) {

    console.error( 'Error in getRoster_3', error );
    throw error;

  }

};
//4. get stat categories based on league settings
const getStatCategories_4 = async ( { leagueKey, accessToken } ) => {

  const url = `https://fantasysports.yahooapis.com/fantasy/v2/league/${ leagueKey }/settings`;
  try {

    const response = await axios.get( url, {
      headers: {
          'Authorization': `Bearer ${ accessToken }`,
          'Content-Type': 'application/json'
      }
    } );
    const jsonData = await xmlToJson( response.data );
    const statCategories = jsonData.fantasy_content.league[ 0 ].settings[ 0 ].stat_categories[ 0 ].stats[ 0 ].stat;
    return statCategories;

  } catch ( error ) {

    console.error( 'Error in getStatCategories_4', error );
    throw error;

  }
  
};
//5. get stats of players specified by playerKeys
const getStatsIds_5 = async ( { leagueKey, playerKeys, accessToken } ) => {

  const url = `https://fantasysports.yahooapis.com/fantasy/v2/league/${ leagueKey }/players;player_keys=${ playerKeys }/stats`;
  try {

    const response = await axios.get( url, {
      headers: {
        'Authorization': `Bearer ${ accessToken }`,
        'Content-Type': 'application/json'
      }
    } );
    const jsonData = await xmlToJson( response.data );

    const statIds = jsonData.fantasy_content.league[ 0 ].players[ 0 ].player;
    
    return statIds;

  } catch ( error ) {

    console.error( 'Error in getStats_5', error );
    throw error;

  }

};



//7. get players sorted in descending fantasy point order in batches of 25
const getPlayers_7 = async ( { leagueKey, accessToken, targetPlayerCount, maxCount = 25, offset = 0 } ) => {

  let results = [];

  while( results.length < targetPlayerCount ) {

    const count = Math.min( maxCount, targetPlayerCount - results.length );

    try {
      
      const url = `https://fantasysports.yahooapis.com/fantasy/v2/league/${ leagueKey }/players;sort=PTS;start=${ offset };count=${ count }`;
      const response = await axios.get( url, {

        headers: {
            'Authorization': `Bearer ${ accessToken }`,
            'Content-Type': 'application/json'
        }

      } );

      const jsonData = await xmlToJson( response.data );
      const players = jsonData.fantasy_content.league[ 0 ].players[ 0 ].player;

      offset += players.length;
      players.forEach( async player => {
        
        const res = await insertPlayer( player.player_id[ 0 ], player.name[ 0 ].full[ 0 ], player.primary_position[ 0 ], player.editorial_team_key[ 0 ] );
        results.push( res );
    
      } );
      
    } catch ( error ) {

      console.error( error );
      throw( error );

    }

  }

};

const getPlayerStats_8 = async ( { leagueKey, accessToken } ) => {
  const url = `https://fantasysports.yahooapis.com/fantasy/v2/league/${ leagueKey }/players;player_keys=423.p.33500,423.p.31883,423.p.29399,423.p.32687/stats`
  try {

    const response = await axios.get( url, {
        headers: {
            'Authorization': `Bearer ${ accessToken }`,
            'Content-Type': 'application/json'
        }
    } );
    const jsonData = await xmlToJson( response.data );
    console.log( JSON.stringify( jsonData, null, 4 ) );
   

  } catch ( error ) {

    console.error( 'Error fetching WR season data:', error );
    throw error;

  }
}


app.get( '/auth', ( _, res ) => {
  const origin = 'https://api.login.yahoo.com/oauth2/request_auth';
  const queryParams = `?client_id=${ process.env.CLIENT_ID }&redirect_uri=${ process.env.REDIRECT_URI }&response_type=code&language=en-us`;
  const url = origin + queryParams;
  res.redirect( url );
} );

app.get( '/callback', async ( req, res ) => {
  const code = req.query.code;
  const tokenUrl = 'https://api.login.yahoo.com/oauth2/get_token';
  try {

    const tokenResponse = await axios.post( tokenUrl, new URLSearchParams( {

      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri: process.env.REDIRECT_URI,
      code: code,
      grant_type: 'authorization_code'

    } ), {

      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }

    } );
  
    //1. get league data and accessToken before making api requests
    console.log( JSON.stringify( tokenResponse.data, null, 4 ),'dataa' );
    console.log(tokenResponse.data.refresh_token, 'refreshhh' );
    const accessToken = tokenResponse.data.access_token;
    
    const headers = {
      'Authorization': `Bearer ${ accessToken }`,
      'Content-Type': 'application/json'
    }
    const leagues = await getLeagues_1( accessToken );
    const leagueKey = leagues[ 1 ].league_key;
  
    //test apis
    const getPlayers = async ( pos, offset ) => {
      const query = `sort=PTS;position=${ pos };start=${ offset }/stats`;
      const url = `https://fantasysports.yahooapis.com/fantasy/v2/league/${ leagueKey }/players;${ query }`;
      const resp = await axios.get( url, headers );
      const json = await xmlToJson( resp.data );
      const players = json.fantasy_content.league[ 0 ].players[ 0 ].player;
      players.forEach( ( player, idx ) => {

       if( idx === 24 ) {

        console.log( JSON.stringify( player, null, 4 ) );

       }

      } );
      console.log( url, 'url' );

      return players;

    }

    const getGamelog = async ( pk ) => {

      try {

        const query = `player_ids=${ pk }/stats;type=week;week=3`;
        const url = `https://fantasysports.yahooapis.com/fantasy/v2/league/${ leagueKey }/players;${ query }`;
        const resp = await axios.get( url, { headers } );
        const json = await xmlToJson( resp.data );
  
        console.log( JSON.stringify( json, null, 4 ) );
        console.log( url );
        return json;

      } catch ( error ) {

        console.error( error );

      }
   
    }
    // const gamelog = await getGamelog( 40168 ); //by id

    res.send('Authentication successful! please');

    return accessToken;

  } catch ( error ) {

    console.error( 'Error during token exchange:', error );
    res.status( 500 ).send( 'Authentication failed' );

  }
    
} );

app.get( '/', ( _, res ) => {
  res.send( 'Yahoo Fantasy Football API Integration' );
} );

https.createServer( options, app ).listen( port, () => {
  console.log( `HTTPS server running at https://localhost:${ port }` );
} );