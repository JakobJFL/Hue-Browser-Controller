function getDashboardHtml(rooms, lights) {
  let html = `<div class="col-md-4">
  <div class="h-100 p-4 text-white bg-dark border rounded-3">
    <h1 class="display-8">Rooms
      <button id="refreshBtn" class="btn btn-secondary btn-refresh">Refresh</button>
    </h1>
    <div id="roomSelecters">`;

  let bottomDivs = `</div></div></div> <div class="col-md-8 "><div class="h-100 p-3 text-white bg-dark border rounded-3">  `;
  let bottomHtml = "</div>";

  for (const room of rooms) {
    html += makeRoomSelecter(room.name, room.on, room.id, room.xy, room.ct, room.bri);
  }
  html += bottomDivs;
  for (const light of lights) {
    html += makeLightSelecter(light);
  }
  html += bottomHtml;
  return html;
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
  }
  else 
    sliderDisabled = 'style="display:none"';
  return `<button type="button" onclick="selectRoom_click(${id});" style="background: linear-gradient(to right, rgb(${firstColor}) 0%, rgb(${secondColor}) 100%);" class="btn roomSelecter my-2">
    <div class="textRoom">${name}
      <label class="switch swRight">
        <input type="checkbox" id="roomSwitch${id}" onclick="setRoomState_click(${id});" ${checkedStr}>
        <span class="slider"></span>
      </label>   
    </div>
    <input type="range" min="0" max="255" value="${bri}" ${sliderDisabled} class="sliderBar" id="roomSlider${id}" onchange="setRoomState_click(${id})">
  </button>`
}

function makeLightSelecter(light) {
  let sliderDisabled = "";
  let colorConv = new ColorConverter();
  let color = "";

  if (light.on) {
    color = "255, 233, 191";
    if (light.xy) 
      color = colorConv.xyBriToRgb(light.xy[0], light.xy[1], 255); // todo: Fix color
    else if (light.ct) 
      color = colorConv.colorTempToRGB(1000000/(light.ct-200)); // Mired to kelvin, -200 for celebration https://en.wikipedia.org/wiki/Mired
  }
  else 
    sliderDisabled = 'style="display:none"';

  return `<button type="button" style="background-color: rgb(${color})" class="btn lightSelecter my-2"> 
    <div class="nowrapTxt">${light.name}</div>
    <input type="range" min="0" max="255" value="${light.bri}" ${sliderDisabled} class="sliderBar" id="myRange">
  </button>`
}

function setRoomState_click(id) {
  let isChecked = document.getElementById("roomSwitch"+id).checked;
  let getBri = document.getElementById("roomSlider"+id).value;
  changeRoomState(id, isChecked, getBri).then(res => {
    setDashboardElements(); // Refresh html
  });
}

function selectRoom_click(id) {
  if (selectedRoom !== id) {
    console.log(id)
    selectedRoom = id;
  }
}
