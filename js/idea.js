/*
    Define Object
*/
 var Room = "none";
 var Version = 0;
 var socket = null;
 var Collection_Json = [];
 var Collection_Object = [];
 var Collection_zindex = 1;
 var iobj = [];
 var idea = function(_x, _y){
    var obj = {
        _idx : "",
        idea_type:"Suggest",
        hot:"normal",
        size:"large",
        x: _x,
        y: _y,
        subject:"temp",
        contents:"temp",
        url:"",
        parent:"",
        child: [],
        template: null,
        visible: true
    };
    this.setobj = function(_name, _val){
        obj[_name] = _val;
    }
    this.getobj = function(_name){
        return obj[_name];
    }
    this.getindex = function(){
        return obj._idx;
    }
    this.getidea = function(){
        return obj;
    }
     this.setidea = function(_obj){
         obj = _obj;
     }
    this.replace_idea = function(_obj){
        obj = _obj.getidea();
    }
    this.eventListener = function(){
        $( ".drag-object" ).draggable({
            start: function(event, ui){
                $(this).css("z-index", Collection_zindex++);
                zindexinit();
            },
            stop:function(dragobj){
                obj.x = $(this).css("left");
                obj.y = $(this).css("top");
                if(socket) socket_update(); //-------------------- UPDATE
            }
        });
        $( ".drag-object" ).droppable({
            drop: function(event,ui){
                var handleobj = $(ui.draggable);
                try {
                    var merge = confirm("아이템을 병합하시겠습니까?");
                    if (merge) {
                        handleobj.effect("scale", { percent: 5 }, 500, function () {
                            handleobj.hide();
                        });
                    }
                } catch(e){
                    console.log("Draggable Event Error : " + e);
                }
            }
        });
    }
    this.init = function(){
        obj._idx = "obj_" + new Date().getTime();
        var template = Obj_Template(obj.idea_type, obj.hot, obj.size, obj.subject, obj.contents, obj._idx, obj.x, obj.y);
        $("#idea-canvas").append(template);
        this.eventListener();
    }
     this.redraw = function(){
         var template = Obj_Template(obj.idea_type, obj.hot, obj.size, obj.subject, obj.contents, obj._idx, obj.x, obj.y);
         $("#idea-canvas").append(template);
         this.eventListener();
     }
     this.reinput = function(temp){
         var template = temp;
         $("#idea-canvas").append(template);
         this.eventListener();
     }
}

function ChangetoJson(){
    Collection_Json = [];
    for(var i in Collection_Object){
        Collection_Json.push(Collection_Object[i].getidea());
    }
}

function ChangetoObject(Collection_Json){
    Collection_Object = [];
    $("#idea-canvas").empty();
    for(var i in Collection_Json){
        var _obj = new idea(Collection_Json[i].x,Collection_Json[i].y);
        var template = Obj_Template(Collection_Json[i].idea_type, Collection_Json[i].hot, Collection_Json[i].size, Collection_Json[i].subject,Collection_Json[i].contents, Collection_Json[i]._idx, Collection_Json[i].x, Collection_Json[i].y);
        _obj.reinput(template);
        Collection_Object[i].setidea(_obj);
    }
    Collection_Json = [];
}


function Obj_Template (itype, hot, size, subject, contents, idx, _x, _y) {
    this._template = '<div id="' + idx + '" class="circle ' +  hot + ' size-' +  size + ' drag-object draggable" href="#DataModal" data-toggle="modal" data-index="' + idx + '" style="left:' + _x + 'px;top:' + _y + 'px;">';
    this._template +='<p class="idea-type">' + itype + '</p>';
    this._template +='<p class="Subject">' +  subject + '</p>';
    this._template +='</div>';
    return this._template;
}

function zindexinit(){
    try{
        if(Collection_zindex > 5){
            for(var i in Collection_Object){
                $("#" + Collection_Object[i].getindex()).css("z-index", 1);
            }
            Collection_zindex = 1;
        }
    } catch(e){
        console.log("Error Collection Reset : " + e);   
    }
}

/*
    Load Event
*/
$(function() {
    /*
    $(document).on("click","#btn-newitem",function(e){
        console.log(e);
        var _obj = new idea;
        _obj.init();
        Collection_Object.push(_obj);
    });
    */
    $('#LoginModal').modal('show');
    $(document).on("click","#btn-minutes",function(){
        alert("회의록 변환");
    });
    $(document).on("click","#modal-accept",function(){
        var datainput = ["#data-item-subject","#data-item-url"];
        if(validation(datainput)){
                var _obj = new idea("20px","20px");
                _obj.setobj("subject",$("#data-item-subject").val());
                _obj.setobj("contents",$("#data-item-context").val());
                _obj.setobj("url",$("#data-item-url").val());
                //_obj.setobj("size",$("#data-item-level").val());
                //console.log($("#data-item-level").val());
                _obj.init();
                Collection_Object.push(_obj);
                $('#InputModal').modal('hide');
                if(socket) socket_update(); //-------------------- UPDATE
        }
    });
    $(document).on("click","#modal-connect",function(){
            try{
                Room = $("#data-room").val();
                socket_sync_room();
            } catch(e){
                exception_msg(e);
            }
    });
    $(document).on("click","#modal-modify",function(){
        var idx = $("#DataModal").attr("data-index");
        var datainput = ["#modify-item-subject","#modify-item-url"];
        if(validation(datainput)){
                var _obj = getideainCollection(idx);
                _obj.setobj("subject",$("#modify-item-subject").val());
                _obj.setobj("contents",$("#modify-item-context").val());
                _obj.setobj("url",$("#modify-item-url").val());
                //_obj.setobj("size",$("#data-item-level").val());
                //console.log($("#data-item-level").val());
                replace_collection(_obj);
                replace_view();
                $('#DataModal').modal('hide');
        }
        
    });
    $('#DataModal').on('show.bs.modal', function (e) {
            $(this).attr("data-index", e.relatedTarget.id);
            var _obj = getideainCollection(e.relatedTarget.id);
            $("#modify-item-subject").val(_obj.getobj("subject"));
            $("#modify-item-context").val(_obj.getobj("contents"));
            $("#modify-item-url").val(_obj.getobj("url"));
    })
    /* Socket.io 통신 */
    socket = io("http://localhost:3000");
    socket.on('data-version', function(msg){
        Room = msg.RoomName;
        Version = msg.Version;
        $("#room-code").html(msg.RoomName);
        $('#LoginModal').modal('hide');
    });
    socket.on('data-update', function(msg){
         ChangetoObject(JSON.parse(msg.collection));
    });


});
function socket_sync_room(){
    socket.emit('data-room-check', { RoomName: Room });
}

function socket_update(){
    ChangetoJson();
    socket.emit('data-update', { RoomName: Room, collection: JSON.stringify(Collection_Json) });
}
function getideainCollection(_id){
    var _idea = null;
    for(var i in Collection_Object){
         if(Collection_Object[i].getindex() == _id) _idea = Collection_Object[i];
    }
    return _idea;
}

function validation(data){
    var flag = false;
    for(var i in data){
        if($(data[i]).val() == null || $(data[i]).val() == "") flag = true;
    }
    if(flag == true){
        alert("모든 값을 입력해주세요!");
        return false;
    } else {
        return true;
    }
}

function exception_msg(m){
    console.log(m);
    //window.location.reload();
}

function replace_collection(obj){
    console.log(Collection_Object);
    for(var i in Collection_Object){
         if(Collection_Object[i].getindex() == obj.getindex()){
             Collection_Object[i].replace_idea(obj);
             console.log("update:" + obj.getindex());
         }
    }
    if(socket) socket_update();  //-------------------- UPDATE
}


function replace_view(){
    $("#idea-canvas").empty();
    for(var i in Collection_Object){
         Collection_Object[i].redraw();
    }
}