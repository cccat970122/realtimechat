// server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// 靜態檔案提供
app.use(express.static('public'));

// 使用者連線
io.on('connection', socket => {
const users = {}; // 追蹤連線中的使用者（socket.id → 使用者名稱）

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
});

// 啟動伺服器
const PORT = 3000;
http.listen(PORT, () => {
  console.log(`伺服器運行中：http://localhost:${PORT}`);
});
