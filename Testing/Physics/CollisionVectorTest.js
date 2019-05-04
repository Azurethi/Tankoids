//TODO improve \/
//efficency (3/5/19): 3.9ms/update @ 500 entities

const   mSin = Math.sin,
        mCos = Math.cos,
        maTan = Math.atan,
        mPi = Math.PI,
        mPow = Math.pow,
        mSqrt = Math.sqrt,
        mAbs = Math.abs,
        mCaT = (x) =>{return 1/(Math.sqrt(1+Math.pow(x,2)))},
        mSaT = (x) =>{return x/(Math.sqrt(1+Math.pow(x,2)))};


var canvas,_Ent=[],c;
function onload(){
    canvas = document.getElementById('gameCanvas');
    clear();
    c = canvas.getContext('2d');
    generateEntities(100);
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

    var vecDrawScale = 50;
    if(doclear)clear();
    c.translate(winX/2,winY/2);
    c.beginPath();
    _Ent = _Ent.filter(ent=>{
        if(ent.health<=0 && !godmode) return false;   //TODO re-enable death!
        ent.x+=ent.vx;
        ent.y+=ent.vy;

        //Viscous medium
        ent.vx*=0.9995;
        ent.vy*=0.9995;
        
        c.moveTo(ent.x+ent.m,ent.y);
        c.arc(ent.x,ent.y,ent.m,0,mPi*2);

        //confine to window
        if((ent.x>winX/2 && ent.vx>0)||ent.x<-winX/2 && ent.vx<0){
            ent.vx = -ent.vx;
        }else if((ent.y>winY/2 && ent.vy>0)||(ent.y<-winY/2 && ent.vy<0)){
            ent.vy = -ent.vy;
        }

        

        //Other bodies
        _Ent.forEach(ent2=>{
            if(ent2.id>ent.id){
                collide(ent,ent2);
            }
        });
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

function collide(ent,ent2){
    var dx=ent2.x-ent.x;
    var dy=ent2.y-ent.y;
    var dist=mSqrt(mPow(dx,2)+mPow(dy,2));
    
    if(dist-ent.m-ent2.m<=0){
        //angle to other body
        var theta =mPi/2+(dx<0?mPi:0)-maTan(dy/dx);

        //momentum towards other body.
        //var ourv=mSqrt(mPow(ent.vx,2)+mPow(ent.vy,2))*mSin(mPi/2+(ent.vx<0?mPi:0) - maTan(ent.vy/ent.vx)-theta);
        //var teyv=mSqrt(mPow(ent2.vx,2)+mPow(ent2.vy,2))*mCos(mPi/2+(ent2.vx<0?mPi:0) - maTan(ent2.vy/ent2.vx)-theta);
        
        //var ovs=mCos((ent.vx<0?mPi:0) - maTan(ent.vy/ent.vx)-theta);//NB: remove Q<0 term in our/teyv
        //var tvs=mSin((ent2.vx<0?-mPi:-2*mPi) - maTan(ent2.vy/ent2.vx)-theta); //NB: remove Q<0 term in our/teyv
        //var ovs=mCos(maTan(ent.vy/ent.vx)+theta)+mSin(maTan(ent.vy/ent.vx)+theta);
        //var tvs=mCos(maTan(ent2.vy/ent2.vx)+theta);
        //var ovs=mSin(theta+mPi/4) - (ent.vy/ent.vx)*mSin(theta-mPi/4);
        //var tvs=(mCos(theta)-(ent2.vy/ent2.vx)*mSin(theta));

        //var ovs=mSin((dx<0?7*mPi/4:3*mPi/4)-maTan(dy/dx)) + (ent.vy/ent.vx)*mSin((dx<0?-7*mPi/4:-mPi/4)+maTan(dy/dx));
        //var tvs=mSin(maTan(dy/dx)+(dx<0?-mPi:0))-(ent2.vy/ent2.vx)*mCos((dx<0?mPi:0)-maTan(dy/dx));

        var ovs=mSin((dx<0?7*mPi/4:3*mPi/4)-maTan(dy/dx)) + (ent.vy/ent.vx)*mSin((dx<0?-7*mPi/4:-mPi/4)+maTan(dy/dx));  //TODO expand & tidy
        var tvs=mSin(maTan(dy/dx)+(dx<0?-mPi:0))-(ent2.vy/ent2.vx)*mCos((dx<0?mPi:0)-maTan(dy/dx));                     //TODO expand & tidy

        var ourv=mSqrt(mPow(ent.vx,2)+mPow(ent.vy,2))*(ent.vx<0?-1:1)*mCaT(ent.vy/ent.vx)*mSqrt(2)*ovs;
        var teyv=mSqrt(mPow(ent2.vx,2)+mPow(ent2.vy,2))*(ent2.vx<0?1:-1)*mCaT(ent2.vy/ent2.vx)*tvs;

        var sumO2 = mAbs(ourv + teyv)*0.25; 
        
        ent.vx-=sumO2*mSin(theta)*ent2.m/(ent.m+ent2.m);
        ent.vy-=sumO2*mCos(theta)*ent2.m/(ent.m+ent2.m);
        ent2.vx+=sumO2*mSin(theta)*ent.m/(ent.m+ent2.m);
        ent2.vy+=sumO2*mCos(theta)*ent.m/(ent.m+ent2.m);

        /*
        ent.vx=ent.vx*0.93-sumO2*mSin(theta)*ent2.m/(ent.m+ent2.m);
        ent.vy=ent.vy*0.93-sumO2*mCos(theta)*ent2.m/(ent.m+ent2.m);
        ent2.vx=ent2.vx*0.93+sumO2*mSin(theta)*ent.m/(ent.m+ent2.m);
        ent2.vy=ent2.vy*0.93+sumO2*mCos(theta)*ent.m/(ent.m+ent2.m);
        */
        ent.health -= ent2.dmg;
        ent2.health -= ent.dmg;
    }
}
