var BoxBuilder=(function namespace(){
    //Constructor
    function Init(container,map,callback,mode){
        config.map=map;
        if(map==null){
            config.googleMap=false;
        }
        config.container=container;
        config.resultCallback=callback;
        if(!mode){
            mode=0;
        }
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
        if(config.googleMap&&config.mode==Mode.fixed){
            google.maps.event.addListener(config.map,"drag",fixedBoxUpdateHandler);
            google.maps.event.addListener(config.map,"zoom_changed",fixedBoxUpdateHandler);
        }
    }
    //Public Method
    Init.prototype.setBoxId=function(id){
        config.boxId=id;
    };
    Init.prototype.clearBoxes=function(){
        if(config.mode=Mode.multiple&&config.boxCount>1){
            for(var i in boxes){
                if(document.getElementById(config.boxId+(i+1))){
                    config.container.removeChild(boxes[i]);
                }
            }
            boxes.length=0;
        }
    };
    Init.prototype.setMode=function(mode){
        config.mode=mode;
    };
    Init.prototype.setFixedBox=function(p1,p2){
        config.box=document.createElement("div");
        config.box.id=config.boxId;
        config.box.className=config.boxClass;
        config.box.style.left=p1.x+"px";
        config.box.style.top=p1.y+"px";
        config.box.style.width=(p2.x-p1.x)+"px";
        config.box.style.height=(p2.y-p1.y)+"px";
        config.container.appendChild(config.box);
    };
    Init.prototype.setFixedBoxLatLng=function(p1,p2){
        config.fixedPoints={
            p1:p1,
            p2:p2
        };
        if(config.googleMap){
            getGoogleMapPixel(p1.lat,p1.lng,function(point1){
                getGoogleMapPixel(p2.lat,p2.lng,function(point2){
                    Init.prototype.setFixedBox(point1,point2);
                });
            });
        }
    };
    //Event Handler
    function keyDownHandler(e){
        if(e.which==17){
            if(!config.keyDownSenser){
                if(config.googleMap){
                    config.map.setOptions({draggable: false});
                }
                config.keyDownSenser=true;
            }
            if(config.container){
                config.container.addEventListener("mousedown",mouseDownHandler);
                config.container.addEventListener("mousemove",mouseMoveHandler);
                config.container.addEventListener("mouseup",mouseUpHandler);
            }
        }
    }
    function keyUpHandler(e){
        if(e.which==17){
            if(config.googleMap){
                config.map.setOptions({draggable: true});
            }
            config.keyDownSenser=false;
            if(config.container){
                config.container.removeEventListener("mousedown",mouseDownHandler);
                config.container.removeEventListener("mousemove",mouseMoveHandler);
                config.container.removeEventListener("mouseup",mouseUpHandler);
            }
            if(document.getElementById(config.boxId)&&config.mode==Mode.normal){
                config.container.removeChild(config.box);
            }
            if(document.getElementById(config.boxId)&&config.mode==Mode.multiple){
                config.box.id=config.boxId+config.boxCount;
                config.boxCount++;
                boxes.push(config.box);
                config.box=null;
            }
        }
    }
    function mouseDownHandler(e){
        var pos={};
        var offset=getOffset(config.container);
        temp.start.X=pos.X=navigator.appName=="Netscape"?e.clientX:event.clientX;
        temp.start.Y=pos.Y=navigator.appName=="Netscape"?e.clientY:event.clientY;
        if(!config.boxInit){
            config.box=document.createElement("div");
            config.box.id=config.boxId;
            config.box.className=config.boxClass;
            config.box.style.left=(pos.X-offset.left)+"px";
            config.box.style.top=(pos.Y-offset.top)+"px";
            config.container.appendChild(config.box);
            config.boxInit=true;
        }else{
            config.box.style.left=(pos.X-offset.left)+"px";
            config.box.style.top=(pos.Y-offset.top)+"px";
            config.box.style.width=config.box.style.height=0;
        }
        config.dragging=true;
    }
    function mouseMoveHandler(e){
        var pos={};
        var offset=getOffset(config.container);
        temp.end.X=pos.X=navigator.appName=="Netscape"?e.clientX:event.clientX;
        temp.end.Y=pos.Y=navigator.appName=="Netscape"?e.clientY:event.clientY;
        if(config.dragging){
            config.box.style.width=Math.abs(pos.X-temp.start.X)+"px";
            config.box.style.height=Math.abs(pos.Y-temp.start.Y)+"px";
            config.box.style.left=((pos.X<temp.start.X?pos.X:temp.start.X)-offset.left)+"px";
            config.box.style.top=((pos.Y<temp.start.Y?pos.Y:temp.start.Y)-offset.top)+"px";
        }
    }
    function mouseUpHandler(e){
        config.dragging=false;
        config.boxInit=false;
        if(document.getElementById("box")){
            config.container.removeChild(config.box);
        }
        endResult(temp.start,temp.end);
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
        if(config.googleMap&&config.mode==Mode.fixed){
            getGoogleMapPixel(config.fixedPoints.p1.lat,config.fixedPoints.p1.lng,function(point1){
                getGoogleMapPixel(config.fixedPoints.p2.lat,config.fixedPoints.p2.lng,function(point2){
                    config.box.style.left=point1.x+"px";
                    config.box.style.top=point1.y+"px";
                    config.box.style.width=(point2.x-point1.x)+"px";
                    config.box.style.height=(point2.y-point1.y)+"px";
                });
            });
        }
    }
    //Private Method
    function endResult(start,end){
        var result={};
        result.min.X=Math.min(start.X,end.X);
        result.min.Y=Math.min(start.Y,end.Y);
        result.min.lat=Math.min(start.lat,end.lat);
        result.min.lng=Math.min(start.lng,end.lng);
        result.max.X=Math.max(start.X,end.X);
        result.max.Y=Math.max(start.Y,end.Y);
        result.max.lat=Math.max(start.lat,end.lat);
        result.max.lng=Math.max(start.lng,end.lng);
        console.log("Min:"+result.min.lat+","+result.min.lng+"\nMax:"+result.max.lat+","+result.max.lng);
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
    }
    //Config
    var Mode={
        normal:0,
        keep:1,
        multiple:2,
        fixed:3,
    };
    var config={
        box:null,
        boxId:"box",
        boxClass:"box",
        mode:Mode.normal,
        googleMap:true,
        keyDownSenser:false,
        map:null,
        container:null,
        resultCallback:undefined,
        boxCount:1,
        dragging:false,
        fixedPoints:null,
    };
    var temp={
        start:{
            lat:null,
            lng:null
        },
        end:{
            lat:null,
            lng:null
        },
    };
    var boxes=[];
    return Init;
}());