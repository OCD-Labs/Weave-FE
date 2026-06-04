"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Address } from "viem";
import { fmtUsd } from "@/lib/format";
import { useComposeBasket } from "@/lib/api/hooks";
import { mapComposeResponse, type UiCatalogueAsset } from "@/lib/api/map";
import { toUnits } from "@/lib/units";
import { takeBasketDraft } from "@/lib/basketDraft";
import { useRegistryParams, usePaused } from "@/lib/web3/hooks";
import { useCreateBasket } from "@/lib/web3/useCreateBasket";
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
import { TransactionStatus } from "./TransactionStatus";

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

// Example theses chosen to match the live catalogue (currently US mega-cap
// tech/consumer names: AMD, AMZN, NFLX, PLTR, TSLA), so the AI can actually
// find ≥3 fitting constituents.
const EXAMPLES = [
  "Megacap US technology leaders in AI, cloud, and streaming",
  "AI and data-analytics platforms driving the next tech cycle",
  "Consumer tech disruptors like EVs, e-commerce, and streaming",
];

/** Translate the backend's raw AI error into something a user understands.
   The most common failure is the model returning too few constituents for the
   thesis (the catalogue is small), which surfaces as a schema-validation blob. */
function friendlyAiError(raw: string): string {
  const r = raw.toLowerCase();
  if (r.includes("too_small") || r.includes("at least 3")) {
    return "The AI couldn't find enough matching assets for that description. Try a broader theme (the catalogue is focused on US tech and consumer names), or select the constituents yourself.";
  }
  if (r.includes("timeout") || r.includes("timed out")) {
    return "The AI took too long to respond. Please try again, or select the constituents yourself.";
  }
  if (r.includes("network")) {
    return "Couldn't reach the AI composer. Check your connection and try again.";
  }
  return "The AI composer couldn't generate a basket from that description. Try rephrasing, or select the constituents yourself.";
}

export function CreateBasket() {
  const router = useRouter();
  const { toast } = useToast();
  const { connected, connect } = useWallet();
  const compose = useComposeBasket();
  const registry = useRegistryParams();
  const paused = usePaused();
  const { state: deployState, deploy: runDeploy, reset: resetDeploy } = useCreateBasket();

  const [step, setStep] = useState(1);
  const [thesis, setThesis] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [aiMeta, setAiMeta] = useState<{ overall: string; risk: string } | null>(null);
  const [showCat, setShowCat] = useState(false);
  // True when the wizard opened pre-filled from a catalogue selection (step 1
  // then offers "continue to review" instead of starting empty).
  const [fromCatalogue, setFromCatalogue] = useState(false);

  // config
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [rebal, setRebal] = useState(false);
  const [drift, setDrift] = useState(500);
  const [seed, setSeed] = useState("");

  const loading = compose.isPending;
  const aiError = compose.isError;
  const descOk = thesis.trim().length >= 20;
  const deploying = deployState.phase !== "idle" && deployState.phase !== "error";

  // Read-and-clear a catalogue hand-off once on mount. Done in an effect (not a
  // lazy initializer) so the server render — which has no sessionStorage — and
  // the client's first render agree, avoiding a hydration mismatch. The mount
  // sync is intentional and one-shot.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const draft = takeBasketDraft();
    if (!draft) return;
    setRows(
      draft.map((a) => ({
        address: a.address,
        sym: a.sym,
        name: a.name,
        sector: a.sector,
        price: a.price,
        weight: 0,
        rationale: "Selected from the catalogue.",
      }))
    );
    setFromCatalogue(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // On successful deploy, navigate to the new basket (or marketplace fallback).
  useEffect(() => {
    if (deployState.phase === "success") {
      toast("Basket deployed — welcome to the marketplace", "success");
      const t = setTimeout(() => {
        router.push(
          deployState.basketAddress
            ? `/baskets/${deployState.basketAddress.toLowerCase()}`
            : "/"
        );
      }, 900);
      return () => clearTimeout(t);
    }
  }, [deployState.phase, deployState.basketAddress, router, toast]);

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
        setFromCatalogue(false);
        setStep(2);
      },
      onError: (err) => {
        toast(friendlyAiError(err instanceof Error ? err.message : ""), "error");
      },
    });
  }

  /** Primary path: build the composition by hand, starting from an empty table. */
  function startManual() {
    setRows([]);
    setAiMeta(null);
    compose.reset();
    setStep(2);
  }

  const totalW = rows ? rows.reduce((s, r) => s + (r.weight || 0), 0) : 0;
  const weightsOk = totalW === 10000;
  const countOk = !!rows && rows.length >= 3 && rows.length <= registry.maxConstituents;
  const boundsOk = !!rows && rows.every((r) => r.weight >= registry.minWeightBps && r.weight <= 5000);
  const reviewOk = weightsOk && countOk && boundsOk;
  const seedNum = parseFloat(seed) || 0;
  const configOk =
    name.trim().length > 0 && symbol.trim().length > 0 && seedNum >= registry.minFirstDepositUsd;

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
    if (paused) {
      toast("The protocol is temporarily paused. Please try again later.", "error");
      return;
    }
    if (!rows || !reviewOk || !configOk) {
      toast("Complete the composition and configuration first.", "error");
      return;
    }
    // Guard: every constituent must carry a real on-chain address. AI-composed
    // and catalogue-added rows do; this catches any gap before signing.
    const missing = rows.find((r) => !r.address);
    if (missing) {
      toast(`${missing.sym} is missing its token address — re-add it from the catalogue.`, "error");
      return;
    }
    runDeploy({
      name: name.trim(),
      symbol: symbol.trim(),
      thesis: thesis.trim(),
      constituents: rows.map((r) => r.address as Address),
      targetWeightsBps: rows.map((r) => r.weight),
      rebalancingEnabled: rebal,
      driftThresholdBps: rebal ? drift : 0,
      initialDepositRaw: toUnits(seed || "0", 6),
    });
  }

  return (
    <div className="wrap reveal" style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 920 }}>
      <Stepper steps={STEPS} step={step} />

      {/* STEP 1 — Describe */}
      {step === 1 && (
        <div className="card card-pad" style={{ padding: 36, marginTop: 28 }}>
          <h1 style={{ fontSize: 30, letterSpacing: "-0.03em" }}>Describe your basket</h1>
          <p
            className="muted"
            style={{ fontSize: 15.5, marginTop: 10, maxWidth: 640, lineHeight: 1.55 }}
          >
            Give your basket a short description of its thesis. Then build the composition yourself, or let the AI propose one from your
            description.
          </p>

          <label className="eyebrow" htmlFor="basket-thesis" style={{ marginTop: 24, display: "block" }}>
            Description
          </label>
          <div style={{ position: "relative", marginTop: 8 }}>
            <textarea
              id="basket-thesis"
              className="input"
              rows={5}
              value={thesis}
              maxLength={600}
              onChange={(e) => setThesis(e.target.value)}
              placeholder="e.g. Companies building the physical infrastructure for AI like data centres, power, and semiconductor manufacturing outside the United States."
            />
            <span
              className="muted num"
              style={{ position: "absolute", right: 14, bottom: 12, fontSize: 12 }}
            >
              {thesis.length} / 600
            </span>
          </div>
          <div style={{ marginTop: 14 }}>
            <span className="muted" style={{ fontSize: 13 }}>
              Examples:
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  className="btn btn-subtle"
                  onClick={() => setThesis(ex)}
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    height: "auto",
                    minHeight: 36,
                    padding: "8px 12px",
                    justifyContent: "flex-start",
                    textAlign: "left",
                    whiteSpace: "normal",
                    lineHeight: 1.4,
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
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
                AI composition failed
              </div>
              <p style={{ fontSize: 13.5, marginTop: 4, lineHeight: 1.5 }}>
                {friendlyAiError(compose.error instanceof Error ? compose.error.message : "")}
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <button type="button" className="btn btn-primary" onClick={startManual}>
                  Select constituents →
                </button>
                <button type="button" className="btn btn-ghost" onClick={runAI}>
                  <SparkleIcon /> Retry AI
                </button>
              </div>
            </div>
          ) : fromCatalogue ? (
            <>
              <div
                style={{
                  marginTop: 22,
                  padding: 14,
                  background: "var(--accent-tint)",
                  borderRadius: "var(--r-sm)",
                  fontSize: 13.5,
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: "var(--accent-strong)" }}>
                  {rows!.length} {rows!.length === 1 ? "asset" : "assets"} from the catalogue
                </strong>{" "}
                are ready. Add a description, then continue to set their weights.
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  disabled={!descOk}
                  onClick={() => setStep(2)}
                >
                  Continue to review →
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-lg"
                  disabled={!descOk}
                  onClick={runAI}
                >
                  <SparkleIcon /> Compose with AI instead
                </button>
              </div>
              {!descOk && (
                <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
                  Add at least 20 characters to continue.
                </p>
              )}
            </>
          ) : (
            <>
              <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
                {/* Primary path: pick assets yourself */}
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  disabled={!descOk}
                  onClick={startManual}
                >
                  Select constituents →
                </button>
                {/* Secondary path: AI proposal */}
                <button
                  type="button"
                  className="btn btn-ghost btn-lg"
                  disabled={!descOk}
                  onClick={runAI}
                >
                  <SparkleIcon /> Compose with AI
                </button>
              </div>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 10, lineHeight: 1.5 }}>
                {descOk ? (
                  <>
                    <strong style={{ color: "var(--ink-2)" }}>Select constituents</strong> — pick
                    assets from the catalogue and set weights.{" "}
                    <strong style={{ color: "var(--ink-2)" }}>Compose with AI</strong> — get a
                    proposed composition from your description to review and edit.
                  </>
                ) : (
                  "Add at least 20 characters to continue."
                )}
              </p>
            </>
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
                <h2 style={{ fontSize: 20 }}>{aiMeta ? "Review the proposal" : "Build your composition"}</h2>
                <p className="muted" style={{ fontSize: 13.5, marginTop: 3 }}>
                  {aiMeta
                    ? "Remove, add, or reweight any constituent. Weights must total 100%."
                    : "Add 3–20 constituents from the catalogue and set weights totalling 100%."}
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
                    <th>{aiMeta ? "AI rationale" : "Rationale"}</th>
                    <th style={{ textAlign: "right" }}>Price</th>
                    <th style={{ textAlign: "right", width: 130 }}>Weight</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "32px 16px" }}>
                        <p className="muted" style={{ fontSize: 14, marginBottom: 12 }}>
                          No constituents yet. Add tokenized equities from the catalogue to build
                          your basket.
                        </p>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setShowCat(true)}
                        >
                          + Add your first constituent
                        </button>
                      </td>
                    </tr>
                  )}
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
                Initial deposit (USDG)
              </label>
              <div style={{ position: "relative", marginTop: 8 }}>
                <input
                  id="basket-seed"
                  className="input num"
                  style={{ paddingRight: 60, fontWeight: 600 }}
                  value={seed}
                  inputMode="decimal"
                  placeholder={String(registry.minFirstDepositUsd)}
                  onChange={(e) => setSeed(e.target.value.replace(/[^0-9.]/g, ""))}
                />
                <span
                  className="tag"
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}
                >
                  USDG
                </span>
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                Minimum {fmtUsd(registry.minFirstDepositUsd)}. You seed the basket from your own
                wallet at deployment.
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
                  A {(registry.managementFeeBps / 100).toFixed(2)}% fee is charged on each deposit
                  and redemption.{" "}
                  <strong>{(registry.creatorShareBps / 100).toFixed(0)}% flows to you</strong> as the
                  creator — continuously, for the life of the basket — and{" "}
                  {(registry.protocolShareBps / 100).toFixed(0)}% to the protocol treasury.
                </p>
              </div>
            </div>
          </div>
          <WizardNav
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
            nextOk={configOk}
            nextHint={!configOk ? "Name, symbol, and a $10+ deposit required" : ""}
          />
        </div>
      )}

      {/* STEP 4 — Deploy */}
      {step === 4 && rows && (
        <div style={{ marginTop: 28 }}>
          <div className="card card-pad" style={{ padding: 30 }}>
            <h2 style={{ fontSize: 22 }}>Review &amp; deploy</h2>
            <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
              Confirm everything below. Deployment is two transactions: USDG approval, then basket
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
              <SummaryRow k="Initial deposit" v={fmtUsd(seedNum)} mono />
              <SummaryRow
                k="Fee on first deposit"
                v={fmtUsd(seedNum * (registry.managementFeeBps / 10000))}
                mono
              />
            </div>
            <div style={{ marginTop: 18 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>
                Description
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-2)" }}>{thesis}</p>
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
              disabled={deploying}
            >
              {!connected
                ? "Connect wallet to deploy"
                : deploying
                  ? "Deploying…"
                  : deployState.phase === "error"
                    ? "Retry deploy"
                    : "Approve & deploy basket"}
            </button>

            {deployState.phase !== "idle" && <TransactionStatus state={deployState} />}
          </div>
          {!deploying && (
            <WizardNav
              onBack={() => {
                resetDeploy();
                setStep(3);
              }}
              hideNext
            />
          )}
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
