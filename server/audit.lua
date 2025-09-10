RegisterNetEvent('tablet:audit', function(action, meta)
    local src = source
    print(('[si_tablet][AUDIT] Source: %s | Action: %s | Meta: %s'):format(
        tostring(src), tostring(action), json.encode(meta or {})
    ))
end)
