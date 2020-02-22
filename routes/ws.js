var express = require('express');
var router = express.Router();
var ioSvc = require('../io/ioHelper').ioSvc;
var msgType = require('../io/messageTpye').messageType;

/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('index', {title: 'Node-Msg-Sender'});
});

router.get('/sendMsg', function (req, res, next) {
	var type = req.query.type || msgType.public;
	var content = req.query.content || 'none';
	var uid = req.query.uid;

	switch (type) {
		case msgType.public:
			ioSvc.serverBroadcastMsg(content);
			break;
		case msgType.private:
			if (!uid) {
				return res.send({code: 400, msg: 'uid参数必传'});
			}
			ioSvc.serverToPrivateMsg(uid, content);
			break;
	}
	return res.send({code: 200, msg: '发送成功'});

});

router.post('/sendMsg', function (req, res, next) {
	var type = req.body.type || msgType.public;
	var content = req.body.content || 'none';
	var uid = req.body.uid;

	switch (type) {
		case msgType.public:
			ioSvc.serverBroadcastMsg(content);
			break;
		case msgType.private:
			if (!uid) {
				return res.send({code: 400, msg: 'uid参数必传'});
			}
			ioSvc.serverToPrivateMsg(uid, content);
			break;
	}
	return res.send({code: 200, msg: '发送成功'});

});

router.post('/redirectToLogin', function (req, res, next) {
	var socketId = req.body.socketId;
	ioSvc.redirectToLogin(socketId);
	return res.send({code: 200, msg: '请求成功'});
});

router.post('/deleteAccountToUpdateOnline', function (req, res, next) {
	const {uid, userName} = req.body;
	ioSvc.updateOnlieCount({
		deleteFlag: true,
		uid,
		userName
	});
	return res.send({code: 200, msg: '请求成功'});
});

module.exports = router;
