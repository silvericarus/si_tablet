local listeners = {}

exports('on', function(eventName, cb)
    if type(eventName) ~= 'string' or type(cb) ~= 'function' then return false end
    listeners[eventName] = listeners[eventName] or {}
    table.insert(listeners[eventName], cb)
    return true
end)

exports('emit', function(eventName, payload)
    local subs = listeners[eventName]
    if subs then
        for _, cb in ipairs(subs) do
            local ok, err = pcall(cb, payload)
            if not ok then
                print(('[si_tablet][core_bus] Error in event "%s": %s'):format(eventName, err))
            end
        end
    end
    TriggerServerEvent('tablet:audit', 'emit', { evt = eventName })
end)

RegisterCommand("tablet_bus_demo", function()
    exports.si_tablet:on('demo:ping', function(payload)
        print('[tablet-core] demo:ping recibido =>', payload and payload.msg or 'nil')
    end)

    exports.si_tablet:emit('demo:ping', { msg = 'Hello Bus!' })
end, false)
