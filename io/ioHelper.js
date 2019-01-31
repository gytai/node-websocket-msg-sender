var redis = require('../utils/redis');
var redisClient1 = require("redis").createClient();

redisClient1.select(0, function (err, result) {
	if (err) {
		console.log("切换数据库db(0)失败", err);
	} else {
		console.log("切换数据库db(0)成功");
	}
});

var ioSvc = {};
ioSvc.io = null;

//初始化实例
ioSvc.setInstance = function (io) {
	this.io = io;
};

ioSvc.getInstance = function () {
	return this.io;
};

function fetchUserSocketIdArr() {
	return new Promise((resolve, reject) => {
		redisClient1.keys("*", (err, reply) => {
			if (err) {
				console.log(err);
				resolve(false);
			} else {
				if (reply && reply.length > 0) {
					var arr = redisClient1.mget(reply, (err, reply1) => {
						if (err) {
							console.log(err);
							resolve(false);
						} else {
							arr = reply1.map((item) => {
								return JSON.parse(item).login_user_info.socketId;
							});
							console.log('arr', arr);
							resolve(arr);
						}
					});
				}
			}
		});
	});
}

//服务器给所有客户端广播消息
ioSvc.serverBroadcastMsg = function (data) {
	console.log('发送广播消息');
	console.log(data);
	// console.log("this.io.sockets", this.io.sockets);
	/*fetchUserSocketIdArr().then((arr) => {
		if (arr && arr.length > 0) {
			arr.forEach((item) => {
				this.io.sockets.connected && this.io.sockets.connected[item] && this.io.sockets.connected[item].emit('message', data);
			});
		}
	});*/
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
		if (sid && _this.io.sockets.connected[sid]) {
			//给指定的客户端发送消息
			_this.io.sockets.connected[sid].emit('message', data);
		}
	});
};

ioSvc.redirectToLogin = function (socketId) {
	console.log('重定向到登录页');
	if (socketId && this.io.sockets.connected[socketId]) {
		this.io.sockets.connected[socketId].emit('redirect_to_login');
	}
};

exports.ioSvc = ioSvc;