const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const io = new Server(http);

const users = {}; // 紀錄連線使用者

// 連接 MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://gary8662009:G9IfSpAH5DYTEQb5@cluster0.xlr3vi8.mongodb.net/chatapp?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ 已連接到 MongoDB'))
.catch(err => console.error('❌ MongoDB 連接失敗', err));

// 定義訊息 Schema 與 Model
const MessageSchema = new mongoose.Schema({
  name: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', MessageSchema);

// 靜態檔案目錄 public
app.use(express.static('public'));

// 首頁導向 login.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

// Socket.IO 事件
io.on('connection', socket => {
  console.log('使用者已連線');

  socket.on('login', async (name) => {
    users[socket.id] = name;
    console.log(`${name} 上線了`);

    // 傳送歷史訊息，排序由舊到新，最多50筆
    const history = await Message.find().sort({ createdAt: 1 }).limit(50);
    socket.emit('chat history', history);

    io.emit('user-status', { name, status: 'online' });
  });

  socket.on('chat message', async data => {
    console.log('收到訊息：', data);
    // 儲存到資料庫
    await Message.create(data);

    // 廣播給其他人
    socket.broadcast.emit('chat message', data);
  });

  socket.on('disconnect', () => {
    const name = users[socket.id];
    if (name) {
      console.log(`${name} 離線了`);
      io.emit('user-status', { name, status: 'offline' });
      delete users[socket.id];
    }
  });
});

// 啟動伺服器
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`伺服器已啟動在 port ${PORT}`);
});
