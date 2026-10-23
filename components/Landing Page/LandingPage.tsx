"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { catPaths } from "@/constants/animation-constants";
import { useUser } from "@clerk/nextjs";

const contentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { delay: 2.2, duration: 1.0 },
  },
};

const CatSilhouette = ({
  className,
  poseIndex = 0,
}: {
  className?: string;
  poseIndex?: number;
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={catPaths[poseIndex % catPaths.length]} />
  </svg>
);

function BokkenShape() {
  return (
    <g>
      <path
        d="M58 7 L186 8.6 Q197 10 186 11.4 L58 13 Z"
        fill="#b08d5a"
        stroke="#8d6e63"
        strokeWidth="0.8"
      />
      <path d="M62 10 L184 10" stroke="#8d6e63" strokeWidth="0.6" opacity="0.6" />
      <rect x="8" y="7.4" width="44" height="5.2" rx="2" fill="#5d4037" />
      {[14, 20, 26, 32, 38, 44].map((x) => (
        <path key={x} d={`M${x} 7.4 L${x + 3} 12.6`} stroke="#2c1810" strokeWidth="1" />
      ))}
      <ellipse cx="55" cy="10" rx="3" ry="7.2" fill="#d4af37" stroke="#8d6e63" strokeWidth="0.6" />
      <circle cx="7" cy="10" r="3.3" fill="#5d4037" />
    </g>
  );
}

function Bokken({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 20" className={className} aria-hidden="true">
      <BokkenShape />
    </svg>
  );
}

function Leaf({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} aria-hidden="true">
      <path
        d="M12 23 L12.8 13 C 5 13, 1.5 8, 2 3 C 5 4.5, 8.5 3.5, 12 2 C 15.5 3.5, 19 4.5, 22 3 C 22.5 8, 19 13, 12.8 13 Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Floater =
  | {
      type: "firefly";
      top: string;
      left: string;
      duration: number;
      delay: number;
      dx: number[];
      dy: number[];
    }
  | {
      type: "leaf";
      left: string;
      duration: number;
      delay: number;
      size: number;
      sway: number;
      color: string;
      spin: number;
    }
  | {
      type: "bokken";
      top: string;
      left: string;
      duration: number;
      delay: number;
      width: number;
      rotation: number;
    }
  | {
      type: "cat";
      top: string;
      left: string;
      duration: number;
      delay: number;
      scale: number;
      rotation: number;
      poseIndex: number;
    };

const LEAF_COLORS = ["#d4af37", "#c5851f", "#a1773a", "#8d6e63"];
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

function DojoInterior() {
  const windowsX = [210, 960];
  const floorRays = Array.from({ length: 29 }, (_, i) => i - 14);
  const seams = [572, 588, 610, 640, 682, 740, 820];

  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="di-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#15100d" />
          <stop offset="1" stopColor="#1d130f" />
        </linearGradient>
        <linearGradient id="di-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a1b13" />
          <stop offset="1" stopColor="#0f0b0a" />
        </linearGradient>
        <linearGradient id="di-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d4af37" stopOpacity="0.32" />
          <stop offset="1" stopColor="#d4af37" stopOpacity="0.14" />
        </linearGradient>
        <radialGradient id="di-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#d4af37" stopOpacity="0.14" />
          <stop offset="1" stopColor="#d4af37" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="di-lantern" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#e0a23a" stopOpacity="0.45" />
          <stop offset="1" stopColor="#e0a23a" stopOpacity="0" />
        </radialGradient>

        {                                                       }
        <g id="di-patch">
          <polygon points="250,600 470,600 620,860 330,860" fill="#d4af37" opacity="0.1" />
          <g stroke="#0f0b0a" strokeWidth="2.5" opacity="0.35">
            <line x1="265" y1="650" x2="499" y2="650" />
            <line x1="287" y1="720" x2="539" y2="720" />
            <line x1="309" y1="790" x2="580" y2="790" />
            <line x1="323" y1="600" x2="426" y2="860" />
            <line x1="395" y1="600" x2="521" y2="860" />
          </g>
        </g>
      </defs>

      {                                }
      <rect width="1440" height="560" fill="url(#di-wall)" />
      {                             }
      <g stroke="#0f0b0a" strokeWidth="1.5" opacity="0.35">
        {Array.from({ length: 15 }, (_, i) => (
          <line key={i} x1={100 + i * 94} y1="122" x2={100 + i * 94} y2="548" />
        ))}
      </g>

      {                           }
      <rect width="1440" height="34" fill="#1a110d" />
      <line x1="0" y1="34" x2="1440" y2="34" stroke="#3a2318" />
      <rect y="104" width="1440" height="18" fill="#2b1a12" stroke="#3a2318" />

      {           }
      {[56, 1346].map((x) => (
        <g key={x}>
          <rect x={x} y="0" width="38" height="560" fill="#2b1a12" stroke="#3a2318" />
          <g stroke="#3a2318" strokeWidth="1" opacity="0.5">
            <line x1={x + 9} y1="0" x2={x + 9} y2="560" />
            <line x1={x + 17} y1="0" x2={x + 15} y2="560" />
            <line x1={x + 28} y1="0" x2={x + 29} y2="560" />
          </g>
        </g>
      ))}

      {                   }
      {windowsX.map((x) => (
        <g key={x}>
          <ellipse cx={x + 135} cy="350" rx="260" ry="210" fill="url(#di-halo)" />
          <rect x={x - 8} y="242" width="286" height="262" fill="#2b1a12" stroke="#3a2318" />
          <rect x={x} y="250" width="270" height="190" fill="url(#di-paper)" />
          <rect x={x} y="440" width="270" height="56" fill="#241711" />
          <g stroke="#2b1a12" strokeWidth="3">
            {[1, 2, 3, 4, 5].map((k) => (
              <line key={`v${k}`} x1={x + k * 45} y1="250" x2={x + k * 45} y2="440" />
            ))}
            {[1, 2, 3, 4].map((k) => (
              <line key={`h${k}`} x1={x} y1={250 + k * 38} x2={x + 270} y2={250 + k * 38} />
            ))}
          </g>
        </g>
      ))}

      {                       }
      <rect x="110" y="282" width="88" height="88" fill="#1f130f" stroke="#3a2318" opacity="0.9" />
      {[291, 341].map((y) => (
        <g key={y}>
          <rect x="120" y={y + 11} width="6" height="6" fill="#3a2318" />
          <rect x="180" y={y + 11} width="6" height="6" fill="#3a2318" />
          <g transform={`translate(108 ${y}) scale(0.45)`}>
            <BokkenShape />
          </g>
        </g>
      ))}

      {                           }
      <rect x="1264" y="214" width="56" height="6" rx="3" fill="#5d4037" />
      <rect x="1268" y="220" width="48" height="200" fill="#3a2318" />
      <rect
        x="1274"
        y="232"
        width="36"
        height="150"
        fill="#18120e"
        stroke="#d4af37"
        strokeOpacity="0.25"
      />
      <g
        stroke="#d4af37"
        strokeOpacity="0.4"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="6 4"
      >
        <line x1="1286" y1="244" x2="1286" y2="350" />
        <line x1="1298" y1="244" x2="1298" y2="330" />
      </g>
      <rect x="1296" y="360" width="10" height="10" fill="#d4af37" opacity="0.7" />
      <rect x="1264" y="420" width="56" height="6" rx="3" fill="#5d4037" />

      {                      }
      {[345, 1095].map((x) => (
        <g key={x} transform={`translate(${x} 122)`}>
          <circle cx="0" cy="58" r="80" fill="url(#di-lantern)">
            <animate
              attributeName="opacity"
              values="0.75;1;0.82;1;0.75"
              dur="5s"
              repeatCount="indefinite"
            />
          </circle>
          <line x1="0" y1="0" x2="0" y2="28" stroke="#8d6e63" strokeWidth="1.5" />
          <rect x="-10" y="28" width="20" height="5" rx="1.5" fill="#2b1a12" stroke="#5c3d21" />
          <ellipse
            cx="0"
            cy="58"
            rx="19"
            ry="26"
            fill="#c88a2e"
            fillOpacity="0.75"
            stroke="#5c3d21"
          />
          <g stroke="#7a5320" strokeWidth="0.8" fill="none">
            <ellipse cx="0" cy="58" rx="19" ry="8" />
            <ellipse cx="0" cy="46" rx="16" ry="6" />
            <ellipse cx="0" cy="70" rx="16" ry="6" />
          </g>
          <rect x="-10" y="84" width="20" height="5" rx="1.5" fill="#2b1a12" stroke="#5c3d21" />
        </g>
      ))}

      {                                 }
      <rect y="548" width="1440" height="14" fill="#1a110d" stroke="#3a2318" />
      <rect y="562" width="1440" height="338" fill="url(#di-floor)" />
      <g stroke="#3a2318" strokeWidth="1.2" opacity="0.55">
        {floorRays.map((i) => (
          <line key={i} x1={720 + i * 10} y1="562" x2={720 + i * 150} y2="900" />
        ))}
      </g>
      <g stroke="#3a2318" opacity="0.65">
        {seams.map((y, i) => (
          <line key={y} x1="0" y1={y} x2="1440" y2={y} strokeWidth={0.8 + i * 0.35} />
        ))}
      </g>
      <ellipse cx="720" cy="740" rx="560" ry="120" fill="url(#di-halo)" />
      <use href="#di-patch" />
      <use href="#di-patch" transform="translate(1440 0) scale(-1 1)" />
    </svg>
  );
}

export default function LandingPage() {
  const [backgroundElements, setBackgroundElements] = useState<Floater[]>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const elements: Floater[] = [
        ...Array.from(
          { length: 16 },
          (_, i): Floater => ({
            type: "firefly",
            top: `${rand(28, 96)}%`,
            left: `${rand(2, 98)}%`,
            duration: rand(7, 13),
            delay: i * 0.6,
            dx: [0, rand(-60, 60), rand(-60, 60), 0],
            dy: [0, rand(-50, 20), rand(-50, 20), 0],
          })
        ),
        ...Array.from(
          { length: 10 },
          (_, i): Floater => ({
            type: "leaf",
            left: `${rand(0, 100)}%`,
            duration: rand(16, 28),
            delay: i * 2.2,
            size: rand(14, 26),
            sway: rand(40, 110),
            color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
            spin: rand(180, 420) * (Math.random() > 0.5 ? 1 : -1),
          })
        ),
        ...Array.from(
          { length: 4 },
          (_, i): Floater => ({
            type: "bokken",
            top: `${rand(8, 82)}%`,
            left: `${rand(0, 88)}%`,
            duration: rand(14, 22),
            delay: i * 1.8,
            width: rand(130, 210),
            rotation: rand(-50, 50),
          })
        ),
        ...Array.from(
          { length: 6 },
          (_, i): Floater => ({
            type: "cat",
            top: `${rand(0, 90)}%`,
            left: `${rand(0, 90)}%`,
            duration: rand(15, 25),
            delay: i * 1.5,
            scale: rand(0.5, 1),
            rotation: rand(-15, 15),
            poseIndex: Math.floor(Math.random() * catPaths.length),
          })
        ),
      ];
      setBackgroundElements(elements);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);
  const { user } = useUser();
  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      {                                                       }
      <div className="absolute inset-0 bg-[#120c0a]">
        <DojoInterior />
        {                                                                            }
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,11,10,0.82)_0%,rgba(15,11,10,0.5)_40%,rgba(15,11,10,0.1)_75%,transparent_100%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(10,5,3,0.75)_100%)]"></div>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,1) 0%, transparent 40%, rgba(0,0,0,1) 100%)`,
            backgroundSize: "60px 100%",
          }}
        ></div>
      </div>

      {                                           }
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {backgroundElements.map((el, i) => {
          if (el.type === "firefly") {
            return (
              <motion.div
                key={`ff-${i}`}
                className="absolute size-1.5 rounded-full bg-[#f3d676]"
                style={{
                  left: el.left,
                  top: el.top,
                  boxShadow: "0 0 10px 3px rgba(243,214,118,0.5)",
                }}
                animate={{ x: el.dx, y: el.dy, opacity: [0, 1, 0.25, 1, 0] }}
                transition={{
                  duration: el.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: el.delay,
                }}
              />
            );
          }

          if (el.type === "leaf") {
            return (
              <motion.div
                key={`leaf-${i}`}
                className="absolute top-0"
                style={{ left: el.left, color: el.color }}
                initial={{ y: "-8vh", opacity: 0 }}
                animate={{
                  y: "108vh",
                  x: [0, el.sway, -el.sway, el.sway / 2, 0],
                  rotate: el.spin,
                  opacity: [0, 0.55, 0.55, 0],
                }}
                transition={{
                  duration: el.duration,
                  repeat: Infinity,
                  ease: "linear",
                  delay: el.delay,
                }}
              >
                <Leaf size={el.size} />
              </motion.div>
            );
          }

          if (el.type === "bokken") {
            return (
              <motion.div
                key={`bk-${i}`}
                className="absolute opacity-[0.18]"
                style={{ left: el.left, top: el.top, width: el.width, rotate: el.rotation }}
                animate={{
                  y: [0, -22, 0],
                  rotate: [el.rotation, el.rotation + 6, el.rotation],
                }}
                transition={{
                  duration: el.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: el.delay,
                }}
              >
                <Bokken className="w-full" />
              </motion.div>
            );
          }

          return (
            <motion.div
              key={`cat-${i}`}
              className="absolute text-[#d4af37] opacity-10 mix-blend-screen"
              style={{ left: el.left, top: el.top, scale: el.scale, rotate: el.rotation }}
              animate={{ y: [0, -30, 0], x: [0, 20, 0], opacity: [0.05, 0.15, 0.05] }}
              transition={{
                duration: el.duration,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: el.delay,
              }}
            >
              <CatSilhouette className="w-24 h-24" poseIndex={el.poseIndex} />
            </motion.div>
          );
        })}
      </div>

      <motion.div
        className="z-10 text-center px-6 relative max-w-7xl w-full"
        initial="hidden"
        animate="visible"
        variants={contentVariants}
      >
        <div className="mb-4">
          <span className="text-[#d4af37] text-sm tracking-[0.5em] opacity-80 font-serif">
            アルゴリズムを極める
          </span>
        </div>
        <div className="relative group inline-block">
          <h1 className="font-brand text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none text-[#eaddcf] mix-blend-screen drop-shadow-[0_0_15px_rgba(234,221,207,0.1)] whitespace-nowrap">
            NEKKO
            <span className="text-[#d4af37] drop-shadow-[0_2px_10px_rgba(212,175,55,0.4)]">
              DOJO
            </span>
          </h1>
          <h1 className="font-brand absolute inset-0 text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none text-[#d4af37] opacity-0 group-hover:opacity-10 group-hover:translate-x-1 group-hover:translate-y-1 transition-all duration-300 pointer-events-none select-none whitespace-nowrap">
            NEKKO<span className="">DOJO</span>
          </h1>
        </div>
        <div className="flex items-center justify-center gap-4 my-8 opacity-50">
          <div className="h-px w-12 bg-[#d4af37]"></div>
          <span className="text-[#d4af37] font-serif text-lg">猫</span>
          <div className="h-px w-12 bg-[#d4af37]"></div>
        </div>
        <p className="text-lg md:text-2xl font-light text-[#a1887f] max-w-3xl mx-auto leading-relaxed">
          Enhance your{" "}
          <span className="text-[#eaddcf] font-medium border-b border-[#d4af37]/30">
            Data Structures & Algorithms
          </span>{" "}
          skills
          <br className="hidden md:block" />
          in the sanctuary of code.
        </p>
        <div className="mt-12 flex flex-col md:flex-row gap-8 justify-center items-center">
          {user ? (
            <>
              <Link
                href="/problems"
                className="relative px-12 py-4 bg-[#2c1810] border border-[#5d4037] text-[#d4af37] tracking-[0.2em] font-bold uppercase hover:bg-[#3e2723] hover:border-[#d4af37] hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all duration-500 clip-path-slant"
              >
                Start Practice
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="relative px-12 py-4 bg-[#2c1810] border border-[#5d4037] text-[#d4af37] tracking-[0.2em] font-bold uppercase hover:bg-[#3e2723] hover:border-[#d4af37] hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all duration-500 clip-path-slant"
              >
                Enter Dojo
              </Link>
            </>
          )}
        </div>
      </motion.div>
      <div className="absolute left-6 bottom-0 hidden lg:block pb-12 z-10">
        <div className="writing-vertical-rl text-[#3e2723] text-opacity-40 text-sm tracking-[0.8em] font-mono h-48 border-l border-[#3e2723]/20 pl-4">
          継続は力なり
        </div>
      </div>

      <div className="absolute bottom-6 w-full text-center z-10">
        <p className="text-[#3e2723] text-xs tracking-[0.4em] font-mono opacity-50">
          EST. 2025 // NEKKODOJO
        </p>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.5, duration: 1 }}
        className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer z-30"
        onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37]/60">Scroll</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="text-[#d4af37]/60 size-5" />
        </motion.div>
      </motion.div>
      <div className="absolute top-0 left-0 w-full h-48 bg-linear-to-b from-[#0f0b0a] via-[#0f0b0a]/90 to-transparent pointer-events-none z-20"></div>
      <div className="absolute bottom-0 left-0 w-full h-48 bg-linear-to-t from-[#0f0b0a] via-[#0f0b0a]/90 to-transparent pointer-events-none z-20"></div>
    </main>
  );
}
