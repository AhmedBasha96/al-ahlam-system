# Deploy on linux server 
## setup docker on server

# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

 sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo docker run hello-world

sudo systemctl enable docker
sudo systemctl start docker
sudo systemctl status docker

docker --version

============================
## Disable ipv6 if can' reach internet 
sudo nano /etc/docker/daemon.json
{
  "ipv6": false,
  "dns": ["8.8.8.8", "1.1.1.1"]
}

sudo nano /etc/sysctl.conf

- add at the end
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
net.ipv6.conf.lo.disable_ipv6 = 1


sudo sysctl -p
sudo systemctl restart docker
curl -v https://mcr.microsoft.com/v2/

## increase docker timeout in shell
export DOCKER_CLIENT_TIMEOUT=600
export COMPOSE_HTTP_TIMEOUT=600

sudo nano /etc/resolv.conf
nameserver 8.8.8.8
nameserver 8.8.4.4

=============================
## Firewall setup 
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 1433/tcp
sudo ufw enable
sudo ufw reload

## Connect to github 

ssh-keygen -t ed25519 -C "ab150047@gmail.com"
cat ~/.ssh/id_ed25519.pub

Copy the result key and add it into Magdy Github  SSH Keys

git clone git@github.com:AhmedBasha96/al-ahlam-system.git
chmod +x deploy.sh

## Build & run docker 
inside cloned folder

./deploy.sh

## database 
 change connection string to refer to "<ip,port>, ..."
 update-database 


 # setup reverse proxy
    sudo apt update
    sudo apt install nginx -y
    sudo systemctl start nginx
    sudo systemctl enable nginx
    sudo nano /etc/nginx/sites-available/default

   server {
    listen 80;
    server_name _;  # This will match any request coming to the IP

    location / {
        proxy_pass http://localhost:5000; # Your application's address
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Additional headers
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}


    sudo nginx -t
    sudo systemctl reload nginx

    sudo ufw allow 'Nginx Full'
    sudo ufw reload


# Increase nginx proxy request size

nano /etc/nginx/nginx.conf
add lines in http:
        client_max_body_size 100M;
        client_body_timeout 300s;
        client_header_timeout 300s;
        keepalive_timeout 300s;
        send_timeout 300s;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
sudo systemctl restart nginx



# SSL Setup
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d <your_domain.com>
sudo systemctl status certbot.timer

## redeploy
go to server then run deploy.sh file





# Save password with SSH
on local PC:
ssh-keygen -t rsa -b 4096
type %USERPROFILE%\.ssh\id_rsa.pub
on remote:
mkdir -p ~/.ssh
echo "ssh-rsa -----<YOUR_SSH_KEY_HERE>" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys



## regular DB backup

# Create the backup directory if it doesn't exist
docker exec -u 0 sql-server-container mkdir -p /var/opt/mssql/backups

# Change ownership to mssql user (UID 10001) and root group (GID 0)
docker exec -u 0 sql-server-container chown -R 10001:0 /var/opt/mssql/backups

# Set appropriate permissions (read/write for user and group)
docker exec -u 0 sql-server-container chmod -R 775 /var/opt/mssql/backups

# add this volume to sql-service
 - ./sql-backups:/var/opt/mssql/backups

# create backup script
chmod +x regular-backup.sh
crontab -e
add this line
0 0 * * * ~/src/regular-backup.sh
and save


## Servcer SWAP memory
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab


## copy file from local to docker container: 
docker cp allUploads.zip src_dotnet-api_1:app/wwwroot/
docker exec -it src_dotnet-api_1 /bin/bash
cd wwwroot
unzip -o file.zip



#  mintoring
free -m
top
htop


# NetData mintoring
wget https://raw.githubusercontent.com/netdata/netdata/master/packaging/installer/kickstart.sh
chmod +x kickstart.sh
sudo ./kickstart.sh --dont-wait

sudo usermod -aG docker netdata
sudo nano /etc/netdata/go.d/docker.conf
paste this: 
```cmd
jobs:
  - name: local
    url: http://127.0.0.1:2375  # Or use socket: unix:///var/run/docker.sock
    
  - name: containers
    enabled: yes
    timeout: 1
    labels_filter: '*'

```

ufw allow 19999
ufw reload
access: http://198.7.114.58:19999




## Setup docker monitor on port 9000
docker volume create portainer_data
docker run -d -p 9000:9000 -p 8000:8000  --name=portainer --restart=always  -v /var/run/docker.sock:/var/run/docker.sock  -v portainer_data:/data  portainer/portainer-ce