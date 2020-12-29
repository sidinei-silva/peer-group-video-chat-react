import { useRouter } from 'next/dist/client/router';
import React, { useRef, useEffect, useState } from 'react';
import { getMyMediaWebCam } from '../services/navegatorMedia';
import {
  openPeer,
  peerCall,
  showPeer,
  subscribeCall,
} from '../services/webpeers';
import {
  socketSendMessage,
  subcribeCreateMessage,
  subcribeUserConnect,
  subcribeUserDisconnect,
} from '../services/websocket';

const peers = {};

const RoomPage: React.FC = () => {
  const myVideoEl = useRef(null);
  const gridVideoEl = useRef(null);
  const [gridCol, setGridCol] = useState(1);
  const [inputMessage, setInputMessage] = useState('');
  const [name, setName] = useState('');
  const [modal, setModal] = useState(true);

  const videoClasses = 'object-cover h-full w-full';
  const router = useRouter();
  const { room } = router.query;

  const enterRoom = () => {
    if (room && modal && name.length > 0) {
      setModal(false);
      openPeer({ room, name });
    }
  };

  useEffect(() => {
    if (!myVideoEl) {
      return;
    }
    getMyMediaWebCam((err, stream) => {
      const video = myVideoEl.current;
      video.srcObject = stream;
      video.play();
      video.muted = true;
    });
  }, [myVideoEl]);

  useEffect(() => {
    if (modal) {
      return;
    }
    subscribeCall((err, call) => {
      getMyMediaWebCam((errWebCam, stream) => {
        call.answer(stream);
        const hostVideo = document.createElement('video');
        hostVideo.id = call.peer;
        peers[call.peer] = call;
        call.on('stream', userVideoStream => {
          addVideoStream(hostVideo, userVideoStream);
        });
      });
    });

    subcribeUserConnect((err, userId) => {
      getMyMediaWebCam((errWebCam, stream) => {
        const call = peerCall(userId, stream);
        const newUserVideoElement = document.createElement('video');
        newUserVideoElement.id = userId;
        call.on('stream', userVideoStream => {
          addVideoStream(newUserVideoElement, userVideoStream);
        });
        peers[userId] = call;
        console.log('Peers: ', peers);
        console.log('Variable Global myPeers: ', showPeer());
      });
    });

    subcribeUserDisconnect((err, userId) => {
      if (peers[userId]) {
        peers[userId].close();
        const elementDisconnected = document.getElementById(userId);
        if (elementDisconnected) {
          elementDisconnected.remove();
          if (gridCol < 3) {
            setGridCol(gridCol - 1);
          }
        }
      }
    });

    subcribeCreateMessage((err, autorName, message) => {
      const chatList = document.getElementById('chat-list');
      const messageItem = document.createElement('li');

      const autorMessage = document.createElement('p');
      autorMessage.className += 'text-xs font-bold';
      const autorText = document.createTextNode(autorName);
      autorMessage.append(autorText);
      messageItem.append(autorMessage);

      messageItem.className += 'p-1 px-3 text-sm';
      const itemText = document.createTextNode(message);
      messageItem.append(itemText);

      chatList.append(messageItem);
      const windowsChat = document.getElementById('windows-chat');
      windowsChat.scrollTop = windowsChat.scrollHeight;
    });
  }, [modal]);

  useEffect(() => {
    const gridVideo = gridVideoEl.current;
    switch (gridVideo.children.length) {
      case 0:
        setGridCol(0);
        break;
      case 1:
        setGridCol(1);
        break;
      case 2:
        setGridCol(2);
        break;

      default:
        setGridCol(3);
        break;
    }
  });

  const keyDownEnter = event => {
    if (event.which === 13) {
      handleSendMessage();
    }
  };

  const addVideoStream = (videoElement, stream) => {
    videoElement.srcObject = stream;
    videoElement.className += videoClasses;
    console.log('Adicionando stream', stream);
    videoElement.addEventListener('loadedmetadata', () => {
      console.log('Evento loadedmetadata');
      videoElement.play();
      const videoGridElement = gridVideoEl.current;
      videoGridElement.append(videoElement);
      if (gridCol < 3) {
        setGridCol(gridCol + 1);
      }
    });
  };

  const handleSendMessage = () => {
    if (inputMessage.length > 0) {
      const chatList = document.getElementById('chat-list');
      const messageItem = document.createElement('li');
      messageItem.className += 'p-1 text-sm text-right';
      const itemText = document.createTextNode(inputMessage);
      messageItem.append(itemText);
      chatList.append(messageItem);
      const windowsChat = document.getElementById('windows-chat');
      windowsChat.scrollTop = windowsChat.scrollHeight;

      socketSendMessage(name, inputMessage);
      setInputMessage('');
    }
  };

  return (
    <div className="flex flex-row h-screen max-h-screen w-screen max-w-screen">
      <div
        ref={gridVideoEl}
        className={`bg-black w-full grid grid-flow-row grid-cols-${gridCol} gap-4`}
      >
        <video className={videoClasses} ref={myVideoEl}>
          <track kind="captions" srcLang="pt-BR" />
        </video>
      </div>
      <div className="bg-white w-100">
        <div className="border-b-2 h-16 text-center flex justify-center p-2">
          <h4 className=" font-bold text-xl">Chat</h4>
        </div>
        <div className="h-5/6">
          <div id="windows-chat" className="flex-grow overflow-y-auto">
            <ul id="chat-list" className="list-none" />
          </div>
        </div>
        <div className="border-t-2 border-gray-200 px-1 pt-4">
          <div className="relative">
            <input
              onKeyDown={keyDownEnter}
              value={inputMessage}
              onChange={event => setInputMessage(event.target.value)}
              type="text"
              placeholder="Escreva uma mensagem para todos"
              className="text-left w-full text-sm focus:outline-none focus:placeholder-gray-400 text-gray-600 placeholder-gray-600 px-4 shadow rounded-full py-3"
            />
            <div className="absolute right-0 items-center inset-y-0 hidden sm:flex">
              <button
                onClick={handleSendMessage}
                type="button"
                className="inline-flex items-center justify-center rounded-full h-12 w-12 transition duration-500 ease-in-out text-white bg-blue-500 hover:bg-blue-400 focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-6 w-6 transform rotate-90"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      {modal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75" />
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-headline"
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3
                    className="text-lg leading-6 font-medium text-gray-900"
                    id="modal-headline"
                  >
                    Necessário nome de usuário
                  </h3>
                  <div className="mt-2 w-full">
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      id="name"
                      className="shadow w-full h-full rounded-lg p-4 mr-0 text-gray-800 border-gray-200 bg-white outline-none "
                      placeholder="Insira seu nome"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={enterRoom}
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Entrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomPage;
