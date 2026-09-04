import ComingSoon from '@/components/dashboard/ComingSoon';

export const metadata = { title: 'Wedding Planner' };

export default function PlannerPage() {
  return (
    <ComingSoon
      title="Wedding Planner"
      tagline="Checklist persiapan dengan timeline yang dihitung mundur otomatis dari tanggal pernikahan Anda, plus pencatatan vendor dalam satu tempat."
      features={[
        {
          name: 'Checklist bertimeline',
          description:
            'Tugas persiapan tersusun otomatis: 12 bulan sebelum hari-H sampai minggu terakhir, lengkap dengan tenggat dan status pengerjaan.',
        },
        {
          name: 'Vendor tracker',
          description:
            'Catat kontak, status booking, penawaran harga, dan DP tiap vendor — dari katering, dekorasi, sampai dokumentasi.',
        },
        {
          name: 'Pembagian tugas',
          description:
            'Setiap tugas bisa ditugaskan ke pasangan, keluarga, atau wedding organizer setelah fitur kolaborasi aktif.',
        },
        {
          name: 'Terhubung ke budget',
          description:
            'DP dan pelunasan vendor otomatis muncul sebagai pengeluaran di Budget Tracker.',
        },
      ]}
      note="Tabel checklists dan vendors sudah tersedia di database dan menempel ke wedding project ini, jadi saat modul diaktifkan tidak ada data yang perlu dipindahkan."
    />
  );
}
