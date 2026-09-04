import ComingSoon from '@/components/dashboard/ComingSoon';

export const metadata = { title: 'Budget Tracker' };

export default function BudgetPage() {
  return (
    <ComingSoon
      title="Budget Tracker"
      tagline="Alokasikan anggaran per kategori, catat pengeluaran nyata, dan lihat seberapa jauh realisasi dari rencana."
      features={[
        {
          name: 'Alokasi per kategori',
          description:
            'Tentukan pagu untuk katering, dekorasi, busana, dokumentasi, dan lainnya sesuai prioritas Anda.',
        },
        {
          name: 'Realisasi vs alokasi',
          description:
            'Grafik perbandingan rencana dan pengeluaran nyata, dengan penanda kategori yang mulai melewati pagu.',
        },
        {
          name: 'Estimasi net cost',
          description:
            'Total pengeluaran dikurangi amplop digital yang masuk, sehingga terlihat biaya bersih acara.',
        },
        {
          name: 'Riwayat pengeluaran',
          description:
            'Setiap transaksi tercatat dengan tanggal, kategori, catatan, dan vendor terkait.',
        },
      ]}
      note="Tabel budget_allocations dan budget_expenses sudah ada di database sejak awal, siap diisi begitu modul ini dibuka."
    />
  );
}
