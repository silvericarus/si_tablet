local resourceName = GetCurrentResourceName()
local AppsRaw, AppsFiltered = {}, {}
local Scopes = {}
local loaded = false

local function readFile(path)
    local raw = LoadResourceFile(resourceName, path)
    if not raw then return nil end
    return raw
end

local function decodeJson(raw, where)
    if not raw then return nil end
    local decoder
    if json and json.decode then
        decoder = json.decode
    elseif lib and lib.json and lib.json.decode then
        decoder = lib.json.decode
    else
        print("No JSON decoder found!")
        return nil
    end

    local ok, result = pcall(decoder, raw)
    if not ok or type(result) ~= 'table' then
        print(("Failed to decode JSON in %s: %s"):format(where, result))
        return nil
    end
    return result
end

local function trim(s) return type(s) == 'string' and s:match('^%s*(.-)%s*$') or s end

local function sanitizeRelPath(rel, allowExts)
    if type(rel) ~= "string" or rel == "" then return nil end
    rel = trim(rel or ''):gsub('[\r\n\t]', ''):gsub('\\', '/'):gsub('^/+', '')
    if rel:find("%.%./", 1, true) or rel:find("/%.%./", 1, true) then return nil end
    if allowExts then
        local ext = rel:match("%.([%w]+)$")
        ext = ext and ext:lower() or nil
        local ok = false
        for _, a in ipairs(allowExts) do
            if ext == a then
                ok = true
                break
            end
        end
        if not ok then return nil end
    end
    return rel
end

local function assetExists(appName, relPath)
    local path = ("apps/%s/%s"):format(appName, relPath)
    local raw = LoadResourceFile(resourceName, path)
    return raw ~= nil, (raw and #raw or 0), path
end

local function toNuiUrl(appName, relPath)
    return ("nui://%s/apps/%s/%s"):format(resourceName, appName, relPath)
end

local ICON_KINDS = { "icon.png", "icon.jpg", "icon.jpeg", "icon.svg", "icon.webp" }

local function findIconFor(appName, explicit)
    if explicit and type(explicit) == "string" and explicit ~= "" then
        if explicit:find("^nui://", 1, true) then return explicit end
        local rel = sanitizeRelPath(explicit, { "png", "jpg", "jpeg", "svg", "webp" })
        if rel and assetExists(appName, rel) then return toNuiUrl(appName, rel) end
    end

    for _, rel in ipairs(ICON_KINDS) do
        if assetExists(appName, rel) then return toNuiUrl(appName, rel) end
    end
    return nil
end

local function validateAssetRel(appName, rel, allowExts, kindLabel)
    local clean = sanitizeRelPath(rel, allowExts)
    if not clean then
        print(("[%s] WARN: %s inválido en app '%s' -> '%s'"):format(resourceName, kindLabel, appName, tostring(rel)))
        return nil
    end
    local ok, _, path = assetExists(appName, clean)
    if not ok then
        print(("[%s] WARN: %s no encontrado en app '%s' -> '%s'"):format(resourceName, kindLabel, appName, path))
        return nil
    end
    return clean
end

local function normalizeRoutes(appName, title, routes)
    local out, seen = {}, {}
    if type(routes) ~= "table" then return out end
    for _, route in ipairs(routes) do
        local path, label
        if type(route) == "string" then
            path, label = route, nil
        elseif type(route) == "table" then
            path = route.path
            label = route.label
        end
        if type(path) == "string" then
            path = path:gsub("%s+", "")
            if path ~= "" then
                if path:sub(1, 1) ~= "/" then path = "/" .. path end
                if not seen[path] then
                    seen[path] = true
                    out[#out + 1] = { path = path, label = label or title or appName }
                end
            end
        end
    end
    return out
end

local function loadIndex()
    local raw = readFile("apps/index.json")
    local list = decodeJson(raw, "apps/index.json")
    if type(list) ~= "table" then list = {} end
    print(("Loaded %d apps from index"):format(#list))
    return list
end

local function loadManifest(appName)
    local path = ("apps/%s/manifest.json"):format(appName)
    local raw = readFile(path)
    if not raw then return nil end
    local man = decodeJson(raw, path)
    if not man then return nil end

    man.name = man.name or appName
    man.title = man.title or appName
    man.routes = man.routes or {}
    if type(man.routes) ~= "table" then man.routes = {} end

    man.icon = findIconFor(appName, man.icon)

    if man.ui then
        man.ui = validateAssetRel(appName, man.ui, { "js" }, "ui")
    end

    if man.style then
        man.style = validateAssetRel(appName, man.style, { "css" }, "style")
    end

    man.routes = normalizeRoutes(appName, man.title, man.routes)

    print(('[%s] manifest %-12s ui=%s style=%s routes=%d')
        :format(resourceName, man.name, tostring(man.ui), tostring(man.style), #man.routes))
    return man
end

local function hasAllScopes(req)
    if not req or #req == 0 then return true end
    for _, scope in ipairs(req) do
        if not Scopes[scope] then return false end
    end
    return true
end

local function refilter()
    AppsFiltered = {}
    for _, app in ipairs(AppsRaw) do
        if hasAllScopes(app.scopes) then
            AppsFiltered[#AppsFiltered + 1] = app
        end
    end
end

local function loadAllManifests()
    AppsRaw = {}
    local list = loadIndex()
    for _, appName in ipairs(list) do
        local man = loadManifest(appName)
        if man then AppsRaw[#AppsRaw + 1] = man end
    end
    loaded = true
end

local function sendAppsToNui()
    if not loaded then loadAllManifests() end
    refilter()
    SendNUIMessage({
        type = "tablet:apps",
        apps = AppsFiltered
    })
end

CreateThread(function()
    loadAllManifests()
end)

exports('SendAppsToNui', function()
    sendAppsToNui()
end)

RegisterNetEvent('si_tablet:scopesResponse', function(map)
    Scopes = map or {}
    sendAppsToNui()
end)

RegisterCommand('tablet_reload_apps', function()
    loaded = false
    loadAllManifests()
    sendAppsToNui()
end, false)

exports('GetApps', function() return AppsFiltered end)
