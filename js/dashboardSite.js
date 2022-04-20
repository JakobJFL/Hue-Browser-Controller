const maxLightsInGradient = 4;

class DashboardPage {
  constructor(rooms, lights, scenes) {
    this.rooms = rooms;
    this.lights = lights;
    this.scenes = scenes;
  }
  getHtml(acc) { 
    let storage = localStorage.getItem('siteSettings');
    let settingsObj = {
      effects: false,
      showUnreachable: false
    };
    if (storage) 
      settingsObj = JSON.parse(storage);
    else 
      localStorage.setItem('siteSettings', JSON.stringify(settingsObj)); 
    let effects = "";
    let showUnreachableC = "";
    if (settingsObj.effects) effects = "checked";
    if (settingsObj.showUnreachable) showUnreachableC = "checked";

    let header = `<div class="container pt-4">
      <header class="pb-3 mb-4">
        <div class="top-bar">
          <a class="d-flex align-items-center text-dark text-decoration-none">
            <span class="fs-4 text-white">Online Hue Controller</span>
          </a>
          <div class="d-flex flex-row-reverse top-bar-right">
            <a class="nav-link link-white" href="download.html">Download</a>
            <a class="nav-link link-white" type="button" data-bs-toggle="modal" data-bs-target="#SettingsModal" >Settings</a>
          </div>
        </div>

        <!-- SettingsModal -->
        <div class="modal fade" id="SettingsModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content rounded-15">
              <div class="modal-header modal-header-15">
                <h5 class="modal-title text-white" id="exampleModalLabel">More</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <h2 class="fs-4">Options</h2>
                <h3 class="fs-5 text-muted">Hue Controller options</h3>
                <table class="table">
                  <tbody>
                    <tr>
                      <th class="text-muted" scope="row">
                      Enable effects:
                        
                      </th>
                      <td>
                        <label class="switch">
                          <input type="checkbox" id="effectsSwitch" ${effects}>
                          <span class="slider"></span>
                        </label>   
                      </td>
                      <td>Enable special effects that can be applied to a room</td>
                    </tr>
                    <tr>
                      <th class="text-muted" scope="row">
                      Show unreachable:
                      </th>
                      <td class="float-left">
                        <label class="switch">
                          <input type="checkbox" id="reachableSwitch" ${showUnreachableC}>
                          <span class="slider"></span>
                        </label>   
                      </td>
                      <td>Show lights that are unreachable to the bridge</td>
                    </tr>
                  </tbody>
                </table>
                <h2 class="fs-4 ">Bridge</h2>
                <h3 class="fs-5 text-muted">Saved hue login details</h3>
                <table class="table">
                  <tbody>
                    <tr><th class="text-muted" scope="row">IP Addres:</th><td>${acc.ip}</td></tr>
                    <tr><th class="text-muted" scope="row">Access token:</th><td>${acc.token}</td> </tr>
                  </tbody>
                </table>
                <h3 class="fs-5 text-muted" >Remove saved details</h3>
                <button type="button" id="logOutBtn" class="btn btn-outline-danger my-2 btn-round">Logout</button>
                <p class="mb-1">This will remove the saved hue login details from the website's local storage. This means the you will not automatically be logging in when you enter the website.</p>
                <p>You can still log in with the same details after this.</p>
                </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary rounded-10" id="saveSettingsBtn" data-bs-dismiss="modal">Save settings</button>
              </div>
            </div>
          </div>
        </div>

      </header>
      <div class="row align-items-md-stretch">`;
    let rommsHtml = `<div class="col-md-4">
                     <div class="container-full p-4 mt-2 text-white bg-dark shadow-cos rounded-15">
                      <div class="d-flex flex-row justify-content-between">
                        <h1 class="display-8">Rooms</h1>
                        <button id="refreshBtn" class="btn btn-secondary btn-refresh">Refresh</button>

                      </div>
                    <div id="roomSelecters">`                     
    let allHtml = header+rommsHtml;

    let lightsHtml = `</div></div></div> 
                      <div class="col-md-8">
                      <div class="row test row-cols-1 m-0">
                      <div class="p-3 mt-2 container-half text-white bg-dark shadow-cos rounded-15 d-flex align-content-start flex-wrap" id="lightSelecters">
                      <h1 class="display-8 my-2 w-100 ">Lights</h1>`;

    let sceenHtml = `</div><div class="p-4 container-half mt-2 text-white bg-dark shadow-cos rounded-15" id="sceneSelecters">
    <div class="d-flex w-100">          
    <h1 class="display-8 my-2 w-100">Scenes</h1>`;
    if (settingsObj.effects) {
      sceenHtml += `<button onclick="colorloopEffect_click()" type="button" class="btn btn-secondary btn-round h-50 m-1">Colorloop</button>
      <button type="button" onclick="breatheEffect_click()" class="btn btn-secondary btn-round h-50 m-1">Breathe</button>
      <button type="button" onclick="noneEffect_click()" class="btn btn-secondary btn-round h-50 m-1">None</button>`;
    }
   
    sceenHtml +=`</div>`;

    let bottomHtml = "</div></div></div></div>";
    let footer = ` <footer class="text-white bottom-text">
      <p class="text-center ">&copy; <script type="text/javascript">document.write(new Date().getFullYear());</script> Jakob Frederik Lykke <a href="https://github.com/JakobJFL" class="link-white" target="_blank">Github</a> - <a href="https://www.youtube.com/channel/UCf3cp8GGxbCJ8IZfGBmbljw" class="link-white" target="_blank">YouTube</a></p>
    </footer>`;
    if (selectedRoomID === -1) 
      selectedRoomID = allRooms[0].key;

    for (const room of this.rooms) {
      let lightsInThisRoom = [];
      for (const light of this.lights) {
        if (room.lightsInRoom.includes(String(light.id)))
          lightsInThisRoom.push(light);
      }
      lightsInThisRoom.sort(compare);
      allHtml += makeRoomSelecter(room.name, room.on, room.key, room.id, room.bri, lightsInThisRoom);
    }
    allHtml += lightsHtml;
    for (const light of this.lights) {
      if (allRooms[selectedRoomID].lightsInRoom.includes(String(light.id)))
        allHtml += makeLightSelecter(light, settingsObj);
    }
    allHtml += sceenHtml;
    for (const scene of this.scenes) {
      if (allRooms[selectedRoomID].id == scene.group)
        allHtml += makeSceneSelecter(scene);
    }
    allHtml += bottomHtml;
    allHtml += footer;
    return allHtml;
  }
}

function makeRoomSelecter(name, on, key, id, bri, lights) {
  let checkedStr = "";
  let colorsGradient = "linear-gradient(to right,";
  let colorConv = new ColorConverter();
  let sliderDisabled = "";
  let selected = "";
  if (selectedRoomID == key) 
    selected = "selected";
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
    if (lights.length === 1)
      if (lights[0].xy) 
        colorsGradient =  "rgb("+colorConv.xyBriToRgb(lights[0].xy[0], lights[0].xy[1], 255);
      else if (lights[0].ct)
        colorsGradient = " rgb("+colorConv.colorTempToRGB(1000000/(lights[0].ct-200));
      else
        colorsGradient = "rgb(255, 233, 191";
  }
  else {
    sliderDisabled = 'style="display:none"';
  }
  return `<div class="roomSelecter ${selected} my-3" style="background: ${colorsGradient});" class="btn roomSelecter my-2">
          <button class="btn roomBtn" onclick="selectRoom_click(this,${key});">${name}</button>
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

function makeLightSelecter(light, settingsObj) {
  if (!light.reachable && !settingsObj.showUnreachable) return "";
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
    if (light.bri) {
      pickersCollapse = `<button class="btn pickerActivator" type="button" data-bs-toggle="collapse" data-bs-target="#pickerPopup${light.id}" aria-expanded="true" aria-controls="pickerPopup${light.id}">`
      if (!light.reachable) {
        pickersCollapse += `Unreachable`;
      } 
      else 
        pickersCollapse += `<img src="svg/chevron-down.svg">`;

      pickersCollapse += `</button>
      <div id="pickerPopup${light.id}" class="collapse accordion-collapse" data-bs-parent="#lightSelecters">
        <div class="card card-body rounded-10 pickerPopupCard">
            ${sliders}
        </div>
      </div>`;
    }
    else 
      color = "230, 230, 230";
  }
  return `<div class="lightSelecter my-2" id="${light.id}" style="background-color: rgb(${color})"> 
  <button type="button" class="btn nowrapTxt ${textColor}" onclick="setLightState_click(${light.id}, ${light.on})">${light.name}</button>
    ${pickersCollapse}
  </div>`
}

function makeSceneSelecter(scene) {
  return `<button type="button" class="btn sceneSelecter nowrapTxt my-2" onclick="selectScene_click('${scene.key}');">${scene.name}</button>`
}

