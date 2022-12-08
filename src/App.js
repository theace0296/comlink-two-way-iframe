import * as Comlink from 'comlink';

import './App.css';

const generateUUID = () =>
  Array.from({ length: 4 }, () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join('-');

/**
 * @typedef RemoteInterface
 * @property {(id: string, port: MessagePort) => void} __initialize__
 */

class RemotesContainer {
  /** @type {Map<string, import('comlink').Remote<RemoteInterface>>} */
  _remotes = new Map();

  /** @type {Map<string, MessagePort>} */
  _ports = new Map();

  async push(target) {
    const id = generateUUID();
    const { port1, port2 } = new MessageChannel();

    this._ports.set(id, port1);
    this._remotes.set(id, Comlink.wrap(Comlink.windowEndpoint(target)));
    console.log('Attempting to initialize IFrame Window...');
    Comlink.expose(AppService, port1);
    // Wait a bit for the comlink instance on the iframe to load...
    // theoretically we could start the handshake process from the iframe,
    // but for slightly better security we don't want to allow abitrary
    // iframes to set up a connection
    await new Promise(res => setTimeout(res, 250));

    // It seems because of the way we're setting up this two-way communication
    // we can't await the __initialize__ function like we'd expect with Comlink,
    // as an alternative we pass through an initialize callback to tell us when
    // we're done.
    let resolver, rejector;
    const complete = new Promise((res, rej) => {
      resolver = res;
      rejector = rej;
    });
    const initializeCallback = (success, ...args) => {
      if (!success) {
        rejector();
      }
      resolver();
    };
    this._remotes.get(id).__initialize__(id, Comlink.transfer(port2, [port2]), Comlink.proxy(initializeCallback));
    await complete;
  }

  hasRemoteWithId(id) {
    return this._remotes.has(id);
  }
}

const AppService = {
  _remotesContainer: new RemotesContainer(),
  __handshake__(id) {
    if (!this._remotesContainer.hasRemoteWithId(id)) {
      console.log(`IFrame attempted to handshake with invalid ID: ${id}`);
      return false;
    }
    console.log(`Registered iframe with app service, ID: ${id}`);
    return true;
  },
};

function App() {
  const handleIFrameOnLoad = e => {
    AppService._remotesContainer.push(e.target.contentWindow);
  };

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
        <iframe title="Test" src="/" width={500} height={500} onLoad={handleIFrameOnLoad} />
      </div>
    </div>
  );
}

export default App;
