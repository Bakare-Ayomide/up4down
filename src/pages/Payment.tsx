import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, Check, ArrowLeft, CreditCard, Copy, Loader2, Bitcoin, Building2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { CURRENCIES, convertCurrency, formatCurrency } from "@/lib/currency";
import { AdBanner } from "@/components/AdBanner";

interface CryptoWallet {
  id: string;
  currency: string;
  network: string;
  address: string;
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
  enabled: boolean;
}

interface PaymentConfig {
  crypto_wallets: CryptoWallet[];
  bank_accounts: BankAccount[];
  enabled_currencies: string[];
  crypto_enabled: boolean;
  bank_enabled: boolean;
}

const Payment = () => {
  const navigate = useNavigate();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [convertedAmount, setConvertedAmount] = useState(0.99);
  const [converting, setConverting] = useState(false);
  const [email, setEmail] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "crypto">("bank");
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);

  const baseAmount = settings.subscription_price.amount;
  const baseCurrency = settings.subscription_price.currency;

  useEffect(() => {
    fetchPaymentConfig();
  }, []);

  useEffect(() => {
    handleCurrencyChange(selectedCurrency);
  }, [baseAmount, baseCurrency]);

  const fetchPaymentConfig = async () => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "payment_methods_config").single();
    if (data?.value) {
      const config = data.value as any;
      setPaymentConfig(config);
      if (config.crypto_enabled && !config.bank_enabled) setPaymentMethod("crypto");
    }
  };

  const handleCurrencyChange = async (currency: string) => {
    setSelectedCurrency(currency);
    if (currency === "CRYPTO") return;
    setConverting(true);
    try {
      const converted = await convertCurrency(baseAmount, baseCurrency, currency);
      setConvertedAmount(converted);
    } catch {
      setConvertedAmount(baseAmount);
    } finally {
      setConverting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email"); return; }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let userId = session?.user?.id;

      if (!userId) {
        const tempPassword = crypto.randomUUID().slice(0, 16) + "Aa1!";
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: tempPassword });
        if (authError) {
          if (authError.message.includes("already registered")) {
            toast.error("This email is already registered. Please log in first at /auth");
            setSubmitting(false);
            return;
          }
          throw authError;
        }
        userId = authData?.user?.id;
      }

      if (userId) {
        await supabase.from("subscriptions").insert({
          user_id: userId,
          status: "pending",
          currency: selectedCurrency === "CRYPTO" ? paymentMethod.toUpperCase() : selectedCurrency,
          amount_paid: selectedCurrency === "CRYPTO" ? baseAmount : convertedAmount,
          payment_reference: paymentRef || `Payment from ${email}`,
        });
      }

      setSubmitted(true);
      toast.success("Payment request submitted! We'll activate your subscription after verification.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const enabledWallets = paymentConfig?.crypto_wallets?.filter(w => w.enabled) || [];
  const enabledBanks = paymentConfig?.bank_accounts?.filter(a => a.enabled) || [];
  const bankEnabled = paymentConfig?.bank_enabled ?? true;
  const cryptoEnabled = paymentConfig?.crypto_enabled ?? false;

  // Build currency list
  const checkoutCurrencies = (paymentConfig?.enabled_currencies || ["USD"]).map(code => {
    const c = CURRENCIES.find(cur => cur.code === code);
    return c || { code, symbol: code, name: code };
  });

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 max-w-lg text-center">
          <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Payment Request Submitted!</h1>
          <p className="text-muted-foreground mb-8">
            Your subscription will be activated once we verify your payment. This usually takes a few minutes to a few hours.
          </p>
          <Button onClick={() => navigate("/browse")} className="rounded-full">Continue Browsing</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <AdBanner page="payment" position="top" />
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Go Back
        </button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Plan details */}
          <div>
            <Badge className="bg-primary/20 text-primary border-primary/30 mb-4">PREMIUM</Badge>
            <h1 className="text-4xl font-bold mb-4">Premium Access</h1>
            <p className="text-muted-foreground text-lg mb-8">Unlock unlimited downloads with zero ads.</p>

            <div className="space-y-4">
              {["Unlimited downloads - no daily or monthly limits", "Zero ads - clean, fast experience", "Priority support", "Access to all files and categories", "Early access to new uploads"].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* Currency selector */}
            <Card className="p-6 mt-8 border-border bg-card">
              <Label className="text-sm text-muted-foreground mb-2 block">Select your currency</Label>
              <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {checkoutCurrencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.name} ({c.code})
                    </SelectItem>
                  ))}
                  {cryptoEnabled && (
                    <SelectItem value="CRYPTO">₿ Cryptocurrency (CRYPTO)</SelectItem>
                  )}
                </SelectContent>
              </Select>

              <div className="mt-4 text-center">
                {converting ? (
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                ) : selectedCurrency === "CRYPTO" ? (
                  <div className="text-4xl font-bold text-primary">
                    {formatCurrency(baseAmount, baseCurrency)}
                    <span className="text-base font-normal text-muted-foreground"> equivalent/month</span>
                  </div>
                ) : (
                  <div className="text-4xl font-bold text-primary">
                    {formatCurrency(convertedAmount, selectedCurrency)}
                    <span className="text-base font-normal text-muted-foreground">/month</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Payment method toggle */}
            {selectedCurrency !== "CRYPTO" && bankEnabled && cryptoEnabled && (
              <div className="flex gap-2 mt-4">
                <Button variant={paymentMethod === "bank" ? "default" : "outline"} className="flex-1 gap-2" onClick={() => setPaymentMethod("bank")}>
                  <Building2 className="h-4 w-4" /> Bank Transfer
                </Button>
                <Button variant={paymentMethod === "crypto" ? "default" : "outline"} className="flex-1 gap-2" onClick={() => setPaymentMethod("crypto")}>
                  <Bitcoin className="h-4 w-4" /> Crypto
                </Button>
              </div>
            )}
            {selectedCurrency === "CRYPTO" && (
              <div className="mt-4">
                <Button variant="default" className="w-full gap-2" disabled>
                  <Bitcoin className="h-4 w-4" /> Crypto Payment Selected
                </Button>
              </div>
            )}
          </div>

          {/* Payment form */}
          <div>
            <Card className="p-6 border-border bg-card">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                {(paymentMethod === "crypto" || selectedCurrency === "CRYPTO") ? (
                  <><Bitcoin className="h-5 w-5 text-primary" /> Crypto Payment</>
                ) : (
                  <><CreditCard className="h-5 w-5 text-primary" /> Bank Transfer</>
                )}
              </h2>

              {/* Crypto details */}
              {(paymentMethod === "crypto" || selectedCurrency === "CRYPTO") && enabledWallets.length > 0 && (
                <div className="space-y-3 mb-6">
                  {enabledWallets.map((wallet) => (
                    <div key={wallet.id} className="p-4 rounded-xl bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-primary/20 text-primary">{wallet.currency}</Badge>
                        <span className="text-xs text-muted-foreground">{wallet.network}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono flex-1 break-all">{wallet.address}</code>
                        <button onClick={() => copyToClipboard(wallet.address)} className="text-muted-foreground hover:text-primary shrink-0">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bank details */}
              {paymentMethod === "bank" && selectedCurrency !== "CRYPTO" && enabledBanks.length > 0 && (
                <div className="space-y-3 mb-6">
                  {enabledBanks.filter(b => !selectedCurrency || b.currency === selectedCurrency || enabledBanks.length === 1 || selectedCurrency === "USD").map((bank) => (
                    <div key={bank.id} className="p-4 rounded-xl bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{bank.label || bank.bank_name}</span>
                        <Badge variant="outline" className="text-xs">{bank.currency}</Badge>
                      </div>
                      {bank.bank_name && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Bank</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{bank.bank_name}</span>
                            <button onClick={() => copyToClipboard(bank.bank_name)} className="text-muted-foreground hover:text-primary"><Copy className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      )}
                      {bank.account_name && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Account Name</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{bank.account_name}</span>
                            <button onClick={() => copyToClipboard(bank.account_name)} className="text-muted-foreground hover:text-primary"><Copy className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      )}
                      {bank.account_number && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Account Number</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{bank.account_number}</span>
                            <button onClick={() => copyToClipboard(bank.account_number)} className="text-muted-foreground hover:text-primary"><Copy className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      )}
                      {bank.routing_number && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Routing/SWIFT</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{bank.routing_number}</span>
                            <button onClick={() => copyToClipboard(bank.routing_number)} className="text-muted-foreground hover:text-primary"><Copy className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      )}
                      {bank.instructions && (
                        <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">{bank.instructions}</p>
                      )}
                    </div>
                  ))}
                  {/* Fallback to old payment settings if no bank accounts configured */}
                  {enabledBanks.length === 0 && settings.payment_settings.bank_name && (
                    <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                      <h3 className="font-semibold text-sm">Transfer to:</h3>
                      {settings.payment_settings.bank_name && <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Bank</span><span className="font-medium">{settings.payment_settings.bank_name}</span></div>}
                      {settings.payment_settings.account_name && <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Account</span><span className="font-medium">{settings.payment_settings.account_name}</span></div>}
                      {settings.payment_settings.account_number && <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Number</span><span className="font-medium">{settings.payment_settings.account_number}</span></div>}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Your Email *</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="ref">Payment Reference / Transaction ID</Label>
                  <Input id="ref" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="Enter your payment reference" className="mt-1" />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 text-lg font-semibold shadow-[var(--shadow-glow)]">
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Crown className="mr-2 h-5 w-5" />
                      Submit Payment {selectedCurrency !== "CRYPTO" ? `(${formatCurrency(convertedAmount, selectedCurrency)})` : ""}
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>
        <AdBanner page="payment" position="bottom" />
      </main>
    </div>
  );
};

export default Payment;
