module.exports = {
    handlemsg
}

function handlemsg(ls, obj){
    Object.entries(obj).map(([key, val]) => {
        ls = `${ls.replace(`\{${key}\}`, val)}`
    })
    return ls
}