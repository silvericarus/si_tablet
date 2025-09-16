fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'si_tablet'
author 'silvericarus'
version '0.1.0'

ui_page 'web/index.html'

files {
    'web/*',
    'web/**/*',
    'apps/**/icon.*',
    'apps/index.json',
    'apps/**/manifest.json'
}

server_scripts {
    'server/audit.lua',
    'server/scopes.lua'
}

client_scripts {
    'client/apps_loader.lua',
    'client/core_bus.lua',
    'client/core_ui.lua'
}
