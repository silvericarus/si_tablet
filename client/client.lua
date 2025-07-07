RegisterNuiCallback("si_tablet:openApp", function(data, cb)
    if data.app == "business" then
        SetNuiFocus(true, true)
        SendNUIMessage({
            action = "openApp",
            app = "business"
        })
    elseif data.app == "stocks" then
        SetNuiFocus(true, true)
        SendNUIMessage({
            action = "openApp",
            app = "stocks"
        })
    elseif data.app == "settings" then
        SetNuiFocus(true, true)
        SendNUIMessage({
            action = "openApp",
            app = "settings"
        })
    end
    cb("ok")
end)