function briSlider_change(lightId){
  let obj = {bri: Number(document.getElementById("briSlider"+lightId).value)};
  new actions().sliderChange(lightId, obj);
}

function hueSlider_change(lightId){
  let obj = {hue: Number(document.getElementById("hueSlider"+lightId).value)};
  document.getElementById(lightId).style.backgroundColor = `hsl(${obj.hue/(65535/360)}, 100%, 56%)`;
  
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

function setRoomState_click(id, isChecked) {
  //let getBri = document.getElementById("roomSlider"+id).value;

  new actions().changeRoomState(id, isChecked, 255); // Refresh html
}
  
function selectRoom_click(obj, roomId) {
  let settingsObj = JSON.parse(localStorage.getItem('siteSettings'));

  let lightHtml = `<h1 class="display-8 my-2 w-100">Lights </h1>`;
  let sceenHtml = `<div class="d-flex w-100"><h1 class="display-8 my-2 w-100">Scenes</h1>`;
  if (settingsObj.effects) {
    sceenHtml += `<button onclick="colorloopEffect_click()" type="button" class="btn btn-secondary btn-round h-50 m-1">Colorloop</button>
    <button type="button" onclick="breatheEffect_click()" class="btn btn-secondary btn-round h-50 m-1">Breathe</button>
    <button type="button" onclick="noneEffect_click()" class="btn btn-secondary btn-round h-50 m-1">None</button>`;
  }
  sceenHtml +=`</div>`;
  selectedRoomID = roomId;
  let acc = getAccess();
  getHueLights(acc).then(lights => {
    getHueScenes(acc).then(scenes => {
      for (const light of lights) {
        if (allRooms[selectedRoomID].lightsInRoom.includes(light.id))
          lightHtml += makeLightSelecter(light, settingsObj);
      }
      for (const scene of scenes) {
        if (allRooms[selectedRoomID].id == scene.group)
        sceenHtml += makeSceneSelecter(scene);
      }
      document.getElementById("lightSelecters").innerHTML = lightHtml;
      document.getElementById("sceneSelecters").innerHTML = sceenHtml;
    }).catch(err => console.error(err));
  }).catch(err => console.error(err));
  for (const element of document.querySelectorAll(".roomSelecter")) {
    element.classList.remove('selected');
  }
  obj.parentElement.classList.add('selected');
}
  
function setLightState_click(id, isOn) {  
  new actions().changeLightState(id, !isOn); // Refresh html
}

function selectScene_click(key) {
  new actions().changeScene(allRooms[selectedRoomID].id, key).then(() => setDashboard()); // Refresh html
}

function colorloopEffect_click() {
  let acc = getAccess();
  let url = acc.ip+'/api/'+acc.token+'/groups/'+allRooms[selectedRoomID].id+'/action/';
  let json = {
    on: true,
    effect: 'colorloop'
  };

  putRequest(url, json);
}
function breatheEffect_click() {
  let acc = getAccess();
  let url = acc.ip+'/api/'+acc.token+'/groups/'+allRooms[selectedRoomID].id+'/action/';
  let json = {
    on: true,
    bri: 255,
    alert: 'lselect'
  };
  putRequest(url, json);
}
function noneEffect_click() {
  let acc = getAccess();
  let url = acc.ip+'/api/'+acc.token+'/groups/'+allRooms[selectedRoomID].id+'/action/';
  let json = {
    effect: 'none',
    alert: 'none'
  };
  putRequest(url, json);
}

  