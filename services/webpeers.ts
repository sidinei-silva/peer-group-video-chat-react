import { joinRoom } from './websocket';

let Peer;
let myPeer;

const peerHost = process.env.PEER_URL;
const peerPort = process.env.PEER_PORT || 5000;

if (typeof window !== 'undefined') {
  const { Peer: PeerGlobal }: any = window;
  Peer = PeerGlobal;
  const securePeer = peerPort === '443';
  myPeer = new Peer(undefined, {
    path: '/peerjs',
    host: peerHost,
    port: peerPort,
    secure: securePeer,
  });
}

export const showAllPeers = () => {
  return myPeer;
};

export const openPeer = room => {
  myPeer.on('open', id => {
    joinRoom(room, id);
  });
};

export const subscribeCall = callback => {
  myPeer.on('call', call => {
    return callback(null, call);
  });
};

export const peerCall = (userId, stream) => {
  return myPeer.call(userId, stream);
};
