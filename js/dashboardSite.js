const maxLightsInGradient = 4;

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
            <span class="fs-4 text-white">Online Hue Controller</span>
          </a>
          <div class="d-flex flex-row-reverse top-bar-right">
            <a id="logOutBtn" class="nav-link link-white">Log Out</a>
            <a id="logOutBtn" class="nav-link link-white" type="button" data-bs-toggle="modal" data-bs-target="#SettingsModal" >More info</a>
          </div>
        </div>

        <!-- SettingsModal -->
        <div class="modal fade" id="SettingsModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content rounded-15">
              <div class="modal-header modal-header-15">
                <h5 class="modal-title text-white" id="exampleModalLabel">More info</h5>
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
                <button type="button" class="btn btn-secondary rounded-10" data-bs-dismiss="modal">Close</button>
              </div>
            </div>
          </div>
        </div>

      </header>
      <div class="row align-items-md-stretch">`;
    let rommsHtml = `<div class="col-md-4">
                     <div class="h-100 p-4 text-white bg-dark shadow-cos rounded-15">
                      <div class="d-flex flex-row justify-content-between">
                        <h1 class="display-8">Rooms</h1>
                        <button id="refreshBtn" class="btn btn-secondary btn-refresh">Refresh</button>

                      </div>
                    <div id="roomSelecters">`                     
    let allHtml = header+rommsHtml;
    /*                        <label class="refreshLabel">
                          <input type="checkbox" id="refreshSwitchBtn">
                          <div class="btn btn-secondary refreshSwitch">Auto refresh</div>
                        </label>   
                        */
    let lightsHtml = `</div></div></div> 
                      <div class="col-md-8">
                      <div class="row row-cols-1 margin-0">
                      <div class="p-3 text-white bg-dark shadow-cos rounded-15 d-flex align-content-start flex-wrap" id="lightSelecters">
                      <h1 class="display-8 my-2 w-100">Lights</h1>`;

    let sceenHtml = `</div><div class="p-4 mt-2 text-white bg-dark shadow-cos rounded-15" id="sceneSelecters">
                     <h1 class="display-8 my-2 w-100">Scenes</h1>`

    let bottomHtml = "</div></div></div></div>";
    let footer = ` <footer class="text-muted bottom-text">
    <p class="text-center">&copy; <script type="text/javascript">document.write(new Date().getFullYear());</script> Jakob Frederik Lykke</p>
  </footer>`;
    if (selectedRoomID === -1) 
      selectedRoomID = allRooms[0].id;

    for (const room of this.rooms) {
      let lightsInThisRoom = [];
      for (const light of this.lights) {
        if (room.lightsInRoom.includes(String(light.id)))
          lightsInThisRoom.push(light);
      }
      lightsInThisRoom.sort(compare);
      allHtml += makeRoomSelecter(room.name, room.on, room.id, room.bri, lightsInThisRoom);
    }
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
    allHtml += footer;
    return allHtml;
  }
}

function makeRoomSelecter(name, on, id, bri, lights) {
  let checkedStr = "";
  let colorsGradient = "";
  let colorConv = new ColorConverter();
  let sliderDisabled = "";
  if (on) {
    checkedStr = "checked";
    let gradientFillpercent = 0;
    let gradientPercentToAdd = Math.floor(100/lights.length);
    if (lights.length > maxLightsInGradient) 
      gradientPercentToAdd = Math.floor(100/maxLightsInGradient);
    for (const [index, light] of lights.entries()) {
      if (index <= maxLightsInGradient) {
        if (light.xy) 
          colorsGradient += " rgb("+colorConv.xyBriToRgb(light.xy[0], light.xy[1], 255)+") "+gradientFillpercent+"%";
        else if (light.ct) 
          colorsGradient += " rgb("+colorConv.colorTempToRGB(1000000/(light.ct-200))+") "+gradientFillpercent+"%";
        else
          colorsGradient += "rgb(255, 233, 191) "+gradientFillpercent+"%";
        gradientFillpercent += gradientPercentToAdd;
        if (index !== lights.length-1 && index !== maxLightsInGradient) 
          colorsGradient += ",";
      } 
    }
  }
  else {
    sliderDisabled = 'style="display:none"';
  }
  return `<div class="roomSelecter my-3" style="background: linear-gradient(to right,${colorsGradient});" class="btn roomSelecter my-2">
          <button class="btn roomBtn" onclick="selectRoom_click(${id});">${name}</button>
            <label class="switch swRight">
              <input type="checkbox" id="roomSwitch${id}" onclick="setRoomState_click(${id})" ${checkedStr}>
              <span class="slider"></span>
            </label>   
            <input type="range" min="0" max="254" value="${bri}" ${sliderDisabled} class="sliderBar" id="roomSlider${id}" onchange="setRoomState_click(${id})">
        </div>`
}

function compare(a, b) {
  if (a.ct && b.ct) {
    if (a.ct < b.ct) 
      return -1;
    if (a.ct > b.ct) 
      return 1;
  }
  return 0;
}

function makeLightSelecter(light) {
  let colorConv = new ColorConverter();
  let color = "";
  let textColor = "text-hover-white";
  let sliders = `<input type="range" min="0" max="255" value="${light.bri}" class="briSlider sliderBar" id="briSlider${light.id}" onchange="briSlider_change(${light.id})">`;
  let pickersCollapse = "";
  if (light.on) {
    textColor = "text-hover-black";
    color = "255, 233, 191";
    if (light.xy) {
      color = colorConv.xyBriToRgb(light.xy[0], light.xy[1], 255); // todo: Fix color
      sliders += `<input type="range" min="0" max="255" value="${light.sat}" class="satSlider sliderBar" id="satSlider${light.id}" onchange="satSlider_change(${light.id})">
      <input type="range" min="0" max="65535" value="${light.hue}" class="hueSlider sliderBar" id="hueSlider${light.id}" onchange="hueSlider_change(${light.id})">`;
    } else if (light.ct) {                          // ^^^^ Hue does not change
      color = colorConv.colorTempToRGB(1000000/(light.ct-200)); // Mired to kelvin, -200 for celebration https://en.wikipedia.org/wiki/Mired
      sliders += `<input type="range" min="153" max="500" value="${light.ct}" class="tempSlider sliderBar" id="tempSlider${light.id}" onchange="tempSlider_change(${light.id})">`;
    }
    pickersCollapse = `<button class="btn pickerActivator" type="button" data-bs-toggle="collapse" data-bs-target="#pickerPopup${light.id}" aria-expanded="true" aria-controls="pickerPopup${light.id}"><img src="svg/chevron-down.svg"></button>
      <div class="collapse" id="pickerPopup${light.id}" class="accordion-collapse collapse show" data-bs-parent="#lightSelecters">
        <div class="card card-body rounded-10 pickerPopupCard">
            ${sliders}
        </div>
      </div>`;
  }
  return `<div class="lightSelecter my-2" id="${light.id}" style="background-color: rgb(${color})"> 
  <button type="button" class="btn nowrapTxt ${textColor}" onclick="setLightState_click(${light.id}, ${light.on})">${light.name}</button>
    ${pickersCollapse}
  </div>`
}

function makeSceneSelecter(scene) {
  return `<button type="button" class="btn sceneSelecter nowrapTxt my-2" onclick="selectScene_click('${scene.key}');">${scene.name}</button>`
}

