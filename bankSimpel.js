const fs = require('fs')
const readline = require('readline');
const loadJson = require('./dao/loadDataJson')
const animation = require('./additional/animation')
const chalk = require('chalk')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const tulisPertanyaan = (pertanyaan) => {
  return new Promise((resolve) => {
    rl.question(pertanyaan, (jawaban) => {
      resolve(jawaban)
    })
  })
}

const mainMenu = (jawaban) => {
  if (jawaban === '1') {
    return login()
  }
    console.log('Terima kasih telah berkunjung')
    rl.close()
}

const login = async () => {
  const username = await tulisPertanyaan('Masukkan username anda: \n')
  const contacts = loadJson('data/nasabah.json')
  const nasabahName = contacts.find((nama) => nama.nama === username)
  const spinner = await animation('Mencoba login..', 1000)
  
  if(!nasabahName) {
    spinner.fail('Gagal login')
    console.log('mohon mendaftar terlebih dahulu')
    return mainMenu()
  } else {
    spinner.succeed('Berhasil login')
    fs.writeFileSync('data/loginStorage.json', JSON.stringify(nasabahName))
    return fitur()
  }
}

const fitur = async () => {
  const storageResult = loadJson('data/loginStorage.json')
  let options = `Silahkan Pilih Menu di bawah ini:
  1.Transfer
  2.Cek saldo
  3.Wallet
  4.History
  5.Wishlist
  6.Logout
  Pilih Menu: `;
  if(storageResult.role === 'admin') {
  options = `Silahkan Pilih Menu di bawah ini:
  1.Daftar
  2.Daftar Wallet
  3.Logout
  Pilih Menu: `
  }
  answer = await tulisPertanyaan(options)
  if (answer === '1' && storageResult.role === 'nasabah') {
    return transfer()
  }
  if (answer === '1' && storageResult.role === 'admin') {
    return daftar()
  }
  if (answer === '2' && storageResult.role === 'admin') {
    return daftarWalletAdmin()
  }
  if (answer === '2' && storageResult.role === 'nasabah') {
    return cekSaldo()
  }
  if (answer === '3' && storageResult.role === 'nasabah') {
    return walletMenu()
  }
  if (answer === '4' && storageResult.role === 'nasabah') {
    const storageResult = loadJson('data/loginStorage.json')
    return history(storageResult.nama)
  }
  if (answer === '5' && storageResult.role === 'nasabah') {
    return wishlist()
  }
   else {
    console.log('Terima kasih telah berkunjung')
    rl.close()
  }
}


const transfer = async () => {
  const noRek = await tulisPertanyaan('Masukkan no rekening yang anda tuju: \n')
  const nasabahPayload = loadJson('data/nasabah.json')
  const storageResult = loadJson('data/loginStorage.json')
  if (storageResult.accountNumber === noRek) {
    console.log('Anda tidak bisa melakukan transfer ke rekening anda sendiri')
    return transfer()
  }
  const searchNasabah = nasabahPayload.find((data) => data.accountNumber === noRek )
  if (!searchNasabah) {
    console.log('No Rekening yang anda cari tidak ditemukan, Mohon cek kembali')
    return transfer()
  }
  const nominal = await tulisPertanyaan('Masukkan nominal (Minimum 5000): \n')
  const formatNominal = parseInt(nominal)
  if(formatNominal < 5000) {
    console.log('Minimal transfer 5000')
    return fitur()
  }
  searchNasabah.amount += parseInt(formatNominal)
  storageResult.amount -= parseInt(formatNominal)
  if (storageResult.amount < 0) {
    console.log('Saldo anda tidak cukup')
    return fitur()
  }
    const res = [searchNasabah.accountNumber, storageResult.accountNumber]
    const spinner = await animation('Sedang melakukan transaksi', 2000)
    spinner.succeed('Transfer Berhasil')
    console.log(`sisa saldo anda ${currencyFormat(storageResult.amount)}`)
    const filterNasabah = nasabahPayload.filter((data) => !res.includes(data.accountNumber))
    filterNasabah.push(searchNasabah)
    filterNasabah.push(storageResult)
    fs.writeFileSync('data/nasabah.json', JSON.stringify(filterNasabah))
    insertHistory(storageResult, "Transfer", formatNominal, {noRek})
    fs.writeFileSync('data/loginStorage.json', JSON.stringify(storageResult))
    return fitur()
  }


const cekSaldo = () => {
  const storage = fs.readFileSync('data/loginStorage.json', 'utf-8')
  const storageResult = JSON.parse(storage)
  console.log(`sisa saldo anda adalah ${currencyFormat(storageResult.amount)}`)
  return fitur()
}

const currencyFormat = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number)
}

const deleteStorage = () => {
  const loginStorage = fs.readFileSync('data/loginStorage.json', 'utf-8')
  if(loginStorage) {
    fs.writeFileSync('data/loginStorage.json', JSON.stringify({}))
  }
}

const history = (name) => {
  const checkHistory = loadJson('data/history.json')  
  const getDataHistoryByName = checkHistory.filter((data) => data.nama === name)
  console.table(getDataHistoryByName)
  return fitur()
}

const insertHistory = (data, tipe, jmlTransaksi, {noRek = '', noHp = ''} = {}) => {
  const historyData = loadJson('data/history.json')
  const payload = {...data, date:new Date(), tipe, jmlTransaksi, rekeningTujuan: noRek, nomorHandphone:noHp}
  historyData.push(payload)
  fs.writeFileSync('data/history.json', JSON.stringify(historyData))
}

const daftar = async () => {
  const nama = await tulisPertanyaan('Masukkan nama user: ')
  const nasabahPayload = loadJson('data/nasabah.json')
  const searchNasabah = nasabahPayload.find((data) => data.nama === nama )
  if(searchNasabah) {
    console.log('sudah terdaftar')
    return fitur()
  }
  const role = await tulisPertanyaan('User sebagai? (admin, nasabah): ')
  let amount;
  if(role !== 'admin') { 
    amount = await tulisPertanyaan('Masukkan jumlah uang: ')
  }
  let payload = {nama, amount, role}
  if(role === 'admin') {
    payload = {nama, role}
  }
  else {
    nasabahPayload.push(payload)
    fs.writeFileSync('data/nasabah.json', JSON.stringify(nasabahPayload))
    console.log('user berhasil ditambah')
    return fitur()
  }
}

const daftarWalletAdmin = async () => {
  const wallets = daftarWalletExist()
  const wallet = await tulisPertanyaan('Masukkan wallet yang ingin di daftarkan: ')
  const checkWallet = wallets.find((dataWallet) => dataWallet.walletName.toLowerCase() === wallet.toLowerCase())
  if(checkWallet) {
    console.log('wallet sudah terdaftar, mohon di cek kembali')
    return fitur()
  }
  const dataWallet = { walletName: wallet }
  wallets.push(dataWallet)
  fs.writeFileSync('data/wallet.json', JSON.stringify(wallets))
  console.log('wallet berhasil ditambah')
  return fitur()
}

const daftarWalletExist = () => {
  const wallets = loadJson('data/wallet.json')
  console.log(`daftar wallet saat ini: `)
  wallets.forEach((value, index) => {
    console.log(`${index+1}.${value.walletName}`)
  })
  return wallets
}

const walletMenu = async () => {
  const option = await tulisPertanyaan(`Silahkan Pilih Menu di bawah ini:
  1.Daftar wallet
  2.Lihat wallet
  3.Top up
  4.Kembali
  Pilih Menu: `)
  if ( option === '1' ) {
    return daftarWallet()
  }
  if ( option === '2' ) {
    return lihatWalletUtama()
  }
  if ( option === '3' ) {
    return topUp()
  } 
  return fitur()
}

  const daftarWallet = async () => {
    const wallets = daftarWalletExist()  
    const wallet = await tulisPertanyaan('Masukkan wallet yang ingin di daftarkan: ')
    const checkWallet = wallets.find((dataWallet) => dataWallet.walletName.toLowerCase() === wallet.toLowerCase())
    if (!checkWallet) {
      console.log('wallet yang anda pilih tidak ditemukan')
      return daftarWallet()
    }
    const noHp = await tulisPertanyaan('Masukkan nomor handphone: ')
    const walletName = await tulisPertanyaan('Masukkan nomor handphone: ')
    const walletAccount = loadJson('data/walletAccount.json')

    const { nama } = loadJson('data/loginStorage.json')
    const payload = {nama, walletName, noHp, wallet}
    walletAccount.push(payload)
    fs.writeFileSync('data/walletAccount.json', JSON.stringify(walletAccount))
    console.log('wallet berhasil ditambah')
    return walletMenu()
  }

  const lihatWalletUtama = () => {
    lihatWallet()
    return walletMenu()
  }

  const lihatWallet = () => { 
    const wallets = loadJson('data/walletAccount.json')
    wallets.forEach((value, index) => {
      console.log(`${index+1}.${value.walletName}`)
    })
    return wallets
  }

  const topUp = async () => {
    const wallets = lihatWallet()
    const walletTopUp = await tulisPertanyaan('Pilih wallet yang ingin di top up: ')
    const wallet = wallets.find((data, index) => index+1 === parseInt(walletTopUp))
    if (!wallet) {
      console.log('wallet yang anda pilih belum terdaftar')
      return walletMenu()
    }
    const topUpAmount = await tulisPertanyaan('Masukkan nominal yang ingin di top up: ')
    const nasabahPayload = loadJson('data/nasabah.json')
    const storageResult = loadJson('data/loginStorage.json')
    const searchNasabah = nasabahPayload.find((data) => data.nama === storageResult.nama )
    const formatNominal = parseInt(topUpAmount)
    searchNasabah.amount -= parseInt(formatNominal)
    storageResult.amount = searchNasabah.amount
    if (storageResult.amount < 0) {
      console.log('Saldo anda tidak cukup')
      return fitur()
    }
    const res = [searchNasabah.nama, storageResult.nama]
    console.log(`transfer berhasil, sisa saldo anda ${currencyFormat(storageResult.amount)}`)
    const filterNasabah = nasabahPayload.filter((data) => !res.includes(data.nama))
    filterNasabah.push(storageResult)
    fs.writeFileSync('data/nasabah.json', JSON.stringify(filterNasabah))
    const payload = {
      noRek:null,
      noHp: wallet.noHp
    }
    insertHistory(storageResult, "Top Up", formatNominal, payload)
    fs.writeFileSync('data/loginStorage.json', JSON.stringify(storageResult))
    return walletMenu()
  }

  const wishlist = async () => {
    const option = await tulisPertanyaan(`Silahkan Pilih Menu di bawah ini:
    1.Daftar wishlist
    2.Isi wishlist
    3.Beli Wishlist
    4.Logout
    Pilih Menu: `)
    if (option === '1') {
      return daftarWishlist()
    }
    if (option === '2') {
      return lihatWishlist()
    }
    if (option === '3') {
      return beliWishlist()
    }
    else {
      console.log('Terima kasih telah berkunjung')
      rl.close()
    }
  }

  const daftarWishlist = async () => {
    const wishlistPayload = loadJson('data/wishlist.json')
    const harapan = await tulisPertanyaan(`Tuliskan harapan kamu: `)
    const duit = await tulisPertanyaan(`Kasih tau berapa uang yang kamu ingin capai: `)
    const formatDuit = parseInt(duit)
    const payload = {harapan, duit: formatDuit}
    wishlistPayload.push(payload)
    fs.writeFileSync('data/wishlist.json', JSON.stringify(wishlistPayload))
    return wishlist()
  }

  const lihatWishlist = () => { 
    const dataWishlist = loadJson('data/wishlist.json')
    const storageResult = loadJson('data/loginStorage.json')
    dataWishlist.forEach((value, index) => {
      if(storageResult.amount >= value.duit) {
        return console.log(chalk`{bgGreen.black.bold ${index+1}.${value.harapan} - ${currencyFormat(value.duit)} - (Sudah Tercapai)}`)
      }
      console.log(chalk`{bgBlue ${index+1}.${value.harapan} - ${currencyFormat(value.duit)} - (Belum Tercapai)}`)
    })
    return wishlist()
  }

  const beliWishlist = async () => {
    const dataWishlist = loadJson('data/wishlist.json')
    const storageResult = loadJson('data/loginStorage.json')
    const nasabahPayload = loadJson('data/nasabah.json')
    const payloadNasabah = nasabahPayload.find((data) => data.nama === storageResult.nama)
    const newPayload = nasabahPayload.filter((data) => data.nama !== storageResult.nama)
    const getSuccessWishlist = dataWishlist.filter((data) => storageResult.amount >= data.duit)    
    if (getSuccessWishlist.length === 0) {
      console.log('Belum ada wishlist yang tercapai')
      return wishlist()
    }
    getSuccessWishlist.forEach((value, index) => {
      console.log(chalk`{bgGreen.black.bold ${index+1}.${value.harapan} - ${currencyFormat(value.duit)} - (Sudah Tercapai)}`)
    })
    const harapan = await tulisPertanyaan(`Pilih Wishlist yang ingin dibeli:`)
    let filterBuy;
    let harga = 0
    getSuccessWishlist.forEach((value, index) => {
      if(index+1 === parseInt(harapan)) {
        filterBuy = dataWishlist.filter((data) => data.harapan !== value.harapan)
        harga = value.duit
      }
    })
    payloadNasabah.amount -= harga
    storageResult.amount -= harga
    newPayload.push(payloadNasabah)
    fs.writeFileSync('data/wishlist.json', JSON.stringify(filterBuy))
    fs.writeFileSync('data/nasabah.json', JSON.stringify(newPayload))
    fs.writeFileSync('data/loginStorage.json', JSON.stringify(storageResult))
    insertHistory(storageResult,"Beli Wishlist", harga)
    return wishlist()
  }

module.exports = {
  tulisPertanyaan,
  mainMenu,
  login,
  deleteStorage
}