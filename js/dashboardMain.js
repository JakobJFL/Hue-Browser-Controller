'use strict';
const maxLightsInGradient = 4;

class ControllerSite extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      settings: props.settings,
      isLightTheme: this.isLightTheme(props.settings.theme),
    }
  }

  onTheme(i) {
    this.setState({settings: {
        theme: i,
        effects: this.state.settings.effects,
        showUnreachable: this.state.settings.showUnreachable,
      },
      isLightTheme: this.isLightTheme(i),
    }); 
  }

  onEffects(e) {
    this.setState({settings: {
        theme: this.state.settings.theme,
        effects: e,
        showUnreachable: this.state.settings.showUnreachable,
      },
    }); 
  }

  onShowUnreachable(s) {
    this.setState({settings: {
        theme: this.state.settings.theme,
        effects: this.state.settings.effects,
        showUnreachable: s
      },
    }); 
  }

  isLightTheme(i) {
    if (i == 3 || i == 1) {
      return true;
    }
    return false;
  }

  changeTheme(themeIndex) {
    switch (themeIndex) {
      case 1:
          document.body.style.backgroundImage = 'linear-gradient(0, #7c9ffd, #83b9ff, #6b97ff)';
          break; 
      case 2:
          document.body.style.backgroundImage = 'linear-gradient(0, #000, #080808)';
          break;
      case 3:
          document.body.style.backgroundImage = 'linear-gradient(0,  #f2f2f2, #fff, #fff)';
          break;
      default: 
          document.body.style.backgroundImage = 'linear-gradient(0,  #5652b9, #717ce4,#7669e7)';
          break;
    }
    setThemeSettings(this.state.settings);
  }

  render() {
    return(
      <React.Fragment>
        <div className="container pt-4">
          <header className="pb-3 mb-4">
            <div className="top-bar">
              <a className="d-flex align-items-center text-dark text-decoration-none">
                <span className={"fs-4 " + (this.state.isLightTheme ? "" : "text-white")}>Open Hue Controller</span>
              </a>
              <div className="d-flex flex-row-reverse top-bar-right">
                <a className={"nav-link " + (this.state.isLightTheme ? "" : "link-white")} href="download.html">Download</a>
                <a className={"nav-link " + (this.state.isLightTheme ? "" : "link-white")} type="button" data-bs-toggle="modal" data-bs-target="#SettingsModal" >Settings</a>
              </div>
            </div>
          </header>
          <SettingsModal 
            settings={this.state.settings} 
            acc={this.props.acc}
            onTheme={(i)=>this.onTheme(i)}
            onEffects={(i)=>this.onEffects(i)}
            onShowUnreachable={(i)=>this.onShowUnreachable(i)}
          />
          <Dashboard hueData={this.props.hueData}/>
          <footer className="text-white bottom-text">
            <p className="text-center">&copy;  {new Date().getFullYear()} Jakob Frederik Lykke <a href="https://github.com/JakobJFL" className="link-white" target="_blank">Github
              </a> - 
              <a href="https://www.youtube.com/channel/UCf3cp8GGxbCJ8IZfGBmbljw" className="link-white" target="_blank">YouTube</a>
            </p>
          </footer>
        </div>
        {this.changeTheme(this.state.settings.theme)}
      </React.Fragment>
    );
  }
}

class SettingsModal extends React.Component {
  constructor(props) {
    super(props);
  }
  
  render() {
    let settingsObj = this.props.settings;
    return (
    <React.Fragment>
      <div className="modal fade" id="SettingsModal" tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog modal-lg">
            <div className="modal-content rounded-15">
              <div className="modal-header modal-header-15">
                <h5 className="modal-title text-white" id="exampleModalLabel">More</h5>
                <button type="button" className="btn-close " data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <h2 className="fs-4">Options</h2>
                <h3 className="fs-5 text-muted">Hue Controller options</h3>
                <table className="table">
                  <tbody>
                    <tr>
                      <th className="text-muted" scope="row">Enable effects:</th>
                      <td>
                        <ToggleSwitch onChange={(e)=>this.props.onEffects(e.target.checked)} isToggled={settingsObj.effects}/>
                      </td>
                      <td>Enable special effects that can be applied to a room</td>
                    </tr>
                    <tr>
                      <th className="text-muted" scope="row">
                      Show unreachable:
                      </th>
                      <td className="float-left">
                        <ToggleSwitch onChange={(e)=>this.props.onShowUnreachable(e.target.checked)} isToggled={settingsObj.showUnreachable}/>
                      </td>
                      <td>Show lights that are unreachable to the bridge</td>
                    </tr>
                    <tr>
                      <th className="text-muted" scope="row">Change theme:</th>
                      <td className="float-left">
                        <button type="button" onClick={()=>this.props.onTheme(0)} className="solid-colourSelector solid-purple"></button>
                        <button type="button" onClick={()=>this.props.onTheme(1)} className="solid-colourSelector solid-blue"></button>
                        <button type="button" onClick={()=>this.props.onTheme(2)} className="solid-colourSelector solid-black"></button>
                        <button type="button" onClick={()=>this.props.onTheme(3)} className="solid-colourSelector solid-white"></button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <h2 className="fs-4 ">Bridge</h2>
                <h3 className="fs-5 text-muted">Saved hue login details</h3>
                <table className="table">
                  <tbody>
                    <tr><th className="text-muted" scope="row">IP Addres:</th><td>{this.props.acc.ip}</td></tr>
                    <tr><th className="text-muted" scope="row">Access token:</th><td>{this.props.acc.token}</td></tr>
                  </tbody>
                </table>
                <h3 className="fs-5 text-muted" >Remove saved details</h3>
                <button type="button" id="logOutBtn" className="btn btn-outline-danger my-2 btn-round">Logout</button>
                <p className="mb-1">This will remove the saved hue login details from the website's local storage. This means the you will not automatically log in when you enter the website.</p>
                <p>You can still log in with the same details after this.</p>
                </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-round" onClick={()=>setSettings(settingsObj)} data-bs-dismiss="modal">Save settings</button>
              </div>
            </div>
          </div>
        </div>
    </React.Fragment>
    )
  }
}

function ToggleSwitch(props) {
  return (
    <label className="switch">
      <input type="checkbox" onInput={e => props.onChange(e)} defaultChecked={props.isToggled} />
      <span className="slider"></span>
    </label>
  );
}
