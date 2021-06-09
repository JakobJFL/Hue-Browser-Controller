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