"use client";

import { useState } from "react";
import { fmtUsd } from "@/lib/format";
import { useComposeBasket } from "@/lib/api/hooks";
import { mapComposeResponse, type UiCatalogueAsset } from "@/lib/api/map";
import { ApiRequestError } from "@/lib/api/client";
import { useToast } from "../toast/ToastProvider";
import { useWallet } from "../wallet/WalletProvider";
import { SectorPill } from "../badges";
import { SparkleIcon } from "../icons";
import { Modal } from "../Modal";
import { CatalogueTable } from "../catalogue/CatalogueTable";
import { Stepper } from "./Stepper";
import { WizardNav } from "./WizardNav";
import { ChoiceCard } from "./ChoiceCard";
import { AILoading } from "./AILoading";

interface Row {
  /** Constituent token address — required for the real createBasket call.
     Empty for mock AI-preset rows until the live /ai/compose wiring lands. */
  address: string;
  sym: string;
  name: string;
  sector: string;
  price: number;
  weight: number; // bps
  rationale: string;
}

const STEPS = ["Describe", "Review", "Configure", "Deploy"];

const EXAMPLES = [
  "European defense primes for a decade of rearmament",
  "The nuclear renaissance — uranium to small modular reactors",
  "AI data-center power and cooling outside the US",
];

export function CreateBasket() {
  const { toast } = useToast();
  const { connected, connect } = useWallet();
  const compose = useComposeBasket();

  const [step, setStep] = useState(1);
  const [thesis, setThesis] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [aiMeta, setAiMeta] = useState<{ overall: string; risk: string } | null>(null);
  const [showCat, setShowCat] = useState(false);

  // config
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [rebal, setRebal] = useState(false);
  const [drift, setDrift] = useState(500);
  const [seed, setSeed] = useState("1000");

  const loading = compose.isPending;
  const aiError = compose.isError;

  function runAI() {
    compose.mutate(thesis, {
      onSuccess: (res) => {
        const proposal = mapComposeResponse(res);
        setRows(
          proposal.constituents.map((c) => ({
            address: c.address,
            sym: c.sym,
            name: c.name,
            sector: c.sector,
            price: c.price,
            weight: c.weight,
            rationale: c.rationale,
          }))
        );
        setAiMeta({ overall: proposal.overallRationale, risk: proposal.riskNotes });
        setStep(2);
      },
      onError: (err) => {
        const msg =
          err instanceof ApiRequestError
            ? err.message
            : "The AI composer is unavailable. Try again or compose manually.";
        toast(msg, "error");
      },
    });
  }

  /** Skip the AI and start from an empty composition (manual fallback). */
  function composeManually() {
    setRows([]);
    setAiMeta(null);
    compose.reset();
    setShowCat(true);
    setStep(2);
  }

  const totalW = rows ? rows.reduce((s, r) => s + (r.weight || 0), 0) : 0;
  const weightsOk = totalW === 10000;
  const countOk = !!rows && rows.length >= 3 && rows.length <= 20;
  const boundsOk = !!rows && rows.every((r) => r.weight >= 100 && r.weight <= 5000);
  const reviewOk = weightsOk && countOk && boundsOk;
  const configOk = name.trim().length > 0 && symbol.trim().length > 0 && parseFloat(seed) >= 1000;

  function setWeight(i: number, pct: string) {
    const bpsVal = Math.round((parseFloat(pct) || 0) * 100);
    setRows((rs) => rs!.map((r, j) => (j === i ? { ...r, weight: bpsVal } : r)));
  }
  function removeRow(i: number) {
    setRows((rs) => rs!.filter((_, j) => j !== i));
  }
  function addAsset(asset: UiCatalogueAsset) {
    setRows((rs) => {
      if (rs!.some((r) => r.sym === asset.sym)) {
        toast(`${asset.sym} is already in the basket`, "error");
        return rs;
      }
      return [
        ...rs!,
        {
          address: asset.address,
          sym: asset.sym,
          name: asset.name,
          sector: asset.sector,
          price: asset.price,
          weight: 0,
          rationale: "Manually added by you.",
        },
      ];
    });
    setShowCat(false);
  }
  function distribute() {
    setRows((rs) => {
      const zeros = rs!.filter((r) => r.weight === 0);
      if (!zeros.length) return rs;
      const remaining = 10000 - rs!.reduce((s, r) => s + r.weight, 0);
      if (remaining <= 0) return rs;
      const each = Math.floor(remaining / zeros.length / 100) * 100;
      return rs!.map((r) => (r.weight === 0 ? { ...r, weight: each } : r));
    });
  }

  function deploy() {
    if (!connected) {
      toast("Connect your wallet to deploy", "error");
      connect();
      return;
    }
    // The on-chain deploy (USDG approve → factory.createBasket → BasketCreated
    // event → navigate) is wired in the contract-writes slice. For now this
    // confirms the flow end-to-end up to the signature step.
    toast("Deploy flow is being wired to the contracts — coming next.", "pending");
  }

  return (
    <div className="wrap reveal" style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 920 }}>
      <Stepper steps={STEPS} step={step} />

      {/* STEP 1 — Describe */}
      {step === 1 && (
        <div className="card card-pad" style={{ padding: 36, marginTop: 28 }}>
          <span className="badge badge-accent" style={{ marginBottom: 14 }}>
            <SparkleIcon /> AI composition engine
          </span>
          <h1 style={{ fontSize: 30, letterSpacing: "-0.03em" }}>Describe your investment thesis</h1>
          <p
            className="muted"
            style={{ fontSize: 15.5, marginTop: 10, maxWidth: 620, lineHeight: 1.55 }}
          >
            Write what you believe in, in plain language. The agent reads the full Robinhood Chain
            catalogue — sectors, market caps, and live Chainlink prices — and proposes a basket with
            weights and a rationale for every pick.
          </p>
          <div style={{ position: "relative", marginTop: 22 }}>
            <textarea
              className="input"
              rows={5}
              value={thesis}
              maxLength={600}
              onChange={(e) => setThesis(e.target.value)}
              placeholder="e.g. Companies building the physical infrastructure for AI — data centres, power, and semiconductor manufacturing outside the United States."
            />
            <span
              className="muted num"
              style={{ position: "absolute", right: 14, bottom: 12, fontSize: 12 }}
            >
              {thesis.length} / 600
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <span className="muted" style={{ fontSize: 13, alignSelf: "center" }}>
              Try:
            </span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                className="btn btn-subtle btn-sm"
                onClick={() => setThesis(ex)}
                style={{ fontWeight: 600 }}
              >
                {ex}
              </button>
            ))}
          </div>
          {loading ? (
            <AILoading />
          ) : aiError ? (
            <div
              style={{
                marginTop: 22,
                padding: 16,
                background: "var(--down-tint)",
                borderRadius: "var(--r-sm)",
              }}
            >
              <div className="down" style={{ fontWeight: 700, fontSize: 14 }}>
                Composition failed
              </div>
              <p style={{ fontSize: 13.5, marginTop: 4, lineHeight: 1.5 }}>
                {compose.error instanceof Error
                  ? compose.error.message
                  : "The AI composer is temporarily unavailable."}
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <button type="button" className="btn btn-primary" onClick={runAI}>
                  <SparkleIcon /> Retry
                </button>
                <button type="button" className="btn btn-ghost" onClick={composeManually}>
                  Compose manually
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-lg"
              style={{ marginTop: 24 }}
              disabled={thesis.trim().length < 20}
              onClick={runAI}
            >
              <SparkleIcon /> Compose with AI
            </button>
          )}
          {thesis.length > 0 && thesis.trim().length < 20 && (
            <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
              At least 20 characters.
            </p>
          )}
        </div>
      )}

      {/* STEP 2 — Review */}
      {step === 2 && rows && (
        <div style={{ marginTop: 28 }}>
          <div className="card" style={{ overflow: "hidden" }}>
            <div
              style={{
                padding: "18px 22px",
                borderBottom: "1px solid var(--line)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <h2 style={{ fontSize: 20 }}>Review the proposal</h2>
                <p className="muted" style={{ fontSize: 13.5, marginTop: 3 }}>
                  Remove, add, or reweight any constituent. Weights must total 100%.
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button type="button" className="btn btn-subtle btn-sm" onClick={distribute}>
                  Distribute remaining
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowCat(true)}
                >
                  + Add constituent
                </button>
              </div>
            </div>
            <div className="scroll-x">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>AI rationale</th>
                    <th style={{ textAlign: "right" }}>Price</th>
                    <th style={{ textAlign: "right", width: 130 }}>Weight</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.sym}>
                      <td style={{ verticalAlign: "top" }}>
                        <span className="tag">{r.sym}</span>
                        <div style={{ fontWeight: 600, marginTop: 6, fontSize: 13.5 }}>
                          {r.name}
                        </div>
                        <div style={{ marginTop: 5 }}>
                          <SectorPill sector={r.sector} />
                        </div>
                      </td>
                      <td style={{ maxWidth: 320, verticalAlign: "top" }}>
                        <span className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
                          {r.rationale}
                        </span>
                      </td>
                      <td className="num" style={{ textAlign: "right", verticalAlign: "top" }}>
                        {fmtUsd(r.price)}
                      </td>
                      <td style={{ textAlign: "right", verticalAlign: "top" }}>
                        <div style={{ position: "relative", width: 100, marginLeft: "auto" }}>
                          <input
                            className="input num"
                            style={{
                              height: 38,
                              textAlign: "right",
                              paddingRight: 26,
                              fontWeight: 700,
                              borderColor:
                                r.weight < 100 || r.weight > 5000
                                  ? "var(--down)"
                                  : "var(--line)",
                            }}
                            value={r.weight ? r.weight / 100 : ""}
                            placeholder="0"
                            inputMode="decimal"
                            onChange={(e) => setWeight(i, e.target.value.replace(/[^0-9.]/g, ""))}
                            aria-label={`${r.sym} weight percent`}
                          />
                          <span
                            style={{
                              position: "absolute",
                              right: 10,
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "var(--muted-2)",
                              fontSize: 13,
                            }}
                          >
                            %
                          </span>
                        </div>
                        {r.weight > 5000 && (
                          <div className="down" style={{ fontSize: 11, marginTop: 3 }}>
                            max 50%
                          </div>
                        )}
                        {r.weight > 0 && r.weight < 100 && (
                          <div className="down" style={{ fontSize: 11, marginTop: 3 }}>
                            min 1%
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "right", verticalAlign: "top" }}>
                        <button
                          type="button"
                          className="btn btn-subtle btn-sm"
                          style={{ width: 30, padding: 0 }}
                          onClick={() => removeRow(i)}
                          aria-label={`Remove ${r.sym}`}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 22px",
                background: weightsOk ? "var(--up-tint)" : "var(--surface)",
                borderTop: "1px solid var(--line)",
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: weightsOk ? "var(--up)" : "var(--muted)",
                }}
              >
                {weightsOk
                  ? "✓ Weights total 100%"
                  : `Total weight: ${(totalW / 100).toFixed(1)}% — must equal 100%`}
              </span>
              <span
                className="num"
                style={{ fontSize: 16, fontWeight: 800, color: weightsOk ? "var(--up)" : "var(--ink)" }}
              >
                {(totalW / 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {aiMeta && (
            <div className="mt-[18px] grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="card card-pad">
                <div
                  className="eyebrow"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <SparkleIcon /> Overall rationale
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 10 }}>{aiMeta.overall}</p>
              </div>
              <div
                className="card card-pad"
                style={{ background: "var(--warn-tint)", borderColor: "transparent" }}
              >
                <div className="eyebrow" style={{ color: "var(--warn)" }}>
                  Risk notes
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 10 }}>{aiMeta.risk}</p>
              </div>
            </div>
          )}

          <WizardNav
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            nextOk={reviewOk}
            nextHint={
              !countOk
                ? "Need 3–20 constituents"
                : !boundsOk
                  ? "Each weight must be 1%–50%"
                  : !weightsOk
                    ? "Weights must total 100%"
                    : ""
            }
          />
        </div>
      )}

      {/* STEP 3 — Configure */}
      {step === 3 && (
        <div style={{ marginTop: 28 }}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="card card-pad">
              <label className="eyebrow" htmlFor="basket-name">
                Basket name
              </label>
              <input
                id="basket-name"
                className="input"
                style={{ marginTop: 8 }}
                maxLength={50}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="European Defense"
              />
              <label
                className="eyebrow"
                htmlFor="basket-symbol"
                style={{ marginTop: 18, display: "block" }}
              >
                Token symbol
              </label>
              <input
                id="basket-symbol"
                className="input num"
                style={{ marginTop: 8, textTransform: "uppercase" }}
                maxLength={8}
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                placeholder="EUDEF"
              />
              <label
                className="eyebrow"
                htmlFor="basket-seed"
                style={{ marginTop: 18, display: "block" }}
              >
                Initial deposit (USDC)
              </label>
              <div style={{ position: "relative", marginTop: 8 }}>
                <input
                  id="basket-seed"
                  className="input num"
                  style={{ paddingRight: 60, fontWeight: 600 }}
                  value={seed}
                  inputMode="decimal"
                  onChange={(e) => setSeed(e.target.value.replace(/[^0-9.]/g, ""))}
                />
                <span
                  className="tag"
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}
                >
                  USDC
                </span>
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                Minimum $1,000. You seed the basket from your own wallet at deployment.
              </p>
            </div>

            <div className="card card-pad">
              <span className="eyebrow">Rebalancing</span>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <ChoiceCard
                  active={!rebal}
                  onClick={() => setRebal(false)}
                  title="Static"
                  desc="Weights drift freely. Let your winners run."
                />
                <ChoiceCard
                  active={rebal}
                  onClick={() => setRebal(true)}
                  title="Auto-rebalancing"
                  desc="Restore target weights when drift exceeds a threshold."
                />
              </div>
              {rebal && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="eyebrow">Drift threshold</span>
                    <span className="num" style={{ fontWeight: 700 }}>
                      {(drift / 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={2000}
                    step={100}
                    value={drift}
                    onChange={(e) => setDrift(+e.target.value)}
                    style={{ width: "100%", marginTop: 10, accentColor: "var(--accent)" }}
                    aria-label="Drift threshold percent"
                  />
                  <p className="muted" style={{ fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
                    When any holding deviates from its target by {(drift / 100).toFixed(0)}%, the
                    basket trades to restore proportions — funded from fee revenue via Chainlink
                    Automation.
                  </p>
                </div>
              )}
              <div
                style={{
                  marginTop: 18,
                  padding: 14,
                  background: "var(--accent-tint)",
                  borderRadius: "var(--r-sm)",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-strong)" }}>
                  Creator revenue
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.55, marginTop: 5 }}>
                  A 0.50% fee is charged on each deposit and redemption.{" "}
                  <strong>80% flows to you</strong> as the creator — continuously, for the life of
                  the basket — and 20% to the protocol treasury.
                </p>
              </div>
            </div>
          </div>
          <WizardNav
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
            nextOk={configOk}
            nextHint={!configOk ? "Name, symbol, and a $1,000+ deposit required" : ""}
          />
        </div>
      )}

      {/* STEP 4 — Deploy */}
      {step === 4 && rows && (
        <div style={{ marginTop: 28 }}>
          <div className="card card-pad" style={{ padding: 30 }}>
            <h2 style={{ fontSize: 22 }}>Review &amp; deploy</h2>
            <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
              Confirm everything below. Deployment is two transactions: USDC approval, then basket
              creation.
            </p>
            <div className="mt-[22px] grid grid-cols-1 gap-x-[14px] sm:grid-cols-2">
              <SummaryRow k="Name" v={name} />
              <SummaryRow k="Symbol" v={symbol} mono />
              <SummaryRow k="Constituents" v={`${rows.length} holdings`} />
              <SummaryRow
                k="Rebalancing"
                v={rebal ? `Auto · ${(drift / 100).toFixed(0)}% drift` : "Static"}
              />
              <SummaryRow k="Initial deposit" v={fmtUsd(parseFloat(seed) || 0)} mono />
              <SummaryRow k="Fee on first deposit" v={fmtUsd((parseFloat(seed) || 0) * 0.005)} mono />
            </div>
            <div style={{ marginTop: 18 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                Composition
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {rows.map((r) => (
                  <span key={r.sym} className="tag" style={{ height: 28 }}>
                    {r.sym} · {(r.weight / 100).toFixed(0)}%
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-lg btn-block"
              style={{ marginTop: 26 }}
              onClick={deploy}
            >
              {connected ? "Approve & deploy basket" : "Connect wallet to deploy"}
            </button>
          </div>
          <WizardNav onBack={() => setStep(3)} hideNext />
        </div>
      )}

      {showCat && (
        <Modal title="Add a constituent" onClose={() => setShowCat(false)} wide>
          <CatalogueTable
            onAdd={addAsset}
            selected={rows?.map((r) => r.address).filter(Boolean) ?? []}
            maxHeight="52vh"
            autoFocus
          />
        </Modal>
      )}
    </div>
  );
}

function SummaryRow({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: "1px solid var(--line-2)",
      }}
    >
      <span className="muted" style={{ fontSize: 13.5 }}>
        {k}
      </span>
      <span className={mono ? "num" : ""} style={{ fontWeight: 650, fontSize: 14 }}>
        {v}
      </span>
    </div>
  );
}
