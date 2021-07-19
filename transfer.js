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
    fs.writeFileSync('data/loginStorage.json', JSON.stringify(storageResult))
    return fitur()
  }

  module.exports = transfer