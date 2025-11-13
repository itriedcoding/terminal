SSH & distro quick reference

Ubuntu / Debian:
- Connect: `ssh user@host`
- Copy public key: `ssh-copy-id user@host`
- Update packages: `sudo apt update && sudo apt upgrade -y`
- Install package: `sudo apt install -y <pkg>`
- Search package: `apt-cache search <term>`
- Remove package: `sudo apt remove --purge <pkg>`
- Check services: `systemctl status <service>`

CentOS / RHEL / Rocky / AlmaLinux:
- Connect: `ssh user@host`
- Update: `sudo yum update -y` or `sudo dnf update -y`
- Install: `sudo yum install -y <pkg>` or `sudo dnf install -y <pkg>`
- SELinux: `sestatus` and `sudo setenforce 0` (temporarily)

Common useful commands:
- Tail logs: `sudo journalctl -u <service> -f` or `tail -f /var/log/syslog`
- Disk usage: `df -h` and `du -sh *`
- Network: `ss -tuln`, `ip addr`, `ping`, `traceroute`
- Docker: `docker ps`, `docker logs -f <container>`

SSH tips:
- Generate key: `ssh-keygen -t ed25519 -C "you@example.com"`
- Forward agent: `ssh -A user@host`
- Local port forward: `ssh -L 8080:remote:80 user@host`
- Remote port forward: `ssh -R 2222:localhost:22 user@host`
