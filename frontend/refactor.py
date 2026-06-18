import re

with open('d:/college/Project/Karmic_regression_model/frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start of Stage 8
stage8_idx = content.find('          {/* STAGE 8:')

new_stages = '''
          {/* STAGE 8: MONTHLY EVOLUTION DASHBOARD */}
          {stage === 8 && dashboardHistory && (
            <motion.div
              key="stage8"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto px-4"
            >
              {/* Header Card */}
              <div className="glass-panel p-6 md:p-8 rounded-[2rem] border-purple-500/10 shadow-2xl mb-6 relative overflow-hidden bg-gradient-to-r from-purple-500/5 to-indigo-500/5">
                <div className="absolute right-0 top-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <span className="px-3 py-1 rounded-full bg-purple-500/10 border-purple-500/30 text-purple-300 font-bold uppercase text-[9px] tracking-widest inline-block mb-3">Evolution Timeline</span>
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                      Monthly Portal
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Tracking behavioral cycles for <span className="text-white font-semibold">{dashboardHistory.user.name}</span></p>
                  </div>
                  
                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                    <button 
                      onClick={handleStartMonthlyCycle}
                      className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold tracking-wider uppercase shadow-lg glow transition-all"
                    >
                      Start Next Month's Cycle
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Content Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Timeline History */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-xl font-light text-white mb-4">Your Past <span className="font-bold cosmic-gradient">Reflections</span></h3>
                  
                  {dashboardHistory.history.length === 0 ? (
                    <div className="glass-panel p-8 rounded-2xl text-center text-slate-400">
                      No past reflections found. Click "Start Next Month's Cycle" to begin your journey.
                    </div>
                  ) : (
                    dashboardHistory.history.map((entry, idx) => (
                      <div key={idx} className="glass-panel p-6 rounded-2xl shadow-lg border-white/5 bg-slate-950/40 mb-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xs font-bold uppercase text-purple-400 tracking-wider">
                            {new Date(entry.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="prose prose-invert max-w-none text-sm">
                          {renderFormattedReflection(entry.generated_reflection)}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Side Control Column */}
                <div className="space-y-6">
                  {/* Personal Vibration */}
                  <div className="glass-panel p-6 rounded-[2rem] border-white/5 bg-white/5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-purple-400" /> User Profile
                    </h3>
                    <p className="text-[13px] text-slate-300 leading-relaxed">
                      Age: {dashboardHistory.user.age} <br/>
                      Gender Blueprint: {dashboardHistory.user.gender}
                    </p>
                  </div>

                  {/* Return Button */}
                  <button 
                    onClick={() => setStage(0)}
                    className="w-full py-3.5 rounded-xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/60 text-slate-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
                  >
                    Logout & Return to Main Profile
                  </button>
                </div>

              </div>
            </motion.div>
          )}

          {/* STAGE 9: DYNAMIC ADAPTIVE SURVEY */}
          {stage === 9 && (
            <motion.div
              key="stage9"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-2xl mx-auto px-4"
            >
              <div className="glass-panel p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-black/90">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                
                <h2 className="text-3xl md:text-4xl font-light text-center mb-2 leading-tight">
                  <span className="cosmic-gradient font-bold">Adaptive</span> Reflection
                </h2>
                <p className="text-center text-slate-400 text-sm mb-12 uppercase tracking-widest font-medium">
                  We have tailored these questions based on your previous responses.
                </p>

                <form onSubmit={handleDynamicSubmit} className="space-y-10 relative z-10">
                  {dynamicQuestions.map((q, idx) => (
                    <div key={q.id} className="group">
                      <label className="block text-slate-300 text-lg mb-4 font-light leading-relaxed group-hover:text-purple-300 transition-colors">
                        <span className="text-purple-500 font-bold mr-2 text-sm">{(idx + 1).toString().padStart(2, '0')}</span> 
                        {q.question}
                      </label>
                      {q.type === 'dropdown' ? (
                        <select 
                          required
                          className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-5 py-4 text-white text-sm focus:outline-none focus:border-purple-500 hover:border-slate-700 transition-all appearance-none cursor-pointer"
                          value={dynamicAnswers[q.id] || ''}
                          onChange={(e) => setDynamicAnswers({...dynamicAnswers, [q.id]: e.target.value})}
                        >
                          <option value="" disabled className="text-slate-500">Select your alignment...</option>
                          {q.options && q.options.map((opt, o_idx) => (
                            <option key={o_idx} value={opt} className="bg-slate-900 text-white">{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <textarea 
                          required
                          rows="3"
                          className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-5 py-4 text-white text-sm focus:outline-none focus:border-purple-500 hover:border-slate-700 transition-all resize-none"
                          value={dynamicAnswers[q.id] || ''}
                          onChange={(e) => setDynamicAnswers({...dynamicAnswers, [q.id]: e.target.value})}
                          placeholder="Reflect openly here..."
                        />
                      )}
                    </div>
                  ))}

                  <div className="pt-8 border-t border-slate-800/50">
                    <button type="submit" className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm flex justify-center items-center gap-3 glow transition-all shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)]">
                      Synthesize Monthly Evolution <Sparkles className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
'''

if stage8_idx != -1:
    new_content = content[:stage8_idx] + new_stages
    with open('d:/college/Project/Karmic_regression_model/frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully replaced Stage 8 and appended Stage 9.")
else:
    print("Could not find Stage 8 marker.")
