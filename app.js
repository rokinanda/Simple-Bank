const chalk = require('chalk')
const {tulisPertanyaan, mainMenu, deleteStorage} = require('./bankSimpel')
const main = async () => {
 deleteStorage()
 const answer = await tulisPertanyaan(chalk`        {bgBlue :::Selamat Datang di simpel bank:::
--- Menabunglah untuk masa depan yang lebih cerah ---}
 Silahkan Pilih Menu di bawah ini:
 1.Login
 2.Keluar
 `)

 mainMenu(answer)

}

main()