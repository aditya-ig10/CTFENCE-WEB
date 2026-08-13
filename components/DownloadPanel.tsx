"use client";

import { useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { animate, stagger } from "animejs";
import CopyButton from "@/components/CopyButton";
import { motionAllowed } from "@/lib/anim";

type PanelRow = {
  key: string;
  icon: React.ReactNode;
  label: string;
  meta: string;
  href?: string;
  copy?: string;
};

export default function DownloadPanel({
  open,
  onClose,
  rows,
  activeKey,
  version,
  released,
}: {
  open: boolean;
  onClose: () => void;
  rows: PanelRow[];
  activeKey: string;
  version: string;
  released: string;
}) {
  const rowsRef = useRef<HTMLDivElement>(null);

  // radix dialog traps focus and handles Escape; it does not lock body
  // scroll in this version, so we do that here.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // stagger the rows in once the dialog opens.
  useEffect(() => {
    if (!open || !motionAllowed()) return;
    const targets = rowsRef.current?.querySelectorAll(".dl-panel-row");
    if (!targets?.length) return;
    const anim = animate(targets, {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 320,
      ease: "outExpo",
      delay: stagger(45, { start: 90 }),
    });
    return () => {
      anim.pause();
    };
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dl-panel-overlay" />
        <Dialog.Content
          className="dl-panel"
          aria-modal="true"
          aria-describedby="dl-panel-sub"
        >
          <div className="dl-panel-head">
            <span className="dl-panel-eyebrow">
              download · v{version} · {released}
            </span>
            <Dialog.Close className="dl-panel-close" aria-label="Close download panel">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M2 2l8 8M10 2l-8 8" />
              </svg>
            </Dialog.Close>
          </div>
          <Dialog.Title className="dl-panel-title">
            Download <span className="dl-accent">v{version}.</span>
          </Dialog.Title>
          <Dialog.Description className="dl-panel-sub" id="dl-panel-sub">
            Universal binaries for macOS and Windows, plus the homebrew cask —
            every build ships with a fresh sha256.
          </Dialog.Description>
          <div className="dl-panel-rows" ref={rowsRef}>
            {rows.map((row) =>
              row.href ? (
                <a
                  key={row.key}
                  className={`dl-panel-row${row.key === activeKey ? " is-active" : ""}`}
                  href={row.href}
                  rel="noreferrer"
                >
                  <span className="dl-panel-row-icon">{row.icon}</span>
                  <span className="dl-panel-row-main">
                    <span className="dl-panel-row-label">{row.label}</span>
                    <span className="dl-panel-row-meta">{row.meta}</span>
                  </span>
                  <svg
                    className="dl-panel-row-arrow"
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 7h8M8 3.5 11.5 7 8 10.5" />
                  </svg>
                </a>
              ) : (
                <div
                  key={row.key}
                  className={`dl-panel-row${row.key === activeKey ? " is-active" : ""}`}
                >
                  <span className="dl-panel-row-icon">{row.icon}</span>
                  <span className="dl-panel-row-main">
                    <span className="dl-panel-row-label">{row.label}</span>
                    <span className="dl-panel-row-meta">{row.meta}</span>
                  </span>
                  <CopyButton text={row.copy ?? ""} />
                </div>
              )
            )}
          </div>
          <div className="dl-panel-foot">
            <span>unsigned · verify before you run it</span>
            <span>esc to close</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
