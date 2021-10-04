document.addEventListener("shown.bs.collapse", startNewConnection);
document.getElementById("loginFrom").addEventListener("submit", loginExistingCon);
document.getElementById("manuallyIpBtn").addEventListener("click", manuallyNewConnection);

checkLocalStorage();
let interval;
const refreshTime = 1500;
const postJsonObj = {devicetype: "Hue-Browser-Controller"};

function startNewConnection(event) {
    if (event.target.id === "newConnection") {
        document.getElementById("errAutoBox").style.visibility = "hidden";
        document.getElementById("autoConnect").innerHTML = 
            `<p class="text-center">Looking for a bridge on your network...</p>
            <img id="loadingImg" src="img/loading.svg">`;
        clearInterval(interval);
        getRequest("discovery.meethue.com/").then(resGet => {
            if (!resGet[0] || !resGet[0].id || !resGet[0].internalipaddress) 
                throw new Error("Could not find a Hue bridge, try and enter the Hue bridge IP manually");
            document.getElementById("autoConnect").innerHTML = 
                `<p class="text-center">Found IP. Press the link button on the Hue bridge</p>
                <img id="loadingImg" src="img/push-link.png">`;
            findRightIp(resGet);
        }).catch(err => {
            if (err == "TypeError: Failed to fetch")  
                showNewConError("No connection - possible network error, check network connection"); 
            else if (err == "Error: Timeout")  
                showNewConError("Timeout - got no response from the Hue bridge. Check your and the bridges network connection"); 
            else 
                showNewConError(err.message); 
        });
    }
    else if (event.target.id === "existingConnection") {
        clearInterval(interval);
    }
}

function findRightIp(resGet) {
    let timesFailed = 0;
    for (const data of resGet) {
        postRequest(data.internalipaddress+"/api/", postJsonObj).then(resPost => {
            if (!data.internalipaddress.startsWith("192")) // Assume that all IPs starts with 192)
                throw new Error("no192Start"); 
            if (resPost[0].error.type == 101) 
                if (setupLinkButton(data.internalipaddress)) 
                    showNewConError("Error - try and enter the Hue bridge IP manually");
        }).catch(err => {
            if (timesFailed === resGet.length)
                showNewConError("Timeout - got no response from the Hue bridge. Check your and the bridges network connection");
            else if (err != "Error: AbortTimeout" && err != "Error: no192Start" && err != "TypeError: Failed to fetch") 
                showNewConError("Error - try and enter the Hue bridge IP manually");
        });
    }
}

function setupLinkButton(ip) {
    let timesPostSend = 0;
    interval = setInterval(function() {
        if (timesPostSend > 20)
            showNewConError("The link button wasn't pressed in time, please try again");       
        timesPostSend++;
        postRequest(ip+"/api/", postJsonObj).then(resPost => {
            if (Object.keys(resPost[0])[0] !== "error") {
                clearInterval(interval);
                showSuccess(ip, resPost[0].success.username);
                return 0;
            }
        }).catch(function() {
            return 1;
        });
    }, refreshTime);
}

function manuallyNewConnection() {
    document.getElementById("autoConnect").innerHTML = 
    `<p class="text-center">Manual setup</p>`;
    clearInterval(interval);
    document.getElementById("errAutoBox").style.visibility = "hidden";
    let ip = document.getElementById("manuallyIp").value;
    if (setupLinkButton(ip))
        showNewConError("Could not connect check the IP address doesn't work");
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
    document.getElementById("autoConnect").innerHTML = ``;    
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
        if (err == "TypeError: Failed to fetch")  
            errMsgBox.innerText = "No connection - network error, check network connection or IP Address";
        else if (err == "Error: AbortTimeout")  
            errMsgBox.innerText = "Timeout - Check IP Address or network connection";
        else if (err == "Error: unauthorized user")  
            errMsgBox.innerText = "Wrong access token";
        else 
            errMsgBox.innerText = err.message;
    });
}

function setDashboard() {
    let acc = getAccess();
    getDashboard(acc).then(dashboard => {
        document.getElementById("mainSight").innerHTML = dashboard.getHtml(acc);
        document.getElementById("refreshSwitchBtn").addEventListener("change", autoRefresh); 
        document.getElementById("logOutBtn").addEventListener("click", logOut);
        autoRefresh();
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
        setDashboard();
    }
}
