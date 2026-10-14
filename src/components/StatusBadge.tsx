import type { OrderStatus } from '../types';
import { cn } from '../utils';

const statusConfig: Record<OrderStatus, { label: string; cls: string; dot: string }> = {
  menunggu_konfirmasi: {
    label: 'Menunggu Konfirmasi',
    cls: 'bg-gray-100 text-gray-700 border-gray-200',
    dot: 'bg-gray-400',
  },
  diproses: {
    label: 'Pesanan Diproses',
    cls: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  dalam_perjalanan: {
    label: 'Sedang Diantar Armada Kami',
    cls: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  selesai: {
    label: 'Tiba di Tujuan',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        cfg.cls
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export { statusConfig };
