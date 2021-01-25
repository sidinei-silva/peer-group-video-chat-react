import adapter from 'webrtc-adapter';

export default function getConnectionDetails(peerConnection) {
  const connectionDetails: any = {}; // the final result object.

  if (adapter.browserDetails.browser === 'chrome') {
    // checking if chrome
    const reqFields = [
      'googLocalAddress',
      'googLocalCandidateType',
      'googRemoteAddress',
      'googRemoteCandidateType',
    ];
    return new Promise(function (resolve, reject) {
      peerConnection.getStats(function (stats) {
        const report = stats.result();

        const filtered = report.filter(function (e) {
          return (
            e.id.indexOf('Conn') === 0 &&
            e.stat('googActiveConnection') === 'true'
          );
        })[0];

        if (!filtered) return false;

        reqFields.forEach(function (e) {
          connectionDetails[e.replace('goog', '')] = filtered.stat(e);
        });

        return resolve(connectionDetails);
      });
    });
  } // assuming it is firefox
  return peerConnection.getStats(null).then(function (stats) {
    const selectedCandidatePair = [];
    stats.forEach(report => {
      if (report.type === 'candidate-pair' && report.selected === true) {
        selectedCandidatePair.push(report);
      }
    });

    if (selectedCandidatePair.length > 0) {
      const localIceId = selectedCandidatePair[0].localCandidateId;
      const remoteIceId = selectedCandidatePair[0].remoteCandidateId;

      const ICEs: any = {};

      stats.forEach(report => {
        if (report.id === localIceId) {
          ICEs.localICE = report;
        }
        if (report.id === remoteIceId) {
          ICEs.remoteICE = report;
        }
      });

      if (ICEs) {
        connectionDetails.LocalAddress = [
          ICEs.localICE.address,
          ICEs.localICE.port,
        ].join(':');
        connectionDetails.RemoteAddress = [
          ICEs.remoteICE.address,
          ICEs.remoteICE.port,
        ].join(':');
        connectionDetails.LocalCandidateType = ICEs.localICE.candidateType;
        connectionDetails.RemoteCandidateType = ICEs.remoteICE.candidateType;
      }
    }

    return connectionDetails;
  });
}
