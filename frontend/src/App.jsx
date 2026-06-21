import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Sparkles, ArrowRight, Star, ExternalLink, Activity, 
  Mail, Calendar, Compass, ShieldCheck, ArrowLeft, RefreshCw
} from 'lucide-react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);
import CosmicBackground from './components/CosmicBackground';
import LandingPage from './components/LandingPage';
import ArchetypeLegend from './components/ArchetypeLegend';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [stage, setStage] = useState(0); 
  // 0: Start, 1: Loading, 2: Stage 1 Result, 3: Stage 2 Form, 4: Loading 2, 5: Stage 2 Result
  // 6: Weekly Login/Subscribe, 7: Weekly Loading, 8: Weekly Dashboard
  
  // User Data
  const [userData, setUserData] = useState({ name: '', dob: '', age: '', gender: '' });
  const [stage1Result, setStage1Result] = useState(null);
  const [stage2Result, setStage2Result] = useState(null);
  
  // Monthly Portal Data
  const [portalEmail, setPortalEmail] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [portalUsername, setPortalUsername] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [dashboardHistory, setDashboardHistory] = useState(null);
  const [portalActionText, setPortalActionText] = useState('Sign In'); // 'Register' or 'Sign In'
  const [authToken, setAuthToken] = useState(localStorage.getItem('token') || null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminData, setAdminData] = useState(null);
  
  // Forgot Password
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  // Dynamic Monthly State
  const [dynamicQuestions, setDynamicQuestions] = useState([]);
  const [dynamicAnswers, setDynamicAnswers] = useState({});

  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '', q8: '', q9: '' });
  const [rating, setRating] = useState(0);

  // Sync state to browser history
  React.useEffect(() => {
    window.history.pushState({ stage, showLanding }, `Stage ${stage}`, `/#stage-${stage}`);
  }, [stage, showLanding]);

  React.useEffect(() => {
    const handlePopState = (e) => {
      if (e.state) {
        if (e.state.stage !== undefined) setStage(e.state.stage);
        if (e.state.showLanding !== undefined) setShowLanding(e.state.showLanding);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleStage1Submit = async (e) => {
    e.preventDefault();
    setStage(1);
    
    // Simulate analyzing animation for 3 seconds, then drop into Stage 3 (Questions)
    setTimeout(() => {
      setStage(3);
    }, 3000);
  };

  const handleStage2Submit = async (e) => {
    e.preventDefault();
    setStage(4);
    try {
      const res = await axios.post(`${API_BASE_URL}/predict/stage2`, {
        name: userData.name,
        dob: userData.dob,
        age: parseInt(userData.age, 10),
        gender: userData.gender,
        q1: answers.q1,
        q2: answers.q2,
        q3: answers.q3,
        q4: answers.q4,
        q5: answers.q5,
        q6: answers.q6,
        q7: answers.q7,
        q8: answers.q8,
        q9: answers.q9
      });
      if (res.data.status === 'pending') {
        alert(res.data.message);
        setStage2Result(res.data);
        // Force them to register
        setPortalActionText('Register');
        setStage(6);
      } else {
        setStage2Result(res.data);
        setStage(5);
      }
    } catch (err) {
      console.error(err);
      alert('Error generating deeper reflection.');
      setStage(3);
    }
  };

  const handlePortalLogin = async (e) => {
    e.preventDefault();
    try {
      if (portalActionText === 'Register') {
        setStage(7); // loading
        await axios.post(`${API_BASE_URL}/auth/register`, {
          email: portalEmail,
          username: portalUsername || userData.name || "Seeker",
          password: portalPassword,
          dob: userData.dob,
          age: parseInt(userData.age, 10) || 25,
          gender: userData.gender || "Unknown",
          answers: answers
        });
        setStage(6);
        setShowOtp(true);
      } else {
        setStage(7); // loading
        const res = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: portalEmail,
          password: portalPassword
        });
        const token = res.data.access_token;
        setAuthToken(token);
        localStorage.setItem('token', token);
        if (res.data.user.role === 'admin') {
          setIsAdmin(true);
          const adminRes = await axios.get(`${API_BASE_URL}/admin/stats?email=${portalEmail}`);
          setAdminData(adminRes.data);
          setStage(10);
        } else {
          // Immediately trigger 30-day auto-check instead of just loading dashboard
          const autoCheckRes = await axios.post(`${API_BASE_URL}/predict/monthly/questions`, { email: portalEmail });
          
          if (autoCheckRes.data.is_adaptive && autoCheckRes.data.questions.length > 0) {
            setDynamicQuestions(autoCheckRes.data.questions);
            setDynamicAnswers({});
            setStage(9); // Send directly to new survey
          } else {
            // Send to dashboard
            const histRes = await axios.get(`${API_BASE_URL}/dashboard/history/${portalEmail}`);
            setDashboardHistory(histRes.data);
            setStage(8);
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Authentication error.');
      setStage(6);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setStage(7);
    try {
      await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        email: portalEmail,
        otp_code: otpCode
      });
      alert("Verification successful. Please sign in.");
      setShowOtp(false);
      setPortalActionText('Sign In');
      setStage(6);
    } catch (err) {
      alert(err.response?.data?.detail || 'Invalid OTP.');
      setStage(6);
    }
  };

  const handleResendOtp = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/resend-otp`, { email: portalEmail });
      alert("A new verification code has been sent.");
    } catch (err) {
      alert(err.response?.data?.detail || "Could not resend OTP.");
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setStage(7);
    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email: portalEmail });
      setResetCodeSent(true);
      setStage(6);
    } catch (err) {
      alert("Error sending reset code.");
      setStage(6);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setStage(7);
    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        email: portalEmail,
        otp_code: otpCode,
        new_password: newPassword
      });
      alert("Password reset successfully. Please sign in.");
      setIsForgotPassword(false);
      setResetCodeSent(false);
      setPortalActionText('Sign In');
      setStage(6);
    } catch (err) {
      alert(err.response?.data?.detail || "Could not reset password.");
      setStage(6);
    }
  };

  const loadAdminDashboard = async () => {
    setStage(7);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/stats?email=${portalEmail}`);
      setAdminData(res.data);
      setStage(10);
    } catch (err) {
      alert("Failed to load admin dashboard.");
      setStage(6);
    }
  };



  const handleDynamicSubmit = async (e) => {
    e.preventDefault();
    setStage(4);
    try {
      const res = await axios.post(`${API_BASE_URL}/predict/monthly/reflection`, {
        email: portalEmail,
        name: dashboardHistory.user.name,
        dob: dashboardHistory.user.dob,
        age: dashboardHistory.user.age,
        gender: dashboardHistory.user.gender,
        answers: dynamicAnswers
      });
      setStage2Result(res.data);
      setStage(5);
    } catch(err) {
      console.error(err);
      alert('Error generating reflection.');
      setStage(9);
    }
  };

  const submitFeedback = async (star) => {
    setRating(star);
    try {
      const currentResult = stage === 2 ? stage1Result : stage2Result;
      await axios.post(`${API_BASE_URL}/feedback`, {
        stage: stage === 2 ? 1 : 2,
        archetype: currentResult.archetype || "N/A",
        probabilities: currentResult.probabilities || {},
        symbolic_priors: currentResult.priors || {}, // Using priors from currentResult if available
        llm_output: currentResult.reflection || currentResult.llm_output,
        q_responses: stage === 5 ? answers : null,
        user_rating: star
      });
      alert('Thank you for contributing to our behavioral research!');
    } catch (err) {
      console.error(err);
    }
  };

  const renderFormattedReflection = (text) => {
    if (!text) return null;
    const lines = text.split(/\\n|\n/);
    return lines.map((line, i) => {
      if (!line.trim()) return <div key={i} className="h-2"></div>;
      
      // Handle weekly headers specially
      if (line.startsWith('###')) {
        return (
          <h4 key={i} className="text-xl font-bold mt-8 mb-4 text-purple-400 border-b border-purple-500/10 pb-2">
            {line.replace('###', '').trim()}
          </h4>
        );
      }

      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className="mb-4 text-slate-300 leading-relaxed text-base md:text-lg text-justify">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  const triggerEmailSimulation = () => {
    setEmailSimulationSent(true);
    setTimeout(() => {
      alert(`Success: Weekly Karma newsletter dispatched to ${weeklyEmail}! (Email delivery simulated for review)`);
    }, 150);
  };

  if (showLanding) {
    return <LandingPage onStart={() => setShowLanding(false)} onSignIn={() => { setShowLanding(false); setStage(6); setPortalActionText('Sign In'); }} />;
  }

  return (
    <div className="relative min-h-screen w-full font-['Outfit',sans-serif] selection:bg-purple-500/30 overflow-x-hidden pb-12">
      <CosmicBackground />
      
      <div className="relative z-10 w-full px-4 pt-6">
        <AnimatePresence mode="wait">
          
          {/* STAGE 0: Initial Form */}
          {stage === 0 && (
            <motion.div 
              key="stage0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto glass-panel p-6 md:p-10 rounded-3xl"
            >
              <div className="text-center mb-8">
                <Activity className="w-12 h-12 mx-auto text-purple-400 mb-4 animate-pulse" />
                <h1 className="text-4xl font-light mb-2"><span className="cosmic-gradient font-bold">Karmic</span> Reflection</h1>
                <p className="text-slate-400 text-lg">Analyze your behavioral patterns through AI-driven narrative synthesis.</p>
              </div>

              <form onSubmit={handleStage1Submit} className="space-y-6">
                <div>
                  <label className="block text-slate-300 mb-2 font-medium">First Name (Optional)</label>
                  <input type="text" 
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})}
                    placeholder="How should we call you?"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 mb-2 font-medium">Date of Birth</label>
                    <input type="date" required
                      style={{ colorScheme: 'dark' }}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                      value={userData.dob} onChange={e => {
                        const dobVal = e.target.value;
                        let calculatedAge = userData.age;
                        if (dobVal) {
                          const dobDate = new Date(dobVal);
                          const today = new Date();
                          calculatedAge = today.getFullYear() - dobDate.getFullYear();
                          const m = today.getMonth() - dobDate.getMonth();
                          if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
                            calculatedAge--;
                          }
                        }
                        setUserData({...userData, dob: dobVal, age: calculatedAge});
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-2 font-medium">Gender</label>
                    <select required
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                      value={userData.gender} onChange={e => setUserData({...userData, gender: e.target.value})}
                    >
                      <option value="" disabled>Select Gender...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Other">Other / Prefer not to say</option>
                    </select>
                  </div>
                </div>
                
                <button type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-lg flex justify-center items-center gap-2 glow transition-all">
                  Analyze My Patterns <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              <div className="mt-8 border-t border-slate-800 pt-6 text-center">
                <p className="text-slate-400 text-sm mb-4">Ready to track your behavioral cycles over time?</p>
                <button 
                  onClick={() => {
                    setPortalActionText('Sign In');
                    setStage(6);
                  }}
                  className="px-6 py-2.5 rounded-xl border border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5 text-purple-300 text-sm hover:text-white transition-all"
                >
                  Access Monthly Evolution Portal
                </button>
              </div>
            </motion.div>
          )}

          {/* LOADING STAGES & INTERSTITIAL */}
          {(stage === 1 || stage === 4 || stage === 7) && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 max-w-lg mx-auto"
            >
              <div className="w-24 h-24 mx-auto border-t-2 border-l-2 border-purple-500 rounded-full animate-spin mb-8"></div>
              <h2 className="text-2xl font-light cosmic-gradient leading-relaxed">
                {stage === 1 ? "Synchronizing with your celestial baseline..." : 
                 stage === 7 ? "Synthesizing dynamic follow-up questions..." : "Synthesizing behavioral signals..."}
              </h2>
              <p className="text-slate-400 mt-4 text-sm font-medium tracking-wide">
                {stage === 1 ? "We are mapping your foundational energies. To unlock your full behavioral matrix, we need a deeper psychological reflection." : 
                 stage === 7 ? "Aligning Life Path numerology and current transits" : "Mapping emotional priors and psychological cycles"}
              </p>
            </motion.div>
          )}

          {/* STAGE 1 RESULT */}
          {stage === 2 && (
            <motion.div
              key="stage2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto glass-panel p-8 md:p-12 rounded-3xl"
            >
              <div className="text-center mb-8">
                <h3 className="text-purple-400 font-medium tracking-widest uppercase text-xs mb-2">Initial Symbolic Profile</h3>
                <h2 className="text-3xl font-bold cosmic-gradient mb-6">Reflection Layer I</h2>
              </div>
              
              <div className="prose prose-invert max-w-none">
                {renderFormattedReflection(stage1Result.reflection)}
              </div>

              <div className="mt-12 border-t border-slate-700/50 pt-8">
                <h4 className="text-center text-slate-300 mb-4 font-medium italic text-sm">How relatable was this initial reflection?</h4>
                <div className="flex justify-center gap-2 mb-8">
                  {[1,2,3,4,5].map(star => (
                    <button key={star} onClick={() => submitFeedback(star)} className={`p-2 transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-slate-600'}`}>
                      <Star className="w-8 h-8 fill-current" />
                    </button>
                  ))}
                </div>

                <div className="bg-slate-900/50 p-6 rounded-2xl border border-purple-500/20 text-center space-y-4">
                  <h3 className="text-xl font-semibold">Unlock Overlapping Patterns</h3>
                  <p className="text-slate-400 text-sm">Contribute deeper emotional data to calculate your active archetype probabilities and unlock scientific clustering metrics.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button onClick={() => setStage(3)} className="py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-all shadow-lg shadow-purple-500/20">
                      Answer 8 Questions
                    </button>
                    <button 
                      onClick={() => {
                        setPortalActionText('Subscribe');
                        setStage(6);
                      }} 
                      className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-medium border border-purple-500/20 transition-all"
                    >
                      Track Your Monthly Cycles
                    </button>
                  </div>
                  <button onClick={() => setStage(0)} className="text-xs text-slate-500 hover:text-slate-300 block mx-auto pt-2">
                    Return to Profile
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STAGE 2 FORM (Reflection Boost) */}
          {stage === 3 && (
            <motion.div
              key="stage3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-3xl mx-auto glass-panel p-8 rounded-3xl"
            >
              <h2 className="text-3xl font-light mb-2 text-center cosmic-gradient">Behavioral Refinement</h2>
              <p className="text-slate-400 text-center mb-8">Mapping deep emotional overlap</p>

              <form onSubmit={handleStage2Submit} className="space-y-8">
                {/* Q1 */}
                <div>
                  <label className="block text-slate-200 mb-3 font-medium">1. Under emotional stress, you usually:</label>
                  <select required value={answers.q1} onChange={e => setAnswers({...answers, q1: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                    <option value="" disabled>Select an option...</option>
                    <option value="react immediately">react immediately</option>
                    <option value="withdraw silently">withdraw silently</option>
                    <option value="overthink deeply">overthink deeply</option>
                    <option value="seek reassurance">seek reassurance</option>
                  </select>
                </div>

                {/* Q2 */}
                <div>
                  <label className="block text-slate-200 mb-3 font-medium">2. Which pattern feels most recurring in your life?</label>
                  <select required value={answers.q2} onChange={e => setAnswers({...answers, q2: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                    <option value="" disabled>Select an option...</option>
                    <option value="emotional misunderstandings">emotional misunderstandings</option>
                    <option value="delayed opportunities">delayed opportunities</option>
                    <option value="unstable motivation">unstable motivation</option>
                    <option value="trust-related issues">trust-related issues</option>
                  </select>
                </div>

                {/* Q3 */}
                <div>
                  <label className="block text-slate-200 mb-3 font-medium">3. When making important decisions, you mostly:</label>
                  <select required value={answers.q3} onChange={e => setAnswers({...answers, q3: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                    <option value="" disabled>Select an option...</option>
                    <option value="act emotionally">act emotionally</option>
                    <option value="delay decisions">delay decisions</option>
                    <option value="analyze carefully">analyze carefully</option>
                    <option value="depend on others">depend on others</option>
                  </select>
                </div>

                {/* Q4 */}
                <div>
                  <label className="block text-slate-200 mb-3 font-medium">4. Which energy feels strongest recently?</label>
                  <select required value={answers.q4} onChange={e => setAnswers({...answers, q4: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                    <option value="" disabled>Select an option...</option>
                    <option value="emotional exhaustion">emotional exhaustion</option>
                    <option value="inner ambition">inner ambition</option>
                    <option value="confusion">confusion</option>
                    <option value="emotional growth">emotional growth</option>
                  </select>
                </div>

                {/* Q5 */}
                <div>
                  <label className="block text-slate-200 mb-3 font-medium">5. What affects you the most emotionally?</label>
                  <select required value={answers.q5} onChange={e => setAnswers({...answers, q5: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                    <option value="" disabled>Select an option...</option>
                    <option value="rejection">rejection</option>
                    <option value="uncertainty">uncertainty</option>
                    <option value="conflict">conflict</option>
                    <option value="lack of recognition">lack of recognition</option>
                  </select>
                </div>

                {/* Q6 */}
                <div>
                  <label className="block text-slate-200 mb-3 font-medium">6. How often do you regret important decisions?</label>
                  <select required value={answers.q6} onChange={e => setAnswers({...answers, q6: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                    <option value="" disabled>Select an option...</option>
                    <option value="Sometimes">Sometimes</option>
                    <option value="Rarely">Rarely</option>
                    <option value="Often">Often</option>
                    <option value="Very frequently">Very frequently</option>
                  </select>
                </div>

                {/* Q7 */}
                <div>
                  <label className="block text-slate-200 mb-3 font-medium">7. Have you noticed repeating negative situations in your life?</label>
                  <select required value={answers.q7} onChange={e => setAnswers({...answers, q7: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                    <option value="" disabled>Select an option...</option>
                    <option value="Yes">Yes</option>
                    <option value="Unsure">Unsure</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {/* Q8 */}
                <div>
                  <label className="block text-slate-200 mb-3 font-medium">8. After a major negative outcome, how do you usually respond?</label>
                  <select required value={answers.q8} onChange={e => setAnswers({...answers, q8: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                    <option value="" disabled>Select an option...</option>
                    <option value="Seek advice">Seek advice</option>
                    <option value="Reflect and improve">Reflect and improve</option>
                    <option value="Ignore it">Ignore it</option>
                    <option value="Repeat similar behavior">Repeat similar behavior</option>
                  </select>
                </div>

                {/* Q9 */}
                <div>
                  <label className="block text-slate-200 mb-3 font-medium">9. What strategy do you use to avoid repeating mistakes?</label>
                  <select required value={answers.q9} onChange={e => setAnswers({...answers, q9: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                    <option value="" disabled>Select an option...</option>
                    <option value="Taking advice">Taking advice</option>
                    <option value="I do not use any strategy">I do not use any strategy</option>
                    <option value="Reflection / journaling">Reflection / journaling</option>
                    <option value="Delaying decisions">Delaying decisions</option>
                  </select>
                </div>

                <button type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-lg flex justify-center items-center gap-2 glow transition-all">
                  Generate Deep Reflection <Sparkles className="w-5 h-5" />
                </button>
                
                <button type="button" onClick={() => setStage(0)} className="w-full py-3 text-slate-400 hover:text-white transition-colors">
                  Cancel & Restart
                </button>
              </form>
            </motion.div>
          )}

          {/* STAGE 2 RESULT */}
          {stage === 5 && (
            <motion.div
              key="stage5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full px-4"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-7xl mx-auto">
                
                {/* LEFT COLUMN: Deep Reflection (8/12) */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="glass-panel p-8 rounded-[2.5rem] shadow-2xl border-white/5">
                    {/* Compact Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-8 border-b border-white/5 gap-4">
                      <div>
                        <p className="text-purple-400 font-black tracking-[0.3em] uppercase text-[9px] mb-2">Synthesis Result</p>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Personal Behavioral Report</h2>
                        {stage2Result.is_hybrid && (
                           <span className="inline-block mt-3 px-3 py-1 bg-gradient-to-r from-orange-500/20 to-purple-500/20 border border-orange-500/30 text-orange-300 font-bold uppercase text-[10px] tracking-widest rounded-full">
                             Hybrid Persona Detected
                           </span>
                        )}
                      </div>
                      <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-right">
                        <p className="text-[10px] text-white/30 uppercase font-bold mb-1">Core energy</p>
                        <p className="text-sm font-bold bg-gradient-to-r from-purple-300 to-indigo-400 bg-clip-text text-transparent">
                          {stage2Result.archetype}
                        </p>
                      </div>
                    </div>

                    <div className="prose prose-invert max-w-none">
                      {renderFormattedReflection(stage2Result.reflection)}
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">Help Calibrate Our Model</p>
                      <p className="text-xs text-slate-400 mb-6">How accurately did this reflection capture your internal behavioral state?</p>
                      <div className="flex justify-center gap-4 mb-6">
                        {[1,2,3,4,5].map(star => (
                          <button key={`s2-${star}`} onClick={() => submitFeedback(star)} className={`p-1 transition-all hover:scale-125 ${rating >= star ? 'text-yellow-400' : 'text-slate-800'}`}>
                            <Star className="w-7 h-7 fill-current" />
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setStage(0)} className="text-xs text-slate-500 hover:text-slate-300 block mx-auto mt-8 mb-6 transition-colors">
                        Reset and Restart
                      </button>

                      {/* Community Contribution Link */}
                      <a 
                        href="https://forms.gle/RamFfDamt8v1EJvZ8" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-purple-400 flex items-center justify-center gap-2 transition-colors text-xs border-t border-white/5 pt-6"
                      >
                        <ExternalLink className="w-3 h-3" /> Contribute to our Research Dataset
                      </a>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Data & Legend (4/12) */}
                <div className="lg:col-span-4 space-y-6 sticky top-8">
                  {/* COMPACT DATA CARD */}
                  <div className="glass-panel p-8 rounded-[2rem] border-white/10 shadow-xl bg-indigo-500/5">
                    <p className="text-[10px] font-black tracking-[0.4em] text-purple-400 uppercase mb-6">Probabilistic Data</p>
                    <div className="space-y-4 mb-8">
                      {Object.entries(stage2Result.probabilities).map(([name, prob]) => {
                        return (
                          <div key={name} className="group">
                            <div className="flex justify-between text-[11px] mb-1.5 px-1 font-medium">
                              <span className="text-white/60 group-hover:text-white transition-colors">{name}</span>
                              <span className="text-white/30">{Math.round(prob * 100)}%</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${prob * 100}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 shadow-[0_0_8px_rgba(139,92,246,0.3)]"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {stage2Result.features && (
                      <div className="mt-8">
                        <p className="text-[10px] font-black tracking-[0.4em] text-indigo-400 uppercase mb-4 text-center">Behavioral Matrix</p>
                        <div className="h-64 w-full relative flex justify-center items-center">
                          <Radar 
                            data={{
                              labels: ['Impulse', 'Ego', 'Awareness', 'Empathy', 'Logic', 'Adapt'],
                              datasets: [
                                {
                                  label: 'User Matrix',
                                  data: [
                                    stage2Result.features.Impulsiveness,
                                    stage2Result.features.Ego_Dominance,
                                    stage2Result.features.Self_Awareness,
                                    stage2Result.features.Empathy,
                                    stage2Result.features.Analytical_Planning,
                                    stage2Result.features.Adaptability,
                                  ],
                                  backgroundColor: 'rgba(139, 92, 246, 0.3)',
                                  borderColor: '#a855f7',
                                  borderWidth: 2,
                                  pointBackgroundColor: '#a855f7',
                                  pointBorderColor: '#fff',
                                },
                              ],
                            }} 
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                r: {
                                  angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                                  grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                  pointLabels: { color: '#a5b4fc', font: { size: 10, family: 'Outfit' } },
                                  ticks: { display: false, min: 0, max: 5 }
                                }
                              },
                              plugins: { legend: { display: false } }
                            }} 
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* MONTHLY ADVERTISEMENT */}
                  <div className="glass-panel p-6 rounded-[2rem] border-purple-500/20 shadow-xl bg-purple-500/5 text-center space-y-4">
                    <Mail className="w-8 h-8 mx-auto text-purple-400" />
                    <h3 className="text-lg font-bold text-white">Activate Monthly Tracking</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Lock in your behavioral baselines and receive continuous psychological analysis focusing on cyclical patterns, cognitive catalysts, and emotional solutions.
                    </p>
                    <button 
                      onClick={() => {
                        setPortalActionText('Subscribe');
                        setStage(6);
                      }}
                      className="w-full py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 text-xs font-semibold tracking-wider uppercase transition-colors"
                    >
                      Subscribe Now
                    </button>
                  </div>

                  {/* LEGEND SIDEBAR */}
                  <ArchetypeLegend />
                </div>

              </div>
            </motion.div>
          )}

          {/* STAGE 6: MONTHLY SIGN IN / SUBSCRIBE PORTAL */}
          {stage === 6 && (
            <motion.div
              key="stage6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto glass-panel p-8 rounded-3xl"
            >
              <div className="text-center mb-8">
                <Calendar className="w-12 h-12 mx-auto text-purple-400 mb-3" />
                <h2 className="text-3xl font-light mb-1">Monthly <span className="cosmic-gradient font-bold">Evolution</span></h2>
                <p className="text-slate-400 text-sm">Deep psychological cycle tracking, cognitive catalysts, and adaptive reflections.</p>
              </div>

              {!showOtp && !isForgotPassword ? (
                <>
                  <div className="flex gap-4 p-1 bg-slate-950/80 rounded-xl mb-6 border border-slate-800">
                    <button 
                      type="button" 
                      onClick={() => setPortalActionText('Register')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${portalActionText === 'Register' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Register
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setPortalActionText('Sign In')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${portalActionText === 'Sign In' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Sign In
                    </button>
                  </div>

                  <form onSubmit={handlePortalLogin} className="space-y-4">
                    {portalActionText === 'Register' && (
                      <div>
                        <label className="block text-slate-300 text-xs mb-1.5 font-medium">Username</label>
                        <input type="text" required
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                          value={portalUsername} onChange={e => setPortalUsername(e.target.value)}
                          placeholder="Your Name"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-slate-300 text-xs mb-1.5 font-medium">Email Address</label>
                      <input type="email" required
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                        value={portalEmail} onChange={e => setPortalEmail(e.target.value)}
                        placeholder="name@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-xs mb-1.5 font-medium">Password</label>
                      <input type="password" required
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                        value={portalPassword} onChange={e => setPortalPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    
                    {portalActionText === 'Sign In' && (
                      <div className="flex justify-end">
                        <button 
                          type="button" 
                          onClick={() => setIsForgotPassword(true)}
                          className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    )}

                    <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm flex justify-center items-center gap-2 glow transition-all">
                      {portalActionText === 'Register' ? 'Register Account' : 'Access Portal'} <Sparkles className="w-4 h-4" />
                    </button>

                    <button 
                      type="button" 
                      onClick={() => setStage(0)}
                      className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Return to Main Flow
                    </button>
                  </form>
                </>
              ) : isForgotPassword ? (
                <form onSubmit={resetCodeSent ? handleResetPassword : handleForgotPassword} className="space-y-4">
                  <h3 className="text-white text-lg font-bold mb-4">Reset Password</h3>
                  <div>
                    <label className="block text-slate-300 text-xs mb-1.5 font-medium">Email Address</label>
                    <input type="email" required
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                      value={portalEmail} onChange={e => setPortalEmail(e.target.value)}
                      placeholder="name@example.com"
                      disabled={resetCodeSent}
                    />
                  </div>
                  
                  {resetCodeSent && (
                    <>
                      <div>
                        <label className="block text-slate-300 text-xs mb-1.5 font-medium">Reset Code (from Email)</label>
                        <input type="text" required
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors tracking-widest text-center"
                          value={otpCode} onChange={e => setOtpCode(e.target.value)}
                          placeholder="123456"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 text-xs mb-1.5 font-medium">New Password</label>
                        <input type="password" required
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                          value={newPassword} onChange={e => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                    </>
                  )}
                  
                  <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm flex justify-center items-center gap-2 glow transition-all">
                    {resetCodeSent ? 'Save New Password' : 'Send Reset Code'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setIsForgotPassword(false); setResetCodeSent(false); }}
                    className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1 transition-colors"
                  >
                    Back to Login
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-slate-300 text-xs mb-1.5 font-medium">Verification Code (OTP)</label>
                    <input type="text" required
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors tracking-widest text-center text-xl"
                      value={otpCode} onChange={e => setOtpCode(e.target.value)}
                      placeholder="123456"
                    />
                    <p className="text-slate-400 text-xs text-center mt-2">Check your email for the 6-digit code.</p>
                  </div>
                  <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm flex justify-center items-center gap-2 glow transition-all">
                    Verify & Continue
                  </button>
                  <button 
                    type="button" 
                    onClick={handleResendOtp}
                    className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1 transition-colors"
                  >
                    Resend Code
                  </button>
                </form>
              )}
            </motion.div>
          )}


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
                    <p className="text-slate-400 text-xs font-bold tracking-wider uppercase text-center">
                      Next cycle unlocks<br/>automatically in 30 days
                    </p>
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

          {/* STAGE 10: ADMIN DASHBOARD */}
          {stage === 10 && adminData && (
            <motion.div
              key="stage10"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto px-4"
            >
              <div className="glass-panel p-8 rounded-[2rem] border-red-500/20 shadow-2xl relative overflow-hidden bg-gradient-to-r from-red-900/10 to-slate-900/50">
                <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                      <ShieldCheck className="text-red-400 w-8 h-8" /> System Overseer
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Global platform metrics and retraining status.</p>
                  </div>
                  <button onClick={() => setStage(0)} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold">Logout</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Souls</p>
                    <p className="text-4xl font-light text-white">{adminData.total_users}</p>
                  </div>
                  <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Feedback Points</p>
                    <p className="text-4xl font-light text-white">{adminData.total_feedbacks}</p>
                    <p className="text-xs text-slate-500 mt-2">Retrains every 50.</p>
                  </div>
                  <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Monthly Insights</p>
                    <p className="text-4xl font-light text-white">{adminData.total_insights}</p>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-4">Recent Feedback Ratings</h3>
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden mb-8">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950/50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">User ID</th>
                        <th className="px-6 py-4">Rating</th>
                        <th className="px-6 py-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminData.recent_feedbacks.map(f => (
                        <tr key={f.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-6 py-4">#{f.id}</td>
                          <td className="px-6 py-4">{f.user_id}</td>
                          <td className="px-6 py-4 font-bold text-white">{f.rating}/5</td>
                          <td className="px-6 py-4">{new Date(f.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                      {adminData.recent_feedbacks.length === 0 && (
                        <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">No feedback submitted yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
