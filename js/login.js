document.addEventListener("shown.bs.collapse", makeNewConnection);
document.getElementById("loginFrom").addEventListener("submit", loginExistingCon);
document.getElementById("manuallyIpBtn").addEventListener("click", manuallyIpNewConnection);

let interval;
const refreshTime = 1500;
const postJsonObj = {devicetype: "Hue-Browser-Controller"};
checkLocalStorage();

function checkLocalStorage() { 
    if (localStorage.getItem('hueAcc')) 
       setDashboard(); 
    else 
        document.getElementById("overlay").style.display = "none";
}

//<NewConnection>
async function makeNewConnection(event) {
    if (event.target.id === "newConnection") {
        resetAll();
        setAutoConnectText("Looking for a bridge on your network...", "loading");
        try {
            let resGet = await getRequestSecure("discovery.meethue.com/");
            if (!resGet[0] || !resGet[0].id || !resGet[0].internalipaddress) 
                throw new Error("Could not find a Hue bridge, try and enter the Hue bridge IP manually");
            let ip = await findRightIp(resGet)
            setAutoConnectText("Found IP. Press the link button on the Hue bridge", "push-link");
            setupWithLinkButton(ip);
        } catch (err) {
            if (err == "TypeError: Failed to fetch")  
                showNewConError("No connection - possible network error, check network connection"); 
            else if (err == "Error: Timeout")  
                showNewConError("Timeout - got no response from the Hue bridge. Check your and the bridges network connection"); 
            else 
                showNewConError("Error - try and enter the Hue bridge IP manually" + err); 
        }
    }
    else if (event.target.id === "existingConnection") {
        clearInterval(interval);
    }
}

function findRightIp(resGet) {
    return new Promise(function(resolve, reject) {
        let timesFailed = 0;
        for (const data of resGet) {
            postRequest(data.internalipaddress+"/api/", postJsonObj).then(resPost => {
                if (!data.internalipaddress.startsWith("192")) // Assume that all IPs starts with 192)
                    throw new Error("no192Start"); 
                if (resPost[0].error.type == 101) 
                    resolve(data.internalipaddress);
            }).catch(err => {
                if (timesFailed === resGet.length)
                    reject("Timeout");
                else if (err != "Error: AbortTimeout" && err != "Error: no192Start" && err != "TypeError: Failed to fetch") 
                    reject(err);
            });
        }
    });
}

function setupWithLinkButton(ip) {
    let timesPostSend = 0;
    interval = setInterval(function() {
        if (timesPostSend > 20)
            showNewConError("The link button wasn't pressed in time, please try again"); 
        timesPostSend++;
        postRequest(ip+"/api/", postJsonObj).then(resPost => {
            if (Object.keys(resPost[0])[0] !== "error") 
                showSuccess(ip, resPost[0].success.username);
        }).catch(err => {
            showNewConError("An unknown error occurred");
            console.error(err);
        });
    }, refreshTime);
}

function manuallyIpNewConnection() {
    resetAll();
    setAutoConnectText("Manual IP setup - Testing the IP", "loading");
    let ip = document.getElementById("manuallyIp").value;
    testIP(ip).then(function() {
        setAutoConnectText("Manual IP setup - Press the link button on the Hue bridge", "push-link");
        setupWithLinkButton(ip);
    }).catch(function() {
        showNewConError("Could not connect with this IP address");
    });
}

//<OutputToUser>
function showSuccess(ip, accessToken) {
    clearInterval(interval);
    document.getElementById("autoConnect").innerHTML = 
        `<div class="alert alert-success text-center" role="alert">
        <p><strong>Success!</strong> A connection to the bridge has been made. The login details will automatically be saved when you press login.</p>
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

function resetAll() {
    document.getElementById("errAutoBox").style.visibility = "hidden";
    clearInterval(interval);
}

function setAutoConnectText(str, img) {
    let text = `<p class="text-center">${str}</p>`;
    switch (img) {
        case "loading":
            text += `<img id="loadingImg" src="img/loading.svg">`; break;
        case "push-link":
            text += `<img id="loadingImg" src="img/push-link.png">`; break;
    }
    document.getElementById("autoConnect").innerHTML = text;
}

function showNewConError(err) {
    document.getElementById("autoConnect").innerHTML = "";    
    let errMsgBox = document.getElementById("errAutoBox");
    errMsgBox.style.visibility = "visible";
    errMsgBox.innerText = err;
    clearInterval(interval);
}
//</OutputToUser>
//</NewConnection>

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
        console.log(err);
        console.log(err.name, err.message, err.cause);
        if (err == "TypeError: Failed to fetch")  
            errMsgBox.innerText = "No connection - network error, check network connection or IP Address";
        else if (err == "Error: AbortTimeout")  
            errMsgBox.innerText = "Timeout - Check IP Address or network connection";
        else if (err == "Error: unauthorized user")  
            errMsgBox.innerText = "Wrong access token";
        else {
            errMsgBox.innerText ="An unknown error occurred";
            console.error(err);
        }
    });
}

function setDashboard() {
    let acc = getAccess();
    getDashboard(acc).then(dashboard => {
        document.getElementById("mainSite").innerHTML = dashboard.getHtml(acc);
        document.getElementById("refreshBtn").addEventListener("click", refresh); 
        document.getElementById("logOutBtn").addEventListener("click", logOut);
        document.getElementById("overlay").style.display = "none";
    }).catch(err => {
        document.getElementById("overlay").style.display = "none";
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

function showInsecureContentModal() {
    let myModal = new bootstrap.Modal(document.getElementById('InsecureContentModal'));
    myModal.show();
}