let allRooms = {};
let selectedRoomID = -1;

let testingEnvironment = false;

const allowedGroups = ["Room", "Zone"];
const allowedLights = ["Extended color light", "Color temperature light", "Dimmable light", "On/Off plug-in unit"];
const allowedScenes = ["GroupScene"];

function logOut(){
    localStorage.removeItem("hueAcc");
    location.reload();
}

function getAccess() {
    let acc = {};
    let localAcc = localStorage.getItem('hueAcc');
    if (localAcc) {
        acc = JSON.parse(localAcc);
    } else {
        console.error("Access credentials not saved")
    }
    return acc;
}

function getHueRooms(acc) {
    return new Promise((resolve, reject) => {
        getRequest(acc.ip+'/api/'+acc.token+'/groups').then(data => {
            if (testingEnvironment) 
                data = JSON.parse(testGroups);
            let rooms = [];
            let roomId = 0;
            for (const [key, value] of Object.entries(data)) {
                if (value && allowedGroups.includes(value.type)) {
                    let roomObj = {
                        name: value.name,
                        on: value.state.any_on,
                        bri: value.action.bri,
                        ct: value.action.ct,
                        xy: value.action.xy,
                        lightsInRoom: value.lights,
                        key: roomId,
                        id: key
                    }
                    rooms.push(roomObj);
                    roomId++;
                }
            }
            allRooms = rooms;
            resolve(rooms);
        }).catch(err => reject(err));
    });
}

function getHueLights(acc) {
    return  new Promise((resolve, reject) => {
        getRequest(acc.ip+'/api/'+acc.token+'/lights').then(data => {
            if (testingEnvironment) 
                data = JSON.parse(testLights);
            let lights = [];
            for (const [key, value] of Object.entries(data)) {
                if (value && allowedLights.includes(value.type)) {
                    let lightObj = {
                        name: value.name,
                        on: value.state.on,
                        bri: value.state.bri,
                        ct: value.state.ct,
                        xy: value.state.xy,
                        hue: value.state.hue,
                        reachable: value.state.reachable,
                        id: key
                    }
                    lights.push(lightObj);
                }
            }
            resolve(lights);
        }).catch(err => reject(err));
    });
}

function getHueScenes(acc) {
    return  new Promise((resolve, reject) => {
        getRequest(acc.ip+'/api/'+acc.token+'/scenes').then(data => {
            if (testingEnvironment) 
                data = JSON.parse(testScenes);
            let scenes = [];
            for (const [key, value] of Object.entries(data)) {
                if (value && allowedScenes.includes(value.type)) {
                    let sceneObj = {
                        key: key,
                        name: value.name,
                        group: value.group
                    }
                    scenes.push(sceneObj); 
                }
            }
            resolve(scenes);
        }).catch(err => reject(err));
    });
}

