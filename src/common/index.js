export const writeCookie = (key, value, days) => {
    let date = new Date();
    days = days || 7;
    date.setDate(date.getDate() + days);

    let cookie = document.cookie = key + "=" + value + "; expires =" + date.toGMTString() + "; path=/"
    return cookie;
}

// export const getCookie = (cookieName) => {
//     const re = new RegExp(`(?<=${cookieName}=)[^;]*`)

//     try {
//         let cookie = document.cookie.match(re)[0]
//         return cookie
//     } catch (error) {
//         return false
//     }
// }

export const deleteCookie = (cookieName) => {
    try {
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    } catch (error) {
        console.log(error)
    }
}