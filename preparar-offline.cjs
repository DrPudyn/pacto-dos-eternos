const fs=require('fs'),path=require('path');
try{require('./gerar-loja-icone.cjs');}catch(e){console.warn('Ícones da loja:',e.message);}
try{require('./gerar-loja-artes.cjs').main();}catch(e){console.warn('Artes da loja:',e.message);}
const root='minihero-offline';
const target=root+'/build/app-0-_Askj9.js';
for(const name of fs.readdirSync(root+'/build').filter(n=>n.endsWith('.css'))){const file=root+'/build/'+name;fs.writeFileSync(file,require('./local-economy-ui.cjs').updateEconomyStyles(fs.readFileSync(file,'utf8')));}
let original=fs.readFileSync('original-publico/app.js','utf8');
original=require('./hero-config.cjs').addMage(original);
original=require('./hero-rarity-visuals.cjs').applyRarityClothes(original);
original=require('./loading-experience.cjs').applyLoadingExperience(original);
original=require('./hero-sort.cjs').applyHeroSort(original);
original=require('./assistant-visuals.cjs').applyAssistant(original);
original=require('./pact-visuals.cjs').applyPacts(original);
const languageSlot='class:`settings-list`},';
if(!original.includes(languageSlot))throw Error('Menu de áudio não encontrado para incluir idiomas.');
original=original.replace(languageSlot,languageSlot+'mhLanguageSetting(),mhTutorialSetting(),');
const shopRefresh='e.replaceChildren(),n(e,a)';
if(!original.includes(shopRefresh))throw Error('Atualização dos painéis não encontrada.');
original=original.replace(shopRefresh,shopRefresh+',queueMicrotask(()=>mhFitShopPage(e))');
const heroRoleLine='J(`span`,{class:`sheet-role`,text:ro(e)}),';
if(!original.includes(heroRoleLine))throw Error('Linha de arma e alcance do herói não encontrada.');
original=original.replace(heroRoleLine,'');
original=require('./economy-config.cjs').applyPrices(original);
original=require('./codex-rules.cjs').applyCombatRules(original);
original=require('./skill-progression.cjs').applySkillProgression(original);
original=require('./forge-rules.cjs').applyForgeRules(original);
original=require('./equipment-rules.cjs').applyCombatRules(original);
original=require('./hero-movement.cjs').applyMovementRules(original);
original=require('./farm-waves.cjs').applyWaveRules(original);
original=original.replace("text:n.status??oo(e)}))),J(`div`,{class:`sheet-stats`}","text:n.status??oo(e)}))),mhEquipmentSlot(e,!!n.fixed),J(`div`,{class:`sheet-stats`}");
const forgeBadgeSlot='text:n.status??oo(e)}))),mhEquipmentSlot(e,!!n.fixed),J(`div`,{class:`sheet-stats`}';
if(!original.includes(forgeBadgeSlot))throw Error('Ficha do herói não encontrada para mostrar a forja de reparo.');
original=original.replace(forgeBadgeSlot,'text:n.status??oo(e)}))),mhForgeAssignmentBadge(e),mhEquipmentSlot(e,!!n.fixed),J(`div`,{class:`sheet-stats`}');
original=original.replace('Eb(`atk`,`ATK`,e.atk,`${e.atk} damage per hit`)','Eb(`atk`,`ATK`,Math.round(e.atk*(1+(e.weaponBonus?.attack??0))),`${e.atk} ATK base + arma`)');
original=original.replace('let r=Qx,i=On[r-1]','let r=Qx,i=mhForgeUIStats(t,r)').replace('rS(String(a.length),`owned`)),J(`p`','rS(String(a.length),`owned`)),mhForgeMasteryPanel(t,r,n),mhForgeFleetSummary(t,n),J(`p`').replace('...On.map((r,i)=>{let a=i+1','...On.map((r,i)=>{r=mhForgeUIStats(e,i+1);let a=i+1');
const forgeStockNote='mhForgeFleetSummary(t,n),J(`p`,{class:`page-note`},`In the shop: `,c,`. Paid from your wallet, with a studio fee of ${qo(BigInt(hn))} SOL.`),J(`div`,{class:`forge-actions`}';
if(!original.includes(forgeStockNote))throw Error('Mensagem de estoque das forjas não encontrada para remoção.');
original=original.replace(forgeStockNote,'mhForgeFleetSummary(t,n),J(`div`,{class:`forge-actions`}');
{
 const from=original.indexOf('function oS('),to=original.indexOf('function sS(',from),part=original.slice(from,to),image='J(`img`,{class:`forge-entrance`,attrs:{src:W(`ui/forge-entrance.png`),alt:``}})';
 if(!part.includes(image))throw Error('Sprite da forja não encontrada.');
 original=original.slice(0,from)+part.replace(image,"mhForgeSprite(r,mhForgeProgress(t??{},r).level,'forge-entrance')")+original.slice(to);
 const detailFrom=original.indexOf('function Rb('),detailTo=original.indexOf('function ',detailFrom+12),detail=original.slice(detailFrom,detailTo);
 if(!detail.includes(image))throw Error('Sprite de detalhe da forja não encontrada.');
 original=original.slice(0,detailFrom)+detail.replace(image,"mhForgeSprite(e.blacksmith.tier,e.blacksmith.masteryLevel??1,'forge-entrance')")+original.slice(detailTo);
 const buyFrom=original.indexOf('function Ux('),buyTo=original.indexOf('function Wx(',buyFrom),buy=original.slice(buyFrom,buyTo);
 original=original.slice(0,buyFrom)+buy.replace('src:W(t),alt:``','src:e.kind===`blacksmith`?mhForgeSpriteUrl(e.tier,1):W(t),alt:``')+original.slice(buyTo);
}
{
 const a=original.indexOf('function oS('),b=original.indexOf('function sS(',a),part=original.slice(a,b).replace('d=a.find(e=>e.id===t?.blacksmithInService)','d=mhForgeFleet(t).length?a[0]:null').replace('f=a.find(e=>e.id!==t?.blacksmithInService)','f=mhForgeFleet(t).length?null:a[0]').replace('TAKE OUT OF SERVICE','PAUSAR TODAS AS FORJAS').replace('PUT IN SERVICE','COLOCAR FORJAS EM SERVIÇO');
 original=original.slice(0,a)+part+original.slice(b);
 const c=original.indexOf('function sS('),d=original.indexOf('function cS(',c),list=original.slice(c,d).replace('s=a===n?','s=o>0&&mhForgeFleet(e).length>0?').replace('String(a===n)','String(o>0&&mhForgeFleet(e).length>0)').replace(/Own as many blacksmiths[^`]+/, 'Todas as forjas possuídas compartilham o serviço e somam suas vagas. Cada herói ocupa uma vaga e recebe a taxa da sua forja. O Ajudante Orc distribui os heróis automaticamente. A XP avança em todas as categorias enquanto as forjas estão em serviço.');
 original=original.slice(0,c)+list+original.slice(d);
}
original=require('./monster-visuals.cjs').addMonsterVariety(original);
original=require('./boss-visuals.cjs').addBossVisuals(original);
original=require('./dungeon-themes.cjs').addDungeonThemes(original);
original=require('./farm-waves.cjs').applyWaveVisuals(original);
fs.copyFileSync('previas-mapas/vampire-idle.png',root+'/build/vampire-idle.png');
for(const skin of ['swordsman','spearman','archer','mage'])fs.copyFileSync('assets/codex-'+skin+'-pixel.png',root+'/build/codex-'+skin+'-pixel.png');
fs.writeFileSync(root+'/build/codex.css',fs.readFileSync('codex.css','utf8')+'\n'+fs.readFileSync('forge.css','utf8'));
fs.copyFileSync('forge.css',root+'/build/forge.css');
fs.copyFileSync('festival.css',root+'/build/festival.css');
fs.copyFileSync('assistant.css',root+'/build/assistant.css');
fs.copyFileSync('pact.css',root+'/build/pact.css');
fs.copyFileSync('equipment.css',root+'/build/equipment.css');
for(const name of ['weapon-atlas-v2.png','pact-backpack.png','weapon-chest-closed.png','quick-action-updates-v2.png','quick-action-ticket-v2.png'])fs.copyFileSync('assets/'+name,root+'/build/'+name);
fs.copyFileSync('assets/weapon-chest.png',root+'/build/weapon-chest.png');
fs.copyFileSync('assets/brasa-do-pacto-conceito.png',root+'/build/brasa-do-pacto.png');
fs.copyFileSync('language.css',root+'/build/language.css');
fs.copyFileSync('login.css',root+'/build/login.css');
fs.copyFileSync('eternal-menus.css',root+'/build/eternal-menus.css');
fs.copyFileSync('assets/pacto-dos-eternos-login.png',root+'/build/pacto-dos-eternos-login.png');
for(const [from,to]of [['assets/pact-seal.png','pact-seal.png'],['assets/pact-book.png','pact-book.png'],['assets/salao-dos-pactos-v1.png','pact-hall.png']])fs.copyFileSync(from,root+'/build/'+to);
fs.copyFileSync('assets/ajudante-personagem.png',root+'/build/ajudante-personagem.png');
fs.copyFileSync('assets/festival-background.png',root+'/build/festival-background.png');
for(let tier=1;tier<=6;tier++)for(let level=1;level<=3;level++)fs.copyFileSync('assets/forjas/forge-'+tier+'-lv'+level+'.png',root+'/build/forge-'+tier+'-lv'+level+'.png');
fs.writeFileSync(root+'/build/skill-progression.css',fs.readFileSync('skill-progression.css','utf8')+'\n'+fs.readFileSync('forge.css','utf8')); 
for(const name of require('./boss-visuals.cjs').bosses)fs.copyFileSync('previas-bosses/'+name+'-idle.png',root+'/build/boss-'+name+'.png');
original=require('./local-economy-ui.cjs').applyLocalEconomy(original);
for(const [from,to]of [['`Porter`','`Ajudante Orc`'],['`PORTER`','`AJUDANTE ORC`'],['`PORTERS`','`AJUDANTES ORC`'],['`Porters owned`','`Ajudantes Orc contratados`'],['`SELL A PORTER`','`VENDER AJUDANTE ORC`'],['`BY PORTER`','`PELO AJUDANTE ORC`']])original=original.replaceAll(from,to);
original=original.replaceAll('Ajudante Orc','Ajudante').replaceAll('AJUDANTE ORC','AJUDANTE').replaceAll('Ajudantes Orc','Ajudantes');
// Scene resets must also dispose of area-effect sprites (fire/ice/electric bursts).
const cleanup='e.impact?.sprite.destroy();this.numbers.clear()';
if(!original.includes(cleanup))throw Error('Não foi possível localizar a limpeza dos efeitos.');
original=original.replace(cleanup,'e.impact?.sprite.destroy(),e.burst?.sprite.destroy();this.numbers.clear()');
fs.copyFileSync('refuge.css',root+'/build/refuge.css');
fs.writeFileSync(root+'/build/campaign.css',fs.readFileSync('campaign.css','utf8')+'\n'+fs.readFileSync('screen-transitions.css','utf8'));
fs.appendFileSync(root+'/build/refuge.css','\n'+fs.readFileSync('screen-transitions.css','utf8'));
for(const name of fs.readdirSync('assets').filter(name=>/^campaign-.*\.png$/.test(name)))fs.copyFileSync('assets/'+name,root+'/build/'+name);
for(const name of fs.readdirSync('assets').filter(name=>/^refuge-.*\.png$/.test(name)))fs.copyFileSync('assets/'+name,root+'/build/'+name);
original=original.replaceAll('Ajudante','Lúmina').replaceAll('AJUDANTE','LÚMINA');
original=require('./hero-config.cjs').scaleSwordsman(original);
fs.copyFileSync('assets/forge-ui-atlas.png',root+'/build/forge-ui-atlas.png');
original=original.replace('e.chest+=r.mhdg-c,','e.chest+=Math.round((r.mhdg-c)*(e.campaignFarmMultiplier??1)*(1+(e.creatureFarmGoldBonus??0))),');
const tutorialClient='var mhTutorialSteps='+JSON.stringify(require('./tutorial-content.cjs'))+';\n'+fs.readFileSync('tutorial-client.js','utf8')+'\n'+fs.readFileSync('farm-waves-client.js','utf8');
fs.copyFileSync('tutorial.css',root+'/build/tutorial.css');
fs.copyFileSync('mobile.css',root+'/build/mobile.css');
fs.copyFileSync('hero-scale.css',root+'/build/hero-scale.css');
const lojaClient=fs.readFileSync('solana-spl-browser.js','utf8')+'\n'+fs.readFileSync('loja-client.js','utf8');
const skillClient=tutorialClient+'\n'+fs.readFileSync('campaign-atb.js','utf8')+'\n'+fs.readFileSync('campaign-atb-vfx.js','utf8')+'\n'+fs.readFileSync('campaign-atb-client.js','utf8')+'\n'+fs.readFileSync('campaign-tactics.js','utf8')+'\n'+fs.readFileSync('campaign-enemies-client.js','utf8')+'\n'+fs.readFileSync('campaign-defense.js','utf8')+'\n'+fs.readFileSync('hero-rarity-client.js','utf8')+'\n'+fs.readFileSync('screen-transitions.js','utf8')+'\n'+fs.readFileSync('refuge-client.js','utf8')+'\n'+fs.readFileSync('equipment-client.js','utf8')+'\n'+fs.readFileSync('language-client.js','utf8')+'\n'+fs.readFileSync('pact-client.js','utf8')+'\n'+fs.readFileSync('assistant-client.js','utf8')+'\n'+fs.readFileSync('shop-fixed-client.js','utf8')+'\n'+fs.readFileSync('forge-client.js','utf8')+'\n'+fs.readFileSync('skill-client.js','utf8');
fs.copyFileSync('loja.css',root+'/build/loja.css');
for(const name of ['loja-store-icon.png','loja-welcome.png','loja-selo.png','loja-arma.png','loja-pacote.png','loja-saco.png'])fs.copyFileSync('assets/'+name,root+'/build/'+name);
const adapter=skillClient+'\nawait mhPrepareHeroRarity();\n'+'\n'+fs.readFileSync('offline-adapter.js','utf8')+'\nmhInstallLanguage();mhInstallScreenTransitions();';
let patched=original.replace('$E(sT);export{Jp as t};',adapter+'\nexport{Jp as t};');
patched=patched.replace('Paid from your wallet, with a studio fee of ${qo(BigInt(_n(fx)))} SOL.','Pago com saldo local fictício. Sem taxas ou carteira.');
patched=patched.replaceAll('Paid from your wallet, with a studio fee of ${qo(BigInt(hn))} SOL.','Pago com saldo local fictício.');
fs.writeFileSync(target,patched);
const shared=skillClient+'\nvar mhReleaseNotes='+JSON.stringify(require('./release-notes.cjs'))+';\nawait mhPrepareHeroRarity();\n'+'\n'+fs.readFileSync('solana-wallet-client.js','utf8')+'\n'+lojaClient+'\n'+fs.readFileSync('campaign-client.js','utf8')+'\n'+fs.readFileSync('shared-adapter.js','utf8').replaceAll('MHDG','Ouro')+'\n'+fs.readFileSync('tower-client.js','utf8')+'\n'+fs.readFileSync('codex-client.js','utf8')+'\n'+fs.readFileSync('festival-client.js','utf8')+'\nmhInstallLanguage();mhInstallScreenTransitions();';
require('./assets/arqueiro/desenhar-arqueiro.cjs').draw(path.join(__dirname,'assets/arqueiro'));
for(const [src,dst] of [['archer-idle.png','archer-idle-P3SxISc4.png'],['archer-walk.png','archer-walk-BSlfYEZv.png'],['archer-attack.png','archer-attack-ClxIWz7r.png']]){
  const from=path.join(__dirname,'assets/arqueiro',src);
  for(const dir of [root+'/build',root+'/shared-build']){
    fs.mkdirSync(dir,{recursive:true});
    fs.copyFileSync(from,path.join(dir,dst));
  }
}
require('./assets/lanceiro/desenhar-lanceiro.cjs').draw(path.join(__dirname,'assets/lanceiro'));
for(const [src,dst] of [['spearman-idle.png','spearman-idle-CJGk46vT.png'],['spearman-walk.png','spearman-walk-BS5M27-3.png'],['spearman-attack.png','spearman-attack-C3GjcOso.png']]){
  const from=path.join(__dirname,'assets/lanceiro',src);
  for(const dir of [root+'/build',root+'/shared-build']){
    fs.mkdirSync(dir,{recursive:true});
    fs.copyFileSync(from,path.join(dir,dst));
  }
}
require('./assets/espadachim/desenhar-espadachim.cjs').draw(path.join(__dirname,'assets/espadachim'));
for(const [src,dst] of [['swordsman-idle.png','swordsman-idle-BZoYeDgg.png'],['swordsman-walk.png','swordsman-walk-DMJTpNDL.png'],['swordsman-attack.png','swordsman-attack-dbN_R6X3.png']]){
  const from=path.join(__dirname,'assets/espadachim',src);
  for(const dir of [root+'/build',root+'/shared-build']){
    fs.mkdirSync(dir,{recursive:true});
    fs.copyFileSync(from,path.join(dir,dst));
  }
}
fs.mkdirSync(root+'/shared-build',{recursive:true});
for(const file of fs.readdirSync(root+'/build'))if(file!=='shared-app.js'&&file!=='app-0-_Askj9.js')fs.copyFileSync(root+'/build/'+file,root+'/shared-build/'+file);
const sharedApp=original.replace('$E(sT);export{Jp as t};',shared+'\nexport{Jp as t};');
if(sharedApp===original||!sharedApp.includes('function installLoja')||!sharedApp.includes("text:'LOJA'")||!sharedApp.includes('hud-loja'))throw Error('O bundle compartilhado ficou sem o botão LOJA. O jogo offline não substitui o shared-build.');
fs.writeFileSync(root+'/shared-build/app-0-_Askj9.js',sharedApp);
let offlineHtml=fs.readFileSync(root+'/index.html','utf8');
if(!offlineHtml.includes('eternal-menus.css'))offlineHtml=offlineHtml.replace('</head>','<link rel="stylesheet" href="./build/eternal-menus.css"></head>');
offlineHtml=offlineHtml.replace(/<title>[^<]*<\/title>/,'<title>Pacto dos Eternos</title>');
if(!offlineHtml.includes('login.css'))offlineHtml=offlineHtml.replace('</head>','<link rel="stylesheet" href="./build/login.css"></head>');
fs.writeFileSync(root+'/index.html',offlineHtml);
if(!offlineHtml.includes('language.css')){offlineHtml=offlineHtml.replace('</head>','<link rel="stylesheet" href="./build/language.css"></head>');fs.writeFileSync(root+'/index.html',offlineHtml);}
if(!offlineHtml.includes('pact.css')){offlineHtml=offlineHtml.replace('</head>','<link rel="stylesheet" href="./build/pact.css"></head>');fs.writeFileSync(root+'/index.html',offlineHtml);}
if(!offlineHtml.includes('assistant.css')){offlineHtml=offlineHtml.replace('</head>','<link rel="stylesheet" href="./build/assistant.css"></head>');fs.writeFileSync(root+'/index.html',offlineHtml);}
if(!offlineHtml.includes('skill-progression.css')){offlineHtml=offlineHtml.replace('</head>','<link rel="stylesheet" href="./build/skill-progression.css"></head>');fs.writeFileSync(root+'/index.html',offlineHtml);}
if(!offlineHtml.includes('equipment.css')){offlineHtml=offlineHtml.replace('</head>','<link rel="stylesheet" href="./build/equipment.css"></head>');fs.writeFileSync(root+'/index.html',offlineHtml);}
let html=offlineHtml.replaceAll('./build/','./shared-build/').replace('</head>','<link rel="stylesheet" href="/shared.css"><link rel="stylesheet" href="/shared-build/codex.css"><link rel="stylesheet" href="/shared-build/festival.css"><link rel="stylesheet" href="/shared-build/refuge.css"></head>');
html=html.replace('</head>','<link rel="stylesheet" href="/shared-build/campaign.css"><link rel="stylesheet" href="/shared-build/tutorial.css"><link rel="stylesheet" href="/shared-build/mobile.css"><link rel="stylesheet" href="/shared-build/loja.css"></head>');
fs.writeFileSync(root+'/compartilhado.html',html);
console.log('Adaptador offline instalado.');

// Keep the approved campaign map packaged with every game build.
require('./preparar-previa-reino.cjs');
require('./preparar-previa-raridades.cjs');

for(const name of fs.readdirSync(path.join(__dirname,'assets/campaign-bestiary')).filter(n=>/^enemy-.*\.png$/.test(n))){for(const dir of ['minihero-offline/build','minihero-offline/shared-build'])fs.copyFileSync(path.join(__dirname,'assets/campaign-bestiary',name),path.join(__dirname,dir,name));}
fs.copyFileSync('assets/campaign-bestiary/bestiario.html','minihero-offline/shared-build/bestiario.html');
fs.copyFileSync('assets/campaign-bestiary/forest-pixel-preview.html','minihero-offline/shared-build/forest-pixel-preview.html');
fs.copyFileSync('assets/campaign-bestiary/bestiario-pixel.js','minihero-offline/shared-build/bestiario-pixel.js');

for(const name of fs.readdirSync('assets/battle-arenas').filter(n=>/^battle-arena-.*\.png$/.test(n)))for(const dir of ['minihero-offline/build','minihero-offline/shared-build'])fs.copyFileSync('assets/battle-arenas/'+name,dir+'/'+name);
require('./otimizar-assets.cjs').optimizeAssets(path.join(__dirname,'minihero-offline/shared-build'));
for(const file of [root+'/build/app-0-_Askj9.js',root+'/shared-build/app-0-_Askj9.js'])require('./ofuscar-cliente.cjs').obfuscateFile(path.join(__dirname,file));
const shipped=fs.readFileSync(root+'/shared-build/app-0-_Askj9.js','utf8');
if(!shipped.includes('hud-loja')||!shipped.includes('LOJA DOS ETERNOS')||!shipped.includes('loja-saco.png')||shipped.includes('hudAllowed'))throw Error('A ofuscação do shared-build removeu o botão LOJA.');
if(!shipped.includes('38/27')||!shipped.includes('76/27'))throw Error('A ofuscação removeu a escala do espadachim.');
if(!shipped.includes('/shared-api/loja/rpc')||shipped.includes('order.rpc')||shipped.includes('api.mainnet-beta.solana.com'))throw Error('O cliente da loja ainda chama o RPC da Solana direto.');
const page=fs.readFileSync(root+'/compartilhado.html','utf8');
if(!page.includes('./shared-build/app-0-_Askj9.js')||!page.includes('/shared-build/loja.css'))throw Error('compartilhado.html não aponta para o shared-build da loja.');
if(page.includes('farm-preview')||page.includes('PRÉVIA FARM')||offlineHtml.includes('farm-preview'))throw Error('A prévia top-down do farm voltou para o HTML do jogo.');
if(fs.readFileSync(root+'/build/app-0-_Askj9.js','utf8').includes('function installLoja'))throw Error('O bundle offline recebeu a loja do modo compartilhado.');
