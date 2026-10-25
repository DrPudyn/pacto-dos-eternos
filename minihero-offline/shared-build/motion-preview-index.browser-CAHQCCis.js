import{r as e,t}from"./motion-preview-rolldown-runtime-hePW80VL.js";import{SolanaMobileWalletAdapterError as n,SolanaMobileWalletAdapterErrorCode as r,i,n as a,r as o,startNostrScenario as s,startRemoteScenario as c,startScenario as l,t as u}from"./motion-preview-index.browser--XielK_G.js";var d=`solana:mainnet`,f=function(e,t,n,r){if(n===`a`&&!r)throw TypeError(`Private accessor was defined without a getter`);if(typeof t==`function`?e!==t||!r:!t.has(e))throw TypeError(`Cannot read private member from an object whose class did not declare it`);return n===`m`?r:n===`a`?r.call(e):r?r.value:t.get(e)},p=function(e,t,n,r,i){if(r===`m`)throw TypeError(`Private method is not writable`);if(r===`a`&&!i)throw TypeError(`Private accessor was defined without a setter`);if(typeof t==`function`?e!==t||!i:!t.has(e))throw TypeError(`Cannot write private member to an object whose class did not declare it`);return r===`a`?i.call(e,n):i?i.value=n:t.set(e,n),n},m;function h(e){let t=({register:t})=>t(e);try{window.dispatchEvent(new g(t))}catch(e){console.error(`wallet-standard:register-wallet event could not be dispatched
`,e)}try{window.addEventListener(`wallet-standard:app-ready`,({detail:e})=>t(e))}catch(e){console.error(`wallet-standard:app-ready event listener could not be added
`,e)}}var g=class extends Event{get detail(){return f(this,m,`f`)}get type(){return`wallet-standard:register-wallet`}constructor(e){super(`wallet-standard:register-wallet`,{bubbles:!1,cancelable:!1,composed:!1}),m.set(this,void 0),p(this,m,e,`f`)}preventDefault(){throw Error(`preventDefault cannot be called`)}stopImmediatePropagation(){throw Error(`stopImmediatePropagation cannot be called`)}stopPropagation(){throw Error(`stopPropagation cannot be called`)}};m=new WeakMap;var _=`solana:signAndSendTransaction`,v=`solana:signIn`,y=`solana:signMessage`,b=`solana:signTransaction`,x=`standard:connect`,S=`standard:disconnect`,C=`standard:events`,ee=t(((e,t)=>{t.exports=function(){return typeof Promise==`function`&&Promise.prototype&&Promise.prototype.then}})),w=t((e=>{var t,n=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706];e.getSymbolSize=function(e){if(!e)throw Error(`"version" cannot be null or undefined`);if(e<1||e>40)throw Error(`"version" should be in range from 1 to 40`);return e*4+17},e.getSymbolTotalCodewords=function(e){return n[e]},e.getBCHDigit=function(e){let t=0;for(;e!==0;)t++,e>>>=1;return t},e.setToSJISFunction=function(e){if(typeof e!=`function`)throw Error(`"toSJISFunc" is not a valid function.`);t=e},e.isKanjiModeEnabled=function(){return t!==void 0},e.toSJIS=function(e){return t(e)}})),T=t((e=>{e.L={bit:1},e.M={bit:0},e.Q={bit:3},e.H={bit:2};function t(t){if(typeof t!=`string`)throw Error(`Param is not a string`);switch(t.toLowerCase()){case`l`:case`low`:return e.L;case`m`:case`medium`:return e.M;case`q`:case`quartile`:return e.Q;case`h`:case`high`:return e.H;default:throw Error(`Unknown EC Level: `+t)}}e.isValid=function(e){return e&&e.bit!==void 0&&e.bit>=0&&e.bit<4},e.from=function(n,r){if(e.isValid(n))return n;try{return t(n)}catch{return r}}})),E=t(((e,t)=>{function n(){this.buffer=[],this.length=0}n.prototype={get:function(e){let t=Math.floor(e/8);return(this.buffer[t]>>>7-e%8&1)==1},put:function(e,t){for(let n=0;n<t;n++)this.putBit((e>>>t-n-1&1)==1)},getLengthInBits:function(){return this.length},putBit:function(e){let t=Math.floor(this.length/8);this.buffer.length<=t&&this.buffer.push(0),e&&(this.buffer[t]|=128>>>this.length%8),this.length++}},t.exports=n})),te=t(((e,t)=>{function n(e){if(!e||e<1)throw Error(`BitMatrix size must be defined and greater than 0`);this.size=e,this.data=new Uint8Array(e*e),this.reservedBit=new Uint8Array(e*e)}n.prototype.set=function(e,t,n,r){let i=e*this.size+t;this.data[i]=n,r&&(this.reservedBit[i]=!0)},n.prototype.get=function(e,t){return this.data[e*this.size+t]},n.prototype.xor=function(e,t,n){this.data[e*this.size+t]^=n},n.prototype.isReserved=function(e,t){return this.reservedBit[e*this.size+t]},t.exports=n})),ne=t((e=>{var t=w().getSymbolSize;e.getRowColCoords=function(e){if(e===1)return[];let n=Math.floor(e/7)+2,r=t(e),i=r===145?26:Math.ceil((r-13)/(2*n-2))*2,a=[r-7];for(let e=1;e<n-1;e++)a[e]=a[e-1]-i;return a.push(6),a.reverse()},e.getPositions=function(t){let n=[],r=e.getRowColCoords(t),i=r.length;for(let e=0;e<i;e++)for(let t=0;t<i;t++)e===0&&t===0||e===0&&t===i-1||e===i-1&&t===0||n.push([r[e],r[t]]);return n}})),re=t((e=>{var t=w().getSymbolSize,n=7;e.getPositions=function(e){let r=t(e);return[[0,0],[r-n,0],[0,r-n]]}})),ie=t((e=>{e.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};var t={N1:3,N2:3,N3:40,N4:10};e.isValid=function(e){return e!=null&&e!==``&&!isNaN(e)&&e>=0&&e<=7},e.from=function(t){return e.isValid(t)?parseInt(t,10):void 0},e.getPenaltyN1=function(e){let n=e.size,r=0,i=0,a=0,o=null,s=null;for(let c=0;c<n;c++){i=a=0,o=s=null;for(let l=0;l<n;l++){let n=e.get(c,l);n===o?i++:(i>=5&&(r+=t.N1+(i-5)),o=n,i=1),n=e.get(l,c),n===s?a++:(a>=5&&(r+=t.N1+(a-5)),s=n,a=1)}i>=5&&(r+=t.N1+(i-5)),a>=5&&(r+=t.N1+(a-5))}return r},e.getPenaltyN2=function(e){let n=e.size,r=0;for(let t=0;t<n-1;t++)for(let i=0;i<n-1;i++){let n=e.get(t,i)+e.get(t,i+1)+e.get(t+1,i)+e.get(t+1,i+1);(n===4||n===0)&&r++}return r*t.N2},e.getPenaltyN3=function(e){let n=e.size,r=0,i=0,a=0;for(let t=0;t<n;t++){i=a=0;for(let o=0;o<n;o++)i=i<<1&2047|e.get(t,o),o>=10&&(i===1488||i===93)&&r++,a=a<<1&2047|e.get(o,t),o>=10&&(a===1488||a===93)&&r++}return r*t.N3},e.getPenaltyN4=function(e){let n=0,r=e.data.length;for(let t=0;t<r;t++)n+=e.data[t];return Math.abs(Math.ceil(n*100/r/5)-10)*t.N4};function n(t,n,r){switch(t){case e.Patterns.PATTERN000:return(n+r)%2==0;case e.Patterns.PATTERN001:return n%2==0;case e.Patterns.PATTERN010:return r%3==0;case e.Patterns.PATTERN011:return(n+r)%3==0;case e.Patterns.PATTERN100:return(Math.floor(n/2)+Math.floor(r/3))%2==0;case e.Patterns.PATTERN101:return n*r%2+n*r%3==0;case e.Patterns.PATTERN110:return(n*r%2+n*r%3)%2==0;case e.Patterns.PATTERN111:return(n*r%3+(n+r)%2)%2==0;default:throw Error(`bad maskPattern:`+t)}}e.applyMask=function(e,t){let r=t.size;for(let i=0;i<r;i++)for(let a=0;a<r;a++)t.isReserved(a,i)||t.xor(a,i,n(e,a,i))},e.getBestMask=function(t,n){let r=Object.keys(e.Patterns).length,i=0,a=1/0;for(let o=0;o<r;o++){n(o),e.applyMask(o,t);let r=e.getPenaltyN1(t)+e.getPenaltyN2(t)+e.getPenaltyN3(t)+e.getPenaltyN4(t);e.applyMask(o,t),r<a&&(a=r,i=o)}return i}})),D=t((e=>{var t=T(),n=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],r=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430];e.getBlocksCount=function(e,r){switch(r){case t.L:return n[(e-1)*4+0];case t.M:return n[(e-1)*4+1];case t.Q:return n[(e-1)*4+2];case t.H:return n[(e-1)*4+3];default:return}},e.getTotalCodewordsCount=function(e,n){switch(n){case t.L:return r[(e-1)*4+0];case t.M:return r[(e-1)*4+1];case t.Q:return r[(e-1)*4+2];case t.H:return r[(e-1)*4+3];default:return}}})),ae=t((e=>{var t=new Uint8Array(512),n=new Uint8Array(256);(function(){let e=1;for(let r=0;r<255;r++)t[r]=e,n[e]=r,e<<=1,e&256&&(e^=285);for(let e=255;e<512;e++)t[e]=t[e-255]})(),e.log=function(e){if(e<1)throw Error(`log(`+e+`)`);return n[e]},e.exp=function(e){return t[e]},e.mul=function(e,r){return e===0||r===0?0:t[n[e]+n[r]]}})),oe=t((e=>{var t=ae();e.mul=function(e,n){let r=new Uint8Array(e.length+n.length-1);for(let i=0;i<e.length;i++)for(let a=0;a<n.length;a++)r[i+a]^=t.mul(e[i],n[a]);return r},e.mod=function(e,n){let r=new Uint8Array(e);for(;r.length-n.length>=0;){let e=r[0];for(let i=0;i<n.length;i++)r[i]^=t.mul(n[i],e);let i=0;for(;i<r.length&&r[i]===0;)i++;r=r.slice(i)}return r},e.generateECPolynomial=function(n){let r=new Uint8Array([1]);for(let i=0;i<n;i++)r=e.mul(r,new Uint8Array([1,t.exp(i)]));return r}})),O=t(((e,t)=>{var n=oe();function r(e){this.genPoly=void 0,this.degree=e,this.degree&&this.initialize(this.degree)}r.prototype.initialize=function(e){this.degree=e,this.genPoly=n.generateECPolynomial(this.degree)},r.prototype.encode=function(e){if(!this.genPoly)throw Error(`Encoder not initialized`);let t=new Uint8Array(e.length+this.degree);t.set(e);let r=n.mod(t,this.genPoly),i=this.degree-r.length;if(i>0){let e=new Uint8Array(this.degree);return e.set(r,i),e}return r},t.exports=r})),k=t((e=>{e.isValid=function(e){return!isNaN(e)&&e>=1&&e<=40}})),A=t((e=>{var t=`[0-9]+`,n=`[A-Z $%*+\\-./:]+`,r=`(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+`;r=r.replace(/u/g,`\\u`);var i=`(?:(?![A-Z0-9 $%*+\\-./:]|`+r+`)(?:.|[\r
]))+`;e.KANJI=new RegExp(r,`g`),e.BYTE_KANJI=RegExp(`[^A-Z0-9 $%*+\\-./:]+`,`g`),e.BYTE=new RegExp(i,`g`),e.NUMERIC=new RegExp(t,`g`),e.ALPHANUMERIC=new RegExp(n,`g`);var a=RegExp(`^`+r+`$`),o=RegExp(`^[0-9]+$`),s=RegExp(`^[A-Z0-9 $%*+\\-./:]+$`);e.testKanji=function(e){return a.test(e)},e.testNumeric=function(e){return o.test(e)},e.testAlphanumeric=function(e){return s.test(e)}})),j=t((e=>{var t=k(),n=A();e.NUMERIC={id:`Numeric`,bit:1,ccBits:[10,12,14]},e.ALPHANUMERIC={id:`Alphanumeric`,bit:2,ccBits:[9,11,13]},e.BYTE={id:`Byte`,bit:4,ccBits:[8,16,16]},e.KANJI={id:`Kanji`,bit:8,ccBits:[8,10,12]},e.MIXED={bit:-1},e.getCharCountIndicator=function(e,n){if(!e.ccBits)throw Error(`Invalid mode: `+e);if(!t.isValid(n))throw Error(`Invalid version: `+n);return n>=1&&n<10?e.ccBits[0]:n<27?e.ccBits[1]:e.ccBits[2]},e.getBestModeForData=function(t){return n.testNumeric(t)?e.NUMERIC:n.testAlphanumeric(t)?e.ALPHANUMERIC:n.testKanji(t)?e.KANJI:e.BYTE},e.toString=function(e){if(e&&e.id)return e.id;throw Error(`Invalid mode`)},e.isValid=function(e){return e&&e.bit&&e.ccBits};function r(t){if(typeof t!=`string`)throw Error(`Param is not a string`);switch(t.toLowerCase()){case`numeric`:return e.NUMERIC;case`alphanumeric`:return e.ALPHANUMERIC;case`kanji`:return e.KANJI;case`byte`:return e.BYTE;default:throw Error(`Unknown mode: `+t)}}e.from=function(t,n){if(e.isValid(t))return t;try{return r(t)}catch{return n}}})),se=t((e=>{var t=w(),n=D(),r=T(),i=j(),a=k(),o=7973,s=t.getBCHDigit(o);function c(t,n,r){for(let i=1;i<=40;i++)if(n<=e.getCapacity(i,r,t))return i}function l(e,t){return i.getCharCountIndicator(e,t)+4}function u(e,t){let n=0;return e.forEach(function(e){let r=l(e.mode,t);n+=r+e.getBitsLength()}),n}function d(t,n){for(let r=1;r<=40;r++)if(u(t,r)<=e.getCapacity(r,n,i.MIXED))return r}e.from=function(e,t){return a.isValid(e)?parseInt(e,10):t},e.getCapacity=function(e,r,o){if(!a.isValid(e))throw Error(`Invalid QR Code version`);o===void 0&&(o=i.BYTE);let s=(t.getSymbolTotalCodewords(e)-n.getTotalCodewordsCount(e,r))*8;if(o===i.MIXED)return s;let c=s-l(o,e);switch(o){case i.NUMERIC:return Math.floor(c/10*3);case i.ALPHANUMERIC:return Math.floor(c/11*2);case i.KANJI:return Math.floor(c/13);case i.BYTE:default:return Math.floor(c/8)}},e.getBestVersionForData=function(e,t){let n,i=r.from(t,r.M);if(Array.isArray(e)){if(e.length>1)return d(e,i);if(e.length===0)return 1;n=e[0]}else n=e;return c(n.mode,n.getLength(),i)},e.getEncodedBits=function(e){if(!a.isValid(e)||e<7)throw Error(`Invalid QR Code version`);let n=e<<12;for(;t.getBCHDigit(n)-s>=0;)n^=o<<t.getBCHDigit(n)-s;return e<<12|n}})),ce=t((e=>{var t=w(),n=1335,r=21522,i=t.getBCHDigit(n);e.getEncodedBits=function(e,a){let o=e.bit<<3|a,s=o<<10;for(;t.getBCHDigit(s)-i>=0;)s^=n<<t.getBCHDigit(s)-i;return(o<<10|s)^r}})),le=t(((e,t)=>{var n=j();function r(e){this.mode=n.NUMERIC,this.data=e.toString()}r.getBitsLength=function(e){return 10*Math.floor(e/3)+(e%3?e%3*3+1:0)},r.prototype.getLength=function(){return this.data.length},r.prototype.getBitsLength=function(){return r.getBitsLength(this.data.length)},r.prototype.write=function(e){let t,n,r;for(t=0;t+3<=this.data.length;t+=3)n=this.data.substr(t,3),r=parseInt(n,10),e.put(r,10);let i=this.data.length-t;i>0&&(n=this.data.substr(t),r=parseInt(n,10),e.put(r,i*3+1))},t.exports=r})),ue=t(((e,t)=>{var n=j(),r=`0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:`.split(``);function i(e){this.mode=n.ALPHANUMERIC,this.data=e}i.getBitsLength=function(e){return 11*Math.floor(e/2)+e%2*6},i.prototype.getLength=function(){return this.data.length},i.prototype.getBitsLength=function(){return i.getBitsLength(this.data.length)},i.prototype.write=function(e){let t=0;for(;t+2<=this.data.length;t+=2){let n=r.indexOf(this.data[t])*45;n+=r.indexOf(this.data[t+1]),e.put(n,11)}this.data.length%2&&e.put(r.indexOf(this.data[t]),6)},t.exports=i})),de=t(((e,t)=>{var n=j();function r(e){this.mode=n.BYTE,this.data=typeof e==`string`?new TextEncoder().encode(e):new Uint8Array(e)}r.getBitsLength=function(e){return e*8},r.prototype.getLength=function(){return this.data.length},r.prototype.getBitsLength=function(){return r.getBitsLength(this.data.length)},r.prototype.write=function(e){for(let t=0,n=this.data.length;t<n;t++)e.put(this.data[t],8)},t.exports=r})),fe=t(((e,t)=>{var n=j(),r=w();function i(e){this.mode=n.KANJI,this.data=e}i.getBitsLength=function(e){return e*13},i.prototype.getLength=function(){return this.data.length},i.prototype.getBitsLength=function(){return i.getBitsLength(this.data.length)},i.prototype.write=function(e){let t=0;for(;t<this.data.length;t++){let n=r.toSJIS(this.data[t]);if(n>=33088&&n<=40956)n-=33088;else if(n>=57408&&n<=60351)n-=49472;else throw Error(`Invalid SJIS character: `+this.data[t]+`
Make sure your charset is UTF-8`);n=(n>>>8&255)*192+(n&255),e.put(n,13)}},t.exports=i})),M=t(((e,t)=>{var n={single_source_shortest_paths:function(e,t,r){var i={},a={};a[t]=0;var o=n.PriorityQueue.make();o.push(t,0);for(var s,c,l,u,d,f,p,m,h;!o.empty();)for(l in s=o.pop(),c=s.value,u=s.cost,d=e[c]||{},d)d.hasOwnProperty(l)&&(f=d[l],p=u+f,m=a[l],h=a[l]===void 0,(h||m>p)&&(a[l]=p,o.push(l,p),i[l]=c));if(r!==void 0&&a[r]===void 0){var g=[`Could not find a path from `,t,` to `,r,`.`].join(``);throw Error(g)}return i},extract_shortest_path_from_predecessor_list:function(e,t){for(var n=[],r=t;r;)n.push(r),e[r],r=e[r];return n.reverse(),n},find_path:function(e,t,r){var i=n.single_source_shortest_paths(e,t,r);return n.extract_shortest_path_from_predecessor_list(i,r)},PriorityQueue:{make:function(e){var t=n.PriorityQueue,r={},i;for(i in e||={},t)t.hasOwnProperty(i)&&(r[i]=t[i]);return r.queue=[],r.sorter=e.sorter||t.default_sorter,r},default_sorter:function(e,t){return e.cost-t.cost},push:function(e,t){var n={value:e,cost:t};this.queue.push(n),this.queue.sort(this.sorter)},pop:function(){return this.queue.shift()},empty:function(){return this.queue.length===0}}};t!==void 0&&(t.exports=n)})),N=t((e=>{var t=j(),n=le(),r=ue(),i=de(),a=fe(),o=A(),s=w(),c=M();function l(e){return unescape(encodeURIComponent(e)).length}function u(e,t,n){let r=[],i;for(;(i=e.exec(n))!==null;)r.push({data:i[0],index:i.index,mode:t,length:i[0].length});return r}function d(e){let n=u(o.NUMERIC,t.NUMERIC,e),r=u(o.ALPHANUMERIC,t.ALPHANUMERIC,e),i,a;return s.isKanjiModeEnabled()?(i=u(o.BYTE,t.BYTE,e),a=u(o.KANJI,t.KANJI,e)):(i=u(o.BYTE_KANJI,t.BYTE,e),a=[]),n.concat(r,i,a).sort(function(e,t){return e.index-t.index}).map(function(e){return{data:e.data,mode:e.mode,length:e.length}})}function f(e,o){switch(o){case t.NUMERIC:return n.getBitsLength(e);case t.ALPHANUMERIC:return r.getBitsLength(e);case t.KANJI:return a.getBitsLength(e);case t.BYTE:return i.getBitsLength(e)}}function p(e){return e.reduce(function(e,t){let n=e.length-1>=0?e[e.length-1]:null;return n&&n.mode===t.mode?(e[e.length-1].data+=t.data,e):(e.push(t),e)},[])}function m(e){let n=[];for(let r=0;r<e.length;r++){let i=e[r];switch(i.mode){case t.NUMERIC:n.push([i,{data:i.data,mode:t.ALPHANUMERIC,length:i.length},{data:i.data,mode:t.BYTE,length:i.length}]);break;case t.ALPHANUMERIC:n.push([i,{data:i.data,mode:t.BYTE,length:i.length}]);break;case t.KANJI:n.push([i,{data:i.data,mode:t.BYTE,length:l(i.data)}]);break;case t.BYTE:n.push([{data:i.data,mode:t.BYTE,length:l(i.data)}])}}return n}function h(e,n){let r={},i={start:{}},a=[`start`];for(let o=0;o<e.length;o++){let s=e[o],c=[];for(let e=0;e<s.length;e++){let l=s[e],u=``+o+e;c.push(u),r[u]={node:l,lastCount:0},i[u]={};for(let e=0;e<a.length;e++){let o=a[e];r[o]&&r[o].node.mode===l.mode?(i[o][u]=f(r[o].lastCount+l.length,l.mode)-f(r[o].lastCount,l.mode),r[o].lastCount+=l.length):(r[o]&&(r[o].lastCount=l.length),i[o][u]=f(l.length,l.mode)+4+t.getCharCountIndicator(l.mode,n))}}a=c}for(let e=0;e<a.length;e++)i[a[e]].end=0;return{map:i,table:r}}function g(e,o){let c,l=t.getBestModeForData(e);if(c=t.from(o,l),c!==t.BYTE&&c.bit<l.bit)throw Error(`"`+e+`" cannot be encoded with mode `+t.toString(c)+`.
 Suggested mode is: `+t.toString(l));switch(c===t.KANJI&&!s.isKanjiModeEnabled()&&(c=t.BYTE),c){case t.NUMERIC:return new n(e);case t.ALPHANUMERIC:return new r(e);case t.KANJI:return new a(e);case t.BYTE:return new i(e)}}e.fromArray=function(e){return e.reduce(function(e,t){return typeof t==`string`?e.push(g(t,null)):t.data&&e.push(g(t.data,t.mode)),e},[])},e.fromString=function(t,n){let r=h(m(d(t,s.isKanjiModeEnabled())),n),i=c.find_path(r.map,`start`,`end`),a=[];for(let e=1;e<i.length-1;e++)a.push(r.table[i[e]].node);return e.fromArray(p(a))},e.rawSplit=function(t){return e.fromArray(d(t,s.isKanjiModeEnabled()))}})),P=t((e=>{var t=w(),n=T(),r=E(),i=te(),a=ne(),o=re(),s=ie(),c=D(),l=O(),u=se(),d=ce(),f=j(),p=N();function m(e,t){let n=e.size,r=o.getPositions(t);for(let t=0;t<r.length;t++){let i=r[t][0],a=r[t][1];for(let t=-1;t<=7;t++)if(!(i+t<=-1||n<=i+t))for(let r=-1;r<=7;r++)a+r<=-1||n<=a+r||(t>=0&&t<=6&&(r===0||r===6)||r>=0&&r<=6&&(t===0||t===6)||t>=2&&t<=4&&r>=2&&r<=4?e.set(i+t,a+r,!0,!0):e.set(i+t,a+r,!1,!0))}}function h(e){let t=e.size;for(let n=8;n<t-8;n++){let t=n%2==0;e.set(n,6,t,!0),e.set(6,n,t,!0)}}function g(e,t){let n=a.getPositions(t);for(let t=0;t<n.length;t++){let r=n[t][0],i=n[t][1];for(let t=-2;t<=2;t++)for(let n=-2;n<=2;n++)t===-2||t===2||n===-2||n===2||t===0&&n===0?e.set(r+t,i+n,!0,!0):e.set(r+t,i+n,!1,!0)}}function _(e,t){let n=e.size,r=u.getEncodedBits(t),i,a,o;for(let t=0;t<18;t++)i=Math.floor(t/3),a=t%3+n-8-3,o=(r>>t&1)==1,e.set(i,a,o,!0),e.set(a,i,o,!0)}function v(e,t,n){let r=e.size,i=d.getEncodedBits(t,n),a,o;for(a=0;a<15;a++)o=(i>>a&1)==1,a<6?e.set(a,8,o,!0):a<8?e.set(a+1,8,o,!0):e.set(r-15+a,8,o,!0),a<8?e.set(8,r-a-1,o,!0):a<9?e.set(8,15-a-1+1,o,!0):e.set(8,15-a-1,o,!0);e.set(r-8,8,1,!0)}function y(e,t){let n=e.size,r=-1,i=n-1,a=7,o=0;for(let s=n-1;s>0;s-=2)for(s===6&&s--;;){for(let n=0;n<2;n++)if(!e.isReserved(i,s-n)){let r=!1;o<t.length&&(r=(t[o]>>>a&1)==1),e.set(i,s-n,r),a--,a===-1&&(o++,a=7)}if(i+=r,i<0||n<=i){i-=r,r=-r;break}}}function b(e,n,i){let a=new r;i.forEach(function(t){a.put(t.mode.bit,4),a.put(t.getLength(),f.getCharCountIndicator(t.mode,e)),t.write(a)});let o=(t.getSymbolTotalCodewords(e)-c.getTotalCodewordsCount(e,n))*8;for(a.getLengthInBits()+4<=o&&a.put(0,4);a.getLengthInBits()%8!=0;)a.putBit(0);let s=(o-a.getLengthInBits())/8;for(let e=0;e<s;e++)a.put(e%2?17:236,8);return x(a,e,n)}function x(e,n,r){let i=t.getSymbolTotalCodewords(n),a=i-c.getTotalCodewordsCount(n,r),o=c.getBlocksCount(n,r),s=o-i%o,u=Math.floor(i/o),d=Math.floor(a/o),f=d+1,p=u-d,m=new l(p),h=0,g=Array(o),_=Array(o),v=0,y=new Uint8Array(e.buffer);for(let e=0;e<o;e++){let t=e<s?d:f;g[e]=y.slice(h,h+t),_[e]=m.encode(g[e]),h+=t,v=Math.max(v,t)}let b=new Uint8Array(i),x=0,S,C;for(S=0;S<v;S++)for(C=0;C<o;C++)S<g[C].length&&(b[x++]=g[C][S]);for(S=0;S<p;S++)for(C=0;C<o;C++)b[x++]=_[C][S];return b}function S(e,n,r,a){let o;if(Array.isArray(e))o=p.fromArray(e);else if(typeof e==`string`){let t=n;if(!t){let n=p.rawSplit(e);t=u.getBestVersionForData(n,r)}o=p.fromString(e,t||40)}else throw Error(`Invalid data`);let c=u.getBestVersionForData(o,r);if(!c)throw Error(`The amount of data is too big to be stored in a QR Code`);if(!n)n=c;else if(n<c)throw Error(`
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: `+c+`.
`);let l=b(n,r,o),d=new i(t.getSymbolSize(n));return m(d,n),h(d),g(d,n),v(d,r,0),n>=7&&_(d,n),y(d,l),isNaN(a)&&(a=s.getBestMask(d,v.bind(null,d,r))),s.applyMask(a,d),v(d,r,a),{modules:d,version:n,errorCorrectionLevel:r,maskPattern:a,segments:o}}e.create=function(e,r){if(e===void 0||e===``)throw Error(`No input text`);let i=n.M,a,o;return r!==void 0&&(i=n.from(r.errorCorrectionLevel,n.M),a=u.from(r.version),o=s.from(r.maskPattern),r.toSJISFunc&&t.setToSJISFunction(r.toSJISFunc)),S(e,a,i,o)}})),F=t((e=>{function t(e){if(typeof e==`number`&&(e=e.toString()),typeof e!=`string`)throw Error(`Color should be defined as hex string`);let t=e.slice().replace(`#`,``).split(``);if(t.length<3||t.length===5||t.length>8)throw Error(`Invalid hex color: `+e);(t.length===3||t.length===4)&&(t=Array.prototype.concat.apply([],t.map(function(e){return[e,e]}))),t.length===6&&t.push(`F`,`F`);let n=parseInt(t.join(``),16);return{r:n>>24&255,g:n>>16&255,b:n>>8&255,a:n&255,hex:`#`+t.slice(0,6).join(``)}}e.getOptions=function(e){e||={},e.color||(e.color={});let n=e.margin===void 0||e.margin===null||e.margin<0?4:e.margin,r=e.width&&e.width>=21?e.width:void 0,i=e.scale||4;return{width:r,scale:r?4:i,margin:n,color:{dark:t(e.color.dark||`#000000ff`),light:t(e.color.light||`#ffffffff`)},type:e.type,rendererOpts:e.rendererOpts||{}}},e.getScale=function(e,t){return t.width&&t.width>=e+t.margin*2?t.width/(e+t.margin*2):t.scale},e.getImageWidth=function(t,n){let r=e.getScale(t,n);return Math.floor((t+n.margin*2)*r)},e.qrToImageData=function(t,n,r){let i=n.modules.size,a=n.modules.data,o=e.getScale(i,r),s=Math.floor((i+r.margin*2)*o),c=r.margin*o,l=[r.color.light,r.color.dark];for(let e=0;e<s;e++)for(let n=0;n<s;n++){let u=(e*s+n)*4,d=r.color.light;if(e>=c&&n>=c&&e<s-c&&n<s-c){let t=Math.floor((e-c)/o),r=Math.floor((n-c)/o);d=l[+!!a[t*i+r]]}t[u++]=d.r,t[u++]=d.g,t[u++]=d.b,t[u]=d.a}}})),I=t((e=>{var t=F();function n(e,t,n){e.clearRect(0,0,t.width,t.height),t.style||={},t.height=n,t.width=n,t.style.height=n+`px`,t.style.width=n+`px`}function r(){try{return document.createElement(`canvas`)}catch{throw Error(`You need to specify a canvas element`)}}e.render=function(e,i,a){let o=a,s=i;o===void 0&&(!i||!i.getContext)&&(o=i,i=void 0),i||(s=r()),o=t.getOptions(o);let c=t.getImageWidth(e.modules.size,o),l=s.getContext(`2d`),u=l.createImageData(c,c);return t.qrToImageData(u.data,e,o),n(l,s,c),l.putImageData(u,0,0),s},e.renderToDataURL=function(t,n,r){let i=r;i===void 0&&(!n||!n.getContext)&&(i=n,n=void 0),i||={};let a=e.render(t,n,i),o=i.type||`image/png`,s=i.rendererOpts||{};return a.toDataURL(o,s.quality)}})),L=t((e=>{var t=F();function n(e,t){let n=e.a/255,r=t+`="`+e.hex+`"`;return n<1?r+` `+t+`-opacity="`+n.toFixed(2).slice(1)+`"`:r}function r(e,t,n){let r=e+t;return n!==void 0&&(r+=` `+n),r}function i(e,t,n){let i=``,a=0,o=!1,s=0;for(let c=0;c<e.length;c++){let l=Math.floor(c%t),u=Math.floor(c/t);!l&&!o&&(o=!0),e[c]?(s++,c>0&&l>0&&e[c-1]||(i+=o?r(`M`,l+n,.5+u+n):r(`m`,a,0),a=0,o=!1),l+1<t&&e[c+1]||(i+=r(`h`,s),s=0)):a++}return i}e.render=function(e,r,a){let o=t.getOptions(r),s=e.modules.size,c=e.modules.data,l=s+o.margin*2,u=o.color.light.a?`<path `+n(o.color.light,`fill`)+` d="M0 0h`+l+`v`+l+`H0z"/>`:``,d=`<path `+n(o.color.dark,`stroke`)+` d="`+i(c,s,o.margin)+`"/>`,f=`viewBox="0 0 `+l+` `+l+`"`,p=`<svg xmlns="http://www.w3.org/2000/svg" `+(o.width?`width="`+o.width+`" height="`+o.width+`" `:``)+f+` shape-rendering="crispEdges">`+u+d+`</svg>
`;return typeof a==`function`&&a(null,p),p}})),R=e(t((e=>{var t=ee(),n=P(),r=I(),i=L();function a(e,r,i,a,o){let s=[].slice.call(arguments,1),c=s.length,l=typeof s[c-1]==`function`;if(!l&&!t())throw Error(`Callback required as last argument`);if(l){if(c<2)throw Error(`Too few arguments provided`);c===2?(o=i,i=r,r=a=void 0):c===3&&(r.getContext&&o===void 0?(o=a,a=void 0):(o=a,a=i,i=r,r=void 0))}else{if(c<1)throw Error(`Too few arguments provided`);return c===1?(i=r,r=a=void 0):c===2&&!r.getContext&&(a=i,i=r,r=void 0),new Promise(function(t,o){try{t(e(n.create(i,a),r,a))}catch(e){o(e)}})}try{let t=n.create(i,a);o(null,e(t,r,a))}catch(e){o(e)}}e.create=n.create,e.toCanvas=a.bind(null,r.render),e.toDataURL=a.bind(null,r.renderToDataURL),e.toString=a.bind(null,function(e,t,n){return i.render(e,n)})}))(),1),z=`SolanaMobileWalletAdapterDefaultAuthorizationCache`;function B(){let e;try{e=window.localStorage}catch{}return{async clear(){if(e)try{e.removeItem(z)}catch{}},async get(){if(e)try{let t=JSON.parse(e.getItem(z));if(t&&t.accounts){let e=t.accounts.map(e=>({...e,publicKey:`publicKey`in e?new Uint8Array(Object.values(e.publicKey)):a(e.address)}));return{...t,accounts:e}}return t||void 0}catch{}},async set(t){if(e)try{e.setItem(z,JSON.stringify(t))}catch{}}}}function V(){return{async select(e){return e.length===1?e[0]:e.includes(`solana:mainnet`)?d:e[0]}}}var pe=`
<div class="mobile-wallet-adapter-embedded-modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div data-modal-close style="position: absolute; width: 100%; height: 100%;"></div>
	<div class="mobile-wallet-adapter-embedded-modal-card">
		<div>
			<button data-modal-close class="mobile-wallet-adapter-embedded-modal-close">
				<svg width="14" height="14">
					<path d="M 6.7125,8.3036995 1.9082,13.108199 c -0.2113,0.2112 -0.4765,0.3168 -0.7957,0.3168 -0.3192,0 -0.5844,-0.1056 -0.7958,-0.3168 C 0.1056,12.896899 0,12.631699 0,12.312499 c 0,-0.3192 0.1056,-0.5844 0.3167,-0.7958 L 5.1212,6.7124995 0.3167,1.9082 C 0.1056,1.6969 0,1.4317 0,1.1125 0,0.7933 0.1056,0.5281 0.3167,0.3167 0.5281,0.1056 0.7933,0 1.1125,0 1.4317,0 1.6969,0.1056 1.9082,0.3167 L 6.7125,5.1212 11.5167,0.3167 C 11.7281,0.1056 11.9933,0 12.3125,0 c 0.3192,0 0.5844,0.1056 0.7957,0.3167 0.2112,0.2114 0.3168,0.4766 0.3168,0.7958 0,0.3192 -0.1056,0.5844 -0.3168,0.7957 L 8.3037001,6.7124995 13.1082,11.516699 c 0.2112,0.2114 0.3168,0.4766 0.3168,0.7958 0,0.3192 -0.1056,0.5844 -0.3168,0.7957 -0.2113,0.2112 -0.4765,0.3168 -0.7957,0.3168 -0.3192,0 -0.5844,-0.1056 -0.7958,-0.3168 z" />
				</svg>
			</button>
		</div>
		<div class="mobile-wallet-adapter-embedded-modal-content"></div>
	</div>
</div>
`,me=`
.mobile-wallet-adapter-embedded-modal-container {
    display: flex; /* Use flexbox to center content */
    justify-content: center; /* Center horizontally */
    align-items: center; /* Center vertically */
    position: fixed; /* Stay in place */
    z-index: 2147483647; /* Sit on top */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
    overflow-y: auto; /* enable scrolling */
}

.mobile-wallet-adapter-embedded-modal-card {
    display: flex;
    flex-direction: column;
    margin: auto 20px;
    max-width: 780px;
    padding: 20px;
    border-radius: 24px;
    background: #ffffff;
    font-family: "Inter Tight", "PT Sans", Calibri, sans-serif;
    transform: translateY(-200%);
    animation: slide-in 0.5s forwards;
}

@keyframes slide-in {
    100% { transform: translateY(0%); }
}

.mobile-wallet-adapter-embedded-modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    cursor: pointer;
    background: #e4e9e9;
    border: none;
    border-radius: 50%;
}

.mobile-wallet-adapter-embedded-modal-close:focus-visible {
    outline-color: red;
}

.mobile-wallet-adapter-embedded-modal-close svg {
    fill: #546266;
    transition: fill 200ms ease 0s;
}

.mobile-wallet-adapter-embedded-modal-close:hover svg {
    fill: #fff;
}
`,he=`
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
`,H=class{#e=null;#t={};#n=!1;dom=null;constructor(){this.init=this.init.bind(this),this.#e=document.getElementById(`mobile-wallet-adapter-embedded-root-ui`)}async init(){console.log(`Injecting modal`),this.#r()}open=()=>{console.debug(`Modal open`),this.#i(),this.#e&&(this.#e.style.display=`flex`)};close=(e=void 0)=>{console.debug(`Modal close`),this.#a(),this.#e&&(this.#e.style.display=`none`),this.#t.close?.forEach(t=>t(e))};addEventListener(e,t){return this.#t[e]?.push(t)||(this.#t[e]=[t]),()=>this.removeEventListener(e,t)}removeEventListener(e,t){this.#t[e]=this.#t[e]?.filter(e=>t!==e)}#r(){if(document.getElementById(`mobile-wallet-adapter-embedded-root-ui`)){this.#e||=document.getElementById(`mobile-wallet-adapter-embedded-root-ui`);return}this.#e=document.createElement(`div`),this.#e.id=`mobile-wallet-adapter-embedded-root-ui`,this.#e.innerHTML=pe,this.#e.style.display=`none`;let e=this.#e.querySelector(`.mobile-wallet-adapter-embedded-modal-content`);e&&(e.innerHTML=this.contentHtml);let t=document.createElement(`style`);t.id=`mobile-wallet-adapter-embedded-modal-styles`,t.textContent=me+this.contentStyles;let n=document.createElement(`div`);n.innerHTML=he,this.dom=n.attachShadow({mode:`closed`}),this.dom.appendChild(t),this.dom.appendChild(this.#e),document.body.appendChild(n)}#i(){!this.#e||this.#n||([...this.#e.querySelectorAll(`[data-modal-close]`)].forEach(e=>e?.addEventListener(`click`,this.close)),window.addEventListener(`load`,this.close),document.addEventListener(`keydown`,this.#o),this.#n=!0)}#a(){this.#n&&(window.removeEventListener(`load`,this.close),document.removeEventListener(`keydown`,this.#o),this.#e&&([...this.#e.querySelectorAll(`[data-modal-close]`)].forEach(e=>e?.removeEventListener(`click`,this.close)),this.#n=!1))}#o=e=>{e.key===`Escape`&&this.close(e)}},ge=`To use mobile wallet adapter, you must have a compatible mobile wallet application installed on your device.`,_e=`This browser appears to be incompatible with mobile wallet adapter. Open this page in a compatible mobile browser app and try again.`,ve=class extends H{contentStyles=be;contentHtml=ye;initWithError(e){super.init(),this.populateError(e)}populateError(e){let t=this.dom?.getElementById(`mobile-wallet-adapter-error-message`),n=this.dom?.getElementById(`mobile-wallet-adapter-error-action`);if(t){if(e.name===`SolanaMobileWalletAdapterError`)switch(e.code){case`ERROR_WALLET_NOT_FOUND`:t.innerHTML=ge,n&&n.addEventListener(`click`,()=>{window.location.href=`https://solanamobile.com/wallets`});return;case`ERROR_BROWSER_NOT_SUPPORTED`:t.innerHTML=_e,n&&(n.style.display=`none`);return}t.innerHTML=`An unexpected error occurred: ${e.message}`}else console.log(`Failed to locate error dialog element`)}},ye=`
<svg class="mobile-wallet-adapter-embedded-modal-error-icon" xmlns="http://www.w3.org/2000/svg" height="50px" viewBox="0 -960 960 960" width="50px" fill="#000000"><path d="M 280,-80 Q 197,-80 138.5,-138.5 80,-197 80,-280 80,-363 138.5,-421.5 197,-480 280,-480 q 83,0 141.5,58.5 58.5,58.5 58.5,141.5 0,83 -58.5,141.5 Q 363,-80 280,-80 Z M 824,-120 568,-376 Q 556,-389 542.5,-402.5 529,-416 516,-428 q 38,-24 61,-64 23,-40 23,-88 0,-75 -52.5,-127.5 Q 495,-760 420,-760 345,-760 292.5,-707.5 240,-655 240,-580 q 0,6 0.5,11.5 0.5,5.5 1.5,11.5 -18,2 -39.5,8 -21.5,6 -38.5,14 -2,-11 -3,-22 -1,-11 -1,-23 0,-109 75.5,-184.5 Q 311,-840 420,-840 q 109,0 184.5,75.5 75.5,75.5 75.5,184.5 0,43 -13.5,81.5 Q 653,-460 629,-428 l 251,252 z m -615,-61 71,-71 70,71 29,-28 -71,-71 71,-71 -28,-28 -71,71 -71,-71 -28,28 71,71 -71,71 z"/></svg>
<div class="mobile-wallet-adapter-embedded-modal-title">We can't find a wallet.</div>
<div id="mobile-wallet-adapter-error-message" class="mobile-wallet-adapter-embedded-modal-subtitle"></div>
<div>
    <button data-error-action id="mobile-wallet-adapter-error-action" class="mobile-wallet-adapter-embedded-modal-error-action">
        Find a wallet
    </button>
</div>
`,be=`
.mobile-wallet-adapter-embedded-modal-content {
    text-align: center;
}

.mobile-wallet-adapter-embedded-modal-error-icon {
    margin-top: 24px;
}

.mobile-wallet-adapter-embedded-modal-title {
    margin: 18px 100px auto 100px;
    color: #000000;
    font-size: 2.75em;
    font-weight: 600;
}

.mobile-wallet-adapter-embedded-modal-subtitle {
    margin: 30px 60px 40px 60px;
    color: #000000;
    font-size: 1.25em;
    font-weight: 400;
}

.mobile-wallet-adapter-embedded-modal-error-action {
    display: block;
    width: 100%;
    height: 56px;
    /*margin-top: 40px;*/
    font-size: 1.25em;
    /*line-height: 24px;*/
    /*letter-spacing: -1%;*/
    background: #000000;
    color: #FFFFFF;
    border-radius: 18px;
}

/* Smaller screens */
@media all and (max-width: 600px) {
    .mobile-wallet-adapter-embedded-modal-title {
        font-size: 1.5em;
        margin-right: 12px;
        margin-left: 12px;
    }
    .mobile-wallet-adapter-embedded-modal-subtitle {
        margin-right: 12px;
        margin-left: 12px;
    }
}
`;async function U(){if(typeof window<`u`){let e=window.navigator.userAgent.toLowerCase(),t=new ve;e.includes(`wv`)?t.initWithError({name:`SolanaMobileWalletAdapterError`,code:`ERROR_BROWSER_NOT_SUPPORTED`,message:``}):t.initWithError({name:`SolanaMobileWalletAdapterError`,code:`ERROR_WALLET_NOT_FOUND`,message:``}),t.open()}}function xe(){return async()=>{U()}}var Se=class extends H{contentStyles=we;contentHtml=Ce;initWithCallback(e){super.init(),this.#e(e)}#e(e){let t=this.dom?.getElementById(`mobile-wallet-adapter-launch-action`),n=async()=>{t?.removeEventListener(`click`,n),this.close(),e()};t?.addEventListener(`click`,n)}},Ce=`
<svg class="mobile-wallet-adapter-embedded-modal-launch-icon" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.6 48C7.2 48 0 40.8 0 26.4V21.6C0 7.2 7.2 0 21.6 0H26.4C40.8 0 48 7.2 48 21.6V26.4C48 40.8 40.8 48 26.4 48H21.6Z" fill="#15994E"/>
    <mask id="mask0_189_522" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="8" y="8" width="32" height="32">
        <rect x="8" y="8" width="32" height="32" fill="#D9D9D9"/>
    </mask>
    <g mask="url(#mask0_189_522)">
        <mask id="mask1_189_522" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="8" y="8" width="32" height="32">
            <rect x="8" y="8" width="32" height="32" fill="#D9D9D9"/>
        </mask>
        <g mask="url(#mask1_189_522)">
            <path d="M22.1092 26.1208L19.4498 23.4615C19.1736 23.1851 18.8253 23.0468 18.4048 23.0468C17.9846 23.0468 17.6363 23.1851 17.3598 23.4615C17.0836 23.7377 16.9468 24.0861 16.9495 24.5065C16.9522 24.9267 17.0916 25.275 17.3678 25.5512L21.0405 29.2238C21.3463 29.5276 21.7031 29.6795 22.1108 29.6795C22.5184 29.6795 22.8742 29.5276 23.1782 29.2238L30.5918 21.8098C30.8683 21.5336 31.0065 21.1867 31.0065 20.7692C31.0065 20.3514 30.8683 20.0044 30.5918 19.7282C30.3156 19.4517 29.9673 19.3135 29.5468 19.3135C29.1266 19.3135 28.7784 19.4517 28.5022 19.7282L22.1092 26.1208ZM23.9998 37.6042C22.113 37.6042 20.3425 37.2473 18.6885 36.5335C17.0343 35.8197 15.5954 34.8512 14.3718 33.6278C13.1485 32.4043 12.18 30.9654 11.4662 29.3112C10.7524 27.6572 10.3955 25.8867 10.3955 23.9998C10.3955 22.113 10.7524 20.3425 11.4662 18.6885C12.18 17.0343 13.1485 15.5954 14.3718 14.3718C15.5954 13.1485 17.0343 12.18 18.6885 11.4662C20.3425 10.7524 22.113 10.3955 23.9998 10.3955C25.8867 10.3955 27.6572 10.7524 29.3112 11.4662C30.9654 12.18 32.4043 13.1485 33.6278 14.3718C34.8512 15.5954 35.8197 17.0343 36.5335 18.6885C37.2473 20.3425 37.6042 22.113 37.6042 23.9998C37.6042 25.8867 37.2473 27.6572 36.5335 29.3112C35.8197 30.9654 34.8512 32.4043 33.6278 33.6278C32.4043 34.8512 30.9654 35.8197 29.3112 36.5335C27.6572 37.2473 25.8867 37.6042 23.9998 37.6042Z" fill="white"/>
        </g>
    </g>
</svg>
<div class="mobile-wallet-adapter-embedded-modal-title">Ready to connect!</div>
<div>
    <button data-modal-action id="mobile-wallet-adapter-launch-action" class="mobile-wallet-adapter-embedded-modal-launch-action">
        Connect Wallet
    </button>
</div>
`,we=`
.mobile-wallet-adapter-embedded-modal-close {
    display: none;
}
.mobile-wallet-adapter-embedded-modal-content {
    text-align: center;
    min-width: 300px;
}
.mobile-wallet-adapter-embedded-modal-launch-icon {
    margin-top: 24px;
}
.mobile-wallet-adapter-embedded-modal-title {
    margin: 18px 100px 30px 100px;
    color: #000000;
    font-size: 2.75em;
    font-weight: 600;
}
.mobile-wallet-adapter-embedded-modal-launch-action {
    display: block;
    width: 100%;
    height: 56px;
    font-size: 1.25em;
    background: #000000;
    color: #FFFFFF;
    border-radius: 18px;
}
/* Smaller screens */
@media all and (max-width: 600px) {
    .mobile-wallet-adapter-embedded-modal-title {
        font-size: 1.5em;
        margin-right: 12px;
        margin-left: 12px;
    }
}
`,W=class extends H{contentStyles=Ee;get contentHtml(){let e=Ne()?`Long press the app icon on your home screen to open site settings`:`Tap the lock or settings icon in the address bar to open site settings`;return Te.replace(`{{PERMISSION_INSTRUCTION_DETAIL}}`,e)}async init(){super.init(),this.#e()}#e(){let e=this.dom?.getElementById(`mobile-wallet-adapter-launch-action`),t=async n=>{e?.removeEventListener(`click`,t),this.close(n)};e?.addEventListener(`click`,t)}},Te=`
<div class="mobile-wallet-adapter-embedded-modal-header">
    Local Wallet Connection
</div>
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.6 48C7.2 48 0 40.8 0 26.4V21.6C0 7.2 7.2 0 21.6 0H26.4C40.8 0 48 7.2 48 21.6V26.4C48 40.8 40.8 48 26.4 48H21.6Z" fill="#ED1515"/>
    <mask id="mask0_147_1364" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="8" y="8" width="32" height="32">
        <rect x="8" y="8" width="32" height="32" fill="#D9D9D9"/>
    </mask>
    <g mask="url(#mask0_147_1364)">
        <path d="M20.1398 36.2705C19.7363 36.2705 19.3508 36.1945 18.9835 36.0425C18.6162 35.8907 18.2916 35.674 18.0098 35.3922L12.6072 29.9895C12.3254 29.7077 12.1086 29.3832 11.9568 29.0158C11.8048 28.6485 11.7288 28.2631 11.7288 27.8595V20.1395C11.7288 19.736 11.8048 19.3505 11.9568 18.9832C12.1086 18.6158 12.3254 18.2913 12.6072 18.0095L18.0098 12.6068C18.2916 12.3251 18.6162 12.1083 18.9835 11.9565C19.3508 11.8045 19.7363 11.7285 20.1398 11.7285H27.8598C28.2634 11.7285 28.6488 11.8045 29.0162 11.9565C29.3835 12.1083 29.708 12.3251 29.9898 12.6068L35.3925 18.0095C35.6743 18.2913 35.891 18.6158 36.0428 18.9832C36.1948 19.3505 36.2708 19.736 36.2708 20.1395V27.8595C36.2708 28.2631 36.1948 28.6485 36.0428 29.0158C35.891 29.3832 35.6743 29.7077 35.3925 29.9895L29.9898 35.3922C29.708 35.674 29.3835 35.8907 29.0162 36.0425C28.6488 36.1945 28.2634 36.2705 27.8598 36.2705H20.1398ZM20.1732 33.2372H27.8265L33.2375 27.8262V20.1728L27.8265 14.7618H20.1732L14.7622 20.1728V27.8262L20.1732 33.2372ZM23.9998 25.9538L26.7868 28.7408C27.0473 29.0013 27.3729 29.1302 27.7638 29.1275C28.1549 29.1248 28.4807 28.9933 28.7412 28.7328C29.0016 28.4724 29.1318 28.1466 29.1318 27.7555C29.1318 27.3646 29.0016 27.039 28.7412 26.7785L25.9542 23.9995L28.7412 21.2125C29.0016 20.9521 29.1318 20.6264 29.1318 20.2355C29.1318 19.8444 29.0016 19.5186 28.7412 19.2582C28.4807 18.9977 28.1549 18.8675 27.7638 18.8675C27.3729 18.8675 27.0473 18.9977 26.7868 19.2582L23.9998 22.0452L21.2128 19.2582C20.9524 18.9977 20.628 18.8675 20.2398 18.8675C19.8514 18.8675 19.5269 18.9977 19.2665 19.2582C19.006 19.5186 18.8758 19.8444 18.8758 20.2355C18.8758 20.6264 19.006 20.9521 19.2665 21.2125L22.0455 23.9995L19.2585 26.7865C18.998 27.047 18.8692 27.3713 18.8718 27.7595C18.8745 28.148 19.006 28.4724 19.2665 28.7328C19.5269 28.9933 19.8527 29.1235 20.2438 29.1235C20.6347 29.1235 20.9604 28.9933 21.2208 28.7328L23.9998 25.9538Z" fill="black"/>
    </g>
</svg>
<div class="mobile-wallet-adapter-embedded-modal-title">
    Your wallet connection is blocked
</div>
<div id="mobile-wallet-adapter-local-launch-message" class="mobile-wallet-adapter-embedded-modal-subtitle">
    Visit site settings in the address bar and allow "Apps on Device".
</div>

<div class="mobile-wallet-adapter-embedded-modal-divider"><hr></div>
<div class="mobile-wallet-adapter-embedded-modal-footer">
    <div class="mobile-wallet-adapter-embedded-modal-details">
        <!-- Clickable header (label associated with the checkbox) -->
      	<label for="collapsible-1" class="mobile-wallet-adapter-embedded-modal-details-collapsible-header">
            <!-- Hidden checkbox to track state -->
            <input type="checkbox" id="collapsible-1" class="mobile-wallet-adapter-embedded-modal-details-collapsible-input">
            <span class="mobile-wallet-adapter-embedded-modal-details-collapsible-header-label">
              See details
            </span>
            <svg class="mobile-wallet-adapter-embedded-modal-details-collapsible-header-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <mask id="mask0_147_1382" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
                <rect width="24" height="24" fill="#D9D9D9"/>
              </mask>
              <g mask="url(#mask0_147_1382)">
                <path d="M11.9999 17.0811C11.8506 17.0811 11.7087 17.0563 11.5741 17.0067C11.4395 16.957 11.3162 16.8762 11.2042 16.7643L6.57924 12.1393C6.36801 11.9281 6.26656 11.667 6.27489 11.3561C6.28322 11.0453 6.39301 10.7842 6.60424 10.573C6.81547 10.3618 7.08069 10.2561 7.39989 10.2561C7.71909 10.2561 7.9843 10.3618 8.19554 10.573L11.9999 14.3773L15.8292 10.548C16.0405 10.3368 16.3015 10.2353 16.6124 10.2436C16.9233 10.252 17.1843 10.3618 17.3955 10.573C17.6068 10.7842 17.7124 11.0494 17.7124 11.3686C17.7124 11.6878 17.6068 11.9531 17.3955 12.1643L12.7955 16.7643C12.6836 16.8762 12.5603 16.957 12.4257 17.0067C12.2911 17.0563 12.1492 17.0811 11.9999 17.0811Z" fill="black"/>
              </g>
            </svg>
      	</label>
        
        <!-- Content to show/hide -->
        <ul class="mobile-wallet-adapter-embedded-modal-details-collapsible-content">
            <li>{{PERMISSION_INSTRUCTION_DETAIL}}</li>
            <li>Allow "Apps on Device"</li>
        </ul>
    </div>
</div>
<div>
    <button data-modal-action id="mobile-wallet-adapter-launch-action" class="mobile-wallet-adapter-embedded-modal-launch-action">
        Got it
    </button>
</div>
`,Ee=`
.mobile-wallet-adapter-embedded-modal-close {
    display: none;
}
.mobile-wallet-adapter-embedded-modal-content {
    text-align: center;
}
.mobile-wallet-adapter-embedded-modal-header {
    margin: 18px auto 30px auto;
    color: #7D9093;
    font-size: 1.0em;
    font-weight: 500;
}
.mobile-wallet-adapter-embedded-modal-title {
    margin: 18px 100px auto 100px;
    color: #000000;
    font-size: 2.75em;
    font-weight: 600;
}
.mobile-wallet-adapter-embedded-modal-subtitle {
    margin: 12px 60px 30px 60px;
    color: #7D9093;
    font-size: 1.25em;
    font-weight: 400;
}
.mobile-wallet-adapter-embedded-modal-details-collapsible-header {
    display: flex;
    flex-direction: row;
  	justify-content: space-between;
    margin: 10px auto 10px auto;
    color: #000000;
    font-size: 1.5em;
    font-weight: 600;
    cursor: pointer; /* Show pointer on hover */
    transition: background 0.2s ease; /* Smooth background change */
}
.mobile-wallet-adapter-embedded-modal-details-collapsible-header-icon {
  	transition: rotate 0.3s ease;
}
.mobile-wallet-adapter-embedded-modal-details-collapsible-input {
  	display: none; /* Hide the checkbox */
}
.mobile-wallet-adapter-embedded-modal-details-collapsible-content {
    margin: 0px auto 40px auto;
    max-height: 0px; /* Collapse content */
    overflow: hidden; /* Hide overflow when collapsed */
    transition: max-height 0.3s ease; /* Smooth transition */
}
.mobile-wallet-adapter-embedded-modal-details-collapsible-content li {
    margin: 20px auto;
    color: #000000;
    font-size: 1.25em;
    font-weight: 400;
    text-align: left;
}
/* When checkbox is checked, show content */
.mobile-wallet-adapter-embedded-modal-details-collapsible-header:has(> input:checked) ~ .mobile-wallet-adapter-embedded-modal-details-collapsible-content {
  	max-height: 300px;
}
.mobile-wallet-adapter-embedded-modal-details-collapsible-header:has(> input:checked) > .mobile-wallet-adapter-embedded-modal-details-collapsible-header-icon {
  	rotate: 180deg;
}
.mobile-wallet-adapter-embedded-modal-launch-action {
    display: block;
    width: 100%;
    height: 56px;
    /*margin-top: 40px;*/
    font-size: 1.25em;
    /*line-height: 24px;*/
    /*letter-spacing: -1%;*/
    background: #000000;
    color: #FFFFFF;
    border-radius: 18px;
}
/* Smaller screens */
@media all and (max-width: 600px) {
    .mobile-wallet-adapter-embedded-modal-title {
        font-size: 1.75em;
        margin-right: 12px;
        margin-left: 12px;
    }
    .mobile-wallet-adapter-embedded-modal-subtitle {
        margin-right: 12px;
        margin-left: 12px;
    }
}
`,De=class extends H{contentStyles=ke;contentHtml=Oe;async init(){super.init(),this.#e()}#e(){let e=this.dom?.getElementById(`mobile-wallet-adapter-launch-action`),t=async()=>{e?.removeEventListener(`click`,t);try{await fetch(`http://localhost`)}catch{}this.close()};e?.addEventListener(`click`,t)}},Oe=`
<div class="mobile-wallet-adapter-embedded-modal-title">Allow connections to your wallet</div>
<div id="mobile-wallet-adapter-local-launch-message" class="mobile-wallet-adapter-embedded-modal-subtitle">
    Tap "Allow" on the next screen
</div>
<svg class="mobile-wallet-adapter-embedded-modal-permission-prompt-mock" xmlns="http://www.w3.org/2000/svg" width="281" height="83" viewBox="0 0 281 83" fill="none">
    <rect width="281" height="83" rx="22" fill="#F0F3F5"/>
    <path d="M254.194 64L252.626 56.657H254.047L254.866 61.452L254.985 62.278H255.02L255.146 61.452L255.993 57.497H257.4L258.254 61.431L258.373 62.278H258.415L258.534 61.431L259.346 56.657H260.718L259.143 64H257.673L256.826 59.961L256.693 59.093H256.651L256.511 59.961L255.664 64H254.194Z" fill="black"/>
    <path d="M248.837 64.231C248.147 64.231 247.54 64.07 247.017 63.748C246.495 63.426 246.086 62.978 245.792 62.404C245.498 61.83 245.351 61.1673 245.351 60.416V60.241C245.351 59.4897 245.498 58.827 245.792 58.253C246.086 57.679 246.495 57.2333 247.017 56.916C247.54 56.594 248.147 56.433 248.837 56.433C249.528 56.433 250.135 56.594 250.657 56.916C251.18 57.2333 251.588 57.679 251.882 58.253C252.176 58.827 252.323 59.4897 252.323 60.241V60.416C252.323 61.1673 252.176 61.83 251.882 62.404C251.588 62.978 251.18 63.426 250.657 63.748C250.135 64.07 249.528 64.231 248.837 64.231ZM248.837 62.824C249.43 62.824 249.897 62.607 250.237 62.173C250.583 61.7343 250.755 61.1417 250.755 60.395V60.262C250.755 59.5107 250.583 58.918 250.237 58.484C249.897 58.05 249.43 57.833 248.837 57.833C248.249 57.833 247.783 58.05 247.437 58.484C247.092 58.918 246.919 59.5107 246.919 60.262V60.395C246.919 61.1417 247.092 61.7343 247.437 62.173C247.783 62.607 248.249 62.824 248.837 62.824Z" fill="black"/>
    <path d="M242.298 64.231C241.467 64.231 240.814 63.993 240.338 63.517C239.866 63.0364 239.631 62.3737 239.631 61.529V53.78H241.178V61.389C241.178 62.3317 241.591 62.803 242.417 62.803C242.65 62.803 242.865 62.7587 243.061 62.67C243.257 62.5814 243.464 62.4367 243.684 62.236L244.538 63.377C244.225 63.6664 243.884 63.881 243.516 64.021C243.152 64.161 242.746 64.231 242.298 64.231ZM237.51 55.061V53.78H240.611V55.061H237.51Z" fill="black"/>
    <path d="M234.463 64.231C233.633 64.231 232.979 63.993 232.503 63.517C232.032 63.0364 231.796 62.3737 231.796 61.529V53.78H233.343V61.389C233.343 62.3317 233.756 62.803 234.582 62.803C234.816 62.803 235.03 62.7587 235.226 62.67C235.422 62.5814 235.63 62.4367 235.849 62.236L236.703 63.377C236.391 63.6664 236.05 63.881 235.681 64.021C235.317 64.161 234.911 64.231 234.463 64.231ZM229.675 55.061V53.78H232.776V55.061H229.675Z" fill="black"/>
    <path d="M221.442 64L224.557 53.976H226.132L229.233 64H227.581L225.642 56.972L225.341 55.761H225.299L225.005 56.972L223.073 64H221.442ZM222.835 61.634L223.255 60.29H227.371L227.805 61.634H222.835Z" fill="black"/>
    <path d="M178.261 64L175.034 60.066V60.024L178.121 56.657H180.011L176.504 60.423V59.632L180.165 64H178.261ZM173.543 64V53.78H175.097V64H173.543Z" fill="#7D9093" fill-opacity="0.5"/>
    <path d="M169.306 64.224C168.588 64.224 167.958 64.0653 167.416 63.748C166.88 63.426 166.462 62.9803 166.163 62.411C165.865 61.837 165.715 61.1673 165.715 60.402V60.248C165.715 59.4873 165.862 58.8223 166.156 58.253C166.45 57.679 166.863 57.2333 167.395 56.916C167.927 56.594 168.546 56.433 169.25 56.433C169.978 56.433 170.59 56.6056 171.084 56.951C171.579 57.2917 171.955 57.777 172.211 58.407L170.874 58.995C170.72 58.6123 170.508 58.323 170.237 58.127C169.967 57.9263 169.633 57.826 169.236 57.826C168.63 57.826 168.149 58.0383 167.794 58.463C167.444 58.883 167.269 59.4616 167.269 60.199V60.465C167.269 61.1837 167.454 61.7577 167.822 62.187C168.196 62.6163 168.69 62.831 169.306 62.831C169.712 62.831 170.06 62.733 170.349 62.537C170.639 62.341 170.877 62.0423 171.063 61.641L172.379 62.285C172.188 62.6957 171.941 63.0457 171.637 63.335C171.334 63.6243 170.986 63.846 170.594 64C170.202 64.1493 169.773 64.224 169.306 64.224Z" fill="#7D9093" fill-opacity="0.5"/>
    <path d="M161.003 64.231C160.312 64.231 159.706 64.07 159.183 63.748C158.66 63.426 158.252 62.978 157.958 62.404C157.664 61.83 157.517 61.1673 157.517 60.416V60.241C157.517 59.4897 157.664 58.827 157.958 58.253C158.252 57.679 158.66 57.2333 159.183 56.916C159.706 56.594 160.312 56.433 161.003 56.433C161.694 56.433 162.3 56.594 162.823 56.916C163.346 57.2333 163.754 57.679 164.048 58.253C164.342 58.827 164.489 59.4897 164.489 60.241V60.416C164.489 61.1673 164.342 61.83 164.048 62.404C163.754 62.978 163.346 63.426 162.823 63.748C162.3 64.07 161.694 64.231 161.003 64.231ZM161.003 62.824C161.596 62.824 162.062 62.607 162.403 62.173C162.748 61.7343 162.921 61.1417 162.921 60.395V60.262C162.921 59.5107 162.748 58.918 162.403 58.484C162.062 58.05 161.596 57.833 161.003 57.833C160.415 57.833 159.948 58.05 159.603 58.484C159.258 58.918 159.085 59.5107 159.085 60.262V60.395C159.085 61.1417 159.258 61.7343 159.603 62.173C159.948 62.607 160.415 62.824 161.003 62.824Z" fill="#7D9093" fill-opacity="0.5"/>
    <path d="M154.463 64.231C153.633 64.231 152.979 63.993 152.503 63.517C152.032 63.0364 151.796 62.3737 151.796 61.529V53.78H153.343V61.389C153.343 62.3317 153.756 62.803 154.582 62.803C154.816 62.803 155.03 62.7587 155.226 62.67C155.422 62.5814 155.63 62.4367 155.849 62.236L156.703 63.377C156.391 63.6664 156.05 63.881 155.681 64.021C155.317 64.161 154.911 64.231 154.463 64.231ZM149.675 55.061V53.78H152.776V55.061H149.675Z" fill="#7D9093" fill-opacity="0.5"/>
    <path d="M142.24 64V53.976H145.544C146.421 53.976 147.112 54.1953 147.616 54.634C148.12 55.0726 148.372 55.6583 148.372 56.391V56.566C148.372 57.0886 148.246 57.5366 147.994 57.91C147.742 58.2833 147.38 58.5586 146.909 58.736V58.792C147.492 58.9226 147.947 59.2003 148.274 59.625C148.605 60.045 148.771 60.5606 148.771 61.172V61.361C148.771 61.893 148.645 62.3573 148.393 62.754C148.145 63.1506 147.795 63.4586 147.343 63.678C146.895 63.8926 146.365 64 145.754 64H142.24ZM143.794 62.656H145.572C146.085 62.656 146.482 62.5253 146.762 62.264C147.042 62.0026 147.182 61.6293 147.182 61.144V60.99C147.182 60.5046 147.037 60.1313 146.748 59.87C146.463 59.604 146.05 59.471 145.509 59.471H143.36V58.183H145.32C145.791 58.183 146.153 58.064 146.405 57.826C146.657 57.588 146.783 57.2496 146.783 56.811V56.685C146.783 56.2416 146.657 55.9033 146.405 55.67C146.157 55.4366 145.796 55.32 145.32 55.32H143.794V62.656Z" fill="#7D9093" fill-opacity="0.5"/>
    <rect x="18" y="17" width="246" height="7" rx="3.5" fill="#7D9093" fill-opacity="0.26"/>
    <rect x="18" y="33" width="82" height="7" rx="3.5" fill="#7D9093" fill-opacity="0.26"/>
</svg>
<div>
    <button data-modal-action id="mobile-wallet-adapter-launch-action" class="mobile-wallet-adapter-embedded-modal-launch-action">
        Continue to Allow
    </button>
</div>
`,ke=`
.mobile-wallet-adapter-embedded-modal-close {
    display: none;
}
.mobile-wallet-adapter-embedded-modal-content {
    text-align: center;
}
.mobile-wallet-adapter-embedded-modal-title {
    margin: 18px 100px auto 100px;
    color: #000000;
    font-size: 2.75em;
    font-weight: 600;
}
.mobile-wallet-adapter-embedded-modal-subtitle {
    margin: 20px 60px 40px 60px;
    color: #7D9093;
    font-size: 1.25em;
    font-weight: 400;
}
.mobile-wallet-adapter-embedded-modal-permission-prompt-mock {
    width: 90%;
    height: auto;
    margin: 0 auto 30px auto;
    display: block;
}
.mobile-wallet-adapter-embedded-modal-launch-action {
    display: block;
    width: 100%;
    height: 56px;
    font-size: 1.25em;
    background: #000000;
    color: #FFFFFF;
    border-radius: 18px;
}
/* Smaller screens */
@media all and (max-width: 600px) {
    .mobile-wallet-adapter-embedded-modal-title {
        font-size: 1.5em;
        margin-right: 12px;
        margin-left: 12px;
    }
    .mobile-wallet-adapter-embedded-modal-subtitle {
        margin-right: 12px;
        margin-left: 12px;
    }
}
`;function Ae(){return typeof window<`u`&&window.isSecureContext&&typeof document<`u`&&/android/i.test(navigator.userAgent)}function je(){return typeof window<`u`&&window.isSecureContext&&typeof document<`u`&&!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)}function Me(e){return/(WebView|Version\/.+(Chrome)\/(\d+)\.(\d+)\.(\d+)\.(\d+)|; wv\).+(Chrome)\/(\d+)\.(\d+)\.(\d+)\.(\d+))/i.test(e)}function G(e){return e.includes(`Solana Mobile Web Shell`)}function Ne(){let e=typeof document<`u`&&document.referrer.startsWith(`android-app://`);if(typeof window>`u`)return e;let t=window.matchMedia(`(display-mode: standalone)`).matches,n=window.matchMedia(`(display-mode: fullscreen)`).matches,r=window.matchMedia(`(display-mode: minimal-ui)`).matches;return e||t||n||r}async function Pe(){if(typeof navigator<`u`&&G(navigator.userAgent))return!0;try{return(await navigator.permissions.query({name:`loopback-network`})).state===`granted`}catch(e){return!!(e instanceof TypeError&&(e.message.includes(`loopback-network`)||e.message.includes(`local-network-access`)))}}async function K(){if(!(typeof navigator<`u`&&G(navigator.userAgent)))try{let e=await navigator.permissions.query({name:`loopback-network`});if(e.state===`granted`)return;if(e.state===`denied`){let e=new W;throw e.init(),e.open(),new n(r.ERROR_LOOPBACK_ACCESS_BLOCKED,`Local Network Access permission denied`)}if(e.state===`prompt`){let t=new De;if(await new Promise((i,a)=>{t.addEventListener(`close`,e=>{e&&a(new n(r.ERROR_ASSOCIATION_CANCELLED,`Wallet connection cancelled by user`,{event:e}))}),e.onchange=()=>{e.onchange=null,i(e.state)},t.init(),t.open()})===`granted`){let e=new Se;await new Promise((t,i)=>{e.addEventListener(`close`,e=>{e&&i(new n(r.ERROR_ASSOCIATION_CANCELLED,`Wallet connection cancelled by user`,{event:e}))}),e.initWithCallback(async()=>{t(!0)}),e.open()});return}return await K()}throw new n(r.ERROR_LOOPBACK_ACCESS_BLOCKED,`Local Network Access permission unknown`)}catch(e){if(e instanceof TypeError&&(e.message.includes(`loopback-network`)||e.message.includes(`local-network-access`)))return;throw e instanceof n?e:new n(r.ERROR_LOOPBACK_ACCESS_BLOCKED,e instanceof Error?e.message:`Local Network Access permission unknown`)}}var Fe=`
<div class="mobile-wallet-adapter-embedded-loading-indicator" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div data-modal-close style="position: absolute; width: 100%; height: 100%;"></div>
    <div class="mobile-wallet-adapter-embedded-loading-container">
        <div class="mobile-wallet-adapter-embedded-loading-animation"></div>
    </div>
</div>
`,Ie=`
.mobile-wallet-adapter-embedded-loading-indicator {
    display: flex; /* Use flexbox to center content */
    justify-content: center; /* Center horizontally */
    align-items: start; /* Center vertically */
    position: fixed; /* Stay in place */
    z-index: 1; /* Sit on top */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
    overflow-y: auto; /* enable scrolling */
}

.mobile-wallet-adapter-embedded-loading-container {
    display: flex;
    margin: auto;
}

.mobile-wallet-adapter-embedded-loading-animation {
    position: relative;
    left: -9999px;
    width: 10px;
    height: 10px;
    border-radius: 5px;
    background-color: var(--spinner-color);
    color: var(--spinner-color);
    box-shadow: 9984px 0 0 0 var(--spinner-color), 
                9999px 0 0 0 var(--spinner-color), 
                10014px 0 0 0 var(--spinner-color);
    animation: dot-typing 1.5s infinite linear;
}

@keyframes dot-typing {
    0% {
        box-shadow: 9984px 0 0 0 var(--spinner-color), 
                    9999px 0 0 0 var(--spinner-color), 
                    10014px 0 0 0 var(--spinner-color);
    }
    16.667% {
        box-shadow: 9984px -10px 0 0 var(--spinner-color), 
                    9999px 0 0 0 var(--spinner-color), 
                    10014px 0 0 0 var(--spinner-color);
    }
    33.333% {
        box-shadow: 9984px 0 0 0 var(--spinner-color), 
                    9999px 0 0 0 var(--spinner-color), 
                    10014px 0 0 0 var(--spinner-color);
    }
    50% {
        box-shadow: 9984px 0 0 0 var(--spinner-color), 
                    9999px -10px 0 0 var(--spinner-color), 
                    10014px 0 0 0 var(--spinner-color);
    }
    66.667% {
        box-shadow: 9984px 0 0 0 var(--spinner-color), 
                    9999px 0 0 0 var(--spinner-color), 
                    10014px 0 0 0 var(--spinner-color);
    }
    83.333% {
        box-shadow: 9984px 0 0 0 var(--spinner-color), 
                    9999px 0 0 0 var(--spinner-color), 
                    10014px -10px 0 0 var(--spinner-color);
    }
    100% {
        box-shadow: 9984px 0 0 0 var(--spinner-color), 
                    9999px 0 0 0 var(--spinner-color), 
                    10014px 0 0 0 var(--spinner-color);
    }
}
`,Le=class{#e=null;#t={};#n=!1;dom=null;constructor(){this.init=this.init.bind(this),this.#e=document.getElementById(`mobile-wallet-adapter-embedded-root-ui`)}async init(){console.log(`Injecting modal`),this.#r()}open=()=>{console.debug(`Modal open`),this.#i(),this.#e&&(this.#e.style.display=`flex`)};close=(e=void 0)=>{console.debug(`Modal close`),this.#a(),this.#e&&(this.#e.style.display=`none`),this.#t.close?.forEach(t=>t(e))};addEventListener(e,t){return this.#t[e]?.push(t)||(this.#t[e]=[t]),()=>this.removeEventListener(e,t)}removeEventListener(e,t){this.#t[e]=this.#t[e]?.filter(e=>t!==e)}#r(){if(this.dom)return;this.#e=document.createElement(`div`),this.#e.id=`mobile-wallet-adapter-embedded-root-ui`,this.#e.innerHTML=Fe,this.#e.style.display=`none`;let e=document.createElement(`style`);e.id=`mobile-wallet-adapter-embedded-modal-styles`,e.textContent=Ie;let t=document.createElement(`div`);this.dom=t.attachShadow({mode:`closed`}),t.style.setProperty(`--spinner-color`,`#FFFFFF`),this.dom.appendChild(e),this.dom.appendChild(this.#e),document.body.appendChild(t)}#i(){!this.#e||this.#n||([...this.#e.querySelectorAll(`[data-modal-close]`)].forEach(e=>e?.addEventListener(`click`,e=>{this.close(e)})),window.addEventListener(`load`,this.close),document.addEventListener(`keydown`,this.#o),this.#n=!0)}#a(){this.#n&&(window.removeEventListener(`load`,this.close),document.removeEventListener(`keydown`,this.#o),this.#e&&([...this.#e.querySelectorAll(`[data-modal-close]`)].forEach(e=>e?.removeEventListener(`click`,this.close)),this.#n=!1))}#o=e=>{e.key===`Escape`&&this.close(e)}},Re=class extends H{contentStyles=Be;contentHtml=ze;async initWithQR(e){super.init(),this.populateQRCode(e)}async populateQRCode(e){let t=this.dom?.getElementById(`mobile-wallet-adapter-embedded-modal-qr-code-container`);if(t){let n=await R.toCanvas(e,{width:200,margin:0});t.firstElementChild===null?t.appendChild(n):t.replaceChild(n,t.firstElementChild);let r=this.dom?.getElementById(`mobile-wallet-adapter-embedded-modal-qr-placeholder`);r&&(r.style.display=`none`)}else console.error(`QRCode Container not found`)}},ze=`
<div class="mobile-wallet-adapter-embedded-modal-qr-content">
    <div>
        <svg class="mobile-wallet-adapter-embedded-modal-icon" width="100%" height="100%">
            <circle r="52" cx="53" cy="53" fill="#99b3be" stroke="#000000" stroke-width="2"/>
            <path d="m 53,82.7305 c -3.3116,0 -6.1361,-1.169 -8.4735,-3.507 -2.338,-2.338 -3.507,-5.1625 -3.507,-8.4735 0,-3.3116 1.169,-6.1364 3.507,-8.4744 2.3374,-2.338 5.1619,-3.507 8.4735,-3.507 3.3116,0 6.1361,1.169 8.4735,3.507 2.338,2.338 3.507,5.1628 3.507,8.4744 0,3.311 -1.169,6.1355 -3.507,8.4735 -2.3374,2.338 -5.1619,3.507 -8.4735,3.507 z m 0.007,-5.25 c 1.8532,0 3.437,-0.6598 4.7512,-1.9793 1.3149,-1.3195 1.9723,-2.9058 1.9723,-4.7591 0,-1.8526 -0.6598,-3.4364 -1.9793,-4.7512 -1.3195,-1.3149 -2.9055,-1.9723 -4.7582,-1.9723 -1.8533,0 -3.437,0.6598 -4.7513,1.9793 -1.3148,1.3195 -1.9722,2.9058 -1.9722,4.7591 0,1.8527 0.6597,3.4364 1.9792,4.7512 1.3195,1.3149 2.9056,1.9723 4.7583,1.9723 z m -28,-33.5729 -3.85,-3.6347 c 4.1195,-4.025 8.8792,-7.1984 14.2791,-9.52 5.4005,-2.3223 11.2551,-3.4834 17.5639,-3.4834 6.3087,0 12.1634,1.1611 17.5639,3.4834 5.3999,2.3216 10.1596,5.495 14.2791,9.52 l -3.85,3.6347 C 77.2999,40.358 73.0684,37.5726 68.2985,35.5514 63.5292,33.5301 58.4296,32.5195 53,32.5195 c -5.4297,0 -10.5292,1.0106 -15.2985,3.0319 -4.7699,2.0212 -9.0014,4.8066 -12.6945,8.3562 z m 44.625,10.8771 c -2.2709,-2.1046 -4.7962,-3.7167 -7.5758,-4.8361 -2.7795,-1.12 -5.7983,-1.68 -9.0562,-1.68 -3.2579,0 -6.2621,0.56 -9.0125,1.68 -2.7504,1.1194 -5.2903,2.7315 -7.6195,4.8361 L 32.5189,51.15 c 2.8355,-2.6028 5.9777,-4.6086 9.4263,-6.0174 3.4481,-1.4087 7.133,-2.1131 11.0548,-2.1131 3.9217,0 7.5979,0.7044 11.0285,2.1131 3.43,1.4088 6.5631,3.4146 9.3992,6.0174 z"/>
        </svg>
        <div class="mobile-wallet-adapter-embedded-modal-title">Remote Mobile Wallet Adapter</div>
    </div>
    <div>
        <div>
            <h4 class="mobile-wallet-adapter-embedded-modal-qr-label">
                Open your wallet and scan this code
            </h4>
        </div>
        <div id="mobile-wallet-adapter-embedded-modal-qr-code-container" class="mobile-wallet-adapter-embedded-modal-qr-code-container">
            <div id="mobile-wallet-adapter-embedded-modal-qr-placeholder" class="mobile-wallet-adapter-embedded-modal-qr-placeholder"></div>
        </div>
    </div>
</div>
<div class="mobile-wallet-adapter-embedded-modal-divider"><hr></div>
<div class="mobile-wallet-adapter-embedded-modal-footer">
    <div class="mobile-wallet-adapter-embedded-modal-subtitle">
        Follow the instructions on your device. When you're finished, this screen will update.
    </div>
    <div class="mobile-wallet-adapter-embedded-modal-progress-badge">
        <div>
            <div class="spinner">
                <div class="leftWrapper">
                    <div class="left">
                        <div class="circle"></div>
                    </div>
                </div>
                <div class="rightWrapper">
                    <div class="right">
                        <div class="circle"></div>
                    </div>
                </div>
            </div>
        </div>
        <div>Waiting for scan</div>
    </div>
</div>
`,Be=`
.mobile-wallet-adapter-embedded-modal-qr-content {
    display: flex; 
    margin-top: 10px;
    padding: 10px;
}

.mobile-wallet-adapter-embedded-modal-qr-content > div:first-child {
    display: flex;
    flex-direction: column;
    flex: 2;
    margin-top: auto;
    margin-right: 30px;
}

.mobile-wallet-adapter-embedded-modal-qr-content > div:nth-child(2) {
    display: flex;
    flex-direction: column;
    flex: 1;
    margin-left: auto;
}

.mobile-wallet-adapter-embedded-modal-footer {
    display: flex;
    padding: 10px;
}

.mobile-wallet-adapter-embedded-modal-icon {}

.mobile-wallet-adapter-embedded-modal-title {
    color: #000000;
    font-size: 2.5em;
    font-weight: 600;
}

.mobile-wallet-adapter-embedded-modal-qr-label {
    text-align: right;
    color: #000000;
}

.mobile-wallet-adapter-embedded-modal-qr-code-container {
    margin-left: auto;
}

.mobile-wallet-adapter-embedded-modal-qr-placeholder {
    margin-left: auto;
    min-width: 200px;
    min-height: 200px;
    background: linear-gradient(-60deg, #F7F8F8 30%, #ECEEEE 50%, #F7F8F8 70%);
    background-size: 200%;
    animation: placeholderAnimate 2.7s linear infinite;
    border-radius: 12px;
}

.mobile-wallet-adapter-embedded-modal-divider {
    margin-top: 20px;
    padding-left: 10px;
    padding-right: 10px;
}

.mobile-wallet-adapter-embedded-modal-divider hr {
    border-top: 1px solid #D9DEDE;
}

.mobile-wallet-adapter-embedded-modal-subtitle {
    margin: auto;
    margin-right: 60px;
    padding: 20px;
    color: #6E8286;
}

.mobile-wallet-adapter-embedded-modal-progress-badge {
    display: flex;
    background: #F7F8F8;
    height: 56px;
    min-width: 200px;
    margin: auto;
    padding-left: 20px;
    padding-right: 20px;
    border-radius: 18px;
    color: #A8B6B8;
    align-items: center;
}

.mobile-wallet-adapter-embedded-modal-progress-badge > div:first-child {
    margin-left: auto;
    margin-right: 20px;
}

.mobile-wallet-adapter-embedded-modal-progress-badge > div:nth-child(2) {
    margin-right: auto;
}

/* Smaller screens */
@media all and (max-width: 600px) {
    .mobile-wallet-adapter-embedded-modal-card {
        text-align: center;
    }
    .mobile-wallet-adapter-embedded-modal-qr-content {
        flex-direction: column;
    }
    .mobile-wallet-adapter-embedded-modal-qr-content > div:first-child {
        margin: auto;
    }
    .mobile-wallet-adapter-embedded-modal-qr-content > div:nth-child(2) {
        margin: auto;
        flex: 2 auto;
    }
    .mobile-wallet-adapter-embedded-modal-footer {
        flex-direction: column;
    }
    .mobile-wallet-adapter-embedded-modal-icon {
        display: none;
    }
    .mobile-wallet-adapter-embedded-modal-title {
        font-size: 1.5em;
    }
    .mobile-wallet-adapter-embedded-modal-subtitle {
        margin-right: unset;
    }
    .mobile-wallet-adapter-embedded-modal-qr-label {
        text-align: center;
    }
    .mobile-wallet-adapter-embedded-modal-qr-code-container {
        margin: auto;
    }
    .mobile-wallet-adapter-embedded-modal-qr-placeholder {
        margin: auto;
    }
}

/* QR Placeholder */
@keyframes placeholderAnimate {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* Spinner */
@keyframes spinLeft {
    0% {
        transform: rotate(20deg);
    }
    50% {
        transform: rotate(160deg);
    }
    100% {
        transform: rotate(20deg);
    }
}
@keyframes spinRight {
    0% {
        transform: rotate(160deg);
    }
    50% {
        transform: rotate(20deg);
    }
    100% {
        transform: rotate(160deg);
    }
}
@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(2520deg);
    }
}

.spinner {
    position: relative;
    width: 1.5em;
    height: 1.5em;
    margin: auto;
    animation: spin 10s linear infinite;
}
.spinner::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
}
.right, .rightWrapper, .left, .leftWrapper {
    position: absolute;
    top: 0;
    overflow: hidden;
    width: .75em;
    height: 1.5em;
}
.left, .leftWrapper {
    left: 0;
}
.right {
    left: -12px;
}
.rightWrapper {
    right: 0;
}
.circle {
    border: .125em solid #A8B6B8;
    width: 1.25em; /* 1.5em - 2*0.125em border */
    height: 1.25em; /* 1.5em - 2*0.125em border */
    border-radius: 0.75em; /* 0.5*1.5em spinner size 8 */
}
.left {
    transform-origin: 100% 50%;
    animation: spinLeft 2.5s cubic-bezier(.2,0,.8,1) infinite;
}
.right {
    transform-origin: 100% 50%;
    animation: spinRight 2.5s cubic-bezier(.2,0,.8,1) infinite;
}
`,q=`data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik03IDIuNUgxN0MxNy44Mjg0IDIuNSAxOC41IDMuMTcxNTcgMTguNSA0VjIwQzE4LjUgMjAuODI4NCAxNy44Mjg0IDIxLjUgMTcgMjEuNUg3QzYuMTcxNTcgMjEuNSA1LjUgMjAuODI4NCA1LjUgMjBWNEM1LjUgMy4xNzE1NyA2LjE3MTU3IDIuNSA3IDIuNVpNMyA0QzMgMS43OTA4NiA0Ljc5MDg2IDAgNyAwSDE3QzE5LjIwOTEgMCAyMSAxLjc5MDg2IDIxIDRWMjBDMjEgMjIuMjA5MSAxOS4yMDkxIDI0IDE3IDI0SDdDNC43OTA4NiAyNCAzIDIyLjIwOTEgMyAyMFY0Wk0xMSA0LjYxNTM4QzEwLjQ0NzcgNC42MTUzOCAxMCA1LjA2MzEgMTAgNS42MTUzOFY2LjM4NDYyQzEwIDYuOTM2OSAxMC40NDc3IDcuMzg0NjIgMTEgNy4zODQ2MkgxM0MxMy41NTIzIDcuMzg0NjIgMTQgNi45MzY5IDE0IDYuMzg0NjJWNS42MTUzOEMxNCA1LjA2MzEgMTMuNTUyMyA0LjYxNTM4IDEzIDQuNjE1MzhIMTFaIiBmaWxsPSIjRENCOEZGIi8+Cjwvc3ZnPgo=`,J=`Mobile Wallet Adapter`,Y=`Remote Mobile Wallet Adapter`,X=[_,b,y,v],Ve=3e4;function Z(e){return e instanceof Error?e.message:`Unknown error`}var Q=class{#e={};#t=`1.0.0`;#n=J;#r=`https://solanamobile.com/wallets`;#i=q;#a;#o;#s;#c=!1;#l=0;#u=[];#d;#f;#p;#m;get version(){return this.#t}get name(){return this.#n}get url(){return this.#r}get icon(){return this.#i}get chains(){return this.#u}get features(){return{[x]:{version:`1.0.0`,connect:this.#v},[S]:{version:`1.0.0`,disconnect:this.#C},[C]:{version:`1.0.0`,on:this.#h},[y]:{version:`1.0.0`,signMessage:this.#j},[v]:{version:`1.0.0`,signIn:this.#M},...this.#f}}get accounts(){return this.#o?.accounts??[]}constructor(e){this.#s=e.authorizationCache,this.#a=e.appIdentity,this.#u=e.chains,this.#d=e.chainSelector,this.#p=e.onWalletNotFound,this.#m=e.nostrRelay,this.#f={[_]:{version:`1.0.0`,supportedTransactionVersions:[`legacy`,0],signAndSendTransaction:this.#k},[b]:{version:`1.0.0`,supportedTransactionVersions:[`legacy`,0],signTransaction:this.#A}}}get connected(){return!!this.#o}get isAuthorized(){return!!this.#o}get currentAuthorization(){return this.#o}get cachedAuthorizationResult(){return this.#s.get()}#h=(e,t)=>(this.#e[e]?.push(t)||(this.#e[e]=[t]),()=>this.#_(e,t));#g(e,...t){this.#e[e]?.forEach(e=>e.apply(null,t))}#_(e,t){this.#e[e]=this.#e[e]?.filter(e=>t!==e)}#v=async({silent:e}={})=>{if(this.#c||this.connected)return{accounts:this.accounts};this.#c=!0;try{if(e){let e=await this.#s.get();if(e)await this.#x(e.capabilities),await this.#b(e);else return{accounts:this.accounts}}else await this.#y()}catch(e){throw Error(Z(e),{cause:e})}finally{this.#c=!1}return{accounts:this.accounts}};#y=async e=>{try{let t=await this.#s.get();if(t)return this.#b(t),t;let n=await this.#d.select(this.#u);return await this.#w(async t=>{let[r,i]=await Promise.all([t.getCapabilities(),t.authorize({chain:n,identity:this.#a,sign_in_payload:e})]),a=this.#E(i.accounts),o={...i,accounts:a,chain:n,capabilities:r};return Promise.all([this.#x(r),this.#s.set(o),this.#b(o)]),o})}catch(e){throw Error(Z(e),{cause:e})}};#b=async e=>{let t=this.#o==null||this.#o?.accounts.length!==e.accounts.length||this.#o.accounts.some((t,n)=>t.address!==e.accounts[n].address);this.#o=e,t&&this.#g(`change`,{accounts:this.accounts})};#x=async e=>{let t=e.features.includes(`solana:signTransactions`),n=e.supports_sign_and_send_transactions,r=`solana:signAndSendTransaction`in this.features!==n||`solana:signTransaction`in this.features!==t;this.#f={...(n||!n&&!t)&&{"solana:signAndSendTransaction":{version:`1.0.0`,supportedTransactionVersions:[`legacy`,0],signAndSendTransaction:this.#k}},...t&&{"solana:signTransaction":{version:`1.0.0`,supportedTransactionVersions:[`legacy`,0],signTransaction:this.#A}}},r&&this.#g(`change`,{features:this.features})};#S=async(e,t,n)=>{try{let[r,i]=await Promise.all([this.#o?.capabilities??await e.getCapabilities(),e.authorize({auth_token:t,identity:this.#a,chain:n})]),a=this.#E(i.accounts),o={...i,accounts:a,chain:n,capabilities:r};Promise.all([this.#s.set(o),this.#b(o)])}catch(e){throw this.#C(),Error(Z(e),{cause:e})}};#C=async()=>{this.#s.clear(),this.#c=!1,this.#l++,this.#o=void 0,this.#g(`change`,{accounts:this.accounts})};#w=async e=>{let t=this.#o?.wallet_uri_base,i=t?{baseUri:t}:void 0,a=this.#l,o=new Le;try{let t=!0,a,c=await Pe(),u=await Promise.race([(async()=>{!c&&!this.#m&&await K()})().then(async()=>{o.init();let{wallet:n,close:r}=!c&&this.#m?await s({...i,connectionType:`local`,relayDomain:this.#m}):await l(i);t=!1,o.addEventListener(`close`,e=>{e&&r()}),o.open();let a=await e(await n);return o.close(),r(),a}),new Promise((e,i)=>{a=setTimeout(()=>{t&&i(new n(r.ERROR_ASSOCIATION_CANCELLED,`Wallet connection timed out`,{event:void 0}))},Ve)})]);return clearTimeout(a),u}catch(e){throw o.close(),this.#l!==a&&await new Promise(()=>{}),e instanceof Error&&e.name===`SolanaMobileWalletAdapterError`&&e.code===`ERROR_WALLET_NOT_FOUND`&&await this.#p(this),e}};#T=()=>{if(!this.#o)throw Error(`Wallet not connected`);return{authToken:this.#o.auth_token,chain:this.#o.chain}};#E=e=>e.map(e=>{let t=i(e.address);return{address:u(t),publicKey:t,label:e.label,icon:e.icon,chains:e.chains??this.#u,features:e.features??X}});#D=async e=>{let{authToken:t,chain:n}=this.#T();try{let r=e.map(e=>o(e));return await this.#w(async e=>(await this.#S(e,t,n),(await e.signTransactions({payloads:r})).signed_payloads.map(i)))}catch(e){throw Error(Z(e),{cause:e})}};#O=async(e,t)=>{let{authToken:n,chain:r}=this.#T();try{return await this.#w(async a=>{let[s]=await Promise.all([a.getCapabilities(),this.#S(a,n,r)]);if(s.supports_sign_and_send_transactions){let n=o(e);return(await a.signAndSendTransactions({...t,payloads:[n]})).signatures.map(i)[0]}throw Error(`connected wallet does not support signAndSendTransaction`)})}catch(e){throw Error(Z(e),{cause:e})}};#k=async(...e)=>{let t=[];for(let n of e){let e=await this.#O(n.transaction,n.options);t.push({signature:e})}return t};#A=async(...e)=>(await this.#D(e.map(({transaction:e})=>e))).map(e=>({signedTransaction:e}));#j=async(...e)=>{let{authToken:t,chain:n}=this.#T(),r=e.map(({account:e})=>o(new Uint8Array(e.publicKey))),a=e.map(({message:e})=>o(e));try{return await this.#w(async e=>(await this.#S(e,t,n),(await e.signMessages({addresses:r,payloads:a})).signed_payloads.map(i).map(e=>({signedMessage:e,signature:e.slice(-64)}))))}catch(e){throw Error(Z(e),{cause:e})}};#M=async(...e)=>{let t=[];if(e.length>1)for(let n of e)t.push(await this.#N(n));else return[await this.#N(e[0])];return t};#N=async e=>{this.#c=!0;try{let t=await this.#y({...e,domain:e?.domain??window.location.host});if(!t.sign_in_result)throw Error(`Sign in failed, no sign in result returned by wallet`);let n=t.sign_in_result.address,r=t.accounts.find(e=>e.address==n);return{account:{...r??{address:u(i(n))},publicKey:i(n),chains:r?.chains??this.#u,features:r?.features??t.capabilities.features},signedMessage:i(t.sign_in_result.signed_message),signature:i(t.sign_in_result.signature)}}catch(e){throw Error(Z(e),{cause:e})}finally{this.#c=!1}}},$=class{#e={};#t=`1.0.0`;#n=Y;#r=`https://solanamobile.com/wallets`;#i=q;#a;#o;#s;#c=!1;#l=0;#u=[];#d;#f;#p;#m;#h;get version(){return this.#t}get name(){return this.#n}get url(){return this.#r}get icon(){return this.#i}get chains(){return this.#u}get features(){return{[x]:{version:`1.0.0`,connect:this.#y},[S]:{version:`1.0.0`,disconnect:this.#w},[C]:{version:`1.0.0`,on:this.#g},[y]:{version:`1.0.0`,signMessage:this.#M},[v]:{version:`1.0.0`,signIn:this.#N},...this.#f}}get accounts(){return this.#o?.accounts??[]}constructor(e){this.#s=e.authorizationCache,this.#a=e.appIdentity,this.#u=e.chains,this.#d=e.chainSelector,this.#m=`remoteHostAuthority`in e?{kind:`reflector`,domain:e.remoteHostAuthority}:{kind:`nostr`,domain:e.nostrRelay},this.#p=e.onWalletNotFound,this.#f={[_]:{version:`1.0.0`,supportedTransactionVersions:[`legacy`,0],signAndSendTransaction:this.#A},[b]:{version:`1.0.0`,supportedTransactionVersions:[`legacy`,0],signTransaction:this.#j}}}get connected(){return!!this.#h&&!!this.#o}get isAuthorized(){return!!this.#o}get currentAuthorization(){return this.#o}get cachedAuthorizationResult(){return this.#s.get()}#g=(e,t)=>(this.#e[e]?.push(t)||(this.#e[e]=[t]),()=>this.#v(e,t));#_(e,...t){this.#e[e]?.forEach(e=>e.apply(null,t))}#v(e,t){this.#e[e]=this.#e[e]?.filter(e=>t!==e)}#y=async(e={})=>{if(this.#c||this.connected)return{accounts:this.accounts};this.#c=!0;try{await this.#b()}catch(e){throw Error(Z(e),{cause:e})}finally{this.#c=!1}return{accounts:this.accounts}};#b=async e=>{try{let t=await this.#s.get();if(t)return this.#x(t),t;this.#h&&=void 0;let n=await this.#d.select(this.#u);return await this.#T(async t=>{let[r,i]=await Promise.all([t.getCapabilities(),t.authorize({chain:n,identity:this.#a,sign_in_payload:e})]),a=this.#D(i.accounts),o={...i,accounts:a,chain:n,capabilities:r};return Promise.all([this.#S(r),this.#s.set(o),this.#x(o)]),o})}catch(e){throw Error(Z(e),{cause:e})}};#x=async e=>{let t=this.#o==null||this.#o?.accounts.length!==e.accounts.length||this.#o.accounts.some((t,n)=>t.address!==e.accounts[n].address);this.#o=e,t&&this.#_(`change`,{accounts:this.accounts})};#S=async e=>{let t=e.features.includes(`solana:signTransactions`),n=e.supports_sign_and_send_transactions||e.features.includes(`solana:signAndSendTransaction`),r=`solana:signAndSendTransaction`in this.features!==n||`solana:signTransaction`in this.features!==t;this.#f={...n&&{"solana:signAndSendTransaction":{version:`1.0.0`,supportedTransactionVersions:e.supported_transaction_versions,signAndSendTransaction:this.#A}},...t&&{"solana:signTransaction":{version:`1.0.0`,supportedTransactionVersions:e.supported_transaction_versions,signTransaction:this.#j}}},r&&this.#_(`change`,{features:this.features})};#C=async(e,t,n)=>{try{let[r,i]=await Promise.all([this.#o?.capabilities??await e.getCapabilities(),e.authorize({auth_token:t,identity:this.#a,chain:n})]),a=this.#D(i.accounts),o={...i,accounts:a,chain:n,capabilities:r};Promise.all([this.#s.set(o),this.#x(o)])}catch(e){throw this.#w(),Error(Z(e),{cause:e})}};#w=async()=>{this.#h?.close(),this.#s.clear(),this.#c=!1,this.#l++,this.#o=void 0,this.#h=void 0,this.#_(`change`,{accounts:this.accounts})};#T=async e=>{let t=this.#o?.wallet_uri_base,n=t?{baseUri:t}:void 0,r=this.#l,i=new Re;if(this.#h)return e(this.#h.wallet);try{i.init(),i.open();let{associationUrl:t,close:r,wallet:a}=this.#m.kind==`reflector`?await c({...n,remoteHostAuthority:this.#m.domain}):await s({...n,connectionType:`remote`,relayDomain:this.#m.domain}),o=i.addEventListener(`close`,e=>{e&&r()});return i.populateQRCode(t.toString()),this.#h={close:r,wallet:await a},o(),i.close(),await e(this.#h.wallet)}catch(e){throw i.close(),this.#l!==r&&await new Promise(()=>{}),e instanceof Error&&e.name===`SolanaMobileWalletAdapterError`&&e.code===`ERROR_WALLET_NOT_FOUND`&&await this.#p(this),e}};#E=()=>{if(!this.#o)throw Error(`Wallet not connected`);return{authToken:this.#o.auth_token,chain:this.#o.chain}};#D=e=>e.map(e=>{let t=i(e.address);return{address:u(t),publicKey:t,label:e.label,icon:e.icon,chains:e.chains??this.#u,features:e.features??X}});#O=async e=>{let{authToken:t,chain:n}=this.#E();try{return await this.#T(async r=>(await this.#C(r,t,n),(await r.signTransactions({payloads:e.map(o)})).signed_payloads.map(i)))}catch(e){throw Error(Z(e),{cause:e})}};#k=async(e,t)=>{let{authToken:n,chain:r}=this.#E();try{return await this.#T(async a=>{let[s]=await Promise.all([a.getCapabilities(),this.#C(a,n,r)]);if(s.supports_sign_and_send_transactions)return(await a.signAndSendTransactions({...t,payloads:[o(e)]})).signatures.map(i)[0];throw Error(`connected wallet does not support signAndSendTransaction`)})}catch(e){throw Error(Z(e),{cause:e})}};#A=async(...e)=>{let t=[];for(let n of e){let e=await this.#k(n.transaction,n.options);t.push({signature:e})}return t};#j=async(...e)=>(await this.#O(e.map(({transaction:e})=>e))).map(e=>({signedTransaction:e}));#M=async(...e)=>{let{authToken:t,chain:n}=this.#E(),r=e.map(({account:e})=>o(new Uint8Array(e.publicKey))),a=e.map(({message:e})=>o(e));try{return await this.#T(async e=>(await this.#C(e,t,n),(await e.signMessages({addresses:r,payloads:a})).signed_payloads.map(i).map(e=>({signedMessage:e,signature:e.slice(-64)}))))}catch(e){throw Error(Z(e),{cause:e})}};#N=async(...e)=>{let t=[];if(e.length>1)for(let n of e)t.push(await this.#P(n));else return[await this.#P(e[0])];return t};#P=async e=>{this.#c=!0;try{let t=await this.#b({...e,domain:e?.domain??window.location.host});if(!t.sign_in_result)throw Error(`Sign in failed, no sign in result returned by wallet`);let n=t.sign_in_result.address,r=t.accounts.find(e=>e.address==n);return{account:{...r??{address:u(i(n))},publicKey:i(n),chains:r?.chains??this.#u,features:r?.features??t.capabilities.features},signedMessage:i(t.sign_in_result.signed_message),signature:i(t.sign_in_result.signature)}}catch(e){throw Error(Z(e),{cause:e})}finally{this.#c=!1}}};function He(e){if(typeof window>`u`){console.warn(`MWA not registered: no window object`);return}if(!window.isSecureContext){console.warn(`MWA not registered: secure context required (https)`);return}let t=navigator.userAgent;Ae()&&(!Me(t)||G(t))?h(new Q(e)):je()&&(`nostrRelay`in e||e.remoteHostAuthority!==void 0)?`nostrRelay`in e?h(new $({...e,nostrRelay:e.nostrRelay})):h(new $({...e,remoteHostAuthority:e.remoteHostAuthority})):console.warn(`MWA not registered: device or environment not supported`)}export{Q as LocalSolanaMobileWalletAdapterWallet,$ as RemoteSolanaMobileWalletAdapterWallet,Y as SolanaMobileWalletAdapterRemoteWalletName,J as SolanaMobileWalletAdapterWalletName,B as createDefaultAuthorizationCache,V as createDefaultChainSelector,xe as createDefaultWalletNotFoundHandler,U as defaultErrorModalWalletNotFoundHandler,He as registerMwa};