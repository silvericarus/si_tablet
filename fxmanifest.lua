fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'si_tablet'
author 'silvericarus'
version '0.1.0'

ui_page 'web/index.html'

files {
    'web/index.html',
    'web/*'
}

server_scripts {
    'server/audit.lua'
}

client_scripts {
    'client/core_bus.lua',
    'client/core_ui.lua'
}
