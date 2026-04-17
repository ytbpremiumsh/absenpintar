import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Users, Wallet, ArrowDownToLine, CheckCircle2, XCircle, Clock, Loader2, Search, Ban, Play, GraduationCap, Smartphone, Building2, CalendarClock, Send } from "lucide-react";
import { getEstimatedPayoutDate, formatPayoutEstimate } from "@/lib/holidays";

const SuperAdminAffiliate = () => {
  const [loading, setLoading] = useState(true);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [affRes, comRes, wdRes] = await Promise.all([
      supabase.from('affiliates').select('*').order('created_at', { ascending: false }),
      supabase.from('affiliate_commissions').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('affiliate_withdrawals').select('*, affiliates(full_name, email, affiliate_code)').order('created_at', { ascending: false }),
    ]);
    setAffiliates((affRes.data as any) || []);
    setCommissions((comRes.data as any) || []);
    setWithdrawals((wdRes.data as any) || []);
    setLoading(false);
  };

  const toggleAffiliateStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await supabase.from('affiliates').update({ status: newStatus }).eq('id', id);
    toast.success(`Affiliate ${newStatus === 'active' ? 'diaktifkan' : 'ditangguhkan'}`);
    fetchAll();
  };

  const handleWithdrawalAction = async (action: 'approved' | 'rejected') => {
    if (!selectedWithdrawal) return;
    setProcessing(true);
    try {
      await supabase.from('affiliate_withdrawals').update({
        status: action,
        admin_notes: adminNotes || null,
        processed_at: new Date().toISOString(),
      }).eq('id', selectedWithdrawal.id);

      if (action === 'rejected') {
        // Refund balance
        const { data: aff } = await supabase.from('affiliates').select('current_balance, total_withdrawn').eq('id', selectedWithdrawal.affiliate_id).single();
        if (aff) {
          await supabase.from('affiliates').update({
            current_balance: (aff as any).current_balance + selectedWithdrawal.amount,
            total_withdrawn: (aff as any).total_withdrawn - selectedWithdrawal.amount,
          }).eq('id', selectedWithdrawal.affiliate_id);
        }
      }

      toast.success(`Pencairan ${action === 'approved' ? 'disetujui' : 'ditolak'}`);
      setSelectedWithdrawal(null);
      setAdminNotes("");
      fetchAll();
    } catch (err: any) { toast.error(err.message); }
    finally { setProcessing(false); }
  };

  const formatRp = (n: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;

  const filteredAffiliates = affiliates.filter(a =>
    a.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.affiliate_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalance = affiliates.reduce((s, a) => s + (a.current_balance || 0), 0);
  const totalEarned = affiliates.reduce((s, a) => s + (a.total_earned || 0), 0);
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" /> Manajemen Affiliate</h1>
        <p className="text-sm text-muted-foreground">Kelola affiliate, komisi, dan pencairan dana</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Total Affiliate</p><p className="text-2xl font-bold">{affiliates.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Total Komisi Dibayar</p><p className="text-2xl font-bold text-green-600">{formatRp(totalEarned)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Saldo Terhutang</p><p className="text-2xl font-bold text-primary">{formatRp(totalBalance)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Pending Pencairan</p><p className="text-2xl font-bold text-yellow-600">{pendingWithdrawals.length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="affiliates">
        <TabsList>
          <TabsTrigger value="affiliates">Affiliate ({affiliates.length})</TabsTrigger>
          <TabsTrigger value="commissions">Komisi ({commissions.length})</TabsTrigger>
          <TabsTrigger value="withdrawals">
            Pencairan {pendingWithdrawals.length > 0 && <Badge className="ml-1 bg-yellow-500/20 text-yellow-600">{pendingWithdrawals.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="affiliates">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Cari nama, email, kode..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead>Komisi</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAffiliates.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.full_name}</TableCell>
                      <TableCell className="text-xs">{a.email}</TableCell>
                      <TableCell className="font-mono text-xs">{a.affiliate_code}</TableCell>
                      <TableCell>{a.commission_rate}%</TableCell>
                      <TableCell className="font-bold text-primary">{formatRp(a.current_balance)}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === 'active' ? 'default' : 'destructive'}>{a.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => toggleAffiliateStatus(a.id, a.status)} className="gap-1">
                          {a.status === 'active' ? <><Ban className="h-3 w-3" /> Suspend</> : <><Play className="h-3 w-3" /> Aktifkan</>}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <Card>
            <CardHeader><CardTitle className="text-base">Riwayat Komisi</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paket</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Komisi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.plan_name}</TableCell>
                      <TableCell>{formatRp(c.plan_price)}</TableCell>
                      <TableCell>{c.commission_rate}%</TableCell>
                      <TableCell className="font-bold text-primary">{formatRp(c.commission_amount)}</TableCell>
                      <TableCell><Badge variant="outline">{c.status}</Badge></TableCell>
                      <TableCell className="text-xs">{new Date(c.created_at).toLocaleDateString('id-ID')}</TableCell>
                    </TableRow>
                  ))}
                  {commissions.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada komisi</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowDownToLine className="h-4 w-4 text-primary" /> Pencairan Dana
              </CardTitle>
              <CardDescription className="text-xs">
                Estimasi pembayaran maksimal 3 hari kerja (tidak termasuk Sabtu, Minggu, dan tanggal merah)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Tujuan</TableHead>
                    <TableHead>Estimasi Cair</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map(w => {
                    const aff = (w as any).affiliates;
                    const isTeacher = aff?.affiliate_code?.startsWith('TCH-');
                    const isEwallet = !!w.ewallet_type;
                    const estimate = w.estimated_payout_at
                      ? new Date(w.estimated_payout_at)
                      : getEstimatedPayoutDate(new Date(w.created_at));
                    return (
                      <TableRow key={w.id}>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-xs">{aff?.full_name || '-'}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">{aff?.affiliate_code}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isTeacher ? (
                            <Badge className="bg-violet-500/15 text-violet-700 border-violet-500/30 text-[10px] gap-1">
                              <GraduationCap className="h-3 w-3" /> Guru
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Publik</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-bold text-primary">{formatRp(w.amount)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1 text-xs font-medium">
                              {isEwallet ? <Smartphone className="h-3 w-3 text-emerald-600" /> : <Building2 className="h-3 w-3 text-blue-600" />}
                              {isEwallet ? w.ewallet_type : w.bank_name}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">{w.account_number}</span>
                            <span className="text-[10px] text-muted-foreground">a.n {w.account_holder}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-[11px]">
                            <CalendarClock className="h-3 w-3 text-amber-600" />
                            <span className={w.status === 'pending' ? 'font-semibold text-amber-700' : 'text-muted-foreground'}>
                              {formatPayoutEstimate(estimate)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={w.status === 'rejected' ? 'destructive' : 'outline'}
                            className={w.status === 'paid' ? 'bg-emerald-500 text-white border-0' : w.status === 'approved' ? 'bg-blue-500 text-white border-0' : ''}
                          >
                            {w.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {w.status === 'approved' && <Send className="h-3 w-3 mr-1" />}
                            {w.status === 'paid' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {w.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(w.status === 'pending' || w.status === 'approved') && (
                            <Button size="sm" variant="outline" onClick={() => { setSelectedWithdrawal(w); setAdminNotes(""); }}>
                              {w.status === 'pending' ? 'Review' : 'Tandai Dibayar'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {withdrawals.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada pencairan</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Withdrawal Review Dialog */}
          <Dialog open={!!selectedWithdrawal} onOpenChange={(o) => !o && setSelectedWithdrawal(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ArrowDownToLine className="h-5 w-5 text-primary" />
                  {selectedWithdrawal?.status === 'approved' ? 'Konfirmasi Pembayaran' : 'Review Pencairan Dana'}
                </DialogTitle>
              </DialogHeader>
              {selectedWithdrawal && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 p-3 rounded-lg">
                    <div><p className="text-[10px] text-muted-foreground uppercase">Affiliate</p><p className="font-semibold">{(selectedWithdrawal as any).affiliates?.full_name}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase">Jumlah</p><p className="font-bold text-primary text-base">{formatRp(selectedWithdrawal.amount)}</p></div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                        {selectedWithdrawal.ewallet_type ? <Smartphone className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                        {selectedWithdrawal.ewallet_type ? 'E-Wallet' : 'Bank'}
                      </p>
                      <p className="font-medium">{selectedWithdrawal.ewallet_type || selectedWithdrawal.bank_name}</p>
                    </div>
                    <div><p className="text-[10px] text-muted-foreground uppercase">No. Rekening / HP</p><p className="font-mono text-xs">{selectedWithdrawal.account_number}</p></div>
                    <div className="col-span-2"><p className="text-[10px] text-muted-foreground uppercase">Atas Nama</p><p className="font-medium">{selectedWithdrawal.account_holder}</p></div>
                    <div className="col-span-2 pt-2 border-t border-border/50">
                      <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1"><CalendarClock className="h-3 w-3" /> Estimasi Cair</p>
                      <p className="font-semibold text-amber-700">
                        {formatPayoutEstimate(selectedWithdrawal.estimated_payout_at ? new Date(selectedWithdrawal.estimated_payout_at) : getEstimatedPayoutDate(new Date(selectedWithdrawal.created_at)))}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Catatan Admin (opsional)</Label>
                    <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder={selectedWithdrawal.status === 'approved' ? 'Bukti transfer / nomor referensi...' : 'Catatan untuk affiliate...'} />
                  </div>
                  {selectedWithdrawal.status === 'pending' ? (
                    <div className="flex gap-2">
                      <Button onClick={() => handleWithdrawalAction('approved')} disabled={processing} className="flex-1 gap-1 bg-blue-600 hover:bg-blue-700 text-white">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Setujui (Diproses)
                      </Button>
                      <Button onClick={() => handleWithdrawalAction('rejected')} disabled={processing} variant="destructive" className="flex-1 gap-1">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Tolak
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => handleWithdrawalAction('paid' as any)} disabled={processing} className="w-full gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                      {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Konfirmasi Sudah Dibayar
                    </Button>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminAffiliate;
