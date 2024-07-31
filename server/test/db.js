require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool( {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT
} );

const queryDatabase = async ( queryText, queryParams ) => {
  const client = await pool.connect();
  try {
      const res = await client.query(queryText, queryParams);
      return res.rows;
  } finally {
      client.release(); // Releases the client back to the pool
  }
};

//team queries
const doesTeamIdExist = async ( id ) => {

  const queryText = 'SELECT COUNT(*) FROM rosters WHERE teamId = $1';
  const queryParams = [ id ];

  const client = await pool.connect();

  try {

    const res = await client.query(queryText, queryParams);
    return res.rows[0].count > 0;

  } finally {

    client.release();

  }

};

const insertTeam = async ( id, name ) => {

  const exists = await doesTeamIdExist( id );
  
  if( !exists ) {

    const queryText = 'INSERT INTO rosters( teamId, teamName  ) VALUES( $1, $2 ) RETURNING *';
    const queryParams = [ id, name ];

    const client = await pool.connect();
    try {

      const res = await client.query(queryText, queryParams);
      return res.rows[0];

    } finally {

      client.release();
      
    }

  }

};

//player queries
const doesPlayerIdExist = async ( id ) => {

  const queryText = 'SELECT COUNT(*) FROM players WHERE playerId = $1';
  const queryParams = [ id ];

  const client = await pool.connect();

  try {

    const res = await client.query(queryText, queryParams);
    return res.rows[0].count > 0;

  } catch (error) {
    console.error( error )
  } finally {

    client.release();

  }

};

const getPositionId = async ( positionName ) => {

  const queryText = 'SELECT positionId FROM positions WHERE positionName = $1';
  const queryParams = [ positionName.toLowerCase() ];

  const client = await pool.connect();

  const res = await client.query( queryText, queryParams );
  return res.rows[ 0 ] ? res.rows[ 0 ].positionid : null;
  
};

const insertPlayer = async ( playerId, playerName, positionName, teamId ) => {

  const positionId = await getPositionId( positionName );
  const exists = await doesPlayerIdExist( playerId );

  if( positionId  && !exists ) {

    const queryText = 'INSERT INTO players ( playerId, playerName, positionId, teamId ) VALUES ( $1, $2, $3, $4 ) RETURNING *';
    const queryParams = [ playerId, playerName, positionId, teamId ];
    const client = await pool.connect();
    try {
      const result = await client.query( queryText, queryParams );
      return result[0];

    } catch( error ) {

      console.error( 'error inserting player', error );

    } finally {

      if( client ) {
        client.release();
      }

    }
   

  }
    
  
  

}

module.exports = { insertTeam, insertPlayer };