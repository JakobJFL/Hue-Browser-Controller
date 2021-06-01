function putRequest(url, json) {
    return new Promise(function(resolve, reject) {
        fetch(url, {
            method: 'PUT', 
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(json),
        })
        .then(response => response.json())
        .then(data => resolve(data))
        .catch(error => reject(error));
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