基于Nodejs websocket socket.io的消息转发系统  message pusher written in nodejs based on socket.io
==============

消息实时推送，支持在线用户数实时统计。基于[Socket.IO](https://socket.io/)开发，使用websocket推送数据，当浏览器不支持websocket时自动切换comet推送数据。

支持Linux,mac,windows等环境部署。



效果截图
======
![node-msg-sender-demo](http://112.74.81.224:3000/images/demo.png)
 
线上demo  
======

http://112.74.81.224:3000/

可以通过url：http://112.74.81.224:3000/sendMsg/?type=private&uid=1504936989000&content=消息内容 向当前用户发送消息

可以通过url：http://112.74.81.224:3000/sendMsg/?type=public&content=消息内容 向所有在线用户推送消息

uid为接收消息的uid，如果不传递则向所有人推送消息  
content 为消息内容

注：可以通过php或者其它语言的curl功能实现后台推送

下载安装
======
1、git clone https://github.com/gytai/node-websocket-msg-sender.git

2、npm install

3、apt-get install redis-server

4、redis-server

后端服务启动停止,先安装PM2(Advanced Node.js process manager，http://pm2.keymetrics.io/)
======
### 启动服务
pm2 start bin/www --name msg-sender

### 停止服务
pm2 stop msg-sender

Web前端代码类似：
====
```javascript
// 引入前端文件
<script src="/socket.io/socket.io.js"></script>
<script>
      var socket = io.connect('http://localhost:3000');
      socket.emit('login', new Date().getTime());

      // 后端推送来消息时
      socket.on('message', function(msg){
          $('#content').html('收到消息：'+msg);
          $('.notification.sticky').notify();
      });

      // 后端推送来在线数据时
      socket.on('update_online_count', function(data){
          console.log(data);
          $('#online_box').html('当前在线客户端数:&nbsp;'+data.online_count);
      });
</script>
```

其他客户端
====
根据websocket协议即可。具体参考websocket协议。


Nodejs后端调用api向任意用户推送数据
====
```javascript
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
```

Http 发送数据，可以配置跨站发送（需要设置跨域放行）。例如安卓或者IOS等其他客户端也可以方便的发送消息。
====
可以通过url：http://localhost:3000/sendMsg/?type=private&uid=1504936989000&content=消息内容 向当前用户发送消息

可以通过url：http://localhost:3000/sendMsg/?type=public&content=消息内容 向所有在线用户推送消息



