const l = console.log;

const soc=io();
var globalticks=0;

var _Ent = {};

var canvas,c,xMax,yMax;
function onLoad(){
    l("Tankoidz Loaded!");
    
    canvas = document.getElementById("gameCanvas");
    clear();
    //TODO add listeners
    c = canvas.getContext('2d');

    //setInterval(keepalive,1000);  TODO?

    const targetFps = 60;   //TODO change?
    setInterval(update,1000/targetFps);
}

function update(){
    globalticks++;
    clear();
    drawGrid();
    drawEntities();
}

function drawEntities(){
    Object.keys(_Ent).forEach(key=>{  //Move _Ent to an array rather than elm shit
        var ent = _Ent[key];
        drawSimple(ent);
    });
}

function drawSimple(ent){
    c.beginPath();
    c.arc(ent.x-ourX+xMax/2,ent.y-ourY+yMax/2,ent.r,0,2*Math.PI);
    c.fillStyle = "red";
    c.fill();
    c.strokeStyle = "black";
    c.stroke();
}


var ourX=0,ourY=0; //TODO Update these vars
function drawGrid(){
    c.beginPath();
    for(var x=-ourX%25; x<xMax; x+=25){
        c.moveTo(x,0);
        c.lineTo(x,yMax);
    }
    for(var y=-ourY%25; y<yMax; y+=25){
        c.moveTo(0,y);
        c.lineTo(xMax,y);
    }
    c.strokeStyle="#E0E0E0";
    c.stroke();
}

function clear(){
    xMax=(canvas.width=window.innerWidth);
    yMax=(canvas.height=window.innerHeight);
}

soc.on('setEntities',(entarr)=>{_Ent = entarr;});
soc.on('updateEntity',(ent)=>{
    _Ent[ent.id] = ent;
});
soc.on('removeEntity',(ent)=>{
    if(_Ent[ent.id]){
        delete _Ent[ent.id];
    }else{
        l(`server asked to delete non existant entity (${ent.id})`);
    }
});



const lastticks=0;
function keepalive(){
    soc.emit('keepalive', globalticks-lastticks);
    lastticks=globalticks;
}