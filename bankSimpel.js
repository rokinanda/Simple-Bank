const fs = require('fs')
const readline = require('readline');

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
  if(!nasabahName) {
    console.log('mohon mendaftar terlebih dahulu')
    return mainMenu()
  } else {
    fs.writeFileSync('data/loginStorage.json', JSON.stringify(nasabahName))
    return fitur()
  }
}

const fitur = async () => {
  const storageResult = loadJson('data/loginStorage.json')
  let options = `Silahkan Pilih Menu di bawah ini:
  1.Transfer
  2.Cek saldo
  3.History
  4.Logout
  `;
  if(storageResult.role === 'admin') {
  options = `Silahkan Pilih Menu di bawah ini:
  1.Daftar
  2.Logout
  `
  }
  answer = await tulisPertanyaan(options)
  if (answer === '1' && storageResult.role === 'nasabah') {
    return transfer()
  }
  if (answer === '1' && storageResult.role === 'admin') {
    return daftar()
  }
  if (answer === '2' && storageResult.role === 'nasabah') {
    return cekSaldo()
  }
  if (answer === '3' && storageResult.role === 'nasabah') {
    const storageResult = loadJson('data/loginStorage.json')
    return history(storageResult.nama)
  } else {
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
  searchNasabah.amount += parseInt(formatNominal)
  storageResult.amount -= parseInt(formatNominal)
  if (storageResult.amount < 0) {
    console.log('Saldo anda tidak cukup')
    return fitur()
  }
    const res = [searchNasabah.accountNumber, storageResult.accountNumber]
    console.log(`transfer berhasil, sisa saldo anda ${currencyFormat(storageResult.amount)}`)
    const filterNasabah = nasabahPayload.filter((data) => !res.includes(data.accountNumber))
    filterNasabah.push(searchNasabah)
    filterNasabah.push(storageResult)
    fs.writeFileSync('data/nasabah.json', JSON.stringify(filterNasabah))
    insertHistory(storageResult, "Transfer", nominal, noRek)
    fs.writeFileSync('data/loginStorage.json', JSON.stringify(storageResult))
    return fitur()
  }


const cekSaldo = () => {
  const storage = fs.readFileSync('data/loginStorage.json', 'utf-8')
  const storageResult = JSON.parse(storage)
  console.log(`sisa saldo anda adalah ${currencyFormat(storageResult.amount)}`)
  return fitur()
}

const loadJson = (path) => {
  const file = fs.readFileSync(path, 'utf-8')
  const contacts = JSON.parse(file)
  return contacts
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

const insertHistory = (data, tipe, jmlTransaksi, rekTujuan) => {
  const historyData = loadJson('data/history.json')
  const payload = {...data, date:new Date(), tipe, jmlTransaksi, rekTujuan}
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

module.exports = {
  tulisPertanyaan,
  mainMenu,
  login,
  deleteStorage
}