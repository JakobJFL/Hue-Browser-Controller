function changeRoomState(selectRoomId, setOn, setBri) {
    let json = {
        on: setOn,
        bri: Number(setBri)
    };
    let url = 'http://'+acc.ip+'/api/'+acc.token+'/groups/'+selectRoomId+'/action/';
    putRequest(url, json).then(response => {
        getHueRooms(); // Refresh rooms html
    }).catch(err => console.error(err));
}