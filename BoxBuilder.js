var BoxBuilderMode;
var BoxBuilder=(function namespace(){
    //Constructor
    function Init(container,map=null,options={}){
        if(typeof(container)=="undefined"||container==null){
            container=document.getElementsByTagName("body")[0];
        }
        config.container=container;
        this.setGoogleMap(map);
        if(typeof(options.mode)=="undefined"||options.mode==null){
            options.mode=0;
        }
        this.setOptions(options);
        if(!config.googleMap&&config.log){
            console.warn("Google Map is not Active!");
        }
    }
    //Public Method
    Init.prototype.setGoogleMap=function(map){
        config.googleMap=!!map;
        if(config.googleMap){
            config.map=map;
            config.draggable=config.map.get("draggable")==undefined||config.map.get("draggable");
            if(config.mode==Mode.normal
               ||config.mode==Mode.keep
               ||config.mode==Mode.multiple){
                google.maps.event.addListener(config.map,"mousedown",mapMouseDownHandler);
                google.maps.event.addListener(config.map,"mousemove",mapMouseMoveHandler);
            }
            if(config.mode==Mode.fixed){
                google.maps.event.addListener(config.map,"zoom_changed",fixedBoxUpdateHandler);
                google.maps.event.addListener(config.map,"center_changed",fixedBoxUpdateHandler);
            }
        }
    };
    Init.prototype.setOptions=function(options){
        if(options.log!=undefined&&options.log!=null){
            config.log=!!options.log;
        }
        if(Number(options.mode)!=NaN&&options.mode!=null){
            var mode=Number(options.mode);
            if(mode>=Mode.min&&mode<=Mode.max){
                if(config.mode!=null&&config.mode!=undefined){
                    config.mode=mode;
                    var originMode=config.mode;
                    if(originMode==Mode.fixed&&mode!=Mode.fixed){
                        document.addEventListener("keydown",keyDownHandler);
                        document.addEventListener("keyup",keyUpHandler);
                        if(config.googleMap){
                            google.maps.event.addListener(config.map,"mousedown",mapMouseDownHandler);
                            google.maps.event.addListener(config.map,"mousemove",mapMouseMoveHandler);
                        }
                    }
                    if(originMode!=Mode.fixed&&originMode!=Mode.keep&&(mode==Mode.fixed||mode==Mode.keep)){
                        if(config.googleMap){
                            google.maps.event.addListener(config.map,"zoom_changed",fixedBoxUpdateHandler);
                            google.maps.event.addListener(config.map,"center_changed",fixedBoxUpdateHandler);
                        }
                        document.removeEventListener("keydown",keyDownHandler);
                        document.removeEventListener("keyup",keyUpHandler);
                    }
                }else{  //Init
                    config.mode=mode;
                    if(config.mode==Mode.normal
                     ||config.mode==Mode.keep
                     ||config.mode==Mode.multiple){
                        document.addEventListener("keydown",keyDownHandler);
                        document.addEventListener("keyup",keyUpHandler);
                        if(config.googleMap){
                            google.maps.event.addListener(config.map,"mousedown",mapMouseDownHandler);
                            google.maps.event.addListener(config.map,"mousemove",mapMouseMoveHandler);
                        }
                    }
                    if(config.mode==Mode.fixed||config.mode==Mode.keep){
                        if(config.googleMap){
                            google.maps.event.addListener(config.map,"zoom_changed",fixedBoxUpdateHandler);
                            google.maps.event.addListener(config.map,"center_changed",fixedBoxUpdateHandler);
                        }
                    }
                }
            }else{
                console.error("options.mode is not a Legal Box Builder Mode!");
            }
        }
        if(options.hollow!=undefined&&options.hollow!=null){
            config.hollow=!!options.hollow;
        }
        if(typeof(options.id)=="string"){
            config.boxId=options.id;
            if(config.mode!=Mode.multiple&&!!config.box){
                setId(config.box,config.boxId);
            }else if(boxes.length>0){
                for(var i in boxes){
                    setId(boxes[i].box,""+config.boxId+i);
                }
            }
        }else if(options.id!=undefined&&options.id!=null){
            console.error("options.id is not a Legal ID Name!");
        }
        if(typeof(options.className)=="string"){
            config.boxClass=options.className;
            if(config.mode!=Mode.multiple&&!!config.box){
                setClassName(config.box,config.boxClass);
            }else if(boxes.length>0){
                for(var i in boxes){
                    setClassName(boxes[i].box,config.boxClass);
                }
            }
        }else if(options.className!=undefined&&options.className!=null){
            console.error("options.id is not a Legal Class Name!");
        }
        if(typeof(options.callback)=="function"){
            config.resultCallback=options.callback;
        }else if(options.callback!=undefined&&options.callback!=null){
            console.error("options.callback is not a function!");
        }
    };
    Init.prototype.clearBoxes=function(){
        if(config.mode==Mode.multiple&&boxes.length>0){
            for(var i in boxes){
                deleteBox(boxes[i].box,""+config.boxId+i);
            }
            boxes.length=0;
        }
        if(config.mode==Mode.fixed){
            deleteBox(config.box,config.boxId);
        }
        if(config.mode==Mode.keep){
            deleteBox(config.box,config.boxId);
            config.keep=false;
        }
    };
    Init.prototype.setFixedBox=function(p1,p2){
        if(Number(p1.x)==NaN||Number(p1.y)==NaN||Number(p2.x)==NaN||Number(p2.y)==NaN){
            console.error("Parameter must be two Object(Number x,y)!");
            return;
        }else{
            p1.x=Number(p1.x);
            p1.y=Number(p1.y);
            p2.x=Number(p2.x);
            p2.y=Number(p2.y);
        }
        if(config.mode==Mode.fixed||config.mode==Mode.keep){
            if(!!config.box){
                deleteBox(config.box,config.boxId);
            }
            config.box=addBox(p1,p2);
        }else{
            console.error("BoxBuilderMode is not fixed!");
        }
    };
    Init.prototype.setFixedBoxLatLng=function(p1,p2){
        config.fixedPoints={
            p1:objectClone(p1),
            p2:objectClone(p2)
        };
        if(config.googleMap){
            getGoogleMapPixel(p1.lat,p1.lng,function(point1){
                getGoogleMapPixel(p2.lat,p2.lng,function(point2){
                    Init.prototype.setFixedBox(point1,point2);
                });
            });
        }else{
            console.error("Google Map is not Active!");
        }
    };
    //Event Handler
    function keyDownHandler(e){
        if(e.which==17){
            if(!config.keyDownSenser){
                if(config.googleMap&&config.draggable){
                    config.map.setOptions({draggable: false});
                }
                config.keyDownSenser=true;
            }
            config.container.addEventListener("mousedown",mouseDownHandler);
            config.container.addEventListener("mousemove",mouseMoveHandler);
            config.container.addEventListener("mouseup",mouseUpHandler);
        }
    }
    function keyUpHandler(e){
        if(e.which==17){
            if(config.googleMap&&config.draggable){
                config.map.setOptions({draggable: true});
            }
            config.keyDownSenser=false;
            config.container.removeEventListener("mousedown",mouseDownHandler);
            config.container.removeEventListener("mousemove",mouseMoveHandler);
            config.container.removeEventListener("mouseup",mouseUpHandler);
            if(config.mode==Mode.normal){
                deleteBox(config.box,config.boxId);
            }
            if(config.mode==Mode.multiple&&!!document.getElementById(config.boxId)){
                setId(config.box,""+config.boxId+boxes.length);
                boxes.push({box:config.box});
                config.box=null;
            }
        }
    }
    function mouseDownHandler(e){
        var pos={};
        var offset=getOffset(config.container);
        temp.start.x=pos.x=(navigator.appName=="Netscape"?e.clientX:event.clientX)-offset.left;
        temp.start.y=pos.y=(navigator.appName=="Netscape"?e.clientY:event.clientY)-offset.top;
        if(!config.boxInit){
            config.box=addBox(pos,pos);
            config.boxInit=true;
        }else{
            updateBox(config.box,pos,pos);
        }
        config.dragging=true;
        if(config.mode==Mode.keep){
            google.maps.event.addListener(config.map,"zoom_changed",fixedBoxUpdateHandler);
            google.maps.event.addListener(config.map,"center_changed",fixedBoxUpdateHandler);
        }
    }
    function mouseMoveHandler(e){
        var offset=getOffset(config.container);
        if(config.dragging){
            temp.end.x=(navigator.appName=="Netscape"?e.clientX:event.clientX)-offset.left;
            temp.end.y=(navigator.appName=="Netscape"?e.clientY:event.clientY)-offset.top;
            var p1={
                x:Math.min(temp.start.x,temp.end.x),
                y:Math.min(temp.start.y,temp.end.y)
            };
            var p2={
                x:Math.max(temp.start.x,temp.end.x),
                y:Math.max(temp.start.y,temp.end.y)
            };
            updateBox(config.box,p1,p2);
        }
    }
    function mouseUpHandler(e){
        config.dragging=false;
        if(config.mode!=Mode.keep&&config.mode!=Mode.multiple){
            config.boxInit=false;
            deleteBox(config.box,config.boxId);
        }
        var result=endResult(temp.start,temp.end);
        if(config.mode==Mode.keep){
            if(config.googleMap){
                config.keep=true;
                config.fixedPoints={
                    p1:objectClone(result.min),
                    p2:objectClone(result.max)
                };
            }
        }
        if(config.mode==Mode.multiple){
            if(config.googleMap){
                config.keep=true;
            }
        }
    }
    function mapMouseDownHandler(event){
        temp.start.lat=event.latLng.lat();
        temp.start.lng=event.latLng.lng();
    }
    function mapMouseMoveHandler(event){
        temp.end.lat=event.latLng.lat();
        temp.end.lng=event.latLng.lng();
    }
    function fixedBoxUpdateHandler(){
        if(config.googleMap&&(config.mode==Mode.fixed||(config.mode==Mode.keep&&config.keep))){
            getGoogleMapPixel(config.fixedPoints.p1.lat,config.fixedPoints.p1.lng,function(point1){
                getGoogleMapPixel(config.fixedPoints.p2.lat,config.fixedPoints.p2.lng,function(point2){
                    updateBox(config.box,point1,point2);
                });
            });
        }
    }
    //Private Method
    function setId(box,id){
        if(config.hollow){
            box.top.id=id+"-top";
            box.right.id=id+"-right";
            box.bottom.id=id+"-bottom";
            box.left.id=id+"-left";
        }else{
            box.id=id;
        }
    }
    function setClassName(box,className){
        if(config.hollow){
            box.top.className=className+"-border";
            box.right.className=className+"-border";
            box.bottom.className=className+"-border";
            box.left.className=className+"-border";
        }else{
            box.className=className;
        }
    }
    function addBox(p1,p2){
        var box;
        if(config.hollow){
            box={};
            box.top=document.createElement("div");
            box.right=document.createElement("div");
            box.bottom=document.createElement("div");
            box.left=document.createElement("div");
            setId(box,config.boxId);
            setClassName(box,config.boxClass);
            updateBox(box,p1,p2);
            config.container.appendChild(box.top);
            config.container.appendChild(box.right);
            config.container.appendChild(box.bottom);
            config.container.appendChild(box.left);
        }else{
            box=document.createElement("div");
            setId(box,config.boxId);
            setClassName(box,config.boxClass);
            updateBox(box,p1,p2);
            container.appendChild(box);
        }
        return box;
    }
    function updateBox(box,pa,pb){
        var p1={
            x:Math.min(pa.x,pb.x),
            y:Math.min(pa.y,pb.y)
        };
        var p2={
            x:Math.max(pa.x,pb.x),
            y:Math.max(pa.y,pb.y)
        };
        if(config.hollow){
            box.top.style.left=p1.x+"px";
            box.top.style.top=p1.y+"px";
            box.top.style.width=(p2.x-p1.x)+"px";
            box.top.style.height=0+"px";
            box.right.style.left=p2.x+"px";
            box.right.style.top=p1.y+"px";
            box.right.style.width=0+"px";
            box.right.style.height=(p2.y-p1.y)+"px";
            box.bottom.style.left=p1.x+"px";
            box.bottom.style.top=p2.y+"px";
            box.bottom.style.width=(p2.x-p1.x)+"px";
            box.bottom.style.height=0+"px";
            box.left.style.left=p1.x+"px";
            box.left.style.top=p1.y+"px";
            box.left.style.width=0+"px";
            box.left.style.height=(p2.y-p1.y)+"px";
        }else{
            box.style.left=p1.x+"px";
            box.style.top=p1.y+"px";
            box.style.width=(p2.x-p1.x)+"px";
            box.style.height=(p2.y-p1.y)+"px";
        }
        return box;
    }
    function deleteBox(box,id){
        if(config.hollow){
            if(!!document.getElementById(id+"-top")){
                config.container.removeChild(box.top);
            }
            if(!!document.getElementById(id+"-right")){
                config.container.removeChild(box.right);
            }
            if(!!document.getElementById(id+"-bottom")){
                config.container.removeChild(box.bottom);
            }
            if(!!document.getElementById(id+"-left")){
                config.container.removeChild(box.left);
            }
        }else{
            if(!!document.getElementById(id)){
                config.container.removeChild(box);
            }
        }
    }
    function endResult(start,end){
        var result={
            min:{},
            max:{}
        };
        result.min.x=Math.min(start.x,end.x);
        result.min.y=Math.min(start.y,end.y);
        result.max.x=Math.max(start.x,end.x);
        result.max.y=Math.max(start.y,end.y);
        if(config.googleMap){
            result.min.lat=Math.min(start.lat,end.lat);
            result.min.lng=Math.min(start.lng,end.lng);
            result.max.lat=Math.max(start.lat,end.lat);
            result.max.lng=Math.max(start.lng,end.lng);
        }else{
            result.min.lat=result.min.lng=result.max.lat=result.max.lng=null;
        }
        if(config.log){
            console.log("Min:"+result.min.lat+","+result.min.lng+"\nMax:"+result.max.lat+","+result.max.lng);
        }
        config.resultCallback&&config.resultCallback.call(this,result);
        return result;
    }
    function getOffset(element){
        return {
            left:element.getBoundingClientRect().left-document.body.getBoundingClientRect().left-window.pageXOffset,
            top:element.getBoundingClientRect().top-document.body.getBoundingClientRect().top-window.pageYOffset,
            right:element.getBoundingClientRect().right-document.body.getBoundingClientRect().right+window.pageXOffset,
            bottom:element.getBoundingClientRect().bottom-document.body.getBoundingClientRect().bottom+window.pageYOffset,
        };
    }
    function getGoogleMapPixel(lat,lng,callback){
        if(config.googleMap){
            if(Number(lat)==NaN||Number(lng)==NaN){
                console.error("Parameter must be two Number and a Callback Function!");
                return;
            }
            var overlay=new google.maps.OverlayView();
            overlay.draw=function(){};
            overlay.onAdd=function(){
                callback&&callback.call(
                    this,
                    this.getProjection().fromLatLngToContainerPixel(
                        new google.maps.LatLng(lat,lng)
                    )
                );
            };
            overlay.setMap(config.map);
        }else{
            console.error("Google Map is not Active!");
        }
    }
    function objectClone(obj){
        return JSON.parse(JSON.stringify(obj));
    }
    //Config
    var Mode={
        normal:0,
        keep:1,
        multiple:2,
        fixed:3,
        multi_fixed:4,
        //Structure
        min:0,
        max:4,
    };
    var config={
        box:null,
        boxId:"box",
        boxClass:"box",
        mode:null,
        googleMap:true,
        keyDownSenser:false,
        map:null,
        container:null,
        resultCallback:undefined,
        dragging:false,
        draggable:true,
        fixedPoints:null,
        hollow:true,
        log:false,
        keep:false,
    };
    var temp={
        start:{
            x:null,
            y:null,
            lat:null,
            lng:null
        },
        end:{
            x:null,
            y:null,
            lat:null,
            lng:null
        },
    };
    var boxes=[];
    BoxBuilderMode=Mode;
    //Debug
    Init.prototype.getConfig=function(){
        return config;
    };
    return Init;
}());