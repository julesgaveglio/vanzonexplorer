"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export interface FormationCardData {
  _id: string;
  title: string;
  description?: string | null;
  image?: { url?: string; alt?: string } | null;
  sortOrder: number;
}

interface StackItem {
  uid: number;
  cardIndex: number;
}

const POSITION_STYLES = [
  { scale: 1, y: 12 },
  { scale: 0.95, y: -16 },
  { scale: 0.9, y: -44 },
];

function scrollToProgramme() {
  document.getElementById("programme")?.scrollIntoView({ behavior: "smooth" });
}

export default function FormationCardStack({ cards }: { cards: FormationCardData[] }) {
  const visibleCount = Math.min(cards.length, 3);
  const [stack, setStack] = useState<StackItem[]>(() =>
    Array.from({ length: visibleCount }, (_, i) => ({ uid: i, cardIndex: i }))
  );
  const [nextUid, setNextUid] = useState(cards.length);

  if (cards.length === 0) return null;

  function handleNext() {
    if (cards.length < 2) return;
    const lastIndex = stack[stack.length - 1]?.cardIndex ?? 0;
    const nextCardIndex = (lastIndex + 1) % cards.length;
    setStack((prev) => [...prev.slice(1), { uid: nextUid, cardIndex: nextCardIndex }]);
    setNextUid((prev) => prev + 1);
  }

  const displayStack = stack.slice(0, 3);

  return (
    <div className="flex w-full flex-col items-center justify-center pt-2 pb-4">
      <div className="relative h-[380px] w-full overflow-hidden sm:w-[644px]">
        <AnimatePresence initial={false}>
          {displayStack.map((item, index) => {
            const card = cards[item.cardIndex];
            if (!card) return null;
            const pos = POSITION_STYLES[index] ?? POSITION_STYLES[2];
            const zIndex = index === 0 ? 10 : 3 - index;

            return (
              <motion.div
                key={item.uid}
                initial={
                  index === displayStack.length - 1 && displayStack.length > 1
                    ? { y: -64, scale: 0.85, opacity: 0 }
                    : undefined
                }
                animate={{ y: pos.y, scale: pos.scale, opacity: 1 }}
                exit={{
                  y: 480,
                  scale: 0.98,
                  opacity: 0,
                  zIndex: 20,
                  transition: { type: "spring", duration: 0.55, bounce: 0 },
                }}
                transition={{ type: "spring", duration: 0.45, bounce: 0.08 }}
                style={{
                  zIndex,
                  left: "50%",
                  x: "-50%",
                  bottom: 0,
                }}
                className="absolute flex h-[280px] w-[324px] flex-col overflow-hidden rounded-t-2xl border border-slate-200/80 bg-white shadow-xl sm:w-[512px]"
              >
                {/* Image */}
                <div className="relative h-[185px] w-full overflow-hidden bg-amber-50/60 flex-shrink-0">
                  {card.image?.url ? (
                    <Image
                      src={card.image.url}
                      alt={card.image.alt || card.title}
                      fill
                      className="object-cover select-none"
                      sizes="(max-width: 640px) 324px, 512px"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-5xl opacity-20">🎓</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-1 items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold text-slate-900 leading-snug">
                      {card.title}
                    </span>
                    {card.description && (
                      <span className="text-sm text-slate-500 leading-snug line-clamp-1 mt-0.5">
                        {card.description}
                      </span>
                    )}
                  </div>

                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bouton Suivant */}
      {cards.length > 1 && (
        <div className="relative z-10 -mt-px flex w-full items-center justify-center border-t border-slate-100 py-4">
          <button
            onClick={handleNext}
            className="flex h-9 cursor-pointer select-none items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.97]"
          >
            Suivant
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
