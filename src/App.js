import * as Comlink from 'comlink';

import './App.css';

function App() {
  return (
    <div className="App">
      <div
        style={{
          border: 'black solid 1px',
          width: 500,
          height: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <iframe title='Test' src='/' width={500} height={500} />
      </div>
    </div>
  );
}

export default App;
