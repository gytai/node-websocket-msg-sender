var redis = require('../utils/redis');

var ioSvc = {};
ioSvc.io = null;

//初始化实例
ioSvc.setInstance = function (io) {
  this.io = io;
};

ioSvc.getInstance = function () {
  return this.io;
};

//服务器给所有客户端广播消息
ioSvc.serverBroadcastMsg = function (data) {
  console.log('发送广播消息');
  console.log(data);
  // console.log("this.io.sockets", this.io.sockets);
  this.io.sockets.emit('message', data);
};

//服务端给指定用户发消息
ioSvc.serverToPrivateMsg = function (uid, data) {
  console.log('发送私人消息');
  console.log(data);
  var _this = this;
  redis.get(uid, function (err, sid) {
    if (err) {
      console.error(err);
    }
    //console.log("this.io.sockets", _this.io.sockets);
    console.log("uid", uid);
    console.log("sid", sid);
    if (sid) {
      //给指定的客户端发送消息
      _this.io.sockets.connected[sid].emit('message', data);
    }
  });
};

exports.ioSvc = ioSvc;