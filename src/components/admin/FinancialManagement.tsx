import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  DollarSign, TrendingUp, Users, CreditCard, Webhook, 
  CheckCircle2, Clock, XCircle, Copy, Check, RefreshCw, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  buyer_name: string;
  buyer_email: string;
  plan_name: string;
  amount: number;
  currency: string;
  status: "approved" | "pending" | "refunded" | "canceled";
  created_at: string;
  hotmart_transaction_id: string;
}

const STORAGE_KEY = "babybites_financial_txs_v2";

export const FinancialManagement: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      // Clear legacy sample data
      localStorage.removeItem("babybites_financial_txs_v1");
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [search, setSearch] = useState("");

  const webhookUrl = "https://fcrtrdnrnwfuamoyflay.supabase.co/functions/v1/hotmart-webhook";

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success("Hotmart Webhook URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const totalRevenue = transactions
    .filter((t) => t.status === "approved")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const activeSubscribers = transactions.filter((t) => t.status === "approved").length;
  const canceledSubscribers = transactions.filter((t) => t.status === "canceled").length;
  const mrr = transactions
    .filter((t) => t.status === "approved" && t.plan_name.includes("Monthly"))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const filtered = transactions.filter(
    (t) =>
      t.buyer_name.toLowerCase().includes(search.toLowerCase()) ||
      t.buyer_email.toLowerCase().includes(search.toLowerCase()) ||
      t.hotmart_transaction_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-[#EBE8DF] shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Total Revenue</p>
              <h3 className="text-2xl font-serif font-bold text-forest mt-1">
                ${totalRevenue.toFixed(2)}
              </h3>
              <p className="text-[11px] text-[#48B774] mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Approved Hotmart sales
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#EAF5EF] text-[#1E5E3A] flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#EBE8DF] shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Active Paying Users</p>
              <h3 className="text-2xl font-serif font-bold text-gray-900 mt-1">
                {activeSubscribers}
              </h3>
              <p className="text-[11px] text-gray-500 mt-1">Current valid licenses</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#EBE8DF] shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Monthly MRR</p>
              <h3 className="text-2xl font-serif font-bold text-gray-900 mt-1">
                ${mrr.toFixed(2)}/mo
              </h3>
              <p className="text-[11px] text-gray-500 mt-1">Recurring monthly volume</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#EBE8DF] shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Cancellations / Churn</p>
              <h3 className="text-2xl font-serif font-bold text-rose-600 mt-1">
                {canceledSubscribers}
              </h3>
              <p className="text-[11px] text-gray-500 mt-1">Expired / Refunded</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hotmart Webhook Configuration Box */}
      <Card className="rounded-[24px] border-[#EBE8DF] bg-white shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
              🔥
            </div>
            <div>
              <CardTitle className="text-lg font-serif font-bold text-gray-900">
                Hotmart Webhook Integration
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Automatically activates user subscriptions and logs revenue when a Hotmart purchase is completed.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3.5 bg-[#FAF9F5] rounded-xl border border-[#EBE8DF] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
              <Webhook className="w-4 h-4 text-[#1E5E3A] shrink-0" />
              <code className="text-xs font-mono text-gray-800 break-all select-all">
                {webhookUrl}
              </code>
            </div>
            <Button
              size="sm"
              onClick={handleCopyWebhook}
              className="rounded-full bg-[#1E5E3A] hover:bg-[#16472c] text-white text-xs px-4 h-8 shrink-0 flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Webhook URL"}</span>
            </Button>
          </div>

          <div className="text-[11px] text-gray-600 space-y-1 bg-stone-50 p-3 rounded-xl border border-stone-200">
            <p className="font-semibold text-gray-800">📌 How to configure in Hotmart Club / Developers:</p>
            <p>1. Go to <strong>Hotmart Tools ➔ Webhook (Postback)</strong> ➔ Click <strong>Register Webhook</strong>.</p>
            <p>2. Paste the URL above and check events: <code>Purchase Approved</code>, <code>Subscription Canceled</code>, and <code>Refund</code>.</p>
            <p>3. When a mom buys BabyBites on Hotmart, her account is instantly unlocked and registered here.</p>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="rounded-[24px] border-[#EBE8DF] bg-white shadow-xs">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-serif font-bold text-gray-900">
              Customer Transactions & Plans
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Real-time feed of paying subscribers and transaction history
            </CardDescription>
          </div>
          <Input
            placeholder="Search customer, email or transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72 rounded-xl text-xs border-[#E3DFD3]"
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-[#EBE8DF]">
            <Table>
              <TableHeader className="bg-[#FAF9F5]">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-gray-700">Customer</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700">Plan</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700">Amount</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700">Hotmart ID</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center text-gray-400 space-y-2">
                        <AlertCircle className="w-8 h-8 text-gray-300" />
                        <p className="text-sm font-medium text-gray-600">No transactions recorded yet</p>
                        <p className="text-xs text-gray-400 max-w-sm">
                          Once you configure your Hotmart Webhook URL above, live sales, subscriptions, and revenue will populate here automatically.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold text-xs text-gray-900">{t.buyer_name}</div>
                          <div className="text-[11px] text-gray-500">{t.buyer_email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-gray-700">
                        {t.plan_name}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-forest">
                        ${t.amount.toFixed(2)} {t.currency}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            t.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }
                        >
                          {t.status === "approved" ? "Active / Paid" : "Canceled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-gray-500">
                        {t.hotmart_transaction_id}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(t.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialManagement;
