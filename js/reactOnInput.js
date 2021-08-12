function briSlider_change(lightId){
  let obj = {bri: Number(document.getElementById("briSlider"+lightId).value)};
  new actions().sliderChange(lightId, obj);
}

function hueSlider_change(lightId){
  let obj = {hue: Number(document.getElementById("hueSlider"+lightId).value)};
  new actions().sliderChange(lightId, obj);
}

function satSlider_change(lightId){
  let obj = {sat: Number(document.getElementById("satSlider"+lightId).value)};
  new actions().sliderChange(lightId, obj);
}

function tempSlider_change(lightId){
  let obj = {ct: Number(document.getElementById("tempSlider"+lightId).value)};
  new actions().sliderChange(lightId, obj);
}

function setRoomState_click(id) {
  let isChecked = document.getElementById("roomSwitch"+id).checked;
  let getBri = document.getElementById("roomSlider"+id).value;
  new actions().changeRoomState(id, isChecked, getBri).then(() => setDashboard()); // Refresh html
}
  
function selectRoom_click(roomId) {
  let lightHtml = `<h1 class="display-8 my-2 w-100">Lights </h1>`;
  let scenehtml = `<h1 class="display-8 my-2 w-100">Scenes</h1>`;
  selectedRoomID = roomId;
  let acc = getAccess();
  getHueLights(acc).then(lights => {
    getHueScenes(acc).then(scenes => {
      for (const light of lights) {
        if (allRoom[String(selectedRoomID-1)].lightsInRoom.includes(String(light.id)))
        lightHtml += makeLightSelecter(light);
      }
      for (const scene of scenes) {
        if (selectedRoomID == scene.group)
        scenehtml += makeSceneSelecter(scene);
      }
      document.getElementById("lightSelecters").innerHTML = lightHtml;
      document.getElementById("sceneSelecters").innerHTML = scenehtml;
    }).catch(err => console.error(err));
  }).catch(err => console.error(err));
}
  
function setLightState_click(id, isOn) {  
  new actions().changeLightState(id, !isOn).then(() => setDashboard()); // Refresh html
}

function setLightRange_change(id, isOn) {  
  let getBri = document.getElementById("lightSlider"+id).value;
  new actions().changeLightState(id, isOn, getBri).then(() => setDashboard()); // Refresh html
}

function selectScene_click(key) {
  new actions().changeScene(selectedRoomID, key).then(() => setDashboard()); // Refresh html
}
  