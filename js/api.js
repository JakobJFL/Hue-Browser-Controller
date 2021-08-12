function putRequest(url, json) {
    return new Promise(function(resolve, reject) {
        fetch(url, {
            method: 'PUT', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(json),
        })
        .then(response => response.json())
        .then(data => resolve(data))
        .catch(err => reject(err));
    });
}

function postRequest(url, json) {
    const timeoutTime = 500;
    return new Promise(function(resolve, reject) {
        const controller = new AbortController();
        setTimeout(function() {
            reject(new Error("Timeout"));
            controller.abort()
        }, timeoutTime);
        fetch(url, {
            method: 'POST', 
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(json),
        })
        .then(response => response.json())
        .then(data => resolve(data))
        .catch(err => reject(err));
    });
    
}

function getRequest(url) {
    return new Promise(function(resolve, reject) {
        fetch(url)
        .then((response) => response.json())
        .then((data) => {
            resolve(data);
        }).catch(err => reject(err));
    });
}

function connectionGood(acc) {
    const timeoutTime = 1000;
    return new Promise(function(resolve, reject) {
        const controller = new AbortController();
        setTimeout(function() {
            reject(new Error("Timeout"));
            controller.abort()
        }, timeoutTime);
        fetch('http://'+acc.ip+'/api/'+acc.token, {
            method: 'GET', 
            signal: controller.signal
        })
        .then(response => response.json())
        .then(data => {
            if (data.lights) 
                resolve(true);
            else if (Object.keys(data[0])[0] === "error") 
                throw new Error(data[0].error.description);
            else {
                throw new Error("Unknown error occurred");
            }
        })
        .catch(err => reject(err));
    });
}

