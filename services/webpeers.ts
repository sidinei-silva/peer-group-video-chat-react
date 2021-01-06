import { joinRoom } from './websocket';

let Peer;
let myPeer;

const peerHost = process.env.PEER_URL;
const peerPort = process.env.PEER_PORT || 5000;

const stunServer = process.env.STUN_SERVER;
const turnServer = process.env.TURN_SERVER;
const turnUsername = process.env.TURN_USERNAME;
const turnCredential = process.env.TURN_CREDENTIAL;

const createMyPeer = () => {
  if (typeof window !== 'undefined') {
    const { Peer: PeerGlobal }: any = window;
    Peer = PeerGlobal;

    const optionsPeer = {
      debug: 3,
      config: {
        iceServers: [],
      },
    };

    if (stunServer) {
      optionsPeer.config.iceServers.push({ url: stunServer });
    }

    if (turnServer) {
      optionsPeer.config.iceServers.push({
        url: turnServer,
        username: turnUsername,
        credential: turnCredential,
      });
    }

    myPeer = new Peer(null, optionsPeer);

    // Para servidor peer próprio

    // const securePeer = peerPort === '443';
    // myPeer = new Peer(undefined, {
    //   path: '/peerjs',
    //   host: peerHost,
    //   port: peerPort,
    //   secure: securePeer,
    //   debug: 3,
    //   config: {
    //     iceServers: [
    //       { url: 'stun:108.177.98.127:19302' },
    //       { url: 'stun:stun.l.google.com:19302' },
    //       {
    //         url: 'turn:numb.viagenie.ca',
    //         credential: 'muazkh',
    //         username: 'webrtc@live.com',
    //       },
    //     ],
    //   },
    // });
  }
};

export const showPeer = () => {
  return myPeer;
};

export const openPeer = ({ room, name }) => {
  createMyPeer();

  if (myPeer) {
    myPeer.on('open', id => {
      joinRoom(room, id, name);
    });
  }
};

export const subscribeCall = callback => {
  myPeer.on('call', call => {
    return callback(null, call);
  });

  return false;
};

export const peerCall = (userId, stream) => {
  return myPeer.call(userId, stream);
};

export const myPeerId = () => {
  return myPeer.id;
};

export const subscribeError = callback => {
  myPeer.on('error', errorPeer => {
    return callback(null, errorPeer);
  });

  return false;
};
