class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedRoom: this.props.hueData.rooms[0].key,
      rooms: this.props.hueData.rooms,
      lights: this.filterLights(this.props.hueData.lights, this.props.hueData.rooms[0].key),
      scenes: this.props.hueData.scenes,
    }
  }

  filterLights(lights, selectedRoom) {
    return lights.filter(r=> this.props.hueData.rooms[selectedRoom].lightsInRoom.includes(r.id));
  }

  async reload() {
    try {
      this.setState({
        rooms: await getHueRooms(this.props.acc),
        lights: this.filterLights(await getHueLights(this.props.acc), this.state.selectedRoom),
      });
    }
    catch (err) {
      console.error(err);
    }
  }

  roomChange(k) {
    this.setState({
      selectedRoom: k,
    });
    this.reload();
  }

  render() {
    return(
      <React.Fragment>
        <div className="row align-items-md-stretch">
          <div className="col-md-4">
            <div className="container-full p-4 mt-2 text-white bg-dark shadow-cos rounded-15">
              <div className="d-flex flex-row justify-content-between">
                <h1 className="display-8">Rooms</h1>
                <button id="refreshBtn" className="btn btn-secondary btn-refresh">Refresh</button>
              </div>
              <div id="roomSelecters">
                {
                  this.state.rooms.map((v,i) => { 
                    let isSelected = i==this.state.selectedRoom;
                    return <RoomSelecter key={i} data={v} reload={()=>this.reload()} roomChange={(k)=>this.roomChange(k)} selected={isSelected}/>
                  })
                }
              </div>
            </div>
          </div>
          <div className="col-md-8">
            <div className="row test row-cols-1 m-0">
              <div className="p-3 mt-2 container-half text-white bg-dark shadow-cos rounded-15 d-flex align-content-start flex-wrap" id="lightSelecters">
                <h1 className="display-8 my-2 w-100 ">Lights</h1>                
                {
                  this.state.lights.map((v,i) => { 
                    return <LightSelecter key={i} data={v} />
                  })
                }
              </div>
              <div className="p-4 container-half mt-2 text-white bg-dark shadow-cos rounded-15" id="sceneSelecters">
                <div className="d-flex w-100">          
                  <h1 className="display-8 my-2 w-100">Scenes</h1>

                </div>
              </div>
            </div>  
          </div>
        </div>
      </React.Fragment>
    );
  }
}


class LightSelecter extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <React.Fragment>
        <div className="lightSelecter my-2" > 
        <button type="button" className={"btn nowrapTxt "+ (!this.props.data.on ? "text-hover-white" : "")}>{this.props.data.name}</button>
          pickersCollapse
        </div>
      </React.Fragment>
      )
    }
}


class RoomSelecter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      bri: this.props.data.bri,
    }
  }

  onSwitch(e) {
    new actions().changeRoomState(this.props.data.id, e, this.props.data.bri); 
    this.setState({
      on: e,
    });
    this.props.reload();
  }

  onBri(e) {
    this.setState({
      bri: e,
    });
  }

  updateRoom() {
    new actions().changeRoomState(this.props.data.id, this.props.data.on, this.state.bri);
    this.props.reload();
  }

  getGradient() {
    let colorConv = new ColorConverter();
    if (!this.props.data.on) {
      return "";
    }
    let colorsGradient = "linear-gradient(to right, rgb(255, 233, 191), rgb(255, 233, 0))";
    
    /*
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
      */
    return colorsGradient;
  }

  render() {
  return (
    <React.Fragment>
      <div className={"roomSelecter my-3 "+(this.props.selected ? "selected" : "")} style={{background: this.getGradient()}}>
        <button className="btn roomBtn" onClick={()=>this.props.roomChange(this.props.data.key)}>{this.props.data.name}</button>
          <ToggleSwitch onChange={e=>this.onSwitch(e.target.checked)} isToggled={this.props.data.on}/>
          {this.props.data.on ? 
              <input className="sliderBar" type="range" min="0" max="254" value={this.props.data.bri} onChange={e=>this.onBri(e.target.value)} onClick={()=>this.updateRoom()}/>
            : ""
          }
      </div>
    </React.Fragment>
    )
  }
}





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
  
  
      let header = `
      <div className="container pt-4">
        <header className="pb-3 mb-4">
          <div className="top-bar">
            <a className="d-flex align-items-center text-dark text-decoration-none">
              <span className="fs-4 text-white">Open Hue Controller</span>
            </a>
            <div className="d-flex flex-row-reverse top-bar-right">
              <a className="nav-link link-white" href="download.html">Download</a>
              <a className="nav-link link-white" type="button" data-bs-toggle="modal" data-bs-target="#SettingsModal" >Settings</a>
            </div>
          </div>
  
          <!-- SettingsModal -->
          
  
        </header>
        <div className="row align-items-md-stretch">`;

      let rommsHtml = `<div className="col-md-4">
                       <div className="container-full p-4 mt-2 text-white bg-dark shadow-cos rounded-15">
                        <div className="d-flex flex-row justify-content-between">
                          <h1 className="display-8">Rooms</h1>
                          <button id="refreshBtn" className="btn btn-secondary btn-refresh">Refresh</button>
  
                        </div>
                      <div id="roomSelecters">`                     
      let allHtml = header+rommsHtml;
  
      let lightsHtml = `</div></div></div> 
                        <div className="col-md-8">
                        <div className="row test row-cols-1 m-0">
                        <div className="p-3 mt-2 container-half text-white bg-dark shadow-cos rounded-15 d-flex align-content-start flex-wrap" id="lightSelecters">
                        <h1 className="display-8 my-2 w-100 ">Lights</h1>`;
  
      let sceenHtml = `</div><div className="p-4 container-half mt-2 text-white bg-dark shadow-cos rounded-15" id="sceneSelecters">
      <div className="d-flex w-100">          
      <h1 className="display-8 my-2 w-100">Scenes</h1>`;
      if (settingsObj.effects) {
        sceenHtml += `<button onclick="colorloopEffect_click()" type="button" className="btn btn-secondary btn-round h-50 m-1">Colorloop</button>
        <button type="button" onclick="breatheEffect_click()" className="btn btn-secondary btn-round h-50 m-1">Breathe</button>
        <button type="button" onclick="noneEffect_click()" className="btn btn-secondary btn-round h-50 m-1">None</button>`;
      }
     
      sceenHtml +=`</div>`;
  
      let bottomHtml = "</div></div></div></div>";
      let footer = ` <footer className="text-white bottom-text">
        <p className="text-center ">&copy; <script type="text/javascript">document.write(new Date().getFullYear());</script> Jakob Frederik Lykke <a href="https://github.com/JakobJFL" className="link-white" target="_blank">Github</a> - <a href="https://www.youtube.com/channel/UCf3cp8GGxbCJ8IZfGBmbljw" className="link-white" target="_blank">YouTube</a></p>
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
    return `<div className="roomSelecter ${selected} my-3" style="background: ${colorsGradient});" className="btn roomSelecter my-2">
            <button className="btn roomBtn" onclick="selectRoom_click(this,${key});">${name}</button>
              <label className="switch swRight">
                <input type="checkbox" id="roomSwitch${id}" onclick="setRoomState_click(${id})" ${checkedStr}>
                <span className="slider"></span>
              </label>   
              <input type="range" min="0" max="254" value="${bri}" ${sliderDisabled} className="sliderBar" id="roomSlider${id}" onchange="setRoomState_click(${id})">
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
    let sliders = `<input type="range" min="0" max="255" value="${light.bri}" className="briSlider sliderBar" id="briSlider${light.id}" onchange="briSlider_change(${light.id})">`;
    let pickersCollapse = "";
    if (light.on) {
      textColor = "text-hover-black";
      color = "255, 233, 191";
      if (light.xy) {
        color = colorConv.xyBriToRgb(light.xy[0], light.xy[1], 255); // todo: Fix color
        sliders += `<input type="range" min="0" max="255" value="${light.sat}" className="satSlider sliderBar" id="satSlider${light.id}" onchange="satSlider_change(${light.id})">
        <input type="range" min="0" max="65535" value="${light.hue}" className="hueSlider sliderBar" id="hueSlider${light.id}" onchange="hueSlider_change(${light.id})">`;
      } else if (light.ct) {                          // ^^^^ Hue does not change
        color = colorConv.colorTempToRGB(1000000/(light.ct-200)); // Mired to kelvin, -200 for celebration https://en.wikipedia.org/wiki/Mired
        sliders += `<input type="range" min="153" max="500" value="${light.ct}" className="tempSlider sliderBar" id="tempSlider${light.id}" onchange="tempSlider_change(${light.id})">`;
      }
      if (light.bri) {
        pickersCollapse = `<button className="btn pickerActivator" type="button" data-bs-toggle="collapse" data-bs-target="#pickerPopup${light.id}" aria-expanded="true" aria-controls="pickerPopup${light.id}">`
        if (!light.reachable) {
          pickersCollapse += `Unreachable`;
        } 
        else 
          pickersCollapse += `<img src="svg/chevron-down.svg">`;
  
        pickersCollapse += `</button>
        <div id="pickerPopup${light.id}" className="collapse accordion-collapse" data-bs-parent="#lightSelecters">
          <div className="card card-body rounded-10 pickerPopupCard">
              ${sliders}
          </div>
        </div>`;
      }
      else 
        color = "230, 230, 230";
    }
    return `<div className="lightSelecter my-2" id="${light.id}" style="background-color: rgb(${color})"> 
    <button type="button" className="btn nowrapTxt ${textColor}" onclick="setLightState_click(${light.id}, ${light.on})">${light.name}</button>
      ${pickersCollapse}
    </div>`
  }
  
  function makeSceneSelecter(scene) {
    return `<button type="button" className="btn sceneSelecter nowrapTxt my-2" onclick="selectScene_click('${scene.key}');">${scene.name}</button>`
  }
  
  