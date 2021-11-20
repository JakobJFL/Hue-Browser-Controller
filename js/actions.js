class actions {
    changeRoomState(selectRoomId, setOn, setBri) {
        return new Promise((resolve, reject) => {
            let json = {
                on: setOn,
                bri: Number(setBri)
            };
            let acc = getAccess();
            let url = acc.ip+'/api/'+acc.token+'/groups/'+selectRoomId+'/action/';
            putRequest(url, json).then(response => {
                resolve(response);
            }).catch(err => reject(err));
        })
    }
    
    changeLightState(selectLightId, setOn) {
        return new Promise((resolve, reject) => {
            let json = { on: setOn };
            let acc = getAccess();
            let url = acc.ip+'/api/'+acc.token+'/lights/'+selectLightId+'/state/';
            putRequest(url, json).then(response => {
                resolve(response);
            }).catch(err => reject(err));
        }).catch(err => console.error(err));
    }

    changeScene(group, sceneKey) {
        return new Promise((resolve, reject) => {
            let json = { scene: sceneKey };
            let acc = getAccess();
            let url = acc.ip+'/api/'+acc.token+'/groups/'+group+'/action';
            putRequest(url, json).then(response => {
                resolve(response);
            }).catch(err => reject(err));
        }).catch(err => console.error(err));
    }
    
    sliderChange(lightId, jsonObj) {
        let acc = getAccess();
        let url = acc.ip+'/api/'+acc.token+'/lights/'+lightId+'/state/';
        putRequest(url, jsonObj)
        .catch(err => console.error(err))
    }
}
