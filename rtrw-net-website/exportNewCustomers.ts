import { PrismaClient } from '@prisma/client'
import * as xlsx from 'xlsx'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

async function main() {
  // Ambil data pelanggan yang baru (misalnya kita ambil semua pelanggan tapi bisa difilter jika perlu)
  const customers = await prisma.user.findMany({
    where: {
      role: 'PELANGGAN'
    },
    orderBy: {
      name: 'asc'
    }
  })

  const data = customers.map(c => {
    let phone = c.phone || '';
    if (phone.length < 11) {
      phone = '';
    } else if (phone.startsWith('08')) {
      phone = '628' + phone.substring(2);
    }

    // Tanggal pemasangan random (misal dalam 30 hari terakhir)
    const randomDate = faker.date.recent({ days: 30 })
    
    // Format tanggal ke DD/MM/YYYY
    const formattedDate = `${randomDate.getDate().toString().padStart(2, '0')}/${(randomDate.getMonth() + 1).toString().padStart(2, '0')}/${randomDate.getFullYear()}`

    return {
      'nama': c.name,
      'alamat': c.address || '',
      'abonemen': c.abonemen,
      'tgl pemasangan': formattedDate,
      'no telp': phone
    }
  })

  const worksheet = xlsx.utils.json_to_sheet(data)
  const workbook = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Pelanggan')

  const fileName = 'Data_Pelanggan_Baru.xlsx'
  xlsx.writeFile(workbook, fileName)
  console.log(`Berhasil mengekstrak ${data.length} data pelanggan ke file ${fileName}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
