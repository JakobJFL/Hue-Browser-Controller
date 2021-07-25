function briSlider_change(lightId){
    let obj = {bri: Number(document.getElementById("briSlider"+lightId).value)};
    sliderChange(lightId, obj);
}

function hueSlider_change(lightId){
    let obj = {hue: Number(document.getElementById("hueSlider"+lightId).value)};
    sliderChange(lightId, obj);
}

function satSlider_change(lightId){
    let obj = {sat: Number(document.getElementById("satSlider"+lightId).value)};
    sliderChange(lightId, obj);
}

function tempSlider_change(lightId){
    let obj = {ct: Number(document.getElementById("tempSlider"+lightId).value)};
    sliderChange(lightId, obj);
}

function sliderChange(lightId, jsonObj) {
    let acc = getAccess();
    let url = 'http://'+acc.ip+'/api/'+acc.token+'/lights/'+lightId+'/state/';
    putRequest(url, jsonObj)
    //.then(() => setDashboardElements()) // Refresh html
    .catch(err => console.error(err))
}

function setRoomState_click(id) {
    let isChecked = document.getElementById("roomSwitch"+id).checked;
    let getBri = document.getElementById("roomSlider"+id).value;
    changeRoomState(id, isChecked, getBri).then(() => setDashboardElements()); // Refresh html
  }
  
  function selectRoom_click(roomId) {
    let html = "";
    selectedRoomID = roomId-1;
    getHueLights().then(lights => {
      for (const light of lights) {
        if (allRoom[String(selectedRoomID)].lightsInRoom.includes(String(light.id)))
          html += makeLightSelecter(light);
      }
      document.getElementById("lightSelecters").innerHTML = html;
    });
  }
  
  function setLightState_click(id, isOn) {  
    changeLightState(id, !isOn).then(() => setDashboardElements()); // Refresh html
  }
  
  function setLightRange_change(id, isOn) {  
    let getBri = document.getElementById("lightSlider"+id).value;
    changeLightState(id, isOn, getBri).then(() => setDashboardElements()); // Refresh html
  }
  