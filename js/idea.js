/*
    - Solution Reeting -
    Define Object
*/
 var room_name = null;
 var socket = null;
 var obj_Collection = [];
 var Collection_zindex = 1;
var obj = function () {
    this._idx = "obj_" + new Date().getTime();
    this.idea_type = "Suggest";
    this.hot = "normal";
    this.size = "large";
    this.x = "0px";
    this.y = "0px";
    this.subject = "temp";
    this.contents = "temp";
    this.url = "";
    this.parent = "";
    this.child = [];
    this.template = null;
    this.visible = true;
}

obj.prototype.eventListener = function(){
    var that = this;
    $( "#" + that._idx ).draggable({
        start: function(event, ui){
            $(this).css("z-index", Collection_zindex++);
            zindexinit();
        },
        stop:function(dragobj){
            that.x = $(this).css("left");
            that.y = $(this).css("top");
            socket_itemupdate(that);
            console.log(obj_Collection);
        }
    });
    $( "#" + that._idx ).droppable({
        drop: function(event,ui){
            var handleobj = $(ui.draggable);
            try {
                var merge = confirm("아이템을 병합하시겠습니까?");
                if (merge) {
                    handleobj.effect("scale", { percent: 5 }, 500, function () {
                        handleobj.hide();
                        var handleobj_idx = handleobj.attr("data-index");
                        this.child.push(handleobj_idx);
                    });
                }
            } catch(e){
                console.log("Draggable Event Error : " + e);
            }
        }
    });
}
// 객체의 기존 속성 프로퍼티만 변경하는 프로토타입
obj.prototype.replace_property = function(newobj){
    var extension = this;
    for (var property in newobj)
    {
        try
        {
            extension[property] = newobj[property];
        }
        catch(warning)
        {
            exception_msg(warning);
        }
    }
}
obj.prototype.init = function(){
    var template = Obj_Template(this.idea_type, this.hot, this.size, this.subject, this.contents, this._idx, this.x, this.y);
    $("#idea-canvas").append(template);
    this.eventListener();
}
obj.prototype.redraw = function(){
    $("#idea-canvas #"+ this._idx + " .idea-type").html(this.idea_type);
    $("#idea-canvas #"+ this._idx + " .Subject").html(this.subject);
    $("#idea-canvas #"+ this._idx).removeAttr('class');
    $("#idea-canvas #"+ this._idx).attr('class', 'circle ' +  this.hot + ' size-' +  this.size + ' drag-object draggable');
    $("#idea-canvas #"+ this._idx).attr('data-index', this._idx);
    $("#idea-canvas #"+ this._idx).attr('style', 'left:' + this.x + ';top:' + this.y + ';');
    this.eventListener();
}



function Obj_Template (itype, hot, size, subject, contents, idx, _x, _y) {
    this._template = '<div id="' + idx + '" class="circle ' +  hot + ' size-' +  size + ' drag-object draggable" href="#DataModal" data-toggle="modal" data-index="' + idx + '" style="left:' + _x + ';top:' + _y + ';">';
    this._template +='<p class="idea-type">' + itype + '</p>';
    this._template +='<p class="Subject">' +  subject + '</p>';
    this._template +='</div>';
    return this._template;
}

function zindexinit(){
    try{
        if(Collection_zindex > 5){
            for(var i in obj_Collection){
                $("#" + obj_Collection[i]._idx).css("z-index", 1);
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
    // 최초 접근시 로그인 모달 출력
    $('#LoginModal').modal('show');

    // 회의록 변환 버튼 이벤트
    $(document).on("click","#btn-minutes",function(){
        alert("회의록 변환");
    });

    // 룸 연결 커넥션 버튼 이벤트
    $(document).on("click","#modal-connect",function(){
            try{
                var datainput = ["#data-room","#data-user-name"];
                if(validation(datainput)){
                    data_room = $("#data-room").val();
                    data_user = $("#data-user-name").val();
                    socket_room(data_room,data_user);
                }
            } catch(e){
                exception_msg(e);
            }
    });


    // 아이템 등록하기 버튼 이벤트
    $(document).on("click","#modal-accept",function(){
        var datainput = ["#data-item-subject","#data-item-url"];
        if(validation(datainput)){
            var _obj = new obj();
            _obj.subject = $("#data-item-subject").val();
            _obj.contents = $("#data-item-context").val();
            _obj.url = $("#data-item-url").val();
            _obj.init();
            obj_Collection[_obj._idx] = _obj;
            try {
                // 룸 구성원들에게 동기화
                socket.emit('data-request', {category: "data-put", room: room_name, item: obj_Collection[_obj._idx], idx: _obj._idx});
            } catch(e){
                exception_msg(e);
            }
            $('#InputModal').modal('hide');
        }
    });

    // 아이템 수정버튼 이벤트
    $(document).on("click", "#modal-modify", function () {
        var idx = $("#DataModal").attr("data-index");
        var datainput = ["#modify-item-subject", "#modify-item-url"];
        if (validation(datainput)) {
            var _obj = obj_Collection[idx];
            _obj.subject = $("#modify-item-subject").val();
            _obj.contents = $("#modify-item-context").val();
            _obj.url = $("#modify-item-url").val();
            _obj.redraw();
            try {
                // 룸 구성원들에게 동기화
                socket_itemupdate(_obj);
            } catch(e){
                exception_msg(e);
            }
            $('#DataModal').modal('hide');
        }

    });

    // 아이템 수정시 기존 값 불러오기 이벤트
    $('#DataModal').on('show.bs.modal', function (e) {
            $(this).attr("data-index", e.relatedTarget.id);
            var _obj = obj_Collection[e.relatedTarget.id];
            $("#modify-item-subject").val(_obj.subject);
            $("#modify-item-context").val(_obj.contents);
            $("#modify-item-url").val(_obj.url);
    });
    socket_connect();
});

// Socket.io 기본 통신 이벤트 함수
// 접속
function socket_connect(){
    socket = io.connect('http://localhost:3000/');
    socket.on('data-response', function(res){
        switch(res.category) {
            case "room-newuser":
                alert(res.msg);
                break;
            case "room-connect":
                // 룸 접속 성공
                room_name = res.room_name;
                $('#LoginModal').modal('hide');
                $('#room-code').html(room_name);
                break;
            case "room-userlist":
                console.log(res.users);
                break;
            case "data-put":
                var _obj = new obj();
                _obj.replace_property(res.item);
                _obj.init();
                obj_Collection[res.idx] = _obj;
                break;
            case "data-update":
                    var _obj = obj_Collection[res.idx];
                    _obj.replace_property(res.item);
                    _obj.redraw();
                break;
            case "data-load":
                try {
                    for (var i in res.col) {
                        var _obj = new obj();
                        console.log(_obj);
                        _obj.replace_property(res.col[i]);
                        _obj.init();
                        obj_Collection[res.col[i]._idx] = _obj;
                    }
                } catch(e){
                    exception_msg(e);
                }
                break;
            case "connect":
                console.log(res.msg);
                break;
            default:
                socket_response(res.category);
            break;
        }
    });
}
// 방 접속
function socket_room(room, user){
    socket.emit('data-request',{category:'room-connect', roomname: room, username: user});
}
// 수신
function socket_response(res){
    // to do
    console.log("[no category] + " + res);
}

function socket_itemupdate(_obj){
    socket.emit('data-request', {category: "data-update", room: room_name, item: obj_Collection[_obj._idx], idx: _obj._idx});
}

// 폼 값 검증 함수
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

// 예외처리 메세지 출력함수
function exception_msg(m){
    console.log(m);
    //window.location.reload();
}
