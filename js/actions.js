function changeRoomState(selectRoomId, setOn, setBri) {
    return new Promise((resolve, reject) => {
        let json = {
            on: setOn,
            bri: Number(setBri)
        };
        let acc = getAccess();
        let url = 'http://'+acc.ip+'/api/'+acc.token+'/groups/'+selectRoomId+'/action/';
        putRequest(url, json).then(response => {
            resolve(response);
        }).catch(err => reject(err));
    })
}

function changeLightState(selectLightId, setOn) {
    return new Promise((resolve, reject) => {
        let json = { on: setOn };
        let acc = getAccess();
        let url = 'http://'+acc.ip+'/api/'+acc.token+'/lights/'+selectLightId+'/state/';
        putRequest(url, json).then(response => {
            resolve(response);
        }).catch(err => reject(err));
    })
}