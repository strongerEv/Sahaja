'use client';

export type StepSaveProps = {
  saving: boolean;
  onSave: (formData: FormData, options?: { advance?: boolean }) => void | Promise<void>;
};

/**
 * Bungkus form tiap langkah wizard: judul, deskripsi, dan dua tombol aksi
 * (simpan di tempat, atau simpan lalu lanjut ke langkah berikutnya).
 */
export default function StepForm({
  title,
  description,
  children,
  saving,
  onSave,
  hideNext = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  hideNext?: boolean;
} & StepSaveProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        onSave(new FormData(event.currentTarget), {
          advance: submitter?.value === 'next',
        });
      }}
      className="card space-y-5"
    >
      <header>
        <h2 className="font-display text-2xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </header>

      {children}

      <div className="flex flex-wrap gap-2 border-t border-line pt-5">
        <button type="submit" value="save" className="btn-ghost" disabled={saving}>
          {saving ? 'Menyimpan…' : 'Simpan'}
        </button>
        {!hideNext && (
          <button type="submit" value="next" className="btn-primary" disabled={saving}>
            Simpan &amp; lanjut →
          </button>
        )}
      </div>
    </form>
  );
}
