/*
*介绍：socket.io 功能封装
*作者：TaiGuangYin
*时间：2017-09-09
* */
var redis = require('../utils/redis');
var msgType = require('./messageTpye');
var ioSvc = require('./ioHelper').ioSvc;
var redisClient1 = require("redis").createClient();
var request = require('request');
console.log(APP);

redisClient1.select(0, function (err, result) {
	if (err) {
		console.log("切换数据库db(0)失败", err);
	} else {
		console.log("切换数据库db(0)成功");
	}
});

//服务端连接
function ioServer(io) {

	var _self = this;
	ioSvc.setInstance(io);

	//初始化连接人数
	redis.set('online_count', 0, null, function (err, ret) {
		if (err) {
			console.error(err);
		}
	});

	io.on('connection', function (socket) {
		console.log('有新的socket连接: ' + socket.id);
		//用户与Socket进行绑定
		//监听客户端发来的登录成功信息
		socket.on('login', function (uid) {
			console.log(uid + '登录成功');
			socket.emit("login_success", socket.id);
			var options = {
				url: APP.myappIP + '/user/send_private_todolist_msg',
				headers: {
					'Content-Type': 'application/json;charset=UTF-8',
				},
				body: JSON.stringify(
					{
						userId: uid
					}
				)
			};
			request.post(options, function (err, response, data) {
				if (err) {
					console.log("send_private_todolist_msg failure", err);
				} else {
					console.log("send_private_todolist_msg success");
				}
			});


			//用户id与socket id相互绑定
			redis.set(uid, socket.id, null, function (err, ret) {
				if (err) {
					console.error(err);
				}
				redis.set(socket.id, uid, null, function (err, ret) {
					if (err) {
						console.error(err);
					}
					_self.updateOnlieCount();
				});
			});

			/*redis.isSpecialKeyExists(uid, function (err, ret) {
				if (err) {
					console.error(err);
				}
				//如果不存在key，则插入
				if (ret !== 1) {
					redis.set(uid, socket.id, null, function (err, ret) {
						if (err) {
							console.error(err);
						}
						redis.set(socket.id, uid, null, function (err, ret) {
							if (err) {
								console.error(err);
							}
							_self.updateOnlieCount();
						});
					});
				} else {
					redis.set(uid, socket.id, null, function (err, ret) {
						if (err) {
							console.error(err);
						}
						redis.set(socket.id, uid, null, function (err, ret) {
							if (err) {
								console.error(err);
							}
							_self.updateOnlieCount();
						});
					});
				}
			});*/
		});

		//退出断开连接事件
		socket.on('logout_disconnect', function (socketId) {
			var connSocketId = socketId || socket.id;
			console.log("socket: " + connSocketId + " 与服务器断开（logout_disconnect）");
			redis.get(connSocketId, function (err, val) {
				if (err) {
					console.error(err);
				}
				redis.del(connSocketId, function (err, ret) {
					if (err) {
						console.error(err);
					}
				});
				_self.updateOnlieCount();
				if (val) {
					console.log("User: " + val + " 与服务器断开（logout_disconnect）");
					redis.del(val, function (err, ret) {
						if (err) {
							console.error(err);
						}
					});
				}
			});
		});

		//断开事件
		socket.on('disconnect', function () {
			console.log("socket: " + socket.id + " 与服务器断开（disconnect）");
			redis.get(socket.id, function (err, val) {
				if (err) {
					console.error(err);
				} else {
					redis.del(socket.id, function (err, ret) {
						if (err) {
							console.error(err);
						}
					});
				}
				if (val) {
					console.log("User: " + val + " 与服务器断开（disconnect）");
				}
			});
		});

		//重连事件
		socket.on('reconnect', function () {
			console.log("重新连接到服务器");
		});

		socket.on('redirect_to_login', function () {
			console.log("重定向到登录页");
		});

		//监听客户端发送的信息,实现消息转发到各个其他客户端
		socket.on('message', function (msg) {
			console.log("socket receive msg");
			if (msg.type == msgType.messageType.public) {
				socket.broadcast.emit("message", msg.content);
			} else if (msg.type == msgType.messageType.private) {
				var uid = msg.uid;
				redis.get(uid, function (err, sid) {
					if (err) {
						console.error(err);
					}
					if (sid) {
						//给指定的客户端发送消息
						io.sockets.socket(sid).emit('message', msg.content);
					}
				});
			}
		});
	});

	/*this.updateOnlieCount = function () {
		//记录在线客户连接数，首先通过dbsize获取当前库的数据总数
		redisClient1.dbsize(function (err, val) {
			if (err) {
				console.error(err);
			}

			//然后判断是否存在带undefined的key，如果有，则在dbsize结果的基础上减一
			//最多存在一个带undefined的key
			//但是有一个缺点就是如果库中存在不是以sess开头的key，则会出现统计偏差
			redisClient1.keys(`sess:undefined/!*`, (err, reply) => {
				if (err) {
					return console.log(err);
				}
				if (typeof val == 'string') {
					val = parseInt(val);
				}
				if (reply.length > 0) {
					val = val - 1;
				}
				if (!val) {
					val = 0;
				}
				console.log("===========计拉取当前在线人数=============");
				console.log('当前在线人数：' + val);
				io.sockets.emit('update_online_count', {online_count: val});

				redis.set('online_count', val, null, function (err, ret) {
					if (err) {
						console.error(err);
					}
				});
			});
		});
	};*/

	this.updateOnlieCount = function () {
		//记录在线客户连接数，首先通过dbsize获取当前库的数据总数
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
						io.sockets.emit('update_online_count', {
							online_count: count,
							user_list: userList
						});
					})
				} else {
					console.log("===========拉取当前在线用户信息=============");
					console.log('当前在线人数：' + count);
					io.sockets.emit('update_online_count', {
						online_count: count,
						user_list: userList
					});
				}
			} else {
				console.log("===========拉取当前在线用户信息=============");
				console.log('当前在线人数：' + count);
				io.sockets.emit('update_online_count', {
					online_count: count,
					user_list: userList
				});
			}
		});
	};
}


//模块导出
exports.ioServer = ioServer;