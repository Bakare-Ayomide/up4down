import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2, Plus, Trash2, Wallet, Building2, Bitcoin } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CryptoWallet {
  id: string;
  currency: string;
  network: string;
  address: string;
  price: string;
  enabled: boolean;
}

interface BankAccount {
  id: string;
  label: string;
  currency: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number: string;
  instructions: string;
  price: string;
  enabled: boolean;
}

const CRYPTO_OPTIONS = [
  { code: "BTC", name: "Bitcoin", networks: ["Bitcoin", "Lightning"] },
  { code: "ETH", name: "Ethereum", networks: ["Ethereum (ERC-20)", "Arbitrum", "Optimism", "Base"] },
  { code: "USDT", name: "Tether", networks: ["Ethereum (ERC-20)", "Tron (TRC-20)", "BNB Smart Chain (BEP-20)", "Solana", "Polygon"] },
  { code: "USDC", name: "USD Coin", networks: ["Ethereum (ERC-20)", "Solana", "Polygon", "Arbitrum", "Base"] },
  { code: "BNB", name: "BNB", networks: ["BNB Smart Chain (BEP-20)", "Ethereum (ERC-20)"] },
  { code: "SOL", name: "Solana", networks: ["Solana"] },
  { code: "XRP", name: "Ripple", networks: ["XRP Ledger"] },
  { code: "ADA", name: "Cardano", networks: ["Cardano"] },
  { code: "DOGE", name: "Dogecoin", networks: ["Dogecoin"] },
  { code: "DOT", name: "Polkadot", networks: ["Polkadot"] },
  { code: "MATIC", name: "Polygon", networks: ["Polygon", "Ethereum (ERC-20)"] },
  { code: "LTC", name: "Litecoin", networks: ["Litecoin"] },
  { code: "AVAX", name: "Avalanche", networks: ["Avalanche C-Chain"] },
  { code: "TRX", name: "Tron", networks: ["Tron (TRC-20)"] },
  { code: "TON", name: "Toncoin", networks: ["TON"] },
  { code: "DAI", name: "Dai", networks: ["Ethereum (ERC-20)", "Polygon", "Arbitrum"] },
];

const FIAT_CURRENCIES = ["NGN", "USD", "GBP", "CAD", "EUR", "AUD", "ZAR", "KES", "GHS", "INR", "BRL", "MXN", "JPY", "CHF", "SGD", "HKD", "KRW", "TRY", "SEK", "NOK", "PLN", "THB", "IDR", "MYR", "PHP", "CZK", "ILS", "EGP", "AED", "SAR"];

export const PaymentMethodsManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cryptoWallets, setCryptoWallets] = useState<CryptoWallet[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [enabledCurrencies, setEnabledCurrencies] = useState<string[]>(["USD"]);
  const [cryptoEnabled, setCryptoEnabled] = useState(false);
  const [bankEnabled, setBankEnabled] = useState(true);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from("site_settings").select("key, value").eq("key", "payment_methods_config");
    if (data && data.length > 0) {
      const val = data[0].value as any;
      setCryptoWallets(val.crypto_wallets || []);
      setBankAccounts(val.bank_accounts || []);
      setEnabledCurrencies(val.enabled_currencies || ["USD"]);
      setCryptoEnabled(val.crypto_enabled ?? false);
      setBankEnabled(val.bank_enabled ?? true);
    }
    setLoading(false);
  };

  const saveAll = async () => {
    setSaving(true);
    const value = {
      crypto_wallets: cryptoWallets,
      bank_accounts: bankAccounts,
      enabled_currencies: enabledCurrencies,
      crypto_enabled: cryptoEnabled,
      bank_enabled: bankEnabled,
    };
    const { error } = await supabase.from("site_settings").upsert({ key: "payment_methods_config", value } as any, { onConflict: "key" });
    if (error) toast.error("Failed to save");
    else toast.success("Payment methods saved!");
    setSaving(false);
  };

  const addCryptoWallet = () => {
    setCryptoWallets([...cryptoWallets, {
      id: crypto.randomUUID(),
      currency: "BTC",
      network: "Bitcoin",
      address: "",
      price: "0.99",
      enabled: true,
    }]);
  };

  const updateCryptoWallet = (id: string, field: string, value: any) => {
    setCryptoWallets(cryptoWallets.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  const removeCryptoWallet = (id: string) => {
    setCryptoWallets(cryptoWallets.filter(w => w.id !== id));
  };

  const addBankAccount = () => {
    setBankAccounts([...bankAccounts, {
      id: crypto.randomUUID(),
      label: "",
      currency: "USD",
      bank_name: "",
      account_name: "",
      account_number: "",
      routing_number: "",
      instructions: "",
      enabled: true,
    }]);
  };

  const updateBankAccount = (id: string, field: string, value: any) => {
    setBankAccounts(bankAccounts.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const removeBankAccount = (id: string) => {
    setBankAccounts(bankAccounts.filter(a => a.id !== id));
  };

  const toggleCurrency = (code: string) => {
    setEnabledCurrencies(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Payment Methods</h2>
        <p className="text-muted-foreground">Configure crypto wallets, bank accounts, and checkout currencies</p>
      </div>

      <Tabs defaultValue="crypto" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="crypto" className="gap-1 text-xs sm:text-sm"><Bitcoin className="h-4 w-4" />Crypto</TabsTrigger>
          <TabsTrigger value="bank" className="gap-1 text-xs sm:text-sm"><Building2 className="h-4 w-4" />Bank</TabsTrigger>
          <TabsTrigger value="currencies" className="gap-1 text-xs sm:text-sm"><Wallet className="h-4 w-4" />Currencies</TabsTrigger>
        </TabsList>

        <TabsContent value="crypto">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Enable Crypto Payments</Label>
              <Switch checked={cryptoEnabled} onCheckedChange={setCryptoEnabled} />
            </div>

            {cryptoEnabled && (
              <>
                {cryptoWallets.map((wallet) => {
                  const cryptoOption = CRYPTO_OPTIONS.find(c => c.code === wallet.currency);
                  return (
                    <Card key={wallet.id} className="p-4 space-y-3 border-border">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-primary/20 text-primary">{wallet.currency}</Badge>
                        <div className="flex gap-2 items-center">
                          <Switch checked={wallet.enabled} onCheckedChange={(v) => updateCryptoWallet(wallet.id, "enabled", v)} />
                          <Button size="icon" variant="ghost" onClick={() => removeCryptoWallet(wallet.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Cryptocurrency</Label>
                          <Select value={wallet.currency} onValueChange={(v) => {
                            const opt = CRYPTO_OPTIONS.find(c => c.code === v);
                            updateCryptoWallet(wallet.id, "currency", v);
                            if (opt) updateCryptoWallet(wallet.id, "network", opt.networks[0]);
                          }}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {CRYPTO_OPTIONS.map(c => (
                                <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Network</Label>
                          <Select value={wallet.network} onValueChange={(v) => updateCryptoWallet(wallet.id, "network", v)}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(cryptoOption?.networks || []).map(n => (
                                <SelectItem key={n} value={n}>{n}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Wallet Address</Label>
                        <Input value={wallet.address} onChange={(e) => updateCryptoWallet(wallet.id, "address", e.target.value)} placeholder="Enter wallet address..." className="mt-1 font-mono text-xs" />
                      </div>
                    </Card>
                  );
                })}

                <Button variant="outline" onClick={addCryptoWallet} className="gap-2 w-full">
                  <Plus className="h-4 w-4" /> Add Crypto Wallet
                </Button>
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="bank">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Enable Bank Transfer</Label>
              <Switch checked={bankEnabled} onCheckedChange={setBankEnabled} />
            </div>

            {bankEnabled && (
              <>
                {bankAccounts.map((account) => (
                  <Card key={account.id} className="p-4 space-y-3 border-border">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{account.label || "Bank Account"}</Badge>
                      <div className="flex gap-2 items-center">
                        <Switch checked={account.enabled} onCheckedChange={(v) => updateBankAccount(account.id, "enabled", v)} />
                        <Button size="icon" variant="ghost" onClick={() => removeBankAccount(account.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Label</Label>
                        <Input value={account.label} onChange={(e) => updateBankAccount(account.id, "label", e.target.value)} placeholder="e.g. USD Account, NGN Account..." className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Currency</Label>
                        <Select value={account.currency} onValueChange={(v) => updateBankAccount(account.id, "currency", v)}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FIAT_CURRENCIES.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Bank Name</Label>
                        <Input value={account.bank_name} onChange={(e) => updateBankAccount(account.id, "bank_name", e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Account Name</Label>
                        <Input value={account.account_name} onChange={(e) => updateBankAccount(account.id, "account_name", e.target.value)} className="mt-1" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Account Number</Label>
                        <Input value={account.account_number} onChange={(e) => updateBankAccount(account.id, "account_number", e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Routing / SWIFT</Label>
                        <Input value={account.routing_number} onChange={(e) => updateBankAccount(account.id, "routing_number", e.target.value)} className="mt-1" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Instructions</Label>
                      <Textarea value={account.instructions} onChange={(e) => updateBankAccount(account.id, "instructions", e.target.value)} rows={2} className="mt-1" />
                    </div>
                  </Card>
                ))}

                <Button variant="outline" onClick={addBankAccount} className="gap-2 w-full">
                  <Plus className="h-4 w-4" /> Add Bank Account
                </Button>
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="currencies">
          <Card className="p-6 space-y-4">
            <Label className="text-base font-semibold">Enabled Checkout Currencies</Label>
            <p className="text-sm text-muted-foreground">Select which currencies users can choose at checkout. CRYPTO is auto-added if crypto is enabled.</p>
            <div className="flex flex-wrap gap-2">
              {FIAT_CURRENCIES.map(c => (
                <Badge
                  key={c}
                  variant={enabledCurrencies.includes(c) ? "default" : "outline"}
                  className="cursor-pointer select-none"
                  onClick={() => toggleCurrency(c)}
                >
                  {c}
                </Badge>
              ))}
              {cryptoEnabled && (
                <Badge className="bg-primary/20 text-primary border-primary/30">CRYPTO (auto)</Badge>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Button onClick={saveAll} disabled={saving} className="gap-2 w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save All Payment Methods
      </Button>
    </div>
  );
};
