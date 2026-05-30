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
    <tr className="border-b border-line/20 transition-colors last:border-0 hover:bg-primary/[0.03]">
      <td className="px-4 py-3 text-sm text-muted">{index}</td>
      <td className="px-4 py-3">
        <p className="font-semibold text-ink">{nasabah.nama}</p>
        <p className="text-xs text-muted">NIK {nasabah.nik}</p>
      </td>
      <td className="px-4 py-3 text-sm text-ink">{nasabah.email}</td>
      <td className="px-4 py-3 text-sm text-ink">{nasabah.nomorHp}</td>
      <td className="hidden px-4 py-3 text-sm text-muted lg:table-cell">
        {formatTanggal(nasabah.createdAt, false)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(nasabah)}
            aria-label={`Edit ${nasabah.nama}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary-dark/25 text-primary-deep transition-colors hover:bg-primary/5"
          >
            <IconEdit className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => onDelete(nasabah)}
            aria-label={`Hapus ${nasabah.nama}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-danger/30 text-danger transition-colors hover:bg-danger/5 disabled:opacity-50"
          >
            <IconTrash className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
