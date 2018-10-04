'use babel';

var vscode = require('vscode');
import {StatusBarAlignment, window} from "vscode";

import Term from './terminal';
import ApiWrapper from '../main/api-wrapper.js';
import Logger from '../helpers/logger.js'


var EventEmitter = require('events');

export default class PanelView extends EventEmitter {

  constructor(pyboard,settings) {
    super()
    var _this = this
    this.settings = settings
    this.pyboard = pyboard
    this.visible = true
    this.api = new ApiWrapper()
    this.logger = new Logger('PanelView')

    this.statusItems = {}
    this.statusItems['status'] = this.createStatusItem('status',"","pymakr.toggleConnect","Toggle terminal") // name is set using setTitle function
    this.statusItems['run'] = this.createStatusItem('run',"$(triangle-right) Run","pymakr.run","Run current file")
    //todo: --> this.statusItems['runselection'] = this.createStatusItem('runselection',"$(triangle-right) Run Line","pymakr.runselection","Run current line")
    this.statusItems['upload'] = this.createStatusItem('upload',"$(triangle-up) Upload","pymakr.upload","Upload project to your board")
    this.statusItems['download'] = this.createStatusItem('download',"$(triangle-down) Download","pymakr.download","Download project from your board")
    this.statusItems['disconnect'] = this.createStatusItem('disconnect',"$(x) Disconnect","pymakr.disconnect","Disconnect")
    this.statusItems['settings'] = this.createStatusItem('settings',"$(gear) Settings","pymakr.globalSettings","Global Pymakr settings")
    this.statusItems['projectsettings'] = this.createStatusItem('projectsettings',"$(gear) Project settings","pymakr.projectSettings","Project settings for Pymakr")
    this.statusItems['getversion'] = this.createStatusItem('getversion',"$(tag) Get version","pymakr.extra.getVersion","Get board version")
    this.statusItems['getssid'] = this.createStatusItem('getssid',"$(rss) Get WiFi SSID","pymakr.extra.getWifiMac","Get WiFi AP SSID")
    this.statusItems['listserial'] = this.createStatusItem('listserial',"$(list-unordered) List serialports","pymakr.extra.getSerial","List available serialports")
    this.statusItems['listcommands'] = this.createStatusItem('listcommands',"$(list-unordered) All commands","pymakr.listCommands","List all available pymakr commands")
    this.setTitle("not connected")

    // terminal logic
    var onTermConnect = function(err){
      _this.emit('term-connected',err)
    }

    _this.setProjectName(_this.api.getProjectPath())

    // create terminal
    this.terminal = new Term(onTermConnect,this.pyboard,_this.settings)
    this.terminal.setOnMessageListener(function(input){
      _this.emit('user_input',input)
    })
  }

  showQuickPick(){
    var _this = this
    var items = [];
    items.push({ label: "Pymakr > Connect", description: "", cmd: "connect" });
    items.push({ label: "Pymakr > Disconnect", description: "", cmd: "disconnect" });
    items.push({ label: "Pymakr > Run current file", description: "", cmd: "run" });
    items.push({ label: "Pymakr > Run current line or selection", description: "", cmd: "runselection" });    
    items.push({ label: "Pymakr > Upload Project", description: "", cmd: "upload" });
    items.push({ label: "Pymakr > Download Project", description: "", cmd: "download" });
    items.push({ label: "Pymakr > Project Settings", description: "", cmd: "project_settings" });
    items.push({ label: "Pymakr > Global Setting", description: "", cmd: "global_settings" });
    items.push({ label: "Pymakr > Extra > Get board version", description: "", cmd: "get_version" });
    items.push({ label: "Pymakr > Extra > Get WiFi AP SSID", description: "", cmd: "get_wifi" });
    items.push({ label: "Pymakr > Extra > List Serial Ports", description: "", cmd: "get_serial" });
    items.push({ label: "Pymakr > Help", description: "", cmd: "help" });

    var options = {
        placeHolder: "Select Action"
    };

    window.showQuickPick(items, options).then(function(selection){
        if (typeof selection === "undefined") {
            return;
        }
        _this.emit(selection.cmd)
        
    });
  }


  createStatusItem(key,name,command,tooltip){

    if(!this.statusItemPrio){
      this.statusItemPrio = 15
    }
    var statusBarItem = vscode.window.createStatusBarItem(StatusBarAlignment.Left,this.statusItemPrio)
    statusBarItem.command = command
    statusBarItem.text = name
    statusBarItem.tooltip = tooltip
    if((this.settings.statusbar_buttons && this.settings.statusbar_buttons.indexOf(key) > -1) || key == 'listcommands'){
      statusBarItem.show()
    }
    this.statusItemPrio-=1
    return statusBarItem
  }

  setProjectName(project_path){
    if(project_path && project_path.indexOf('/') > -1){
      this.project_name = project_path.split('/').pop()
    }else{
      this.project_name = "No project"
    }
    this.setButtonState()
  }

  // refresh button display based on current status
  setButtonState(runner_busy){
    if (!this.visible) {
      this.setTitle('not connected')
    }else if(this.pyboard.connected) {
      if(runner_busy == undefined){
        // do nothing
      }else if(runner_busy){
        this.setButton('run','primitive-square','Stop')
      }else{
        this.setButton('run','triangle-right','Run')
      }

      this.setTitle('connected')

    }else{
      this.setTitle('not connected')
    }
  }

  setButton(name,icon,text){
      this.statusItems[name].text = "$("+icon+") "+text
  }

  setTitle(status){
    var icon = "x"
    if(status == "connected"){
      icon = "check"
    }
    this.setButton('status',icon,'Pycom Console')
  }


  // UI Stuff
  addPanel(){
    // not implemented
  }

  setPanelHeight(height){
    // not implemented
  }

  hidePanel(){
    this.terminal.hide()
    this.visible = false
  }

  showPanel(){
    this.terminal.clear()
    this.terminal.show()
    this.visible = true
    this.setButtonState()
  }

  clearTerminal(){
    this.terminal.clear()
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {
    // not implemented
  }

  // Tear down any state and detach
  destroy() {
    this.disconnect()
  }

  getElement() {
    return {};
  }

}
