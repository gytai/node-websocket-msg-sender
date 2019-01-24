var express = require('express');
var router = express.Router();
var ioSvc = require('../io/ioHelper').ioSvc;
var msgType = require('../io/messageTpye').messageType;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Node-Msg-Sender' });
});

router.get('/sendMsg', function(req, res, next) {
    var type = req.query.type || msgType.public;
    var content = req.query.content || 'none';
    var uid = req.query.uid;

    switch (type){
        case msgType.public:
            ioSvc.serverBroadcastMsg(content);
            break;
        case msgType.private:
            if(!uid){
                return res.send({code:400,msg:'uid参数必传'});
            }
            ioSvc.serverToPrivateMsg(uid,content);
            break;
    }
    return res.send({code:200,msg:'发送成功'});

});

module.exports = router;
