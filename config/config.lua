Config = {}
PhoneSystem = {}

-- Phone System Configuration --

Config.PhoneSystem =
"jpr-phonesystem" -- The phone system to use. Options: "jpr-phonesystem", "lb_phone"

-- Phone System Functions Configuration --

if Config.PhoneSystem == "jpr-phonesystem" then
    PhoneSystem = {
        "exports['jpr-phonesystem']:sendiMessage(Receiver Number, Sender Number (Can be a name), Message, Type)",
        "exports['jpr-phonesystem']:getPhoneNumber()" }
elseif Config.PhoneSystem == "lb-phone" then
    PhoneSystem = {
        "exports['lb-phone']:CreateCall(options)",
        "exports['lb-phone']:CreateMessage(options)" }
else
    print("Invalid phone system configuration in config.lua. Please check the Config.PhoneSystem value.")
end

-- Business App Configuration --

Config.BusinessList = {
    ["bus"] = {
        name = "Los Santos Transit",
        icon = "fa-solid fa-bus fa-2xl",
        color = "#e7940e",
        appLabel = "Los Santos Transit",
    },
    ["mechanic"] = {
        name = "Los Santos Customs",
        icon = "fa-solid fa-wrench fa-2xl",
        color = "#e7940e",
        appLabel = "Los Santos Customs",
    },
    ["taxi"] = {
        name = "Yellow Cab Co.",
        icon = "fa-solid fa-taxi fa-2xl",
        color = "#e7940e",
        appLabel = "Yellow Cab Co.",
    },
    ["lawyer"] = {
        name = "Law Office",
        icon = "fa-solid fa-gavel fa-2xl",
        color = "#e7940e",
        appLabel = "Law Office",
    }
}
