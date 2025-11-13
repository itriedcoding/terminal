# Web Terminal (SSH)

This project provides a browser-based terminal emulator that connects to real SSH servers using a Node.js backend.

Key points:
- Frontend: `xterm.js` running in browser.
- Backend: `ssh2` + `socket.io` proxying shell and SFTP.
- Real SSH connections: you provide host/credentials; the server opens an SSH connection to the target host.

Features (implemented or provided):
- **Tabs**: multiple sessions
- **Split panes**: UI support
- **Real SSH**: password/key auth
- **SFTP**: list, get, put via socket messages
- **Resize handling**: terminal resize forwarded to server
- **Session logging**: console output remains in terminal; can be extended to server-side logs
- **Keepalive-ready**: ssh2 supports keepalive options
- **UTF-8 + 24-bit colors**: xterm.js supports colors and UTF-8
- **Copy / paste**: browser-native clipboard works
- **Keyboard shortcuts**: browser-level (can be extended)
- **Quick commands cheatsheet** for Ubuntu/Debian/CentOS
- **Local sandbox terminal** (basic)
- **File upload/download (SFTP)**
- **Port forwarding**: ssh2 supports it (can be added via API)
- **Agent forwarding**: ssh2 supports it (use `agent` in cfg)
- **Session cleanup on disconnect**
- **Multiple auth methods** (password, private key, agent)
- **XTerm compatibility**: uses xterm-color term type
- **CORS-enabled** backend for dev
- **Static frontend** served from Express
- ...and more that can be enabled or extended via small code additions

This scaffold is intentionally minimal but real — the SSH connections are actual network connections performed by the server using the credentials you provide.

Security note: do not expose this server publicly without adding authentication, TLS, rate-limiting, and proper secret handling. Private keys or passwords are passed to the Node process — treat with care.

Run locally:

```bash
npm install
npm start
# Then open http://localhost:3000
```

If you want me to add more features (session recording to files, OAuth login, HTTPS/TLS, persistent session storage, session sharing links, full SFTP GUI, port forwarding UI, etc.), tell me which ones to prioritize.
