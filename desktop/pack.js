const {packager}=require('@electron/packager');(async()=>{
for(const [platform,arch,icon] of [['win32','x64','build/icon.ico'],['darwin','arm64','build/icon.icns'],['darwin','x64','build/icon.icns']]){
 const out=await packager({dir:'app',out:'out',platform,arch,electronVersion:'38.8.6',overwrite:true,asar:true,icon,name:'DeadlinePlanner',executableName:'DeadlinePlanner',appBundleId:'io.github.lgy10.deadlineplanner',appCopyright:'lgy-10',
  win32metadata:{ProductName:'마감 역산 일정표',FileDescription:'마감 역산 일정표',CompanyName:'lgy-10'},extendInfo:{CFBundleDisplayName:'마감 역산 일정표',CFBundleName:'마감 역산 일정표',LSMinimumSystemVersion:'12.0'},prune:true,quiet:true});console.log(out)}})().catch(e=>{console.error(e.message);process.exit(1)});
