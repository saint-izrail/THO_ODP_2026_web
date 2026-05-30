// Baris tabel untuk satu nasabah (presentational). Aksi edit/hapus
// didelegasikan ke induk lewat props.
import type { NasabahDetail } from "@/lib/nasabah";
import { formatTanggal } from "@/lib/format";
import { IconEdit, IconTrash } from "@/components/icons";

export function NasabahRow({
  nasabah,
  index,
  deleting,
  onEdit,
  onDelete,
}: {
  nasabah: NasabahDetail;
  index: number;
  deleting: boolean;
  onEdit: (n: NasabahDetail) => void;
  onDelete: (n: NasabahDetail) => void;
}) {
  return (
    <tr className="group border-b border-edge transition-colors last:border-0 hover:bg-gradient-to-r hover:from-primary/[0.05] hover:to-gold/[0.03]">
      <td className="px-4 py-3.5">
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg border border-edge bg-surface-2 px-1.5 text-xs font-semibold text-muted transition-colors group-hover:border-edge-strong group-hover:text-primary-deep">
          {index}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <p className="font-semibold text-ink">{nasabah.nama}</p>
        <p className="text-xs tracking-wide text-muted">NIK {nasabah.nik}</p>
      </td>
      <td className="px-4 py-3.5 text-sm text-ink">{nasabah.email}</td>
      <td className="px-4 py-3.5 text-sm text-ink">{nasabah.nomorHp}</td>
      <td className="hidden px-4 py-3.5 text-sm text-muted lg:table-cell">
        {formatTanggal(nasabah.createdAt, false)}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(nasabah)}
            aria-label={`Edit ${nasabah.nama}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary-dark/25 text-primary-deep transition-all hover:-translate-y-0.5 hover:border-primary-dark/40 hover:bg-primary/10 hover:shadow-md hover:shadow-primary/20 active:scale-95"
          >
            <IconEdit className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => onDelete(nasabah)}
            aria-label={`Hapus ${nasabah.nama}`}
            aria-busy={deleting}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-danger/30 text-danger transition-all hover:-translate-y-0.5 hover:border-danger/50 hover:bg-danger/10 hover:shadow-md hover:shadow-danger/20 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            <IconTrash className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
