local isOpen = false
local resourceName = GetCurrentResourceName()

local function send(msg)
    SendNUIMessage(msg)
end

local function setVisible(state)
    isOpen = state
    SetNuiFocus(state, state)
    send({ type = "tablet:visible", value = state })
    print('[baseline] toggle ->', state and 'open' or 'close')

    if state then
        send({ type = "tablet:navigate", route = "/home" })
    end
end

RegisterCommand("tablet", function()
    setVisible(not isOpen)
end, false)

-- RegisterKeyMapping('tablet', 'Abrir/cerrar Tablet', 'keyboard', 'F1')

RegisterNUICallback("uiClose", function(_, cb)
    setVisible(false)
    cb({ ok = true })
end)

RegisterNUICallback("uiReady", function(_, cb)
    print("[si_tablet] UI Ready")
    cb({ ok = true, resource = resourceName })
end)

RegisterCommand('tablet_force', function()
    send({ type = 'tablet:force' })
end, false)

AddEventHandler("onResourceStop", function(resource)
    if resource == resourceName then
        SetNuiFocus(false, false)
    end
end)
