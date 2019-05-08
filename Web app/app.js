const   l = console.log,
        mPi = Math.PI,
        mPow = Math.pow,
        mSqrt = Math.sqrt,
        mAbs = Math.abs,

        express = require('express'),
        app = express(),
        srv = require('http').Server(app),
        sio = require('socket.io')(srv, {}),

        watchdog_historyLength = 50;

var     watchdog_update_start = [],
        watchdog_update_finish= [],
        watchdog_update_count = 0,

        ents = [],
        clients = [],

        maxX = 5000,
        maxY = 5000,

        godmode = true,
        lastcid = 0;


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/tankoids.html');
});
app.get('/clientjs', function (req, res) {
    res.sendFile(__dirname + '/client/client.js');
});
app.get('/sockio', function (req, res) {
    res.sendFile(__dirname + '/client/socket.io-1.4.5.js');
});


sio.sockets.on('connection', function (socket) {
	socket.id = lastcid++;
	clients.push({ socket: socket, account: false });
    l(`Socket connected (id:${socket.id})`)
});

function init(){
    l("Generating random entities");
    generateEntities(1000);

    l("Starting update & watchdog");
    setInterval(update, 30);
    setInterval(watchdog, 5000);

    setInterval(()=>{
        clients.forEach(client=>{
            client.socket.emit('setEntities', ents);
        });
    }, 5000);   //TODO: decide sync frequency (and maybe stagger sync's to even network load)

    srv.listen(80);
    l("[init] waiting for clients.");
}
init();









function watchdog(){
    //update
    var avgTimeBetween=0;
    var avgTimeTaken=0;
    for(var i = 0; i<watchdog_historyLength-1; i++){
        avgTimeTaken+= watchdog_update_finish[i]-watchdog_update_start[i];
        avgTimeBetween+= watchdog_update_start[i+1] - watchdog_update_start[i];
    }
    avgTimeTaken+= watchdog_update_start[watchdog_historyLength-1] - watchdog_update_finish[watchdog_historyLength-1];
    avgTimeBetween+= watchdog_update_start[0] - watchdog_update_start[watchdog_historyLength-1];
    
    avgTimeTaken/=watchdog_historyLength;
    avgTimeBetween/=watchdog_historyLength;

    l(`[Watchdog] average (${watchdog_historyLength}) updates are spaced ${avgTimeBetween}ms apart, taking ${avgTimeTaken}ms to complete. (ents: ${ents.length})`);
}



function update(){
    watchdog_update_start[watchdog_update_count%watchdog_historyLength]=Date.now();
    ents = ents.filter((ent, index)=>{
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

        //confine to window
        if((ent.x>maxX/2 && ent.vx>0)||ent.x<-maxX/2 && ent.vx<0){
            ent.vx = -ent.vx;
        }else if((ent.y>maxY/2 && ent.vy>0)||(ent.y<-maxY/2 && ent.vy<0)){
            ent.vy = -ent.vy;
        }

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
    watchdog_update_finish[watchdog_update_count%watchdog_historyLength]=Date.now();
    watchdog_update_count++;
}

function generateEntities(num){
    var lastEid=0;
    if(ents.length>0) lastEid = ents[ents.length-1].id;
    
    for(var i = lastEid+1; i<=lastEid+num; i++){
        ents.push({
            id:i,
            health: Math.random() * 1000,
            dmg: Math.random() * 10,
            m:Math.random() * 20 + 5,
            x:maxX*(1/2-Math.random()),
            y:maxY*(1/2-Math.random()),
            vx:4*(1/2-Math.random()),
            vy:4*(1/2-Math.random())
        })
    }
}