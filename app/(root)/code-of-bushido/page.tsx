"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert, Users, ScrollText, Sword, Lock, ArrowLeft, Flame } from "lucide-react";

export default function BushidoRulesPage() {
  const virtues = [
    {
      kanji: "礼",
      romaji: "REI",
      meaning: "Respect",
      meaningJa: "敬意",
      icon: <Users size={24} className="text-[#0f0b0a]" />,
      rules: [
        { text: "Bow to your peers. Treat every Ronin with dignity.", translation: "仲間に敬意を払い、すべての浪人を大切にする。" },
        { text: "Harassment creates disharmony and is strictly forbidden.", translation: "嫌がらせは和を乱すため、固く禁ずる。" },
        { text: "Critique the technique (code), never the warrior.", translation: "批評するのは技（コード）であり、使い手ではない。" },
        { text: "Patience is a weapon; use it with beginners.", translation: "忍耐は力なり。初心者には寛容であれ。" },
      ],
    },
    {
      kanji: "誠",
      romaji: "MAKOTO",
      meaning: "Honesty",
      meaningJa: "誠実",
      icon: <ScrollText size={24} className="text-[#0f0b0a]" />,
      rules: [
        { text: "Do not steal honor. Plagiarism is a stain on your name.", translation: "名誉を盗むな。盗用は己の名を汚す。" },
        { text: "Seek knowledge, not just answers. Do not beg for solutions.", translation: "答えだけでなく知恵を求めよ。解答を乞うな。" },
        { text: "Show your path (code) when asking for guidance.", translation: "導きを求めるときは、自らの道（コード）を示せ。" },
        { text: "Deception in code or intent is unworthy of this Dojo.", translation: "コードにも心にも偽りを持ち込むべからず。" },
      ],
    },
    {
      kanji: "名誉",
      romaji: "MEIYO",
      meaning: "Honor",
      meaningJa: "名誉",
      icon: <Sword size={24} className="text-[#0f0b0a]" />,
      rules: [
        { text: "Search first. To repeat a question is to waste the Clan's time.", translation: "まず調べよ。同じ問いを重ね、仲間の時を奪うな。" },
        { text: "Speak clearly. Use descriptive titles and Markdown.", translation: "明快に伝えよ。内容がわかる題名と Markdown を使う。" },
        { text: "No spam or merchants. We are here to train, not to sell.", translation: "宣伝や商売は禁ずる。ここは鍛錬の場であり、売買の場ではない。" },
        { text: "Uphold the reputation of the NekoDojo in all posts.", translation: "すべての投稿で、猫道場の名誉を守れ。" },
      ],
    },
    {
      kanji: "忠義",
      romaji: "CHUUGI",
      meaning: "Loyalty",
      meaningJa: "忠義",
      icon: <Lock size={24} className="text-[#0f0b0a]" />,
      rules: [
        { text: "Protect the Clan. Never leak keys, secrets, or data.", translation: "仲間を守れ。鍵・秘密・個人情報を決して漏らすな。" },
        { text: "Guard your identity and the privacy of others.", translation: "己の身元と他者のプライバシーを守れ。" },
        { text: "Report cracks in the armor (bugs) to the admins.", translation: "鎧のほころび（バグ）を見つけたら管理者に報告せよ。" },
        { text: "Malice and malware result in immediate exile.", translation: "悪意ある行為やマルウェアは、即刻の追放を招く。" },
      ],
    },
  ];
  const [revealedVirtue, setRevealedVirtue] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0807] text-[#eaddcf] relative overflow-hidden font-sans selection:bg-[#d4af37]/30">
      {                                    }
      <div className="fixed inset-0 pointer-events-none">
        {                           }
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')]" />

        {                          }
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#5d1a1a] rounded-full blur-[100px] opacity-40 mix-blend-screen" />

        {                        }
        <div className="absolute bottom-0 left-0 w-full h-[500px] bg-linear-to-t from-black to-transparent z-10" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        {                                }
        <div className="text-center mb-24 relative">
          {                                  }
          <div className="absolute top-0 left-10 hidden md:block text-[#d4af37]/10 text-9xl font-black opacity-50 select-none writing-vertical-rl">
            武士道
          </div>
          <div className="absolute top-0 right-10 hidden md:block text-[#d4af37]/10 text-9xl font-black opacity-50 select-none writing-vertical-rl">
            猫道場
          </div>

          <div className="inline-flex items-center justify-center w-24 h-24 mb-8 relative group cursor-default">
            <div className="absolute inset-0 border-[3px] border-[#d4af37] rotate-45 group-hover:rotate-90 transition-transform duration-700 ease-in-out" />
            <div className="absolute inset-0 border border-[#d4af37]/30 rotate-12" />
            <ShieldAlert size={40} className="text-[#d4af37] relative z-10" />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 text-[#eaddcf]">
            THE <span className="text-[#d4af37]">DOJO KUN</span>
          </h1>
          <p className="text-[#a1887f] text-lg uppercase tracking-[0.3em] font-medium">
            Code of Bushido: The Code of the Digital Warrior
          </p>
        </div>

        {                              }
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto mb-24">
          {virtues.map((virtue, idx) => (
            <div
              key={idx}
              role="button"
              tabIndex={0}
              aria-pressed={revealedVirtue === idx}
              onClick={() => setRevealedVirtue(revealedVirtue === idx ? null : idx)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setRevealedVirtue(revealedVirtue === idx ? null : idx);
                }
              }}
              className={`group relative cursor-pointer bg-[#14100e] border border-[#3e2723] p-1 transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] ${revealedVirtue === idx ? "is-revealed" : ""}`}
            >
              {                                      }
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#d4af37] opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#d4af37] opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#d4af37] opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#d4af37] opacity-50 group-hover:opacity-100 transition-opacity" />

              <div className="relative h-full bg-[#0a0807] p-8 overflow-hidden">
                {                                      }
                <span className="absolute -right-4 -bottom-8 text-9xl text-[#3e2723]/20 font-black z-0 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                  {virtue.kanji}
                </span>

                <div className="relative z-10">
                  {            }
                  <div className="flex items-center gap-6 mb-8 border-b border-[#3e2723] pb-6">
                    <div className="w-14 h-14 bg-[#d4af37] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.2)] text-[#0f0b0a]">
                      {virtue.icon}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-[#eaddcf] uppercase tracking-wide">
                        {virtue.romaji}
                      </h2>
                      <p className="text-[#d4af37] font-medium tracking-widest text-sm">
                        {virtue.meaning} <span className="ml-1 text-[#e2c45a]">{virtue.meaningJa}</span>
                      </p>
                    </div>
                  </div>

                  {                }
                  <ul className="space-y-4">
                    {virtue.rules.map((rule, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-4 text-[#a1887f] transition-colors group-hover:text-[#cfb096]"
                      >
                        <span className="mt-1.5 w-1.5 h-1.5 bg-[#d4af37] rotate-45 shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span
                            className="text-sm leading-relaxed line-through decoration-1 transition-[text-decoration-color] duration-500 ease-out md:text-base"
                            style={{
                              textDecorationColor:
                                revealedVirtue === idx ? "#d4af37" : "transparent",
                              transitionDelay: `${revealedVirtue === idx ? i * 90 : 0}ms`,
                            }}
                          >
                            {rule.text}
                          </span>
                          <span
                            lang="ja"
                            className="block overflow-hidden text-sm leading-relaxed text-[#d4af37] transition-all duration-500 ease-out"
                            style={{
                              maxHeight: revealedVirtue === idx ? "6rem" : "0",
                              opacity: revealedVirtue === idx ? 1 : 0,
                              transform: revealedVirtue === idx ? "translateY(0)" : "translateY(-0.35rem)",
                              transitionDelay: `${revealedVirtue === idx ? i * 90 + 180 : 0}ms`,
                            }}
                          >
                            {rule.translation}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {                                     }
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-[#5d1a1a]/10 to-transparent blur-xl" />

          <div className="border-t border-b border-[#3e2723] py-12 relative bg-[#0a0807]/80 backdrop-blur-sm">
            <div className="flex justify-center mb-6 text-[#9a3434]">
              <Flame size={32} />
            </div>

            <h3 className="text-2xl font-bold text-[#eaddcf] mb-3 uppercase tracking-widest">
              Breach of Protocol
            </h3>
            <p className="text-[#a1887f] mb-8 max-w-xl mx-auto">
              Those who dishonor the code face the{" "}
              <span className="text-[#9a3434] font-bold">Exile of the Ban</span>. Tread carefully,
              Ronin.
            </p>

            <Link
              href="/"
              className="group inline-flex items-center gap-3 px-8 py-3 bg-transparent border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0f0b0a] font-bold uppercase tracking-widest text-sm transition-all duration-300"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Return to Dojo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
