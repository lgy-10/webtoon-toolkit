const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',{
  platform:process.platform,
  togglePin:()=>ipcRenderer.invoke('pin:toggle'),
  getPin:()=>ipcRenderer.invoke('pin:get'),
  onPin:cb=>ipcRenderer.on('pin:changed',(_e,v)=>cb(v)),
  openMain:()=>ipcRenderer.send('main:open'),
  showWidget:()=>ipcRenderer.send('widget:show'),
  hideWidget:()=>ipcRenderer.send('widget:hide')
});
