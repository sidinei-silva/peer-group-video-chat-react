export const getMyMediaWebCam = callback => {
  if (typeof window !== 'undefined') {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(stream => {
        return callback(null, stream);
      })
      .catch(() => {
        alert('Não foi possivel capturar camera');
        if (typeof window !== 'undefined') {
          window.location.replace('/');
        }
      });
  }
};
