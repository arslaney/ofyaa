import {build} from 'esbuild';
import {compile,optimize} from '@tailwindcss/node';
import {readFile,writeFile} from 'node:fs/promises';
await build({entryPoints:['src/studio/main.tsx'],outfile:'studio/cards.js',bundle:true,minify:true,format:'iife',target:['es2022'],jsx:'automatic',alias:{'@':process.cwd()},define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof'});
const css=await readFile('src/studio/cards.css','utf8');
const compiler=await compile(css,{base:process.cwd()+'/src/studio',onDependency(){}});
const built=compiler.build(['tw:grid','tw:grid-cols-12','tw:gap-4','tw:col-span-12']);
await writeFile('studio/cards.css',optimize(built,{minify:true}).code);
