local resourceName = GetCurrentResourceName()
local Apps = {}
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

local function loadAllManifests()
    local list = loadIndex()
    for _, appName in ipairs(list) do
        local man = loadManifest(appName)
        if man then
            table.insert(Apps, man)
        else
            print(("Failed to load manifest for app '%s'"):format(appName))
        end
    end
    print(("Loaded %d app manifests"):format(#Apps))
    loaded = true
end

local function sendAppsToNui()
    if not loaded then loadAllManifests() end
    print(('send_apps_to_nui → %d apps'):format(#Apps))
    SendNUIMessage({
        action = "tablet:apps",
        apps = Apps
    })
end

CreateThread(function()
    loadAllManifests()
end)

exports('SendAppsToNui', function()
    sendAppsToNui()
end)

exports('GetApps', function() return Apps end)
