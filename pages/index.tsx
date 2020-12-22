import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const myVideoEl = useRef(null);
  const [pageUrl, setPageUrl] = useState('');
  const [myCodeRoom, setMyCodeRoomUrlRoom] = useState('');
  const urlRoom = `${pageUrl}/${myCodeRoom}`;

  useEffect(() => {
    const uuid = uuidv4();
    setMyCodeRoomUrlRoom(uuid);
  }, []);

  useEffect(() => {
    const fullUrl = `${window.location.protocol}//${window.location.hostname}${
      window.location.port ? `:${window.location.port}` : ''
    }`;
    setPageUrl(fullUrl);
  }, []);

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
    <div className="container mx-auto ">
      <main className="h-screen flex flex-col justify-center gap-12">
        <div>
          <h1 className="text-6xl leading-tight text-center">
            Bem vindx ao
            <a className="text-blue-400" href="/">
              {' '}
              Beet!
            </a>
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-8 items-center">
          <div className="flex flex-col gap-5">
            <p className="text-center text-2xl leading-normal">
              Entre na sala ou digite o código
            </p>
            <p className="mt-3 p-3 bg-gray-100 text-base text-center">
              {urlRoom}
            </p>
            <div className="flex flex-col gap-10 justify-center justify-items-center">
              <div className="rounded-md shadow">
                <a
                  href={urlRoom}
                  className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 md:py-4 md:text-lg md:px-10"
                >
                  Entrar na sala
                </a>
              </div>

              <form className="shadow rounded-lg flex items-center justify-center ">
                <input
                  className="w-full h-full rounded-l-lg p-4 mr-0 text-gray-800 border-gray-200 bg-white outline-none "
                  placeholder="Digite o codigo ou link"
                />
                <button
                  type="submit"
                  className="text-white text-base font-medium rounded-r-lg bg-blue-500 p-4 border-blue-500 border-t border-b border-r md:text-lg"
                >
                  Participar
                </button>
              </form>
            </div>
          </div>
          <div className="w-auto">
            <video ref={myVideoEl}>
              <track kind="captions" srcLang="pt-BR" />
            </video>
          </div>
        </div>
      </main>
    </div>
  );
}
