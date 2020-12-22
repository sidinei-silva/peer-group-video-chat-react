import { joinRoom } from './websocket';

let Peer;
let myPeer;

const peerHost = process.env.PEER_URL;
const peerPort = process.env.PEER_PORT;

if (typeof window !== 'undefined') {
  const { Peer: PeerGlobal }: any = window;
  Peer = PeerGlobal;
  myPeer = new Peer(undefined, {
    path: '/peerjs',
    host: peerHost,
    port: peerPort,
  });
}

export const openPeer = room => {
  myPeer.on('open', id => {
    console.log('Meu id:', id);
    joinRoom(room, id);
  });
};

export const subscribeCall = callback => {
  myPeer.on('call', call => {
    console.log('Ouvindo call', call);
    return callback(null, call);
  });
};

export const peerCall = (userId, stream) => {
  return myPeer.call(userId, stream);
};
