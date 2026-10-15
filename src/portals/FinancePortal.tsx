import { useState } from 'react';
import {
  FileText, Wallet, Receipt, Calendar, DollarSign, AlertCircle,
  CheckCircle2, Search, X, Save, TrendingUp, FileSpreadsheet, User,
} from 'lucide-react';
import { useApp } from '../context';
import { AppHeader } from '../components/AppHeader';
import { formatRupiah, formatDate, cn } from '../utils';
import type { Staff, Invoice, PaymentMethod } from '../types';

export type FinanceView = 'invoices' | 'receivables' | 'sales_recap' | 'profile';

export function FinanceDashboard({ staff, view, setView }: {
  staff: Staff;
  view: FinanceView;
  setView: (v: FinanceView) => void;
}) {
  const { invoices, suratJalan, createInvoice, payInvoice } = useApp();

  const navItems = [
    { label: 'Input Faktur', active: view === 'invoices', onClick: () => setView('invoices') },
    { label: 'Daftar Piutang', active: view === 'receivables', onClick: () => setView('receivables') },
    { label: 'Rekap Penjualan', active: view === 'sales_recap', onClick: () => setView('sales_recap') },
    { label: 'Profil', active: view === 'profile', onClick: () => setView('profile') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Dashboard Admin Keuangan" navItems={navItems} />
      {view === 'invoices' && <InvoiceInputView suratJalan={suratJalan} invoices={invoices} createInvoice={createInvoice} />}
      {view === 'receivables' && <ReceivablesView invoices={invoices} payInvoice={payInvoice} />}
      {view === 'sales_recap' && <SalesRecapView invoices={invoices} />}
      {view === 'profile' && <FinanceProfile staff={staff} />}
    </div>
  );
}

function InvoiceInputView({ suratJalan, invoices, createInvoice }: {
  suratJalan: ReturnType<typeof useApp>['suratJalan'];
  invoices: Invoice[];
  createInvoice: ReturnType<typeof useApp>['createInvoice'];
}) {
  const [selectedSJId, setSelectedSJId] = useState('');
  const [nomorFaktur, setNomorFaktur] = useState('');
  const [metode, setMetode] = useState<PaymentMethod>('tunai');
  const [topDays, setTopDays] = useState('30');
  const [catatan, setCatatan] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedSJ = suratJalan.find((s) => s.id === selectedSJId);
  const existingInvoice = invoices.find((inv) => inv.surat_jalan_id === selectedSJId);

  const totalAsli = selectedSJ?.items.reduce((s, i) => s + i.price * i.quantity, 0) ?? 0;
  const totalSetelahPenolakan = selectedSJ?.items.reduce((s, i) => s + i.price * (i.quantity - i.rejected_qty), 0) ?? 0;
  const totalPenolakan = totalAsli - totalSetelahPenolakan;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!selectedSJId) { setError('Pilih Surat Jalan terlebih dahulu'); return; }
    if (!nomorFaktur.trim()) { setError('Nomor Faktur wajib diisi'); return; }
    if (existingInvoice) { setError('Surat Jalan ini sudah memiliki faktur'); return; }

    setSaving(true);
    const result = await createInvoice({
      suratJalanId: selectedSJId,
      nomorFaktur: nomorFaktur.trim(),
      metodePembayaran: metode,
      topJangkaWaktu: metode === 'top' ? parseInt(topDays, 10) || 30 : 0,
      catatan,
    });
    setSaving(false);

    if (result.success) {
      setSuccess(`Faktur ${nomorFaktur.trim()} berhasil dibuat`);
      setSelectedSJId(''); setNomorFaktur(''); setCatatan(''); setMetode('tunai'); setTopDays('30');
      setTimeout(() => setSuccess(null), 4000);
    } else {
      setError(result.error ?? 'Gagal membuat faktur');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-5">
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <Receipt className="h-5 w-5 text-blue-600" /> Input Faktur
        </h1>
        <p className="text-sm text-gray-500">Buat faktur berdasarkan Surat Jalan. Nilai otomatis berkurang jika ada barang ditolak driver.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[440px_1fr]">
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          {error && <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"><AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}</div>}
          {success && <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4 flex-shrink-0" /> {success}</div>}

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Pilih Surat Jalan</label>
            <select value={selectedSJId} onChange={(e) => setSelectedSJId(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" required>
              <option value="">-- Pilih Surat Jalan --</option>
              {suratJalan.map((sj) => {
                const hasInvoice = invoices.some((inv) => inv.surat_jalan_id === sj.id);
                return (
                  <option key={sj.id} value={sj.id} disabled={hasInvoice}>
                    {sj.nomor_surat_jalan} — {sj.store_name} {hasInvoice ? '(Sudah difaktur)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedSJ && (
            <div className="rounded-lg bg-gray-50 p-3 text-xs">
              <p className="mb-1 font-semibold text-gray-700">Manifes Barang:</p>
              {selectedSJ.items.map((item, i) => (
                <div key={i} className="flex justify-between py-0.5">
                  <span className={cn(item.rejected_qty > 0 ? 'text-gray-500' : 'text-gray-700')}>
                    {item.name} × {item.quantity} {item.unit}
                    {item.rejected_qty > 0 && (
                      <span className="ml-1 text-red-500">(-{item.rejected_qty} ditolak: {item.rejection_reason ?? 'tidak ada alasan'})</span>
                    )}
                  </span>
                  <span className="font-medium">{formatRupiah(item.price * (item.quantity - item.rejected_qty))}</span>
                </div>
              ))}
              <div className="mt-2 border-t border-gray-200 pt-2">
                <div className="flex justify-between"><span>Total Asli</span><span className="font-medium">{formatRupiah(totalAsli)}</span></div>
                {totalPenolakan > 0 && (
                  <div className="flex justify-between text-red-600"><span>Potongan Penolakan</span><span>-{formatRupiah(totalPenolakan)}</span></div>
                )}
                <div className="flex justify-between font-bold"><span>Total Faktur</span><span className="text-blue-700">{formatRupiah(totalSetelahPenolakan)}</span></div>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Nomor Faktur</label>
            <input type="text" placeholder="INV-20261015-001" value={nomorFaktur} onChange={(e) => setNomorFaktur(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" required />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Metode Pembayaran</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setMetode('tunai')} className={cn('rounded-lg border py-2.5 text-sm font-medium', metode === 'tunai' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600')}>
                Tunai
              </button>
              <button type="button" onClick={() => setMetode('top')} className={cn('rounded-lg border py-2.5 text-sm font-medium', metode === 'top' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600')}>
                Term of Payment
              </button>
            </div>
          </div>

          {metode === 'top' && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Jangka Waktu Jatuh Tempo (hari)</label>
              <select value={topDays} onChange={(e) => setTopDays(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
                <option value="7">7 Hari</option>
                <option value="14">14 Hari</option>
                <option value="30">30 Hari</option>
                <option value="60">60 Hari</option>
                <option value="90">90 Hari</option>
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Catatan (opsional)</label>
            <input type="text" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan faktur..." className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
          </div>

          <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300">
            <Save className="h-4 w-4" /> {saving ? 'Menyimpan...' : 'Buat Faktur'}
          </button>
        </form>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-gray-900">Faktur Terbaru</h3>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Receipt className="mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">Belum ada faktur</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.slice(0, 15).map((inv) => (
                <div key={inv.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">{inv.nomor_faktur}</p>
                      <p className="text-xs text-gray-400">{inv.store_name} · {inv.nomor_surat_jalan}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-700">{formatRupiah(inv.total_setelah_penolakan)}</p>
                      <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-medium', inv.status === 'lunas' ? 'bg-emerald-50 text-emerald-700' : inv.status === 'jatuh_tempo' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700')}>
                        {inv.status === 'lunas' ? 'Lunas' : inv.status === 'jatuh_tempo' ? 'Jatuh Tempo' : 'Belum Lunas'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                    <span>{inv.metode_pembayaran === 'tunai' ? 'Tunai' : `ToP ${inv.top_jangka_waktu} hari`}</span>
                    {inv.top_jatuh_tempo && <span>· Jatuh tempo: {formatDate(inv.top_jatuh_tempo)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReceivablesView({ invoices, payInvoice }: {
  invoices: Invoice[];
  payInvoice: ReturnType<typeof useApp>['payInvoice'];
}) {
  const [search, setSearch] = useState('');
  const [paying, setPaying] = useState<string | null>(null);

  const receivables = invoices.filter((inv) => inv.metode_pembayaran === 'top' && inv.status !== 'lunas');
  const filtered = receivables.filter((inv) => inv.store_name.toLowerCase().includes(search.toLowerCase()) || inv.nomor_faktur.toLowerCase().includes(search.toLowerCase()));

  const totalPiutang = receivables.reduce((s, inv) => s + inv.total_setelah_penolakan, 0);
  const today = new Date().toISOString().split('T')[0];

  const handlePay = async (invoiceId: string) => {
    setPaying(invoiceId);
    await payInvoice(invoiceId);
    setPaying(null);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-5">
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <Wallet className="h-5 w-5 text-blue-600" /> Daftar Piutang Toko
        </h1>
        <p className="text-sm text-gray-500">Tagihan toko dengan Term of Payment yang belum lunas.</p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">Total Piutang</p>
          <p className="text-lg font-bold text-blue-700">{formatRupiah(totalPiutang)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">Jumlah Faktur</p>
          <p className="text-lg font-bold text-gray-900">{receivables.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">Jatuh Tempo</p>
          <p className="text-lg font-bold text-red-600">{receivables.filter((r) => r.top_jatuh_tempo && r.top_jatuh_tempo <= today).length}</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Cari toko atau nomor faktur..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none" />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-12 text-center">
          <Wallet className="mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">Tidak ada piutang belum lunas</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-500">
              <tr>
                <th className="px-4 py-3">No. Faktur</th>
                <th className="px-4 py-3">Toko</th>
                <th className="px-4 py-3">Jatuh Tempo</th>
                <th className="px-4 py-3">Nilai</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((inv) => {
                const isOverdue = inv.top_jatuh_tempo && inv.top_jatuh_tempo <= today;
                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{inv.nomor_faktur}</td>
                    <td className="px-4 py-3 text-gray-600">{inv.store_name}</td>
                    <td className="px-4 py-3 text-gray-500">{inv.top_jatuh_tempo ? formatDate(inv.top_jatuh_tempo) : '—'}</td>
                    <td className="px-4 py-3 font-bold text-blue-700">{formatRupiah(inv.total_setelah_penolakan)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', isOverdue ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700')}>
                        {isOverdue ? 'Jatuh Tempo' : 'Belum Lunas'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handlePay(inv.id)} disabled={paying === inv.id} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-gray-300">
                        {paying === inv.id ? '...' : 'Tandai Lunas'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SalesRecapView({ invoices }: { invoices: Invoice[] }) {
  const monthly: Record<string, { count: number; total: number; lunas: number; belumLunas: number }> = {};

  invoices.forEach((inv) => {
    const monthKey = new Date(inv.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
    if (!monthly[monthKey]) monthly[monthKey] = { count: 0, total: 0, lunas: 0, belumLunas: 0 };
    monthly[monthKey].count++;
    monthly[monthKey].total += inv.total_setelah_penolakan;
    if (inv.status === 'lunas') monthly[monthKey].lunas += inv.total_setelah_penolakan;
    else monthly[monthKey].belumLunas += inv.total_setelah_penolakan;
  });

  const sortedMonths = Object.entries(monthly).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  const totalOmzet = invoices.reduce((s, inv) => s + inv.total_setelah_penolakan, 0);
  const totalLunas = invoices.filter((i) => i.status === 'lunas').reduce((s, inv) => s + inv.total_setelah_penolakan, 0);
  const totalBelumLunas = totalOmzet - totalLunas;
  const maxMonthly = Math.max(...sortedMonths.map(([, v]) => v.total), 1);

  return (
    <div className="mx-auto max-w-5xl px-4 py-5">
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <FileSpreadsheet className="h-5 w-5 text-blue-600" /> Rekap Data Penjualan
        </h1>
        <p className="text-sm text-gray-500">Ringkasan omzet dan transaksi bulanan.</p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="mb-1 flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-blue-600" /><span className="text-xs text-gray-500">Total Omzet</span></div>
          <p className="text-lg font-bold text-gray-900">{formatRupiah(totalOmzet)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="mb-1 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" /><span className="text-xs text-gray-500">Lunas</span></div>
          <p className="text-lg font-bold text-emerald-700">{formatRupiah(totalLunas)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="mb-1 flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-amber-600" /><span className="text-xs text-gray-500">Belum Lunas</span></div>
          <p className="text-lg font-bold text-amber-700">{formatRupiah(totalBelumLunas)}</p>
        </div>
      </div>

      {sortedMonths.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-12 text-center">
          <FileSpreadsheet className="mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada data penjualan</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-gray-900">Grafik Omzet Bulanan</h3>
            <div className="space-y-3">
              {sortedMonths.map(([month, data]) => (
                <div key={month}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-600">{month}</span>
                    <span className="text-gray-400">{formatRupiah(data.total)}</span>
                  </div>
                  <div className="h-6 overflow-hidden rounded-lg bg-gray-100">
                    <div className="flex h-full items-center justify-end rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-2 text-[10px] font-bold text-white" style={{ width: `${(data.total / maxMonthly) * 100}%` }}>
                      {data.count} trx
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-500">
                <tr>
                  <th className="px-4 py-3">Bulan</th>
                  <th className="px-4 py-3">Transaksi</th>
                  <th className="px-4 py-3">Omzet</th>
                  <th className="px-4 py-3">Lunas</th>
                  <th className="px-4 py-3">Belum Lunas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedMonths.map(([month, data]) => (
                  <tr key={month} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{month}</td>
                    <td className="px-4 py-3 text-gray-600">{data.count}</td>
                    <td className="px-4 py-3 font-bold text-blue-700">{formatRupiah(data.total)}</td>
                    <td className="px-4 py-3 text-emerald-600">{formatRupiah(data.lunas)}</td>
                    <td className="px-4 py-3 text-amber-600">{formatRupiah(data.belumLunas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function FinanceProfile({ staff }: { staff: Staff }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white">
            <User className="h-7 w-7" />
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">{staff.name}</p>
            <p className="text-sm text-gray-500">{staff.email}</p>
            <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">Admin Keuangan</span>
          </div>
        </div>
        {staff.phone && (
          <div className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-600">
            <span className="text-gray-400">Nomor HP: </span>{staff.phone}
          </div>
        )}
      </div>
    </div>
  );
}
