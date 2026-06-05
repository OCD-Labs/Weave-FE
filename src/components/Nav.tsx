"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "./BrandMark";
import { WalletIcon, ChevronIcon, MenuIcon } from "./icons";
import { useWallet } from "./wallet/WalletProvider";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Markets", href: "/markets" },
  { label: "Create", href: "/create" },
  // { label: "Portfolio", href: "/portfolio" },
  // { label: "Creator", href: "/creator" },
  { label: "Catalogue", href: "/catalogue" },
] as const;

function isActive(pathname: string, href: string): boolean {
  // Markets stays active on the index detail pages too.
  if (href === "/markets") return pathname.startsWith("/markets") || pathname.startsWith("/baskets");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="nav">
      <div className="wrap-wide nav-inner">
        <Link href="/" className="brand sm:mr-24">
          <BrandMark size={40} />
          <span className="brand-name">Weave</span>
        </Link>

        <nav className="nav-links sm:space-x-5" style={{ display: "none" }} data-desktop-nav>
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link ${isActive(pathname, l.href) ? "active" : ""}`}
              aria-current={isActive(pathname, l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="nav-spacer" />

        <WalletButton />

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          style={{ width: 40, padding: 0 }}
          data-mobile-toggle
        >
          <MenuIcon />
        </button>
      </div>

      {menuOpen && (
        <div className="wrap-wide" style={{ paddingBottom: 12 }} data-mobile-menu>
          <div className="card" style={{ padding: 6, boxShadow: "var(--shadow-md)" }}>
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="menu-item"
                onClick={() => setMenuOpen(false)}
                style={
                  isActive(pathname, l.href)
                    ? { color: "var(--accent-strong)", background: "var(--accent-tint)" }
                    : undefined
                }
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Show desktop links / hide hamburger at >=1024px. */}
      <style>{`
        @media (min-width: 1024px) {
          [data-desktop-nav] { display: flex !important; }
          [data-mobile-toggle] { display: none !important; }
          [data-mobile-menu] { display: none !important; }
        }
      `}</style>
    </header>
  );
}

function WalletButton() {
  const { connected, address, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  if (!connected) {
    return (
      <button type="button" className="btn btn-primary btn-sm" onClick={connect}>
        <WalletIcon /> Connect Wallet
      </button>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen((o) => !o)}>
        <span
          aria-hidden="true"
          style={{
            width: 18,
            height: 18,
            borderRadius: 5,
            background: "linear-gradient(135deg, var(--accent), hsl(var(--accent-h) 80% 70%))",
          }}
        />
        <span className="mono" style={{ fontSize: 13 }}>
          {address}
        </span>
        <ChevronIcon />
      </button>
      {open && (
        <div
          className="card"
          style={{
            position: "absolute",
            right: 0,
            top: 44,
            width: 220,
            padding: 6,
            boxShadow: "var(--shadow-lg)",
            zIndex: 50,
          }}
        >
          <div style={{ padding: "10px 12px 8px" }}>
            <div className="eyebrow" style={{ fontSize: 10.5 }}>
              Connected
            </div>
            <div className="mono" style={{ fontSize: 13, marginTop: 3 }}>
              {address}
            </div>
          </div>
          <hr className="divider" />
          <Link href="/portfolio" className="menu-item" onClick={() => setOpen(false)}>
            My Portfolio
          </Link>
          <Link href="/creator" className="menu-item" onClick={() => setOpen(false)}>
            Creator Dashboard
          </Link>
          <hr className="divider" />
          <button
            type="button"
            className="menu-item"
            style={{ color: "var(--down)", width: "100%", textAlign: "left" }}
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
