const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http);

const users = {}; // 追蹤連線中的使用者

// 靜態檔案放在 public 資料夾
app.use(express.static('public'));

// 首頁導向 login.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

// 使用者連線
io.on('connection', socket => {
  console.log('使用者已連線');

  // 接收登入訊息
  socket.on('login', (name) => {
    users[socket.id] = name;
    console.log(`${name} 上線了`);
    io.emit('user-status', { name, status: 'online' });
  });

  // 接收訊息並廣播
  socket.on('chat message', data => {
    socket.broadcast.emit('chat message', data);
  });

  // 離線處理
  socket.on('disconnect', () => {
    const name = users[socket.id];
    if (name) {
      console.log(`${name} 離線了`);
      io.emit('user-status', { name, status: 'offline' });
      delete users[socket.id];
    }
  });
});

// 如果要在 Render 上部署，必須用 process.env.PORT
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`https://scarlett-5lc0.onrender.com`);
});
