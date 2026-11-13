const {app,BrowserWindow,Tray,Menu,ipcMain,shell,nativeImage,screen}=require('electron');
const path=require('path'),fs=require('fs'),os=require('os');
if(!app.requestSingleInstanceLock()){app.quit();return}
const PAGE=path.join(__dirname,'www','index.html');
const CFG=()=>path.join(app.getPath('userData'),'settings.json');
let cfg={pinned:false,widget:true,wb:null,mb:null,autostart:true};
try{cfg={...cfg,...JSON.parse(fs.readFileSync(CFG(),'utf8'))}}catch(e){}
const saveCfg=()=>{try{fs.writeFileSync(CFG(),JSON.stringify(cfg))}catch(e){}};
let mainWin=null,widget=null,tray=null,quitting=false;
const ICON=nativeImage.createFromPath(path.join(__dirname,'icon.png'));
const prefs={preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true};
function guard(w){w.webContents.setWindowOpenHandler(({url})=>{if(/^https?:/.test(url))shell.openExternal(url);return{action:'deny'}});
  w.webContents.on('will-navigate',(e,url)=>{if(!url.startsWith('file:')){e.preventDefault();shell.openExternal(url)}})}
function onScreen(b){if(!b)return null;return screen.getAllDisplays().some(d=>{const a=d.workArea;return b.x<a.x+a.width-40&&b.x+b.width>a.x+40&&b.y>=a.y-10&&b.y<a.y+a.height-40})?b:null}
function openMain(){
  if(mainWin){if(mainWin.isMinimized())mainWin.restore();mainWin.show();mainWin.focus();return}
  const b=onScreen(cfg.mb)||{width:1180,height:860};
  mainWin=new BrowserWindow({...b,minWidth:380,minHeight:500,title:'마감 역산 일정표',icon:ICON,backgroundColor:'#f5f5f6',autoHideMenuBar:true,webPreferences:prefs});
  mainWin.removeMenu&&process.platform!=='darwin'&&mainWin.removeMenu();
  guard(mainWin);mainWin.loadFile(PAGE);
  const keep=()=>{if(!mainWin.isMaximized()&&!mainWin.isMinimized()){cfg.mb=mainWin.getBounds();saveCfg()}};
  mainWin.on('resize',keep);mainWin.on('move',keep);
  mainWin.on('closed',()=>{mainWin=null;if(!widget||!widget.isVisible()){if(process.platform!=='darwin')app.quit()}});
}
function showWidget(){
  if(widget){widget.show();widget.focus();cfg.widget=true;saveCfg();buildMenu();return}
  const wa=screen.getPrimaryDisplay().workArea;
  const b=onScreen(cfg.wb)||{width:340,height:580,x:wa.x+wa.width-360,y:wa.y+20};
  widget=new BrowserWindow({...b,minWidth:280,minHeight:220,frame:false,resizable:true,skipTaskbar:true,alwaysOnTop:cfg.pinned,
    fullscreenable:false,maximizable:false,minimizable:false,show:false,title:'마감 위젯',icon:ICON,backgroundColor:'#f5f5f6',hasShadow:true,webPreferences:prefs});
  if(cfg.pinned)widget.setAlwaysOnTop(true,'floating');
  guard(widget);widget.loadFile(PAGE,{search:'widget'});
  widget.once('ready-to-show',()=>widget.show());
  const keep=()=>{cfg.wb=widget.getBounds();saveCfg()};widget.on('resize',keep);widget.on('move',keep);
  widget.on('close',e=>{if(!quitting){e.preventDefault();hideWidget()}});
  widget.on('closed',()=>{widget=null});
  cfg.widget=true;saveCfg();buildMenu();
}
function hideWidget(){if(widget)widget.hide();cfg.widget=false;saveCfg();buildMenu();if(!mainWin&&process.platform!=='darwin'&&!tray)app.quit()}
function setPin(v){cfg.pinned=!!v;saveCfg();if(widget){widget.setAlwaysOnTop(cfg.pinned,'floating');widget.webContents.send('pin:changed',cfg.pinned)}buildMenu();return cfg.pinned}
function applyLogin(){try{app.setLoginItemSettings({openAtLogin:!!cfg.autostart,args:['--widget']})}catch(e){}}
function buildMenu(){if(!tray)return;const vis=!!(widget&&widget.isVisible());
  tray.setContextMenu(Menu.buildFromTemplate([
    {label:'전체 창 열기',click:openMain},
    {label:vis?'위젯 숨기기':'위젯 띄우기',click:()=>vis?hideWidget():showWidget()},
    {label:'위젯 항상 위에 고정',type:'checkbox',checked:cfg.pinned,click:i=>setPin(i.checked)},
    {type:'separator'},
    {label:'컴퓨터 켤 때 위젯 자동 실행',type:'checkbox',checked:cfg.autostart,click:i=>{cfg.autostart=i.checked;saveCfg();applyLogin();buildMenu()}},
    {type:'separator'},
    {label:'종료',click:()=>{quitting=true;app.quit()}}
  ]))}
ipcMain.handle('pin:toggle',()=>setPin(!cfg.pinned));
ipcMain.handle('pin:get',()=>cfg.pinned);
ipcMain.on('main:open',openMain);ipcMain.on('widget:show',showWidget);ipcMain.on('widget:hide',hideWidget);
app.on('second-instance',()=>openMain());
app.on('before-quit',()=>{quitting=true});
app.on('activate',()=>{if(!mainWin)openMain()});
app.on('window-all-closed',()=>{});
app.whenReady().then(()=>{
  const ti=nativeImage.createFromPath(path.join(__dirname,process.platform==='darwin'?'trayTemplate.png':'tray.png'));
  if(process.platform==='darwin')ti.setTemplateImage(true);
  tray=new Tray(ti);tray.setToolTip('마감 역산 일정표');tray.on('click',()=>{if(process.platform!=='darwin'){widget&&widget.isVisible()?widget.focus():showWidget()}});buildMenu();
  applyLogin();
  let atLogin=process.argv.includes('--widget');try{atLogin=atLogin||app.getLoginItemSettings().wasOpenedAtLogin||(process.platform==='darwin'&&cfg.autostart&&os.uptime()<240)}catch(e){}
  if(!atLogin)openMain();
  if(cfg.widget||atLogin)showWidget();
});
