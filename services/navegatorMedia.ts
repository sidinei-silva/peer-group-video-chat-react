/* eslint-disable @typescript-eslint/ban-ts-comment */
export const getMyMediaWebCam = callback => {
  if (typeof navigator !== 'undefined') {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(stream => {
        return callback(null, stream);
      })
      .catch(error => {
        if (error.name === 'NotFoundError') {
          navigator.mediaDevices
            .getUserMedia({ video: false, audio: true })
            .then(stream => {
              return callback(null, stream);
            })
            .catch(() => {
              alert('Não foi possivel capturar microfone');
              if (typeof window !== 'undefined') {
                if (window.location.pathname !== '/') {
                  window.location.replace('/');
                }
              }
            });
        } else {
          alert('Não foi possivel capturar camera ou microfone');
          if (typeof window !== 'undefined') {
            if (window.location.pathname !== '/') {
              window.location.replace('/');
            }
          }
        }
        return callback(error, undefined);
      });
  }
};

export const getMyMediaScreen = callback => {
  if (typeof navigator !== 'undefined') {
    navigator.mediaDevices
      // @ts-ignore
      .getDisplayMedia({ video: { cursor: 'always' }, audio: false })
      .then(stream => {
        return callback(null, stream);
      });
  }
};
