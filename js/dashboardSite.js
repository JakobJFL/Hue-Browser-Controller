function getDashboardHtml(rooms) {
  let html = `<div class="col-md-4">
  <div class="h-100 p-4 text-white bg-dark border rounded-3">
    <h1 class="display-8">Rooms
      <button id="refreshBtn" class="btn btn-secondary btn-refresh">Refresh</button>
    </h1>
    <div id="roomSelecters">`

  let bottom = `</div>  
    </div>
    </div>
    <div class="col-md-8 ">
      <div class="h-100 p-5 text-white bg-dark border rounded-3">
        <h2>Add borders</h2>
        <p>Or, keep it light and add a border for some added definition to the boundaries of your content. Be sure to look under the hood at the source HTML here as we've adjusted the alignment and sizing of both column's content for equal-height.</p>
        <button class="btn btn-outline-secondary" type="button">Example button</button>
      </div>
    </div>`

  for (const room of rooms) {
    html += makeSelecter(room.name, room.on, room.id, room.xy, room.ct, room.bri);
  }
  html += bottom;
    
  return html;
}

function makeSelecter(name, on, id, xy, ct, bri) {
  let checkedStr = "";
  let firstColor = "20, 20, 20";
  let secondColor = "20, 20, 20";
  let colorConv = new ColorConverter();
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
  return `<button type="button" style="background: linear-gradient(to right, rgb(${firstColor}) 0%, rgb(${secondColor}) 100%);" class="btn roomSelecter my-2">
  <div class="textRoom">${name}
    <label class="switch swRight">
      <input type="checkbox" id="roomSwitch${id}" onclick="setRoomState(${id});" ${checkedStr}>
      <span class="slider"></span>
    </label>   
  </div>
  <input type="range" min="0" max="255" value="${bri}" class="sliderBar" id="roomSlider${id}" onchange="setRoomState(${id})">  
</button>`
}

function setRoomState(id) {
  let isChecked = document.getElementById("roomSwitch"+id).checked;
  let getBri = document.getElementById("roomSlider"+id).value;
  changeRoomState(id, isChecked, getBri);
}
