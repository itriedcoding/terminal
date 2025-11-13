const socket = io();
const { Terminal } = window;
const { FitAddon } = window;

const tabsEl = document.getElementById('tabs');
const panesEl = document.getElementById('panes');
const cheatEl = document.getElementById('cheat');

const cheatText = `
Ubuntu / Debian quick SSH & package commands:
- SSH: ssh user@host
- Update: sudo apt update && sudo apt upgrade -y
- Install: sudo apt install -y <pkg>
- Start service: sudo systemctl start <service>
- Journal: sudo journalctl -u <service> -f

CentOS / RHEL quick commands:
- SSH: ssh user@host
- Update: sudo yum update -y   (or sudo dnf update -y)
- Install: sudo yum install -y <pkg>  (or dnf)
- Start service: sudo systemctl start <service>

Common tips:
- Use public key auth: generate with ssh-keygen and copy with ssh-copy-id user@host
- SFTP with this app: use builtin SFTP panel (right-click in future versions)
`;
cheatEl.textContent = cheatText;

let sessions = [];

function createTab(session) {
  const tab = document.createElement('button');
  tab.textContent = session.title || `Session ${sessions.length}`;
  tab.className = 'tab';
  tab.onclick = () => showSession(session.id);
  tabsEl.appendChild(tab);
  session.tabEl = tab;
}

function showSession(id) {
  sessions.forEach((s) => {
    if (s.id === id) {
      s.container.style.display = 'block';
      s.tabEl.classList.add('active');
      if (s.fit) s.fit.fit();
    } else {
      s.container.style.display = 'none';
      s.tabEl.classList.remove('active');
    }
  });
}

function newTerminalInstance() {
  const term = new Terminal({ cursorBlink: true, cols: 80, rows: 24, convertEol: true });
  const fit = new FitAddon.FitAddon();
  term.loadAddon(fit);
  const container = document.createElement('div');
  container.className = 'terminal-container';
  panesEl.appendChild(container);
  term.open(container);
  fit.fit();
  return { term, fit, container };
}

function startSession(cfg) {
  const id = 's' + Date.now();
  const { term, fit, container } = newTerminalInstance();
  const session = { id, term, fit, container, cfg };
  sessions.push(session);
  createTab(session);
  showSession(id);

  // Wire socket events for this session
  socket.emit('start-ssh', { ...cfg, cols: term.cols, rows: term.rows });

  socket.on('data', (d) => {
    term.write(d);
  });
  socket.on('status', (s) => {
    term.writeln('\r\n[' + s + ']');
  });

  term.onData((data) => {
    socket.emit('input', data);
  });

  window.addEventListener('resize', () => fit.fit());

  // Basic resize handler
  term.onResize(({ cols, rows }) => {
    socket.emit('resize', { cols, rows });
  });

  return session;
}

// UI hooks
document.getElementById('connect-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const host = document.getElementById('host').value;
  const port = parseInt(document.getElementById('port').value || '22', 10);
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const privateKey = document.getElementById('privateKey').value || undefined;
  const cfg = { host, port, username };
  if (password) cfg.password = password;
  if (privateKey) cfg.privateKey = privateKey;
  startSession(cfg);
});

document.getElementById('new-tab').addEventListener('click', () => {
  // Open a local shell-like terminal (no SSH) to run simple JS commands
  const id = 'local' + Date.now();
  const { term, fit, container } = newTerminalInstance();
  const session = { id, term, fit, container, local: true };
  sessions.push(session);
  createTab(session);
  showSession(id);
  term.write('\x1b[32mLocal terminal (JS sandbox). Type "help"\x1b[0m\r\n');
  let buffer = '';
  term.onData((d) => {
    if (d === '\r') {
      if (buffer.trim() === 'help') {
        term.writeln('Available: help, clear');
      } else if (buffer.trim() === 'clear') {
        term.clear();
      } else {
        term.writeln('Unrecognized: ' + buffer);
      }
      buffer = '';
      term.write('\r\n$ ');
    } else {
      buffer += d;
      term.write(d);
    }
  });
});

document.getElementById('disconnect-all').addEventListener('click', () => {
  socket.disconnect();
  sessions.forEach((s) => {
    try { s.term.writeln('\r\n[Disconnected]'); } catch (e) {}
  });
});

// Simple split: duplicate the active terminal view
document.getElementById('split-tab').addEventListener('click', () => {
  if (!sessions.length) return;
  const active = sessions.find((s) => s.tabEl && s.tabEl.classList.contains('active')) || sessions[0];
  const { term, fit, container } = newTerminalInstance();
  term.write('\x1b[33mSplit view (read only)\x1b[0m\r\n');
  // Cannot duplicate live stream easily; user can create new ssh connection instead.
});

// Basic server-side health status
fetch('/_health').catch(() => {});
