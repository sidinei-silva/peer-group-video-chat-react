import { useRouter } from 'next/dist/client/router';
import React, { useRef, useEffect, useState } from 'react';
import { getMyMediaWebCam } from '../services/navegatorMedia';
import { openPeer, peerCall, subscribeCall } from '../services/webpeers';
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

  const videoClasses = 'object-cover h-full w-full';
  const router = useRouter();
  const { room } = router.query;

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
    if (room) {
      openPeer(room);
    }
  }, [room]);

  useEffect(() => {
    subscribeCall((err, call) => {
      getMyMediaWebCam((errWebCam, stream) => {
        call.answer(stream);
        console.log('Respondendo', stream);
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
          alert('Novo usuario conectado');
          addVideoStream(newUserVideoElement, userVideoStream);
        });
        peers[userId] = call;
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

    subcribeCreateMessage((err, message) => {
      const chatList = document.getElementById('chat-list');
      const messageItem = document.createElement('li');
      messageItem.className += 'p-1 px-3 text-sm';
      const itemText = document.createTextNode(message);
      messageItem.append(itemText);
      chatList.append(messageItem);
      const windowsChat = document.getElementById('windows-chat');
      windowsChat.scrollTop = windowsChat.scrollHeight;
    });
  }, []);

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
    videoElement.addEventListener('loadedmetadata', async () => {
      await videoElement.play();
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

      socketSendMessage(inputMessage);
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
    </div>
  );
};

export default RoomPage;
