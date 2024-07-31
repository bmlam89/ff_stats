import axios from 'axios';

const getAuth = async () => {
    
    const url = "/auth";
    try {

        const resp = await axios.get( url );
        console.log( resp.data, 'DATA' );
  
      } catch( error ) {
  
          console.error( 'Error in /players route' , error );
  
      }

};

const getPlayers = async () => {

    const url = "/players";
    try {

      const resp = await axios.get( url );
      console.log( resp.data, 'DATA' );

    } catch( error ) {

        console.error( 'Error in /players route' , error );

    }

};

const getUpdates = async () => {

    const url = '/updates';

    try {

        const resp = await axios.get( url );
        console.log( resp.data, 'DATA' );
  
      } catch( error ) {
  
          console.error( 'Error in /updates route' , error );
  
      }

};

const getGamelogs = async () => {

    const url = '/gamelogs';
    const resp = await axios.get( url );
    console.log( resp.data, 'gamelog data!!' );

}


function App() {

    return (
        <div className="App">
            <h1>hello world</h1>
            <div>
                <button onClick={ getAuth }>Click for auth</button>
            </div>
            <div>
                <button onClick={ getPlayers }>Click for players</button>
            </div>
            <div>
                <button onClick={ getUpdates }>Click for updates</button>
            </div>
            <div>
                <button onClick={ getGamelogs }>Click for gamelogs</button>
            </div>
        </div>
    );
}

export default App;