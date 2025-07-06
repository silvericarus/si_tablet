fx_version('cerulean')
games({ 'gta5' })

shared_script('config/config.lua');

server_scripts({
    'server/server.lua'
});

client_scripts({
    'client/client.lua'
});

ui_page('html/index.html')

files({
    'ui/index.html',
    'ui/styles.css',
    'ui/main.js',
    'ui/assets/*.png',
    'ui/assets/*.woff2'
})