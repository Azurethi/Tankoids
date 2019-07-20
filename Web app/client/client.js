const l = console.log,
      mPi = Math.PI,
      mPow = Math.pow,
      mSqrt = Math.sqrt,
      mAbs = Math.abs,
      soc = io();

var canvas,c,ents=[];

soc.on('connect_error', data=>{
    l("soc: connection error ("+data+")");
});

soc.on('setEntities', data=>{
    l("soc: setEntities");
    ents = data;
});

function onload(){
    l("Tankoidz Loaded!");
    
    canvas = document.getElementById("gameCanvas");

    //TODO add listeners
    c = canvas.getContext('2d');
    clear();
    //setInterval(keepalive,1000);  TODO?
    canvas.addEventListener('mousedown', handlers.mousedown);
    canvas.addEventListener('mouseup', handlers.mouseup);
    canvas.addEventListener('mouseout', handlers.mouseup);
    canvas.addEventListener('mousemove', handlers.mousemove);
    window.addEventListener('keydown', handlers.keydown);
    window.addEventListener('keyup', handlers.keyup);
    setInterval(draw, 30);
}

var ourX=0,ourY=0; //TODO get from our entity
var maxX = 5000, maxY = 5000;

function draw(){
    clear();
    update();   //TODO merge draw & update clientside

    //draw grid
    c.beginPath();
    for(var gx=-ourX%25; gx<winX; gx+=25){
        c.moveTo(gx,0);
        c.lineTo(gx,winY);
    }
    for(var gy=-ourY%25; gy<winY; gy+=25){
        c.moveTo(0,gy);
        c.lineTo(winX,gy);
    }
    c.strokeStyle="#1d1d1d";
    c.stroke();



    c.translate(-ourX,-ourY); //move to current player position
    //draw bounds
    c.beginPath();
    c.moveTo(-maxX/2,-maxY/2);
    c.lineTo(+maxX/2,-maxY/2);
    c.lineTo(+maxX/2,+maxY/2);
    c.lineTo(-maxX/2,+maxY/2);
    c.lineTo(-maxX/2,-maxY/2);
    c.strokeStyle="#999999";
    c.stroke();
    
    ents.forEach(ent=>{
        c.beginPath();
        c.arc(ent.x,ent.y,ent.m,0,mPi*2);
        c.fillStyle = "#D44A1C77";
        if(ent.col){
            c.fillStyle = "#00ace577";
        }
        
        c.fill();
        c.strokeStyle = "black";
        c.stroke();
    });
    c.translate(ourX,ourY);
}

var winX,winY;
function clear(){
    winX = (canvas.width=window.innerWidth);
    winY = (canvas.height=window.innerHeight);
    c.fillStyle="#000000";
    c.fillRect(0,0,winX,winY);
}


function update(){
    ents = ents.filter((ent, index)=>{
        //if(ent.health<=0 && !godmode) return false;
        ent.x+=ent.vx;
        ent.y+=ent.vy;

        //confine to bounds
        if(((ent.x+ent.m)>maxX/2 && ent.vx>0)||(ent.x-ent.m)<-maxX/2 && ent.vx<0){
            ent.vx = -ent.vx;
        }else if(((ent.y+ent.m)>maxY/2 && ent.vy>0)||((ent.y-ent.m)<-maxY/2 && ent.vy<0)){
            ent.vy = -ent.vy;
        }

        //Viscous medium
        ent.vx*=0.9995;
        ent.vy*=0.9995;

        //TODO tank controls (not just udrl)
        if(keyW) ourY-=0.005;
        if(keyA) ourX-=0.005;
        if(keyS) ourY+=0.005;
        if(keyD) ourX+=0.005;
        
        //speed limits
        if(ent.vx>10) ent.vx = 10;
        if(ent.vy>10) ent.vy= 10;
        if(ent.vx<-10) ent.vx = -10;
        if(ent.vy<-10) ent.vy= -10;

        //confine to window
        //if((ent.x>ourX/2 && ent.vx>0)||ent.x<-ourX/2 && ent.vx<0){
        //    ent.vx = -ent.vx;
        //}else if((ent.y>ourY/2 && ent.vy>0)||(ent.y<-ourY/2 && ent.vy<0)){
        //    ent.vy = -ent.vy;
        //}

        //Other bodies
        for(var i = index+1; i<ents.length; i++){
            var ent2 = ents[i];
            var dx=ent2.x-ent.x;
            var dy=ent2.y-ent.y;
            var dist=mSqrt(mPow(dx,2)+mPow(dy,2));
            
            if(dist<=ent2.m+ent.m){
                
                var dyOdx = dy/dx;
                var vyOvx = ent.vy/ent.vx;
                var vyOvx2 = ent2.vy/ent2.vx;

                var mCatdyOdx = 1/(mSqrt(1+mPow(dyOdx,2)));
                var dxlss0 = (dx<0?-1:1);

                var sumO2 = mAbs(
                    mCatdyOdx*(
                        mSqrt((mPow(ent.vx,2)+mPow(ent.vy,2))/(1+mPow(vyOvx,2)))*(ent.vx<0?-1:1)*(dxlss0*(1+(dyOdx)-(vyOvx))+(vyOvx)*(dyOdx))
                        + 
                        mSqrt((mPow(ent2.vx,2)+mPow(ent2.vy,2))/(1+mPow(vyOvx2,2)))*dxlss0*(ent2.vx<0?1:-1)*((dyOdx)-(vyOvx2))
                        )
                    )*0.25; 

                var sinT =sumO2*dxlss0*mCatdyOdx/(ent.m+ent2.m);
                var cosT =sumO2*dxlss0*dyOdx*mCatdyOdx/(ent.m+ent2.m);

                ent.vx-=sinT*ent2.m;
                ent.vy-=cosT*ent2.m;
                ent2.vx+=sinT*ent.m;
                ent2.vy+=cosT*ent.m;

                ent.health -= ent2.dmg;
                ent2.health -= ent.dmg;
            }
        }
        return true;
    });
}

var 
    keyW=false,
    keyA=false,
    keyS=false,
    keyD=false,
    keySp=false;
const handlers={
    mousedown: (e)=>{
        click=true;
    },
    mouseup: (e)=>{
        click=false;
    },
    keydown: (e)=>{
        switch(e.code){
            case "KeyW": keyW=true;   break;
            case "KeyA": keyA=true;   break;    
            case "KeyS": keyS=true;   break;
            case "KeyD": keyD=true;   break;
            case "Space": keySp=true;   break;
        }
    },
    keyup: (e)=>{
        switch(e.code){
            case "KeyW": keyW=false;   break;
            case "KeyA": keyA=false;   break;    
            case "KeyS": keyS=false;   break;
            case "KeyD": keyD=false;   break;
            case "Space": keySp=false;   break;
        }
    },
    mousemove: (e)=>{
        curX=e.clientX;
        curY=e.clientY;
    }
};