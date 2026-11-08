const ALPHABET='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function decode(string){
 if(typeof string!=='string'||!string.length)throw Error('Endereço inválido.');
 const bytes=[0];
 for(let i=0;i<string.length;i++){
  const value=ALPHABET.indexOf(string[i]);
  if(value<0)throw Error('Endereço inválido.');
  for(let j=0;j<bytes.length;j++)bytes[j]*=58;
  bytes[0]+=value;
  let carry=0;
  for(let j=0;j<bytes.length;j++){
   bytes[j]+=carry;
   carry=bytes[j]>>8;
   bytes[j]&=255;
  }
  while(carry){bytes.push(carry&255);carry>>=8;}
 }
 // O zero inicial do acumulador já representa um '1'. Os demais '1' são bytes zero à esquerda.
 for(let i=0;i<string.length-1&&string[i]==='1';i++)bytes.push(0);
 return Buffer.from(bytes.reverse());
}
function encode(buffer){
 const source=Buffer.isBuffer(buffer)?buffer:Buffer.from(buffer);
 if(!source.length)return '';
 const digits=[0];
 for(let i=0;i<source.length;i++){
  let carry=source[i];
  for(let j=0;j<digits.length;j++){
   const x=digits[j]*256+carry;
   digits[j]=x%58;
   carry=(x/58)|0;
  }
  while(carry){digits.push(carry%58);carry=(carry/58)|0;}
 }
 // O dígito zero do acumulador já vira um '1'. Cada byte zero anterior a ele entra à parte.
 for(let i=0;i<source.length-1&&source[i]===0;i++)digits.push(0);
 return digits.reverse().map(d=>ALPHABET[d]).join('');
}
module.exports={decode,encode};
