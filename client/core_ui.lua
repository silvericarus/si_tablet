local isOpen = false
local resourceName = GetCurrentResourceName()

local function send(msg)
    SendNUIMessage(msg)
end

local function setVisible(state)
    isOpen = state
    SetNuiFocus(state, state)
    send({ type = "tablet:visible", value = state })

    if state then
        TriggerServerEvent('si_tablet:requestScopes')
        exports['si_tablet']:SendAppsToNui()
        send({ type = "tablet:navigate", route = "/home" })
    end
end

RegisterNUICallback('requestApps', function(_, cb)
    if exports[resourceName] and exports[resourceName].SendAppsToNui then
        exports[resourceName]:SendAppsToNui()
    end
    cb({ ok = true })
end)

RegisterCommand("tablet", function()
    setVisible(not isOpen)
end, false)

-- RegisterKeyMapping('tablet', 'Abrir/cerrar Tablet', 'keyboard', 'F1')

RegisterNUICallback("uiClose", function(_, cb)
    setVisible(false)
    cb({ ok = true })
end)

RegisterNUICallback("uiReady", function(_, cb)
    print("UI Ready")
    cb({ ok = true, resource = resourceName })
end)

AddEventHandler("onResourceStop", function(resource)
    if resource == resourceName then
        SetNuiFocus(false, false)
    end
end)
