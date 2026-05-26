import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { 
  Download, Trash2, Search, DollarSign, Users, CheckCircle2, 
  Clock, AlertCircle, Loader2, ArrowLeftRight 
} from "lucide-react";
import { toast } from "sonner";
import { generateReceiptPDF } from "@/lib/receipt-generator";
import { canDelete } from "@/lib/admin-permissions";
import { useAdminRole } from "@/hooks/use-admin-role";

export const Route = createFileRoute("/admin/giving")({
  component: GivingAdmin,
});

interface GivingRecord {
  id: string;
  donor_name: string;
  email: string;
  phone: string | null;
  amount: number;
  currency: string;
  giving_type: string;
  reference: string;
  status: string;
  channel: string | null;
  created_at: string;
  updated_at: string;
}

function GivingAdmin() {
  const qc = useQueryClient();
  const { role } = useAdminRole();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<GivingRecord[]>({
    queryKey: ["admin-giving-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("giving_records")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GivingRecord[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("giving_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-giving-records"] });
      toast.success("Transaction record removed");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to remove transaction record");
    }
  });

  // Calculate statistics
  const stats = (() => {
    if (!data) return { totalAmount: 0, successCount: 0, pendingCount: 0, failedCount: 0, contributorsCount: 0 };
    
    const successfulTx = data.filter(t => t.status === "success");
    const totalAmount = successfulTx.reduce((sum, t) => sum + Number(t.amount), 0);
    const successCount = successfulTx.length;
    const pendingCount = data.filter(t => t.status === "pending").length;
    const failedCount = data.filter(t => t.status === "failed" || t.status === "reversed").length;
    
    // Unique contributors (by email) among successful transactions
    const uniqueEmails = new Set(successfulTx.map(t => t.email.toLowerCase()));
    const contributorsCount = uniqueEmails.size;

    return { totalAmount, successCount, pendingCount, failedCount, contributorsCount };
  })();

  // Filtered transactions
  const filteredData = data?.filter((tx) => {
    const matchesSearch = 
      tx.donor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.reference.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
    const matchesType = typeFilter === "all" || tx.giving_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Export to CSV
  const exportCsv = () => {
    if (!filteredData || filteredData.length === 0) return;
    
    const headers = [
      "Date", "Donor Name", "Email", "Phone", "Type", "Amount (GHS)", 
      "Reference", "Status", "Channel", "Last Update"
    ];
    
    const rows = filteredData.map(tx => [
      new Date(tx.created_at).toLocaleString(),
      `"${tx.donor_name.replace(/"/g, '""')}"`,
      tx.email,
      tx.phone || "N/A",
      tx.giving_type,
      tx.amount,
      tx.reference,
      tx.status,
      tx.channel || "N/A",
      new Date(tx.updated_at).toLocaleString()
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `giving_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download single PDF receipt
  const downloadReceipt = async (tx: GivingRecord) => {
    setDownloadingId(tx.id);
    try {
      await generateReceiptPDF({
        donor_name: tx.donor_name,
        email: tx.email,
        phone: tx.phone,
        amount: Number(tx.amount),
        giving_type: tx.giving_type,
        reference: tx.reference,
        created_at: tx.created_at,
        channel: tx.channel
      });
      toast.success("Receipt downloaded!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate receipt PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  const uniqueGivingTypes = Array.from(new Set(data?.map(t => t.giving_type) || []));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Online Giving</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track digital tithes, offerings, and donations.</p>
        </div>
        <Button onClick={exportCsv} disabled={!filteredData?.length}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-24 bg-card/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-green-500/10 text-green-600 shrink-0">
              <DollarSign className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Received</p>
              <h3 className="text-2xl font-black mt-0.5">GHS {stats.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
              <Users className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contributors</p>
              <h3 className="text-2xl font-black mt-0.5">{stats.contributorsCount} unique</h3>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-green-500/10 text-green-600 shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Successful</p>
              <h3 className="text-2xl font-black mt-0.5">{stats.successCount} payments</h3>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-yellow-500/10 text-yellow-600 shrink-0">
              <Clock className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending</p>
              <h3 className="text-2xl font-black mt-0.5">{stats.pendingCount} transactions</h3>
            </div>
          </Card>
        </div>
      )}

      {/* Filters bar */}
      <Card className="p-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search donor name, email or reference..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-3 flex-wrap">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Giving Types</option>
            {uniqueGivingTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Transactions list */}
      {isLoading ? (
        <p className="text-muted-foreground">Loading transactions...</p>
      ) : (
        <Card className="divide-y overflow-hidden">
          <div className="hidden lg:grid grid-cols-[1.2fr_1.8fr_1fr_1.1fr_1.1fr_0.8fr_1.2fr] gap-4 p-4 bg-muted/40 font-bold text-xs text-muted-foreground uppercase tracking-wider">
            <div>Date</div>
            <div>Donor</div>
            <div>Giving Type</div>
            <div className="text-right">Amount</div>
            <div>Method</div>
            <div className="text-center">Status</div>
            <div className="text-right">Actions</div>
          </div>
          
          {filteredData?.map((tx) => (
            <div 
              key={tx.id} 
              className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr_1fr_1.1fr_1.1fr_0.8fr_1.2fr] gap-2 lg:gap-4 p-4 items-center text-sm hover:bg-muted/10 transition-colors"
            >
              {/* Date Column */}
              <div>
                <span className="lg:hidden font-semibold text-xs text-muted-foreground block uppercase">Date: </span>
                <span className="font-medium text-foreground">{new Date(tx.created_at).toLocaleDateString()}</span>
                <span className="text-xs text-muted-foreground block mt-0.5">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Donor Column */}
              <div>
                <span className="lg:hidden font-semibold text-xs text-muted-foreground block uppercase">Donor: </span>
                <div className="font-semibold text-foreground">{tx.donor_name}</div>
                <div className="text-xs text-muted-foreground truncate">{tx.email}</div>
                {tx.phone && <div className="text-xs text-muted-foreground">{tx.phone}</div>}
              </div>

              {/* Type Column */}
              <div>
                <span className="lg:hidden font-semibold text-xs text-muted-foreground block uppercase">Type: </span>
                <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{tx.giving_type}</span>
              </div>

              {/* Amount Column */}
              <div className="lg:text-right font-black text-foreground">
                <span className="lg:hidden font-semibold text-xs text-muted-foreground block uppercase">Amount: </span>
                GHS {Number(tx.amount).toFixed(2)}
              </div>

              {/* Channel/Method Column */}
              <div>
                <span className="lg:hidden font-semibold text-xs text-muted-foreground block uppercase">Channel: </span>
                <span className="capitalize text-muted-foreground text-xs">{tx.channel ? tx.channel.replace('_', ' ') : "Pending"}</span>
                <span className="text-[10px] text-muted-foreground/60 block truncate">{tx.reference}</span>
              </div>

              {/* Status Badge Column */}
              <div className="lg:text-center">
                <span className="lg:hidden font-semibold text-xs text-muted-foreground block uppercase">Status: </span>
                {tx.status === "success" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-bold text-green-700">
                    <CheckCircle2 className="h-3 w-3" /> Success
                  </span>
                ) : tx.status === "pending" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-bold text-yellow-700">
                    <Clock className="h-3 w-3 animate-pulse" /> Pending
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive">
                    <AlertCircle className="h-3 w-3" /> {tx.status || 'failed'}
                  </span>
                )}
              </div>

              {/* Actions Column */}
              <div className="flex justify-end gap-2 mt-2 lg:mt-0">
                <Button 
                  size="sm"
                  variant="outline" 
                  onClick={() => downloadReceipt(tx)} 
                  disabled={tx.status !== "success" || downloadingId === tx.id}
                  title="Download PDF Receipt"
                  className="h-8 px-2"
                >
                  {downloadingId === tx.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span className="lg:hidden ml-2">Receipt</span>
                </Button>
                
                {canDelete(role) && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => { if (confirm("Delete this transaction record?")) remove.mutate(tx.id); }}
                    className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="lg:hidden ml-2">Delete</span>
                  </Button>
                )}
              </div>
            </div>
          ))}

          {filteredData && filteredData.length === 0 && (
            <div className="p-12 text-center">
              <ArrowLeftRight className="h-10 w-10 text-muted-foreground/35 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No transactions found matching the filters.</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
