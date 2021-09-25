class DashboardPage {
  constructor(rooms, lights, scenes) {
    this.rooms = rooms;
    this.lights = lights;
    this.scenes = scenes;
  }
  getHtml(acc) { 
    let header = `<div class="container py-4">
      <header class="pb-3 mb-4">
        <div class="top-bar">
          <a class="d-flex align-items-center text-dark text-decoration-none">
            <span class="fs-4">Hue Browser Controller</span>
          </a>
          <div class="d-flex flex-row-reverse top-bar-right">
            <a id="logOutBtn" class="nav-link">Log Out</a>
            <a id="logOutBtn" class="nav-link" type="button" data-bs-toggle="modal" data-bs-target="#SettingsModal" >Settings</a>
          </div>
        </div>

        <!-- SettingsModal -->
        <div class="modal fade" id="SettingsModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title text-white" id="exampleModalLabel">Settings</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <h3 class="fs-5 text-muted">Hue info</h3>
                <table class="table">
                  <tbody>
                    <tr><th class="text-muted" scope="row">IP Addres:</th><td>${acc.ip}</td></tr>
                    <tr><th class="text-muted" scope="row">Access token:</th><td>${acc.token}</td> </tr>
                  </tbody>
                </table>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Save changes</button>
              </div>
            </div>
          </div>
        </div>

      </header>
      <div class="row align-items-md-stretch">`;
    let rommsHtml = `<div class="col-md-4">
                     <div class="h-100 p-4 text-white bg-dark rounded-3">
                      <div class="d-flex flex-row justify-content-between">
                        <h1 class="display-8">Rooms</h1>
                        <label class="refreshLabel">
                          <input type="checkbox" id="refreshSwitchBtn">
                          <div class="btn btn-secondary refreshSwitch">Auto refresh</div>
                        </label>   
                      </div>
                    <div id="roomSelecters">`                     
    let allHtml = header+rommsHtml;
    
    let lightsHtml = `</div></div></div> 
                      <div class="col-md-8">
                      <div class="row row-cols-1 margin-0">
                      <div class="p-3 text-white bg-dark rounded-3 d-flex align-content-start flex-wrap" id="lightSelecters">
                      <h1 class="display-8 my-2 w-100">Lights</h1>`;

    let sceenHtml = `</div><div class="p-4 mt-2 text-white bg-dark rounded-3" id="sceneSelecters">
                     <h1 class="display-8 my-2 w-100">Scenes</h1>`

    let bottomHtml = "</div></div></div></div>";
  
    for (const room of this.rooms) {
      allHtml += makeRoomSelecter(room.name, room.on, room.id, room.xy, room.ct, room.bri);
    }

    if (selectedRoomID === -1) 
      selectedRoomID = allRooms[0].id;

    allHtml += lightsHtml;
    for (const light of this.lights) {
      if (allRooms[String(selectedRoomID-1)].lightsInRoom.includes(String(light.id)))
        allHtml += makeLightSelecter(light);
    }

    allHtml += sceenHtml;
    for (const scene of this.scenes) {
      if (selectedRoomID == scene.group)
        allHtml += makeSceneSelecter(scene);
    }
    allHtml += bottomHtml;
    return allHtml;

  }
}

function makeRoomSelecter(name, on, id, xy, ct, bri) {
  let checkedStr = "";
  let firstColor = "20, 20, 20";
  let secondColor = "20, 20, 20";
  let colorConv = new ColorConverter();
  let sliderDisabled = "";
  if (on) {
    checkedStr = "checked";
    firstColor = "255, 233, 191";
    secondColor = "255, 233, 191";
    //console.log(ct, colorConv.colorTempToRGB(1010))
    if (xy) 
      firstColor = colorConv.xyBriToRgb(xy[0], xy[1], 255); // todo: Fix color
    else if (ct) 
      firstColor = colorConv.colorTempToRGB(1000000/(ct-200)); // Mired to kelvin, -200 for celebration https://en.wikipedia.org/wiki/Mired
  } else 
    sliderDisabled = 'style="display:none"';
  return `<div class="roomSelecter my-3" style="background: linear-gradient(to right, rgb(${firstColor}) 0%, rgb(${secondColor}) 100%);" class="btn roomSelecter my-2">
          <button class="btn roomBtn" onclick="selectRoom_click(${id});">${name}</button>
            <label class="switch swRight">
              <input type="checkbox" id="roomSwitch${id}" onclick="setRoomState_click(${id})" ${checkedStr}>
              <span class="slider"></span>
            </label>   
            <input type="range" min="0" max="254" value="${bri}" ${sliderDisabled} class="sliderBar" id="roomSlider${id}" onchange="setRoomState_click(${id})">
        </div>`
}

function makeLightSelecter(light) {
  let colorConv = new ColorConverter();
  let color = "";
  let sliders = `<input type="range" min="0" max="255" value="${light.bri}" class="briSlider sliderBar" id="briSlider${light.id}" onchange="briSlider_change(${light.id})">`;
  let pickersCollapse = "";
  if (light.on) {
    color = "255, 233, 191";
    if (light.xy) {
      color = colorConv.xyBriToRgb(light.xy[0], light.xy[1], 255); // todo: Fix color
      sliders += `<input type="range" min="0" max="255" value="${light.sat}" class="satSlider sliderBar" id="satSlider${light.id}" onchange="satSlider_change(${light.id})">
      <input type="range" min="0" max="65535" value="${light.hue}" class="hueSlider sliderBar" id="hueSlider${light.id}" onchange="hueSlider_change(${light.id})">`;
    } else if (light.ct) {                          // ^^^^ Hue does not change
      color = colorConv.colorTempToRGB(1000000/(light.ct-200)); // Mired to kelvin, -200 for celebration https://en.wikipedia.org/wiki/Mired
      sliders += `<input type="range" min="153" max="500" value="${light.ct}" class="tempSlider sliderBar" id="tempSlider${light.id}" onchange="tempSlider_change(${light.id})">`;
    }
    pickersCollapse = `<button class="btn pickerActivator" type="button" data-bs-toggle="collapse" data-bs-target="#pickerPopup${light.id}" aria-expanded="true" aria-controls="pickerPopup${light.id}">v</button>
      <div class="collapse" id="pickerPopup${light.id}" class="accordion-collapse collapse show" data-bs-parent="#lightSelecters">
        <div class="card card-body pickerPopupCard">
            ${sliders}
        </div>
      </div>`;
  }
  return `<div class="lightSelecter my-2" style="background-color: rgb(${color})"> 
  <button type="button" class="btn nowrapTxt" onclick="setLightState_click(${light.id}, ${light.on})">${light.name}</button>
    ${pickersCollapse}
  </div>`
}

function makeSceneSelecter(scene) {
  return `<button type="button" class="btn sceneSelecter nowrapTxt my-2" onclick="selectScene_click('${scene.key}');">${scene.name}</button>`
}

