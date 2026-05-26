import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useMemo, useState, useEffect } from "react";
import { ArrowRight, Banknote, CheckCircle2, CreditCard, Heart, Loader2, ShieldCheck, Smartphone, Download } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { generateReceiptPDF } from "@/lib/receipt-generator";
import { toast } from "sonner";

export const Route = createFileRoute("/giving")({
  head: () => ({
    meta: [
      { title: "Online Giving - SWIC" },
      { name: "description", content: "Support Soul Winners International Church through secure Paystack giving." },
    ],
  }),
  component: Giving,
});

type PaymentMethod = "mobile_money" | "card";

const PAYSTACK_PUBLIC_KEY = "pk_test_efff82b29a7e27495c4fbb92a41516beb1bf1d1b";

const AMOUNTS = [50, 100, 200, 500];

const GIVING_TYPES = ["Tithe", "Offering", "Missions", "Building Fund", "Thanksgiving", "Seed"];

const PAYMENT_METHODS: Array<{
  id: PaymentMethod;
  title: string;
  description: string;
  Icon: typeof Smartphone;
}> = [
  {
    id: "mobile_money",
    title: "Mobile Money",
    description: "Pay with supported mobile money wallets through Paystack checkout.",
    Icon: Smartphone,
  },
  {
    id: "card",
    title: "Visa Card, Mastercard, etc.",
    description: "Pay securely with a Visa, Mastercard, or other supported debit/credit card.",
    Icon: CreditCard,
  },
];

function Giving() {
  const [amount, setAmount] = useState("100");
  const [givingType, setGivingType] = useState(GIVING_TYPES[1]);
  const [method, setMethod] = useState<PaymentMethod>("mobile_money");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [verifying, setVerifying] = useState(false);
  const [verifiedRecord, setVerifiedRecord] = useState<any>(null);
  const [verificationError, setVerificationError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const callbackReference = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("reference") ?? "";
  }, []);

  useEffect(() => {
    if (!callbackReference) return;

    async function verifyPayment() {
      setVerifying(true);
      setVerificationError("");
      try {
        const response = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(callbackReference)}`);
        const payload = await response.json();
        
        if (!response.ok || payload.error) {
          throw new Error(payload.error || "Verification failed");
        }

        if (payload.data && (payload.data.status === "success" || payload.data.status === "success")) {
          setVerifiedRecord(payload.data);
          toast.success("Payment verified successfully!");
        } else {
          setVerificationError(`Payment status: ${payload.data?.status || 'unverified'}`);
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setVerificationError(err.message || "Failed to verify transaction. Please contact support.");
      } finally {
        setVerifying(false);
      }
    }

    verifyPayment();
  }, [callbackReference]);

  async function handleDownloadReceipt() {
    if (!verifiedRecord) return;
    setDownloading(true);
    try {
      await generateReceiptPDF(verifiedRecord);
      toast.success("Receipt downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF receipt.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          email,
          givingType,
          method,
          name,
          phone,
        }),
      });

      const payload = (await response.json()) as { authorizationUrl?: string; error?: string };

      if (!response.ok || !payload.authorizationUrl) {
        throw new Error(payload.error ?? "Unable to start payment. Please try again.");
      }

      window.location.assign(payload.authorizationUrl);
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : "Unable to start payment. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Online Giving"
        title="Give unto the Lord with gladness."
        subtitle="Use Mobile Money or a supported debit/credit card to partner with Soul Winners International Church."
      />

      <section className="py-16">
        <div className="container-prose">
          {callbackReference ? (
            <div className="mb-8 rounded-2xl border bg-card p-6 shadow-soft">
              <h3 className="text-lg font-bold">Transaction Verification</h3>
              <p className="text-sm text-muted-foreground mt-1">Reference: {callbackReference}</p>
              
              {verifying && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Verifying transaction status with Paystack...
                </div>
              )}
              
              {verificationError && (
                <div className="mt-4 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
                  <p className="font-semibold">Verification Alert</p>
                  <p className="mt-1">{verificationError}</p>
                </div>
              )}
              
              {verifiedRecord && (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl bg-green-500/10 p-4 border border-green-500/20 text-green-800">
                    <p className="font-bold flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="h-5 w-5" /> Donation Confirmed!
                    </p>
                    <p className="mt-2 text-sm text-foreground/85">
                      Thank you, <strong>{verifiedRecord.donor_name}</strong>. We have received your donation of <strong>GHS {verifiedRecord.amount}</strong> for <strong>{verifiedRecord.giving_type}</strong>.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadReceipt}
                      disabled={downloading}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 shadow-soft transition disabled:opacity-50 cursor-pointer"
                    >
                      {downloading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Generating Receipt...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" /> Download Receipt (PDF)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <aside className="rounded-2xl bg-ink p-8 text-white shadow-elegant">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl gradient-gold text-ink">
                <Heart className="h-5 w-5" />
              </div>
              <h2 className="mt-6 text-3xl font-extrabold leading-tight">Your giving fuels the work of the Gospel.</h2>
              <p className="mt-4 text-sm leading-7 text-white/75">
                Every gift supports evangelism, discipleship, weekly services, and ministry outreach. Paystack keeps the payment step secure while SWIC receives the donation details.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Secured by Paystack",
                  "Choose your giving type (eg. seed, thanksgiving, offering, etc.)",
                  "Choose the payment channel that fits you"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-white/85">
                    <ShieldCheck className="h-4 w-4 text-gold" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-gold">Luke 6:38</p>
                <p className="mt-3 text-lg font-semibold leading-relaxed">
                  Give, and it will be given to you. A good measure, pressed down, shaken together and running over.
                </p>
              </div>
            </aside>

            <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-6 shadow-soft md:p-8">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl gradient-red text-white">
                  <Banknote className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold">Make a donation</h2>
                  <p className="text-sm text-muted-foreground">You will be redirected to Paystack to complete payment.</p>
                </div>
              </div>

              <div className="mt-8">
                <label className="text-sm font-bold">Amount (GHS)</label>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {AMOUNTS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(String(preset))}
                      className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                        amount === String(preset)
                          ? "border-primary bg-primary text-primary-foreground shadow-elegant"
                          : "border-border bg-background hover:border-primary hover:text-primary"
                      }`}
                    >
                      GHS {preset}
                    </button>
                  ))}
                </div>
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  inputMode="decimal"
                  min="1"
                  type="number"
                  className="mt-3 w-full rounded-xl border bg-background px-4 py-3 text-lg font-bold outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter custom amount"
                  required
                />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold">Giving type</span>
                  <select
                    value={givingType}
                    onChange={(event) => setGivingType(event.target.value)}
                    className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {GIVING_TYPES.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-bold">Phone (optional)</span>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="+233..."
                  />
                </label>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold">Name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Your name"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold">Email</span>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="you@example.com"
                    type="email"
                    required
                  />
                </label>
              </div>

              <div className="mt-8">
                <p className="text-sm font-bold">Payment method</p>
                <div className="mt-3 grid gap-3">
                  {PAYMENT_METHODS.map(({ id, title, description, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setMethod(id)}
                      className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${
                        method === id
                          ? "border-primary bg-primary/10 shadow-soft"
                          : "border-border bg-background hover:border-primary/60"
                      }`}
                    >
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition ${
                          method === id ? "gradient-red text-white" : "bg-muted text-primary"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold">{title}</span>
                        <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
                      </span>
                      <span
                        className={`h-4 w-4 rounded-full border transition ${
                          method === id ? "border-primary bg-primary shadow-[inset_0_0_0_3px_white]" : "border-muted-foreground/40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {error ? <p className="mt-5 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</p> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-extrabold text-primary-foreground shadow-elegant transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {isSubmitting ? "Opening Paystack..." : "Continue to Paystack"}
              </button>

              <p className="mt-4 text-center text-xs text-muted-foreground">Secured transaction by Paystack.</p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
