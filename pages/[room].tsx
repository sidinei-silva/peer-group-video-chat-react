import React, { useRef, useEffect, useState } from 'react';

// import { Container } from './styles';

const RoomPage: React.FC = () => {
  const myVideoEl = useRef(null);
  const gridVideoEl = useRef(null);
  const [gridCol, setGridCol] = useState(3);
  const videoClasses = 'object-cover h-full w-full';

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
  }, [gridVideoEl]);

  useEffect(() => {
    if (!myVideoEl) {
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(stream => {
        const video = myVideoEl.current;
        video.srcObject = stream;
        video.play();
        video.muted = true;
      });
  }, [myVideoEl]);

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
          <div className="flex-grow overflow-y-auto">
            <ul className="list-none" />
          </div>
        </div>
        <div className="border-t-2 border-gray-200 px-1 pt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Escreva uma mensagem para todos"
              className="text-left w-full text-sm focus:outline-none focus:placeholder-gray-400 text-gray-600 placeholder-gray-600 px-4 shadow rounded-full py-3"
            />
            <div className="absolute right-0 items-center inset-y-0 hidden sm:flex">
              <button
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
