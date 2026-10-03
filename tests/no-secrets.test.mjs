import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

async function walk(dir){
  const out=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const p=join(dir,entry.name);
    if(entry.isDirectory()) out.push(...await walk(p)); else out.push(p);
  }
  return out;
}

test('frontend não contém padrões de chaves privadas conhecidas', async()=>{
  const files=(await walk(new URL('../js/',import.meta.url).pathname)).filter(f=>/\.(js|html|css)$/.test(f));
  const forbidden=[/gsk_[A-Za-z0-9_-]{20,}/, /client_id=[A-Za-z0-9_-]{20,}/, /UNSPLASH_ACCESS_KEY\s*=\s*['"][^'"]{10,}/];
  for(const file of files){
    const content=await readFile(file,'utf8');
    for(const pattern of forbidden) assert.equal(pattern.test(content),false,`Possível segredo em ${file}: ${pattern}`);
  }
});
