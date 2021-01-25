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
            });
        } else {
          alert('Não foi possivel capturar camera');
          if (typeof window !== 'undefined') {
            window.location.replace('/');
          }
        }
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
