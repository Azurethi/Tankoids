const l = console.log,
      mPi = Math.PI,
      mPow = Math.pow,
      mSqrt = Math.sqrt,
      mAbs = Math.abs,
      soc = io();

var canvas,c,ents=[];

soc.on('setEntities', data=>{
    ents = data;
});

function onload(){
    l("Tankoidz Loaded!");
    
    canvas = document.getElementById("gameCanvas");
    clear();
    //TODO add listeners
    c = canvas.getContext('2d');

    //setInterval(keepalive,1000);  TODO?
    setInterval(draw, 20);
}

function draw(){
    clear();
    c.translate(winX/2,winY/2); //move to current player position (currently just moves 0,0 to center of window)
    c.beginPath();
    ents.forEach(ent=>{
        c.moveTo(ent.x+ent.m,ent.y);
        c.arc(ent.x,ent.y,ent.m,0,mPi*2);
    });
    c.fillStyle = "blue";
    c.fill();
    c.strokeStyle = "black";
    c.stroke();
    c.translate(-winX/2,-winY/2);
}

var winX,winY;
function clear(){
    winX = (canvas.width=window.innerWidth);
    winY = (canvas.height=window.innerHeight);
}
