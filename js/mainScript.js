let acc;
let selectedRoom = 0;
document.getElementById("loginFrom").addEventListener("submit", setDashboard);

function setDashboard() {
    getAccess();
    setDashboardElements();
}

function setDashboardElements() {
    getHueRooms().then(rooms => {   
        getHueLights().then(lights => {
            let dashboard = document.getElementById("dashboard");
            dashboard.innerHTML = getDashboardHtml(rooms, lights);
            document.getElementById("refreshBtn").addEventListener("click", setDashboardElements); 
        });
    });
}

function getAccess() {
    acc = {
        token: document.getElementById("accessToken").value,
        ip: document.getElementById("ipAddress").value
    }
}

function getHueRooms() {
    return new Promise((resolve, reject) => {
        getRequest('http://'+acc.ip+'/api/'+acc.token+'/groups').then(data => {
            console.log()
            let rooms = [];
            let fistIndex = Object.keys(data)[0];
            selectedRoom = fistIndex;
            let lastIndex = Object.keys(data).length;
            for (let i = fistIndex; i <= lastIndex; i++) {
                let roomObj = {
                    name: data[String(i)].name,
                    on: data[String(i)].state.any_on,
                    bri: data[String(i)].action.bri,
                    ct: data[String(i)].action.ct,
                    xy: data[String(i)].action.xy,
                    id: i
                }
                rooms.push(roomObj);
            }
            resolve(rooms)
        });
    });
}

function getHueLights() {
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
                    id: i
                }
                lights.push(roomObj);
                i++;
            }
            resolve(lights)
        });
    });
}


