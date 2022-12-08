import * as Comlink from 'comlink';

/**
 * @typedef RemoteInterface
 * @property {(id: string) => boolean} __handshake__
 */

const IFrameService = {
  /** @type {string} */
  _id: '',
  /** @type {import('comlink').Remote<RemoteInterface>} */
  _remote: null,

  /**
   * @param {string} id
   * @param {MessagePort} port
   * @param {(success: boolean, ...args) => void} initializeCallback
   */
  async __initialize__(id, port, initializeCallback) {
    this._id = id;
    this._remote = Comlink.wrap(port);
    console.log(`Attempting to handshake with Parent Window...`);
    const connected = await this._remote.__handshake__(this._id);
    if (!connected) {
      console.log('Failed to connect to Parent Window!');
      initializeCallback(false);
    }
    console.log(`Connected to Parent Window with ID: ${this._id}!`);
    initializeCallback(true);
  },
};
Comlink.expose(IFrameService, window);

function IFrame() {
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
          border: 'white solid 2px',
          backgroundColor: '#303030',
          width: 250,
          height: 250,
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
