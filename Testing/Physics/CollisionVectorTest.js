//TODO improve \/
//efficency (3/5/19): 3.9ms/update @ 500 entities
//    ||    (4/5/19): 2.8ms/update @ 500 entities

const   mPi = Math.PI,
        mPow = Math.pow,
        mSqrt = Math.sqrt,
        mAbs = Math.abs;


var canvas,_Ent=[],c;
function onload(){
    canvas = document.getElementById('gameCanvas');
    clear();
    c = canvas.getContext('2d');
    generateEntities(500);
    godmode=true;   //TODO fix

    setInterval(update, 50);
}    

function generateEntities(num){
    var lastEid=0;
    if(_Ent.length>0) lastEid = _Ent[_Ent.length-1].id;
    
    for(var i = lastEid+1; i<=lastEid+num; i++){
        _Ent.push({
            id:i,
            health: Math.random() * 1000,
            dmg: Math.random() * 10,
            m:Math.random() * 20 + 5,
            x:winX*(1/2-Math.random()),
            y:winY*(1/2-Math.random()),
            vx:4*(1/2-Math.random()),
            vy:4*(1/2-Math.random())
        })
    }
}

var winX,winY;
function clear(){
    winX = (canvas.width=window.innerWidth);
    winY = (canvas.height=window.innerHeight);
}


var showtime = 0;
var avgover = 40;
var updatetimeavg = [];
var doclear = true,godmode=false;
function update(){
    var updateStart = Date.now();

    if(doclear)clear();
    c.translate(winX/2,winY/2);
    c.beginPath();
    _Ent = _Ent.filter((ent, index)=>{
        if(ent.health<=0 && !godmode) return false;
        ent.x+=ent.vx;
        ent.y+=ent.vy;

        //Viscous medium
        ent.vx*=0.9995;
        ent.vy*=0.9995;
        
        //speed limits
        if(ent.vx>10) ent.vx = 10;
        if(ent.vy>10) ent.vy= 10;
        if(ent.vx<-10) ent.vx = -10;
        if(ent.vy<-10) ent.vy= -10;

        c.moveTo(ent.x+ent.m,ent.y);
        c.arc(ent.x,ent.y,ent.m,0,mPi*2);

        //confine to window
        if((ent.x>winX/2 && ent.vx>0)||ent.x<-winX/2 && ent.vx<0){
            ent.vx = -ent.vx;
        }else if((ent.y>winY/2 && ent.vy>0)||(ent.y<-winY/2 && ent.vy<0)){
            ent.vy = -ent.vy;
        }

        //Other bodies
        for(var i = index+1; i<_Ent.length; i++){
            var ent2 = _Ent[i];
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
    c.fillStyle = "blue";
    c.fill();
    c.strokeStyle = "black";
    c.stroke();

    c.font = "20px Arial";
    c.fillStyle = "red";
    c.fillText(`Entity count: ${_Ent.length}`, 0, 0);

    c.translate(-winX/2,-winY/2);
    //update timer
    showtime++;
    updatetimeavg[showtime%avgover] = Date.now()-updateStart;
    if(showtime%avgover + 1==avgover){
        var avgtime=0;
        updatetimeavg.forEach(udt=>{avgtime+=udt;})
        
        console.log(`update time (average over ${avgover}) ${avgtime/=avgover}ms`);
    }
}

