var redisSvc = {};
var redis = require("redis");

if (!client) {
	console.log("没有redis连接，重新创建redis连接");
	var client = redis.createClient();
	//切换到db(1)
	client.select(1, function (err) {
		if (err) {
			console.log("切换数据库db(1)失败", err);
			return;
		}
		console.log("切换数据库db(1)成功");
	});
}

client.on("error", function (err) {
	console.log("Redis Error :", err);
	client = null;
});

client.on('connect', function () {
	console.log('Redis连接成功.');
});

/**
 * 切换数据库
 * @param dbId 数据库id
 */
redisSvc.select = function (dbId, callback) {

	client.select(dbId, function (err, result) {

		if (err) {
			console.log(err);
			callback(err, null);
			return;
		}

		callback(null, result);
	});
};

redisSvc.fetchDbRecordCount = function (dbId, callback) {

	client.select(dbId, function (err, result) {

		if (err) {
			console.log(err);
			callback(err, null);
			return;
		}

		client.dbsize(function (err, result) {
			callback(null, result);
		});


	});
};

redisSvc.isSpecialKeyExists = function (key, callback) {

	client.exists(key, function (err, result) {

		if (err) {
			console.log(err);
			callback(err, null);
			return;
		}
		callback(null, result);
	});
};

/**
 * 添加string类型的数据
 * @param key 键
 * @params value 值
 * @params expire (过期时间,单位秒;可为空，为空表示不过期)
 * @param callBack(err,result)
 */
redisSvc.set = function (key, value, expire, callback) {

	if (key && String(key).indexOf("sess:undefined/") === -1) {
		client.set(key, value, function (err, result) {

			if (err) {
				console.log(err);
				callback(err, null);
				return;
			}

			if (!isNaN(expire) && expire > 0) {
				client.expire(key, parseInt(expire));
			}

			callback(null, result)
		})
	} else {
		callback(null, "");
	}

};

/**
 * 查询string类型的数据
 * @param key 键
 * @param callBack(err,result)
 */
redisSvc.get = function (key, callback) {

	client.get(key, function (err, result) {

		if (err) {
			console.log(err);
			callback(err, null);
			return;
		}

		callback(null, result);
	});
};

/*
*删除String 类型的key
 * @param key 键
 * @param callBack(err,result)
*/
redisSvc.del = function (key, callback) {

	client.del(key, function (err, result) {

		if (err) {
			console.log(err);
			callback(err, null);
			return;
		}

		callback(null, result);
	});
};

redisSvc.mget = function (key, callback) {

	client.mget(key, function (err, result) {

		if (err) {
			console.log(err);
			callback(err, null);
			return;
		}

		callback(null, result);
	});
};

module.exports = redisSvc;