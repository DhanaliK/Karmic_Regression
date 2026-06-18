import React from 'react';

const archetypes = [
  {
    name: "Fire Karma",
    desc: "Represents intense passion, raw impulse, and the urge to act. It signals a cycle of rapid change but also the risk of burnout and ego-driven conflict.",
    color: "#ff4b2b"
  },
  {
    name: "Shadow Karma",
    desc: "Reflects deep-seated fears, hidden insecurities, and the parts of yourself you avoid. It points to cycles of self-doubt and emotional suppression.",
    color: "#8e2de2"
  },
  {
    name: "Healing Karma",
    desc: "Signifies empathy, emotional recovery, and the ability to nurture. It suggests a cycle of restoration, where past wounds are being integrated and released.",
    color: "#00d2ff"
  },
  {
    name: "Power Karma",
    desc: "Symbolizes will, discipline, and authority. It indicates a period of taking control and setting boundaries, but warns against becoming too rigid or dominant.",
    color: "#f9d423"
  },
  {
    name: "Wandering Karma",
    desc: "Represents search, uncertainty, and the 'lost soul' state. It reflects a transition period where old paths are closed but the new one is not yet clear.",
    color: "#a8ff78"
  }
];

const ArchetypeLegend = () => {
  return (
    <div className="p-6 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] sticky top-8">
      <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        Archetype Guide
      </h3>
      <div className="space-y-4">
        {archetypes.map((arch) => (
          <div key={arch.name} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ backgroundColor: arch.color }} />
              <span className="text-sm font-bold text-white/90">{arch.name}</span>
            </div>
            <p className="text-[12px] text-white/50 leading-relaxed text-left">
              {arch.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArchetypeLegend;
