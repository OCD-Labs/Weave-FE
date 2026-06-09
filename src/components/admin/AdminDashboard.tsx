"use client";

import { useState, type ChangeEvent } from "react";
import { isAddress, type Address } from "viem";
import { useCatalogue } from "@/lib/api/hooks";
import { CONTRACTS } from "@/lib/web3/addresses";
import {
  REGISTRY_ADMIN,
  AUTOMATION,
  SWAP_ROUTER,
  useAdminAccess,
  useAdminWrite,
  useRegistrySettings,
  useAutomationSettings,
  useRouterSpread,
} from "@/lib/web3/useAdmin";
import { fmtUsd } from "@/lib/format";
import { usdgToNumber, toUnits } from "@/lib/units";
import { useDataSource } from "@/lib/dataSource";
import { useToast } from "@/components/toast/ToastProvider";
import { useWallet } from "@/components/wallet/WalletProvider";
import { ConnectGate } from "@/components/account/primitives";
import { AdminSection, ParamField, ActionButton } from "./primitives";

const short = (a?: string) => (a && a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a ?? "—");
const numStr = (v?: bigint) => (v === undefined ? undefined : String(Number(v)));
const usdStr = (v?: bigint) => (v === undefined ? undefined : fmtUsd(usdgToNumber(v)));
const bpsStr = (v?: bigint) =>
  v === undefined ? undefined : `${Number(v)} bps (${(Number(v) / 100).toFixed(2)}%)`;

export function AdminDashboard() {
  const { connected } = useWallet();
  const access = useAdminAccess();
  const isMock = useDataSource() === "mock";

  // Mock mode is a wallet-free preview: skip the connect/authorization gates and
  // show every section. Writes are no-ops (see useAdminWrite).
  if (!isMock && !connected) {
    return (
      <ConnectGate
        title="Connect the governance wallet"
        sub="The admin dashboard exposes onlyGovernance and SwapRouter-owner controls. Connect the wallet that holds those rights to continue."
      />
    );
  }

  if (!isMock && !access.isAuthorized) {
    return (
      <div className="wrap reveal" style={{ paddingTop: 60, paddingBottom: 80, maxWidth: 560, textAlign: "center" }}>
        <span className="badge badge-warn" style={{ marginBottom: 14 }}>
          Not authorized
        </span>
        <h1 style={{ fontSize: 24 }}>This wallet has no governance rights</h1>
        <p className="muted" style={{ marginTop: 10, fontSize: 14, lineHeight: 1.55 }}>
          Connected as <span className="mono">{short(access.account)}</span>. Governance is{" "}
          <span className="mono">{short(access.governance)}</span> and the SwapRouter owner is{" "}
          <span className="mono">{short(access.routerOwner)}</span>. Switch to one of those wallets to
          manage the protocol.
        </p>
      </div>
    );
  }

  const showGov = isMock || access.isGovernance;
  const showRouter = isMock || access.isRouterOwner;

  return (
    <div className="wrap-wide reveal" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 880 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 30 }}>Admin</h1>
        <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>
          Governance controls for WeaveRegistry, WeaveAutomation and the SwapRouter. Every write is
          pre-simulated and enforced onchain.
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {isMock && <span className="badge badge-warn">Mock preview</span>}
          {showGov && <span className="badge badge-accent">Governance</span>}
          {showRouter && <span className="badge badge-accent">Router owner</span>}
          {access.account && <span className="badge badge-neutral mono">{short(access.account)}</span>}
        </div>
      </header>

      {isMock && (
        <div
          className="card"
          style={{
            background: "var(--warn-tint)",
            border: "none",
            padding: "12px 16px",
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--warn)",
          }}
        >
          Mock preview. Values are placeholders and actions do not send transactions. Switch the data
          source to Live and connect the governance wallet to operate the protocol.
        </div>
      )}

      <div style={{ display: "grid", gap: 16 }}>
        {showGov && <GovernanceSections />}
        {showRouter && <RouterTreasurySection />}
        {!showRouter && showGov && (
          <p className="muted" style={{ fontSize: 12.5 }}>
            SwapRouter treasury controls are owned by a separate deployer wallet and are hidden for
            the governance wallet.
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Governance-only sections (registry + automation + transfer)        */
/* ------------------------------------------------------------------ */
function GovernanceSections() {
  const { pendingKey, send } = useAdminWrite();
  const { settings, refetch } = useRegistrySettings();
  const { settings: autoSettings, refetch: refetchAuto } = useAutomationSettings();

  const reg = (functionName: string, args: readonly unknown[], key: string, label: string) =>
    send(key, label, { address: CONTRACTS.registry, abi: REGISTRY_ADMIN, functionName, args }, refetch);

  return (
    <>
      {/* Emergency */}
      <AdminSection
        title="Emergency"
        danger
        desc="Pause halts all deposits and redemptions across every basket. Rebalancing is not affected (reducing drift during a pause is safe)."
        right={
          settings.paused !== undefined && (
            <span className={`badge ${settings.paused ? "badge-down" : "badge-up"}`}>
              {settings.paused ? "Paused" : "Live"}
            </span>
          )
        }
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <ActionButton
            label="Pause all"
            danger
            busy={pendingKey === "pauseAll"}
            disabled={settings.paused === true}
            onClick={() => reg("pauseAll", [], "pauseAll", "Pause all")}
          />
          <ActionButton
            label="Unpause all"
            busy={pendingKey === "unpauseAll"}
            disabled={settings.paused === false}
            onClick={() => reg("unpauseAll", [], "unpauseAll", "Unpause all")}
          />
        </div>
      </AdminSection>

      {/* Catalogue */}
      <CatalogueSection pendingKey={pendingKey} send={send} />

      {/* Parameters */}
      <AdminSection
        title="Protocol parameters"
        desc="Values apply to new baskets and future operations. bps = basis points (100 bps = 1%). USDG amounts are entered in dollars."
      >
        <ParamField
          label="Management fee (bps)"
          hint="Max 1000 bps (10%)."
          current={bpsStr(settings.managementFeeBps)}
          placeholder="50"
          busy={pendingKey === "setManagementFee"}
          onSubmit={(v) => reg("setManagementFee", [BigInt(v)], "setManagementFee", "Set management fee")}
        />
        <ParamField
          label="Protocol fee split (bps)"
          hint="Protocol share of the fee; creators receive the rest. e.g. 2000 = 20% protocol / 80% creator."
          current={bpsStr(settings.protocolShareBps)}
          placeholder="2000"
          busy={pendingKey === "setFeeSplit"}
          onSubmit={(v) => reg("setFeeSplit", [BigInt(v)], "setFeeSplit", "Set fee split")}
        />
        <ParamField
          label="Min first deposit (USDG $)"
          current={usdStr(settings.minFirstDepositUsdg)}
          placeholder="10"
          busy={pendingKey === "setMinFirstDeposit"}
          onSubmit={(v) =>
            reg("setMinFirstDeposit", [toUnits(v, 6)], "setMinFirstDeposit", "Set min first deposit")
          }
        />
        <ParamField
          label="Min AUM for automation (USDG $)"
          hint="Minimum basket AUM to qualify for protocol-funded Chainlink automation."
          current={usdStr(settings.minAUMUsdg)}
          placeholder="1000"
          busy={pendingKey === "setMinAUM"}
          onSubmit={(v) => reg("setMinAUM", [toUnits(v, 6)], "setMinAUM", "Set min AUM")}
        />
        <ParamField
          label="Min rebalance trade size (USDG $)"
          current={usdStr(settings.minRebalanceTradeSizeUsdg)}
          placeholder="1"
          busy={pendingKey === "setMinRebalanceTradeSize"}
          onSubmit={(v) =>
            reg(
              "setMinRebalanceTradeSize",
              [toUnits(v, 6)],
              "setMinRebalanceTradeSize",
              "Set min rebalance trade size"
            )
          }
        />
        <ParamField
          label="Max swap slippage (bps)"
          hint="Max 1000 bps (10%)."
          current={bpsStr(settings.maxSwapSlippageBps)}
          placeholder="100"
          busy={pendingKey === "setMaxSwapSlippage"}
          onSubmit={(v) => reg("setMaxSwapSlippage", [BigInt(v)], "setMaxSwapSlippage", "Set max swap slippage")}
        />
        <ParamField
          label="Oracle staleness (seconds)"
          hint="Must be greater than 0."
          current={numStr(settings.oracleStalenessSecs)}
          placeholder="3600"
          busy={pendingKey === "setOracleStaleness"}
          onSubmit={(v) => reg("setOracleStaleness", [BigInt(v)], "setOracleStaleness", "Set oracle staleness")}
        />
        <ParamField
          label="Max constituents"
          hint="Must be greater than 0."
          current={numStr(settings.maxConstituents)}
          placeholder="20"
          busy={pendingKey === "setMaxConstituents"}
          onSubmit={(v) => reg("setMaxConstituents", [BigInt(v)], "setMaxConstituents", "Set max constituents")}
        />
        <ParamField
          label="Min weight per constituent (bps)"
          hint="Must be > 0 and < 10000."
          current={bpsStr(settings.minWeightBps)}
          placeholder="100"
          busy={pendingKey === "setMinWeightBps"}
          onSubmit={(v) => reg("setMinWeightBps", [BigInt(v)], "setMinWeightBps", "Set min weight")}
        />
      </AdminSection>

      {/* Protocol addresses */}
      <AdminSection
        title="Protocol addresses"
        desc="Point the registry at new infrastructure contracts. Enter a checksummed 20-byte address."
      >
        <AddressField
          label="Protocol treasury"
          current={short(settings.protocolTreasury)}
          fn="setProtocolTreasury"
          actionLabel="Set treasury"
          pendingKey={pendingKey}
          onSubmit={(addr) => reg("setProtocolTreasury", [addr], "setProtocolTreasury", "Set treasury")}
        />
        <AddressField
          label="Swap router"
          current={short(settings.swapRouter)}
          fn="setSwapRouter"
          actionLabel="Set router"
          pendingKey={pendingKey}
          onSubmit={(addr) => reg("setSwapRouter", [addr], "setSwapRouter", "Set swap router")}
        />
        <AddressField
          label="Basket factory"
          current={short(settings.basketFactory)}
          fn="setBasketFactory"
          actionLabel="Set factory"
          pendingKey={pendingKey}
          onSubmit={(addr) => reg("setBasketFactory", [addr], "setBasketFactory", "Set basket factory")}
        />
        <AddressField
          label="Automation contract"
          current={short(settings.automationContract)}
          fn="setAutomationContract"
          actionLabel="Set automation"
          pendingKey={pendingKey}
          onSubmit={(addr) =>
            reg("setAutomationContract", [addr], "setAutomationContract", "Set automation contract")
          }
        />
      </AdminSection>

      {/* Automation */}
      <AdminSection
        title="Automation (WeaveAutomation)"
        desc="Chainlink upkeep tuning for protocol-funded rebalances."
      >
        <ParamField
          label="Batch size"
          hint="Baskets checked per upkeep call (default 50)."
          current={numStr(autoSettings.batchSize)}
          placeholder="50"
          busy={pendingKey === "setBatchSize"}
          onSubmit={(v) =>
            send(
              "setBatchSize",
              "Set batch size",
              { address: CONTRACTS.automation, abi: AUTOMATION, functionName: "setBatchSize", args: [BigInt(v)] },
              refetchAuto
            )
          }
        />
        <ParamField
          label="Max rebalance slippage (bps)"
          hint="Automation sell-leg cap. Max 500 bps (5%), default 50."
          current={bpsStr(autoSettings.maxRebalanceSlippageBps)}
          placeholder="50"
          busy={pendingKey === "setMaxRebalanceSlippage"}
          onSubmit={(v) =>
            send(
              "setMaxRebalanceSlippage",
              "Set max rebalance slippage",
              {
                address: CONTRACTS.automation,
                abi: AUTOMATION,
                functionName: "setMaxRebalanceSlippage",
                args: [BigInt(v)],
              },
              refetchAuto
            )
          }
        />
      </AdminSection>

      {/* Governance transfer */}
      <AdminSection
        title="Governance transfer"
        desc="Two-step handover. Nominate the new wallet here, then the nominee calls Accept from their own wallet."
        right={
          settings.pendingGovernance &&
          settings.pendingGovernance !== "0x0000000000000000000000000000000000000000" ? (
            <span className="badge badge-warn mono">pending {short(settings.pendingGovernance)}</span>
          ) : undefined
        }
      >
        <AddressField
          label="Nominate new governance"
          current={short(settings.governance)}
          fn="nominateGovernance"
          actionLabel="Nominate"
          pendingKey={pendingKey}
          onSubmit={(addr) => reg("nominateGovernance", [addr], "nominateGovernance", "Nominate governance")}
        />
        <div>
          <ActionButton
            label="Accept governance (as nominee)"
            busy={pendingKey === "acceptGovernance"}
            onClick={() => reg("acceptGovernance", [], "acceptGovernance", "Accept governance")}
          />
        </div>
      </AdminSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Catalogue management                                                */
/* ------------------------------------------------------------------ */
function CatalogueSection({
  pendingKey,
  send,
}: {
  pendingKey: string | null;
  send: ReturnType<typeof useAdminWrite>["send"];
}) {
  const { data: assets, isLoading, refetch } = useCatalogue();
  const [showAdd, setShowAdd] = useState(false);

  const toggle = (token: string, active: boolean) =>
    send(
      `asset-${token}`,
      active ? "Deactivate asset" : "Reactivate asset",
      {
        address: CONTRACTS.registry,
        abi: REGISTRY_ADMIN,
        functionName: active ? "deactivateAsset" : "reactivateAsset",
        args: [token as Address],
      },
      refetch
    );

  return (
    <AdminSection
      title="Catalogue"
      desc="Add tokenized equities or toggle availability. Deactivating an asset suspends every basket holding it on its next interaction."
      right={
        <button type="button" className="btn btn-subtle btn-sm" onClick={() => setShowAdd((s) => !s)}>
          {showAdd ? "Close" : "+ Add asset"}
        </button>
      }
    >
      {showAdd && (
        <AddAssetForm
          busy={pendingKey === "addAsset"}
          send={send}
          onDone={() => {
            setShowAdd(false);
            refetch();
          }}
        />
      )}

      {isLoading ? (
        <div className="skel" style={{ height: 120, width: "100%" }} />
      ) : !assets || assets.length === 0 ? (
        <p className="muted" style={{ fontSize: 13.5 }}>
          No catalogue assets found.
        </p>
      ) : (
        <div className="scroll-x">
          <table className="tbl tbl-hover">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Sector</th>
                <th>Token</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.address}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="tag">{a.symbol}</span>
                      <span style={{ fontWeight: 600 }}>{a.name}</span>
                    </div>
                  </td>
                  <td className="muted" style={{ fontSize: 13 }}>
                    {a.sector}
                  </td>
                  <td className="mono" style={{ fontSize: 12.5 }}>
                    {short(a.address)}
                  </td>
                  <td>
                    <span className={`badge ${a.isActive ? "badge-up" : "badge-neutral"}`}>
                      {a.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="btn btn-subtle btn-sm"
                      disabled={pendingKey === `asset-${a.address}`}
                      onClick={() => toggle(a.address, a.isActive)}
                    >
                      {pendingKey === `asset-${a.address}` ? "…" : a.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminSection>
  );
}

function AddAssetForm({
  busy,
  send,
  onDone,
}: {
  busy?: boolean;
  send: ReturnType<typeof useAdminWrite>["send"];
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [f, setF] = useState({ tokenAddress: "", oracle: "", symbol: "", name: "", sector: "" });
  const set = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = () => {
    if (!isAddress(f.tokenAddress) || !isAddress(f.oracle)) {
      toast("Enter valid token and oracle addresses.", "error");
      return;
    }
    if (!f.symbol.trim() || !f.name.trim() || !f.sector.trim()) {
      toast("Symbol, name and sector are required.", "error");
      return;
    }
    send(
      "addAsset",
      "Add asset",
      {
        address: CONTRACTS.registry,
        abi: REGISTRY_ADMIN,
        functionName: "addAsset",
        args: [
          {
            tokenAddress: f.tokenAddress as Address,
            oracle: f.oracle as Address,
            symbol: f.symbol.trim(),
            name: f.name.trim(),
            sector: f.sector.trim(),
            active: true,
          },
        ],
      },
      onDone
    );
  };

  return (
    <div className="card" style={{ background: "var(--surface)", border: "none", padding: 16, display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
        <Input label="Token address" value={f.tokenAddress} onChange={set("tokenAddress")} mono />
        <Input label="Oracle address" value={f.oracle} onChange={set("oracle")} mono />
        <Input label="Symbol" value={f.symbol} onChange={set("symbol")} />
        <Input label="Name" value={f.name} onChange={set("name")} />
        <Input label="Sector" value={f.sector} onChange={set("sector")} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ActionButton label="Add asset" busy={busy} onClick={submit} />
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  mono,
}: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  mono?: boolean;
}) {
  return (
    <label style={{ display: "grid", gap: 4 }}>
      <span className="eyebrow" style={{ fontSize: 10 }}>
        {label}
      </span>
      <input
        className="input"
        value={value}
        onChange={onChange}
        style={{ fontFamily: mono ? "var(--font-mono)" : undefined, fontSize: mono ? 12.5 : undefined }}
      />
    </label>
  );
}

/* A labeled address input + submit, validating before sending. */
function AddressField({
  label,
  current,
  actionLabel,
  fn,
  pendingKey,
  onSubmit,
}: {
  label: string;
  current?: string;
  actionLabel: string;
  fn: string;
  pendingKey: string | null;
  onSubmit: (addr: Address) => void;
}) {
  const { toast } = useToast();
  return (
    <ParamField
      label={label}
      current={current}
      placeholder="0x…"
      cta={actionLabel}
      multi
      busy={pendingKey === fn}
      onSubmit={(raw) => {
        if (!isAddress(raw)) {
          toast("Enter a valid 20-byte address.", "error");
          return;
        }
        onSubmit(raw as Address);
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* SwapRouter treasury (owner-only)                                    */
/* ------------------------------------------------------------------ */
function RouterTreasurySection() {
  const { pendingKey, send } = useAdminWrite();
  const { spreadBps, refetch } = useRouterSpread();
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [amount, setAmount] = useState("");

  const router = (functionName: string, args: readonly unknown[], key: string, label: string) =>
    send(key, label, { address: CONTRACTS.swapRouter, abi: SWAP_ROUTER, functionName, args }, refetch);

  const fundOrWithdraw = (functionName: "fund" | "withdraw") => {
    if (!isAddress(token)) {
      toast("Enter a valid token address.", "error");
      return;
    }
    if (!/^\d+$/.test(amount.trim())) {
      toast("Enter the amount in the token's smallest unit (integer).", "error");
      return;
    }
    router(functionName, [token as Address, BigInt(amount.trim())], functionName, functionName === "fund" ? "Fund router" : "Withdraw");
  };

  return (
    <AdminSection
      title="SwapRouter treasury"
      desc="Owner-only liquidity controls. Amounts are in the token's smallest unit (USDG 6-dp, stock tokens 18-dp)."
      right={spreadBps !== undefined ? <span className="badge badge-neutral">spread {bpsStr(spreadBps)}</span> : undefined}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <Input label="Token address" value={token} onChange={(e) => setToken(e.target.value)} mono />
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="input num"
            style={{ flex: 1, minWidth: 0 }}
            placeholder="Amount (smallest unit)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <ActionButton
            label="Fund"
            busy={pendingKey === "fund"}
            onClick={() => fundOrWithdraw("fund")}
          />
          <ActionButton
            label="Withdraw"
            busy={pendingKey === "withdraw"}
            onClick={() => fundOrWithdraw("withdraw")}
          />
        </div>
      </div>

      <ParamField
        label="Withdraw all (comma-separated token addresses)"
        placeholder="0xabc…, 0xdef…"
        cta="Withdraw all"
        multi
        busy={pendingKey === "withdrawAll"}
        onSubmit={(raw) => {
          const tokens = raw.split(",").map((s) => s.trim());
          if (!tokens.every((t) => isAddress(t))) {
            toast("One or more addresses are invalid.", "error");
            return;
          }
          router("withdrawAll", [tokens as Address[]], "withdrawAll", "Withdraw all");
        }}
      />

      <ParamField
        label="Swap spread (bps)"
        hint="Max 500 bps (5%), default 30 (0.3%)."
        current={bpsStr(spreadBps)}
        placeholder="30"
        busy={pendingKey === "setSpread"}
        onSubmit={(v) => router("setSpread", [BigInt(v)], "setSpread", "Set spread")}
      />
    </AdminSection>
  );
}
