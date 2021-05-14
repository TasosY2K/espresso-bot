# Espresso Bot

HTTP/HTTPS based Golang botnet
![image](https://user-images.githubusercontent.com/29873078/118262572-bd23f100-b4bd-11eb-9aed-a5b25bdf4d5b.png)

### Information

Espresso is a simple loader/bot inteded to be used for red team operations at controlled pentetsing enviroments. It features a centralized command & control server, session based API encryption and uses a Discord bot as the admin interface. It uses Rubber ducky or any keyboard emulation capable microcontroller as a spreading agent.

### C&C Features

-   Writen in NodeJS
-   Cross platform
-   Discord bot control (no login system required)
-   Used ID whitelist
-   IP blacklist
-   Using ORM (compatible with any SQL database)
-   User-Agent filtering

### Bot Features

-   Written in Go
-   Persistence
-   AES256 traffic and file encryption
-   System information (OS, arch, hostname)
-   Download and run .exe remotely
-   TCP flooding
-   USB Rubber Ducky or Arduino spreading

### How to use

**Server**

-   Install NodeJS
-   Unzip the project and cd into it
-   Install NodeJS dependencies with `yarn install` or `npm install`
-   Edit `.env` with your info
-   Edit the **User Whitelist** with your discord id's
-   Edit the **Ip Blacklist** with your ip's
-   Start server with `yarn start` or `npm start`

**Client**

-   Install Golang
-   cd to `client/` and install Go registry with `go get -u golang.org/x/sys/windows/registry`
-   Edit the variables in `espresso.go` at the `main` function with your info
-   Build the client by running `build.bat` or `build.sh`
-   Your coffee is ready `espresso.go`

**Spreading**

-   Install Arduino IDE or Rubber Ducky flasher
-   Edit `client/DownloadAndRun.txt` or `client/DownloadAndRun.ino` with your payload url
-   Flash

### Screenshots

![image](https://user-images.githubusercontent.com/29873078/118262912-3ae7fc80-b4be-11eb-8b0c-2635b2106b2f.png)

![image](https://user-images.githubusercontent.com/29873078/118263219-a6ca6500-b4be-11eb-9cef-2e88d1c9980f.png)

![image](https://user-images.githubusercontent.com/29873078/118263348-d0838c00-b4be-11eb-863b-a1cc739578d1.png)

### Todo

-   Better spreading agent
-   Add obfuscation
-   Fix loader
-   Add kill switch
-   Add melt function
