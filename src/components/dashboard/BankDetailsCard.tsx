import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Landmark, Loader2, CheckCircle2 } from "lucide-react";

const NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Citibank Nigeria", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank", code: "214" },
  { name: "Globus Bank", code: "00103" },
  { name: "Guaranty Trust Bank", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Keystone Bank", code: "082" },
  { name: "Kuda Bank", code: "50211" },
  { name: "Moniepoint MFB", code: "50515" },
  { name: "Opay", code: "999992" },
  { name: "Palmpay", code: "999991" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered Bank", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "Titan Trust Bank", code: "102" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank for Africa", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
];

interface BankDetailsCardProps {
  storeId: string;
  storeName: string;
  hasSubaccount: boolean;
  onSubaccountCreated: (code: string) => void;
}

const BankDetailsCard = ({ storeId, storeName, hasSubaccount, onSubaccountCreated }: BankDetailsCardProps) => {
  const { toast } = useToast();
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [businessName, setBusinessName] = useState(storeName);
  const [saving, setSaving] = useState(false);
  const [connectedBank, setConnectedBank] = useState<string | null>(null);

  useEffect(() => {
    if (hasSubaccount) {
      setConnectedBank("connected");
    }
  }, [hasSubaccount]);

  const handleSubmit = async () => {
    if (!bankCode || !accountNumber || !businessName) {
      toast({ title: "Missing fields", description: "Please fill in all bank details.", variant: "destructive" });
      return;
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      toast({ title: "Invalid account number", description: "Account number must be 10 digits.", variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-subaccount", {
        body: {
          store_id: storeId,
          business_name: businessName,
          bank_code: bankCode,
          account_number: accountNumber,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const bankName = NIGERIAN_BANKS.find(b => b.code === bankCode)?.name || "Bank";
      setConnectedBank(bankName);
      onSubaccountCreated(data.subaccount_code);

      toast({
        title: "Bank account connected! ✅",
        description: `${data.account_name || businessName} - ${bankName}. You'll now receive payments directly.`,
      });
    } catch (err: any) {
      toast({
        title: "Failed to connect bank",
        description: err.message || "Please check your details and try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (connectedBank) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Landmark className="h-5 w-5 text-primary" /> Bank Account
          </CardTitle>
          <CardDescription>Receive payments from customer orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
            <div>
              <p className="text-sm font-medium text-foreground">Bank account connected</p>
              <p className="text-xs text-muted-foreground">Payments from orders will be settled to your bank account.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Landmark className="h-5 w-5 text-primary" /> Bank Account
        </CardTitle>
        <CardDescription>Connect your bank to receive payments from customer orders</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business / Account Name</Label>
          <Input
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Your business or personal name"
          />
        </div>

        <div className="space-y-2">
          <Label>Bank</Label>
          <Select value={bankCode} onValueChange={setBankCode}>
            <SelectTrigger>
              <SelectValue placeholder="Select your bank" />
            </SelectTrigger>
            <SelectContent>
              {NIGERIAN_BANKS.map((bank) => (
                <SelectItem key={bank.code} value={bank.code}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountNumber">Account Number</Label>
          <Input
            id="accountNumber"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="0123456789"
            maxLength={10}
            inputMode="numeric"
          />
        </div>

        <Button variant="hero" className="w-full" onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting…
            </>
          ) : (
            <>
              <Landmark className="mr-2 h-4 w-4" />
              Connect Bank Account
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Powered by Paystack. Your bank details are securely processed.
        </p>
      </CardContent>
    </Card>
  );
};

export default BankDetailsCard;
