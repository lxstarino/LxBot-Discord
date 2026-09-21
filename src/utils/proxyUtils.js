function isProxyable(val) {
    if (!val || typeof val !== "object" || val.__isProxy) return false
    return Array.isArray(val) || Object.prototype.toString.call(val) === "[object Object]"
}

function createAutoSaveProxy(target, onSave) {
    if (!isProxyable(target)) return target

    const handler = {
        get(obj, prop, receiver) {
            if (prop === "__isProxy") return true
            if (prop === "__raw") return obj
            const val = Reflect.get(obj, prop, receiver)
            if (isProxyable(val)) {
                return new Proxy(val, handler)
            }
            return val
        },
        set(obj, prop, val, receiver) {
            const res = Reflect.set(obj, prop, val, receiver)
            try {
                onSave(target)
            } catch (err) {
                console.error("[Database AutoSave Error]", err)
            }
            return res
        },
        deleteProperty(obj, prop) {
            const res = Reflect.deleteProperty(obj, prop)
            try {
                onSave(target)
            } catch (err) {
                console.error("[Database AutoSave Error]", err)
            }
            return res
        }
    }

    return new Proxy(target, handler)
}

module.exports = {
    createAutoSaveProxy
}
