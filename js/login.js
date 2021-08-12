document.addEventListener("shown.bs.collapse", startNewConnection);
document.getElementById("loginFrom").addEventListener("submit", loginExistingCon);
document.getElementById("manuallyIpBtn").addEventListener("click", manuallyNewConnection);

checkLocalStorage();
let interval;

function startNewConnection(event) {
    const refreshTime = 1500;
    document.getElementById("autoConnect").innerHTML = 
        `<p class="text-center">Looking for a bridge on your network...</p>
        <img id="loadingImg" src="img/loading.svg">`;
    clearInterval(interval);
    if (event.target.id === "newConnection") {
        getRequest("https://discovery.meethue.com/").then(res => {
            document.getElementById("autoConnect").innerHTML = 
            `<p class="text-center">Found IP. Press the link button on the Hue bridge</p>
            <img id="loadingImg" src="img/push-link.png">`;

            let jsonObj = {
                devicetype: "Hue-Browser-Controller",
            }
            interval = setInterval(function() {
                for (const data of res) {
                    postRequest("http://"+data.internalipaddress+"/api/",jsonObj).then(res => {
                        if (Object.keys(res[0])[0] !== "error") {
                            clearInterval(interval);
                            showSuccess(data.internalipaddress, res[0].success.username);
                        }
                    }).catch(err => {
                        let errMsgBox = document.getElementById("errAutoBox");
                        errMsgBox.style.visibility = "visible";
                        if (err != "Error: Timeout")    
                            showNewConError("Timeout Error - try and enter the Hue bridge IP manually");                     
                    });
                }
            }, refreshTime);
        });
    }
}

function manuallyNewConnection() {
    const refreshTime = 1500;
    document.getElementById("autoConnect").innerHTML = 
    `<p class="text-center">Manual setup</p>`;
    clearInterval(interval);
    document.getElementById("errAutoBox").style.visibility = "hidden";
    let ip = document.getElementById("manuallyIp").value;
    let jsonObj = {
        devicetype: "Hue-Browser-Controller",
    }
    interval = setInterval(function() {
        postRequest("http://"+ip+"/api/",jsonObj).then(res => {
            document.getElementById("autoConnect").innerHTML = 
            `<p class="text-center">Manual setup - Press the link button on the Hue bridge</p>
            <img id="loadingImg" src="img/push-link.png">`;
            if (Object.keys(res[0])[0] !== "error") {
                clearInterval(interval);
                showSuccess(ip, res[0].success.username);
            } 
        }).catch(function() {
            showNewConError("IP address doesn't work")
        });
    }, refreshTime);
}

function showSuccess(ip, accessToken) {
    document.getElementById("autoConnect").innerHTML = 
        `<div class="alert alert-success text-center" role="alert">
        <p><strong>Success!</strong> A connection to the bridge is made.</p>
        <button id="loginNewConnection" class="btn btn-primary form-input" type="button">Login</button>
        </div>
        <p class="text-center">IP address: <em>${ip}</em></p> 
        <p class="text-center">Access token: <em>${accessToken}</em></p>`;
    let acc = {
        token: accessToken,
        ip: ip
    };
    localStorage.setItem('hueAcc', JSON.stringify(acc)); 
    document.getElementById("loginNewConnection").addEventListener("click", setDashboard);
}

function showNewConError(err) {
    let errMsgBox = document.getElementById("errAutoBox");
    errMsgBox.style.visibility = "visible";
    errMsgBox.innerText = err;
    clearInterval(interval);
}

function loginExistingCon() {
    document.getElementById("errFromBox").style.visibility = "hidden";
    let acc = {
        token: document.getElementById("accessToken").value,
        ip: document.getElementById("ipAddress").value
    };
    connectionGood(acc).then(()=> {
        localStorage.setItem('hueAcc', JSON.stringify(acc)); 
        setDashboard();
    }).catch(err => {
        let errMsgBox = document.getElementById("errFromBox");
        errMsgBox.style.visibility = "visible";
        errMsgBox.innerText = err;
    });
}

function setDashboard() {
    getDashboard(getAccess()).then(dashboard => {
        document.getElementById("mainSight").innerHTML = dashboard.getHtml();
        document.getElementById("refreshBtn").addEventListener("click", setDashboard); 
        document.getElementById("logOutBtn").addEventListener("click", logOut);
    }).catch(err => {
        console.error(err);
    });
}

async function getDashboard(acc) {
    try {
        let rooms = await getHueRooms(acc);
        let lights = await getHueLights(acc);
        let scenes = await getHueScenes(acc);
        return new DashboardPage(rooms, lights, scenes);
    } catch(err) {
        return err;
    }
}

function checkLocalStorage() { // find a better solution
    if (localStorage.getItem('hueAcc')) {
        loginExistingCon();
    }
}
