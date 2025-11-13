const path = require('path');
const fs = require('fs');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client } = require('ssh2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Simple health-check
app.get('/_health', (req, res) => res.json({ ok: true }));

// Socket.io SSH proxy
io.on('connection', (socket) => {
  let conn = null;
  let sshStream = null;
  let sftp = null;

  socket.on('start-ssh', (cfg) => {
    // cfg: { id, host, port, username, password?, privateKey?, cols, rows }
    conn = new Client();
    conn.on('ready', () => {
      socket.emit('status', 'SSH connection ready');
      conn.shell({ term: 'xterm-color', cols: cfg.cols || 80, rows: cfg.rows || 24 }, (err, stream) => {
        if (err) {
          socket.emit('status', 'Shell error: ' + String(err));
          conn.end();
          return;
        }
        sshStream = stream;
        stream.on('data', (data) => socket.emit('data', data.toString('utf8')));
        stream.on('close', () => {
          socket.emit('status', 'Remote shell closed');
          conn.end();
        });

        socket.on('input', (d) => {
          if (sshStream) sshStream.write(d);
        });

        socket.on('resize', ({ cols, rows }) => {
          if (sshStream) sshStream.setWindow(rows, cols, rows * 16, cols * 8);
        });

        // Request SFTP lazily
        socket.on('sftp-list', (dir, cb) => {
          if (!conn) return cb({ error: 'no-conn' });
          conn.sftp((err, s) => {
            if (err) return cb({ error: String(err) });
            s.readdir(dir || '.', (e, list) => {
              if (e) return cb({ error: String(e) });
              cb({ ok: true, list });
            });
          });
        });

        socket.on('sftp-get', ({ path: remotePath }, cb) => {
          conn.sftp((err, s) => {
            if (err) return cb({ error: String(err) });
            const chunks = [];
            const stream = s.createReadStream(remotePath);
            stream.on('data', (c) => chunks.push(c));
            stream.on('end', () => cb({ ok: true, data: Buffer.concat(chunks).toString('base64') }));
            stream.on('error', (e) => cb({ error: String(e) }));
          });
        });

        socket.on('sftp-put', ({ path: remotePath, dataBase64 }, cb) => {
          conn.sftp((err, s) => {
            if (err) return cb({ error: String(err) });
            const stream = s.createWriteStream(remotePath);
            stream.on('close', () => cb({ ok: true }));
            stream.on('error', (e) => cb({ error: String(e) }));
            stream.end(Buffer.from(dataBase64, 'base64'));
          });
        });
      });
    }).on('error', (err) => {
      socket.emit('status', 'SSH connection error: ' + String(err));
    }).on('end', () => {
      socket.emit('status', 'SSH connection ended');
    }).on('close', () => {
      socket.emit('status', 'SSH connection closed');
    });

    // connect using provided credentials
    try {
      const connectCfg = {
        host: cfg.host,
        port: cfg.port || 22,
        username: cfg.username,
        readyTimeout: cfg.readyTimeout || 20000
      };
      if (cfg.privateKey) connectCfg.privateKey = cfg.privateKey;
      if (cfg.password) connectCfg.password = cfg.password;
      if (cfg.passphrase) connectCfg.passphrase = cfg.passphrase;
      if (cfg.agent) connectCfg.agent = cfg.agent;
      conn.connect(connectCfg);
      socket.emit('status', 'Connecting...');
    } catch (e) {
      socket.emit('status', 'connect error: ' + String(e));
    }
  });

  socket.on('disconnect', () => {
    if (sshStream) sshStream.end && sshStream.end();
    if (conn) conn.end && conn.end();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
