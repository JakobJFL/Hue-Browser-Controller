let allRoom = {};
let selectedRoomID = 1;
document.getElementById("loginFrom").addEventListener("submit", setDashboard);
checkLocalStorage();

function setDashboard() {
    document.getElementById("logOutBtn").style.visibility = "visible";
    document.getElementById("logOutBtn").addEventListener("click", logOut);
    setDashboardElements();
}

function setDashboardElements() {
    getHueRooms().then(rooms => {   
        getHueLights().then(lights => {
            getHueScenes().then(scenes => {
                let dashboard = new DashboardPage(rooms, lights, scenes); 
                document.getElementById("dashboard").innerHTML = dashboard.getHtml();
                document.getElementById("refreshBtn").addEventListener("click", setDashboardElements); 
            }).catch(err => console.error(err));
        }).catch(err => console.error(err));
    }).catch(err => console.error(err));
}

function checkLocalStorage() { // find a better solution
    if (localStorage.getItem('hueAcc')) {
        setDashboard();
    }
}

function getAccess() {
    let acc = {};
    let localAcc = localStorage.getItem('hueAcc');
    if (localAcc) {
        acc = JSON.parse(localAcc);
    }
    else if (document.getElementById("accessToken")) {
        acc = {
            token: document.getElementById("accessToken").value,
            ip: document.getElementById("ipAddress").value
        };
        localStorage.setItem('hueAcc', JSON.stringify(acc)); 
    }
    else {
        console.error("logIn error")
    }
    return acc;
}

function logOut(){
    localStorage.removeItem("hueAcc");
    location.reload();
}

function getHueRooms() {
    let acc = getAccess();
    return new Promise((resolve, reject) => {
        getRequest('http://'+acc.ip+'/api/'+acc.token+'/groups').then(data => {
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
            allRoom = rooms;
            resolve(rooms);
        }).catch(err => reject(err));
    });
}

function getHueLights() {
    let acc = getAccess();
    return  new Promise((resolve, reject) => {
        getRequest('http://'+acc.ip+'/api/'+acc.token+'/lights').then(data => {
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

function getHueScenes() {
    let acc = getAccess();
    return  new Promise((resolve, reject) => {
        getRequest('http://'+acc.ip+'/api/'+acc.token+'/scenes').then(data => {
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
