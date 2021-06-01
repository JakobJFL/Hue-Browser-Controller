document.getElementById("loginFrom").addEventListener("submit", setDashboard);

function setDashboard() {
    getAccess();
    getHueRooms();
}
let acc;

function getAccess() {
    acc = {
        token: document.getElementById("accessToken").value,
        ip: document.getElementById("ipAddress").value
    }
}

function getHueRooms() {
    getRequest('http://'+acc.ip+'/api/'+acc.token+'/groups').then(data => {
        let rooms = [];
        let i = 1;
        while (data[i]) {
            let roomObj = {
                name: data[String(i)].name,
                on: data[String(i)].state.any_on,
                bri: data[String(i)].action.bri,
                ct: data[String(i)].action.ct,
                xy: data[String(i)].action.xy,
                id: i
            }
            rooms.push(roomObj);
            i++;
        }
        let dashboard = document.getElementById("dashboard");
        dashboard.innerHTML = getDashboardHtml(rooms);
        document.getElementById("refreshBtn").addEventListener("click", getHueRooms);
    });
}


