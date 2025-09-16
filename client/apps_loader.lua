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

exports('GetApps', function() return Apps end)
