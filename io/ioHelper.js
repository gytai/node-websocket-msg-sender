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

function updateOnlieCountFunc(self) {
	let count = 0;
	let userList = [];
	redisClient1.keys("*", (err, val) => {
		if (err) {
			console.error(err);
		}
		console.log("val", val);
		let arr = [];

		if (val && val.length > 0) {
			val.forEach((item) => {
				let un = item.split("/")[0].split("sess:")[1];
				if (un !== "undefined") {
					arr.push(item);
				}
			});
			if (arr.length > 0) {
				redisClient1.mget(arr, (e, v) => {
					if (e) {
						console.error(e);
					} else {
						if (v && v.length > 0) {
							v.forEach((item) => {
								const i = JSON.parse(item);
								if (i && i.login_user_info && i.login_user_info.id && i.login_user_info.user_name) {
									count++;
									userList.push(i.login_user_info.user_name);
								}
							})
						}
					}
					console.log("===========拉取当前在线用户信息=============");
					console.log('当前在线人数：' + count);
					self.io.sockets.emit('update_online_count', {
						online_count: count,
						user_list: userList
					});
				})
			} else {
				console.log("===========拉取当前在线用户信息=============");
				console.log('当前在线人数：' + count);
				self.io.sockets.emit('update_online_count', {
					online_count: count,
					user_list: userList
				});
			}
		} else {
			console.log("===========拉取当前在线用户信息=============");
			console.log('当前在线人数：' + count);
			self.io.sockets.emit('update_online_count', {
				online_count: count,
				user_list: userList
			});
		}
	});
}

function deleteToRedirectLogin(self, uid) {
	redis.get(uid, (err, sid) => {
		if (err) {
			console.log(err);
		} else {
			self.redirectToLogin(sid);
		}
	})
}

//服务器给所有客户端广播消息
ioSvc.serverBroadcastMsg = function (data) {
	console.log('发送广播消息');
	console.log(data);
	console.log("this.io.sockets", this.io.sockets);
	fetchUserSocketIdArr().then((arr) => {
		if (arr && arr.length > 0) {
			arr.forEach((item) => {
				this.io.sockets.connected && this.io.sockets.connected[item] && this.io.sockets.connected[item].emit('message', data);
			});
		}
	});
	// 通过以下方式广播信息，可能会出现同一个客户端，同时推送多次完全一样的信息的现象
	// this.io.sockets.emit('message', data);
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

ioSvc.updateOnlieCount = function (params) {
	if (params && params.deleteFlag && params.uid && params.userName) {
		console.log("params.userName", params.userName);
		console.log("--->", `sess:${params.userName}/*`);
		redisClient1.keys(`sess:${params.userName}/*`, (err, res) => {
			console.log("res", res);
			if (res && res.length > 0) {
				redisClient1.del(res[0], (e, r) => {
					if (e) {
						console.log(e);
						console.log("删除该用户名对应的redis key失败");
					} else {
						console.log("删除该用户名对应的redis key成功");
						// this指向ioSvc，传入
						updateOnlieCountFunc(this);
						deleteToRedirectLogin(this, params.uid)
					}
				})
			}
		})
	} else {
		// this指向ioSvc，传入
		updateOnlieCountFunc(this);
	}
};


exports.ioSvc = ioSvc;