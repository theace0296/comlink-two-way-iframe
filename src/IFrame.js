import * as Comlink from 'comlink';

import './App.css';

function IFrame() {
  return (
    <div className="App">
      <div
        style={{
          border: 'white solid 2px',
          backgroundColor: '#303030',
          width: 450,
          height: 450,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <p>SOME IFRAME TEXT</p>
      </div>
    </div>
  );
}

export default IFrame;
