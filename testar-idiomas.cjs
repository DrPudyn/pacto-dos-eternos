const assert=require('assert/strict'),vm=require('vm'),fs=require('fs');
function load(saved){return vm.runInNewContext(fs.readFileSync('language-client.js','utf8')+'\n({translate:mhTranslate,language:mhLanguage});',{localStorage:{getItem:()=>saved},console});}
const pt=load(null),en=load('en');
assert.equal(pt.language,'pt-BR');assert.equal(en.language,'en');
assert.equal(pt.translate('SETTINGS'),'CONFIGURAÇÕES');assert.equal(en.translate('CONFIGURAÇÕES'),'SETTINGS');
assert.equal(pt.translate('Summon 15'),'INVOCAR 15');assert.equal(en.translate('15 de 15 heróis revelados'),'15 of 15 heroes revealed');
assert.equal(en.translate('+55 de ataque contra bosses.'),'+55 attack against bosses.');
assert.equal(en.translate('Você está 39 de Power abaixo do início da semana. Recupere essa diferença; o que superar o valor inicial entra no ranking.'),'You are 39 Power below your weekly starting value. Recover this difference; any gain above the starting value counts toward the ranking.');
for(const s of ['JUKA','QA Jogador','#958','1.234 / 5.678 XP'])assert.equal(en.translate(s),s);
assert.equal(pt.translate('  Heroes  '),'  Heróis  ');assert.equal(en.translate('Forja do Dragão'),'Dragon Forge');
console.log('OK idiomas: preferência salva, português/inglês, caixa e espaços, contadores, skills, Power e nomes/valores preservados.');
