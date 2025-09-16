local PlayerScopes = {}

local Config = {
    AceScopes = { "tablet.admin", "tablet.weazel", "tablet.police" },
    Static = {
        -- ["license:xxxxxxxx"] = { "dev", "ace:tablet.admin" }
    }
}

local function getIdentifiers(src)
    local identifiers = {}
    for _, id in ipairs(GetPlayerIdentifiers(src)) do
        local idType, idValue = id:match("^(%a+):(.+)$")
        if idType and idValue then
            identifiers[idType] = (idType .. ":" .. idValue)
        end
    end
end

local function getFrameworkScopes(src)
    local scopes = {}

    --QBCore
    local qbcore = rawget(exports, "qb-core") and exports['qb-core']:GetCoreObject() or nil
    if qbcore and qbcore.Functions then
        local Player = qbcore.Functions.GetPlayer(src)
        if Player and Player.PlayerData and Player.PlayerData.job then
            local job = Player.PlayerData.job.name
            local grade = (Player.PlayerData.job.grade and Player.PlayerData.job.grade.name) or
                Player.PlayerData.job.grade
            if job then scopes["job:" .. job] = true end
            if job and grade then scopes[("job:%s:grade:%s").format(job, tostring(grade))] = true end
        end
        if Player and Player.PlayerData and Player.PlayerData.groups then
            for group, _ in pairs(Player.PlayerData.groups) do
                scopes["group:" .. group] = true
            end
        end
    end

    --ESX
    local esx = rawget(exports, "es_extended") and exports['es_extended']:getSharedObject() or nil
    if esx and esx.GetPlayerFromId(src) then
        local xPlayer = esx.GetPlayerFromId(src)
        if xPlayer and xPlayer.job then
            local job = xPlayer.getJob()
            if job and job.name then
                scopes["job:" .. job.name] = true
                if job.grade then scopes[("job:%s:grade:%s").format(job.name, tostring(job.grade))] = true end
            end
        end
        if xPlayer and xPlayer.getGroup then
            local group = xPlayer.getGroup()
            if group then scopes["group:" .. group] = true end
        end
    end
    return scopes
end

local function computeScopes(src)
    local scopes = {}

    -- ACE scopes
    for _, ace in ipairs(Config.AceScopes) do
        if IsPlayerAceAllowed(src, ace) then
            scopes["ace:" .. ace] = true
        end
    end

    --Framework scopes
    local frameworkScopes = getFrameworkScopes(src)
    for scope, _ in pairs(frameworkScopes) do
        scopes[scope] = true
    end

    -- Static
    local identifiers = getIdentifiers(src)
    for idKey, list in pairs(Config.Static) do
        if identifiers[idKey:match("^([^:]+)") or ""] == idKey then
            for _, scope in ipairs(list) do
                scopes[scope] = true
            end
        end
    end

    return scopes
end

local function setPlayerScopes(src)
    PlayerScopes[src] = computeScopes(src)
end

AddEventHandler("playerJoining", function() setPlayerScopes(source) end)
AddEventHandler("playerDropped", function() PlayerScopes[source] = nil end)

RegisterNetEvent("si_tablet:requestScopes", function()
    local src = source
    if not PlayerScopes[src] then setPlayerScopes(src) end
    TriggerClientEvent("si_tablet:scopesResponse", src, PlayerScopes[src] or {})
end)

RegisterNetEvent("QBCore:Server:OnJobUpdate", function(src, job)
    if type(src) ~= "number" then src = source end
    setPlayerScopes(src)
    TriggerClientEvent("si_tablet:scopesResponse", src, PlayerScopes[src] or {})
end)

RegisterNetEvent("esx:setJob", function(job)
    local src = source
    setPlayerScopes(src)
    TriggerClientEvent("si_tablet:scopesResponse", src, PlayerScopes[src] or {})
end)
