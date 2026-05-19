/* ==================================================
FILE : backend/src/tasks/image-storage-monitor.task.ts
ROOT : C:\Users\kjm\social-platform\backend\src\tasks\image-storage-monitor.task.ts

STATUS : MANUAL ADMIN STORAGE MONITOR

POLICY :

AUTO RUN 금지
INTERVAL 금지
SERVER START 금지

ADMIN ONLY EXECUTION

================================================== */

import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()

export class ImageStorageMonitorTask {

private running=false;

/* ==============================
파일 재귀 수집
============================== */

private collectFiles(

dir:string,
list:string[]=[]

){

let entries:string[];

try{

entries=
fs.readdirSync(dir);

}catch{

return list;

}

entries.forEach(entry=>{

const fullPath=
path.join(dir,entry);

let stat;

try{

stat=
fs.statSync(fullPath);

}catch{

return;

}

if(stat.isDirectory()){

this.collectFiles(
fullPath,
list
);

}

else if(stat.isFile()){

list.push(fullPath);

}

});

return list;

}

/* ==============================
ADMIN ONLY STORAGE CHECK
============================== */

public checkStorage(){

if(this.running)return;

this.running=true;

try{

const uploadsPath=

path.join(
process.cwd(),
'uploads'
);

if(!fs.existsSync(uploadsPath)){

console.log(
'uploads 폴더 없음'
);

return;

}

const files=

this.collectFiles(
uploadsPath
);

let totalSize=0;

files.forEach(file=>{

try{

const stat=
fs.statSync(file);

totalSize+=stat.size;

}catch{}

});

const sizeMB=
totalSize/1024/1024;

const sizeGB=
sizeMB/1024;

if(sizeGB>=1){

console.log(

`UPLOAD STORAGE:
${sizeGB.toFixed(2)} GB
FILES ${files.length}`

);

}else{

console.log(

`UPLOAD STORAGE:
${sizeMB.toFixed(2)} MB
FILES ${files.length}`

);

}

if(sizeMB>5000){

console.warn(
'uploads storage over 5GB'
);

}

}catch(err){

console.error(
'storage monitor error',
err
);

}

finally{

this.running=false;

}

}

}