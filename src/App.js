import * as Comlink from 'comlink';

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

  /** @type {Map<string, Window>} */
  _targets = new Map();

  /**
   * @param {Window | null} target
   */
  async push(target) {
    if (!target) {
      return;
    }
    const id = generateUUID();
    const { port1, port2 } = new MessageChannel();

    this._ports.set(id, port1);
    this._targets.set(id, target);
    this._remotes.set(id, Comlink.wrap(Comlink.windowEndpoint(target)));
    console.log('Attempting to initialize IFrame Window...', target);
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
    console.log(`Registered IFrame with App Service, ID: ${id}`, this._remotesContainer._targets.get(id));
    return true;
  },
};

function App() {
  /** @param {import('react').SyntheticEvent<HTMLIFrameElement, Event>} e */
  const handleIFrameOnLoad = e => {
    AppService._remotesContainer.push(e.currentTarget.contentWindow);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <div
        style={{
          display: 'grid',
          gap: '7px',
          gridTemplateColumns: 'repeat(2, 1fr)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {Array.from({ length: 4 }, (_, i) => (
          <iframe key={i} title={`Test ${i}`} src="/" width={300} height={300} onLoad={handleIFrameOnLoad} />
        ))}
      </div>
    </div>
  );
}

export default App;
