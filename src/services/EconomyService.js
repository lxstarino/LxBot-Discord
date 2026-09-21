class EconomyService {
    static addWallet(profile, amount) {
        if (!profile || typeof amount !== "number" || isNaN(amount) || amount <= 0) return false
        profile.wallet = (profile.wallet || 0) + Math.floor(amount)
        return true
    }

    static removeWallet(profile, amount) {
        if (!profile || typeof amount !== "number" || isNaN(amount) || amount <= 0) return false
        const current = profile.wallet || 0
        if (current < amount) return false
        profile.wallet = current - Math.floor(amount)
        return true
    }

    static setWallet(profile, amount) {
        if (!profile || typeof amount !== "number" || isNaN(amount) || amount < 0) return false
        profile.wallet = Math.floor(amount)
        return true
    }

    static addBank(profile, amount) {
        if (!profile || typeof amount !== "number" || isNaN(amount) || amount <= 0) return false
        profile.bank = (profile.bank || 0) + Math.floor(amount)
        return true
    }

    static removeBank(profile, amount) {
        if (!profile || typeof amount !== "number" || isNaN(amount) || amount <= 0) return false
        const current = profile.bank || 0
        if (current < amount) return false
        profile.bank = current - Math.floor(amount)
        return true
    }

    static setBank(profile, amount) {
        if (!profile || typeof amount !== "number" || isNaN(amount) || amount < 0) return false
        profile.bank = Math.floor(amount)
        return true
    }

    static deposit(profile, amount) {
        if (!profile || typeof amount !== "number" || isNaN(amount) || amount <= 0) return false
        if ((profile.wallet || 0) < amount) return false
        profile.wallet -= amount
        profile.bank = (profile.bank || 0) + amount
        return true
    }

    static withdraw(profile, amount) {
        if (!profile || typeof amount !== "number" || isNaN(amount) || amount <= 0) return false
        if ((profile.bank || 0) < amount) return false
        profile.bank -= amount
        profile.wallet = (profile.wallet || 0) + amount
        return true
    }

    static transfer(senderProfile, receiverProfile, amount) {
        if (!senderProfile || !receiverProfile || typeof amount !== "number" || isNaN(amount) || amount <= 0) return false
        if ((senderProfile.wallet || 0) < amount) return false
        senderProfile.wallet -= amount
        receiverProfile.wallet = (receiverProfile.wallet || 0) + amount
        return true
    }

    static addItem(profile, category, itemKey, count = 1) {
        if (!profile || !category || !itemKey || count <= 0) return false
        if (!profile.inventory) profile.inventory = {}
        if (!profile.inventory[category]) profile.inventory[category] = {}
        profile.inventory[category][itemKey] = (profile.inventory[category][itemKey] || 0) + count
        return true
    }

    static removeItem(profile, category, itemKey, count = 1) {
        if (!profile || !category || !itemKey || count <= 0) return false
        if (!profile.inventory || !profile.inventory[category] || (profile.inventory[category][itemKey] || 0) < count) {
            return false
        }
        profile.inventory[category][itemKey] -= count
        if (profile.inventory[category][itemKey] <= 0) {
            delete profile.inventory[category][itemKey]
        }
        return true
    }

    static hasItem(profile, category, itemKey, count = 1) {
        if (!profile?.inventory?.[category]?.[itemKey]) return false
        return profile.inventory[category][itemKey] >= count
    }
}

module.exports = EconomyService
