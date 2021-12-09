let allRooms = {};
let selectedRoomID = -1;

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
            console.log(data);
            let rooms = [];
            let fistIndex = Object.keys(data)[0];
            let lastIndex = Object.keys(data).length;
            for (let i = fistIndex; i <= lastIndex; i++) {
                let roomObj = {
                    name: data[String(i)].name,
                    on: data[String(i)].state.any_on,
                    bri: data[String(i)].action.bri,
                    ct: data[String(i)].action.ct,
                    xy: data[String(i)].action.xy,
                    lightsInRoom: data[String(i)].lights,
                    id: i
                }
                rooms.push(roomObj);
            }
            allRooms = rooms;
            resolve(rooms);
        }).catch(err => {console.error(err); reject(err)});
    });
}

function getHueLights(acc) {
    return  new Promise((resolve, reject) => {
        getRequest(acc.ip+'/api/'+acc.token+'/lights').then(data => {
            let lights = [];
            let i = 1;
            while (data[i]) {
                let roomObj = {
                    name: data[String(i)].name,
                    on: data[String(i)].state.on,
                    bri: data[String(i)].state.bri,
                    ct: data[String(i)].state.ct,
                    xy: data[String(i)].state.xy,
                    hue: data[String(i)].state.hue,
                    id: i
                }
                lights.push(roomObj);
                i++;
            }
            resolve(lights);
        }).catch(err => reject(err));
    });
}

function getHueScenes(acc) {
    return  new Promise((resolve, reject) => {
        getRequest(acc.ip+'/api/'+acc.token+'/scenes').then(data => {
            let scenes = [];
            for (const [key, value] of Object.entries(data)) {
                if (value.type === "GroupScene") {
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
function refresh() {
    setDashboard();
}


/*
function autoRefresh() {
    if (document.getElementById("refreshSwitchBtn").checked) {
        let refreshInterval = setInterval(refreshIntervalFun, 1000);
        function refreshIntervalFun() {
            refreshLightRooms();
            if (!document.getElementById("refreshSwitchBtn").checked)
                clearInterval(refreshInterval)
        }
    }
}
*/
/*
function refreshLightRooms() {
    let lightHtml = `<h1 class="display-8 my-2 w-100">Lights </h1>`;
    let roomHtml ="";
    let acc = getAccess();
    
    getHueLights(acc).then(lights => {
        getHueRooms(acc).then(rooms => {
            for (const room of rooms) {
                roomHtml += makeRoomSelecter(room.name, room.on, room.id, room.xy, room.ct, room.bri);
            }
            for (const light of lights) {
                if (allRooms[String(selectedRoomID-1)].lightsInRoom.includes(String(light.id))) // THIS!!!!!!!!!!
                    lightHtml += makeLightSelecter(light);
            }
            document.getElementById("lightSelecters").innerHTML = lightHtml;
            document.getElementById("roomSelecters").innerHTML = roomHtml;
        }).catch(err => console.error(err));
    }).catch(err => console.error(err));
}
*/