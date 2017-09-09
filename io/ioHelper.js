var redis = require('../utils/redis');

var ioSvc = {};
ioSvc.io = null;

//初始化实例
ioSvc.setInstance = function (io) {
    this.io = io;
};

ioSvc.getInstance =function () {
    return this.io;
};

//服务器给所有客户端广播消息
ioSvc.serverBroadcastMsg = function (data) {
    this.io.sockets.emit('message',data);
};

//服务端给指定用户发消息
ioSvc.serverToPrivateMsg = function (uid,data) {
    redis.get(uid,function (err,sid) {
        if(err){
            console.error(err);
        }
        if(sid){
            //给指定的客户端发送消息
            this.io.sockets.socket(sid).emit('message',data);
        }
    });
};

exports.ioSvc = ioSvc;