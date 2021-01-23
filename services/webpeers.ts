/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-underscore-dangle */
import { joinRoom } from './websocket';

let Peer;
let myPeer;

interface IUser {
  id: string;
  name: string;
  isMuted: boolean;
  isHandUp: boolean;
}

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

    const securePeer = peerHost !== 'localhost';

    const optionsPeer = {
      debug: 0,
      path: '/peerjs',
      host: peerHost,
      port: peerPort,
      secure: securePeer,
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
  }
};

export const showPeer = () => {
  if (myPeer) {
    return myPeer;
  }
  return false;
};

export const openPeer = ({ room, name }) => {
  createMyPeer();

  if (myPeer) {
    myPeer.on('open', id => {
      joinRoom(room, id, name);
    });
  }
  return false;
};

export const peerRemoveAllEvents = () => {
  if (myPeer) {
    const eventOpen = myPeer._events.open;
    // @ts-ignore
    myPeer.removeAllListeners();
    myPeer._events.open = eventOpen;
  }
};

export const subscribeCall = callback => {
  if (myPeer) {
    myPeer.on('call', call => {
      return callback(null, call);
    });
  }

  return false;
};

export const peerCall = (userId, stream, user: IUser | null, type: string) => {
  if (myPeer) {
    return myPeer.call(userId, stream, { metadata: { user, type } });
  }
  return false;
};

export const myPeerId = () => {
  if (myPeer) {
    return myPeer.id;
  }
  return false;
};

export const subscribeError = callback => {
  if (myPeer) {
    return myPeer.on('error', errorPeer => {
      return callback(null, errorPeer);
    });
  }

  return false;
};
