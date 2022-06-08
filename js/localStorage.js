function getSettings() {
    let storage = localStorage.getItem('siteSettings');
    let settingsObj = {
      effects: false,
      showUnreachable: false,
      theme: 0,
    };
    if (storage) 
      settingsObj = JSON.parse(storage);
    return settingsObj;
}

function setSettings(settingsObj) {
    localStorage.setItem('siteSettings', JSON.stringify(settingsObj));
}

function setThemeSettings(settingsObj) {
    let storage = localStorage.getItem('siteSettings');
    let newSettingsObj = {
        effects: settingsObj.effects,
        showUnreachable: settingsObj.showUnreachable,
        theme: settingsObj.theme
    };
    if (storage) 
        newSettingsObj = JSON.parse(storage);
    newSettingsObj.theme = settingsObj.theme;
    localStorage.setItem('siteSettings', JSON.stringify(newSettingsObj));
}