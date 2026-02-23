import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  BookOpen, Gamepad2, Star, CheckCircle2,
  Zap, Timer, HelpCircle, ArrowLeft, ShieldAlert,
  Grid3X3, Crown, Rocket, Lightbulb, X, Calculator, Settings2, Delete, Target, PenTool, PartyPopper, CheckSquare,
  User, Lock, LogOut, ShieldCheck, UserPlus, Users, KeyRound, Loader
} from 'lucide-react';
import { rrbTopics as labTopics, rrbQuestionBank as labQuestionBank } from './data/rrbData.js';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5174').replace(/\/+$/, '');
const buildApiUrl = (path) => {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
const AUTH_ENABLED = false;
const APP_STORAGE_KEY = 'maths-app-progress-v1';
const LOCAL_USER = Object.freeze({
  id: 'local-user',
  username: 'Learner',
  role: 'user',
});

const themes = {
  // Apprentice Tier (2-10)
  2: { base: 'blue', bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500', glow: 'bg-blue-400' },
  3: { base: 'green', bg: 'bg-green-500', text: 'text-green-500', border: 'border-green-500', glow: 'bg-green-400' },
  4: { base: 'purple', bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500', glow: 'bg-purple-400' },
  5: { base: 'orange', bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500', glow: 'bg-orange-400' },
  6: { base: 'pink', bg: 'bg-pink-500', text: 'text-pink-500', border: 'border-pink-500', glow: 'bg-pink-400' },
  7: { base: 'teal', bg: 'bg-teal-500', text: 'text-teal-500', border: 'border-teal-500', glow: 'bg-teal-400' },
  8: { base: 'red', bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500', glow: 'bg-red-400' },
  9: { base: 'indigo', bg: 'bg-indigo-500', text: 'text-indigo-500', border: 'border-indigo-500', glow: 'bg-indigo-400' },
  10: { base: 'sky', bg: 'bg-sky-500', text: 'text-sky-500', border: 'border-sky-500', glow: 'bg-sky-400' },
  
  // Wizard Tier (11-20)
  11: { base: 'cyan', bg: 'bg-cyan-500', text: 'text-cyan-500', border: 'border-cyan-500', glow: 'bg-cyan-400' },
  12: { base: 'lime', bg: 'bg-lime-500', text: 'text-lime-500', border: 'border-lime-500', glow: 'bg-lime-400' },
  13: { base: 'fuchsia', bg: 'bg-fuchsia-500', text: 'text-fuchsia-500', border: 'border-fuchsia-500', glow: 'bg-fuchsia-400' },
  14: { base: 'violet', bg: 'bg-violet-500', text: 'text-violet-500', border: 'border-violet-500', glow: 'bg-violet-400' },
  15: { base: 'rose', bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500', glow: 'bg-rose-400' },
  16: { base: 'sky', bg: 'bg-sky-500', text: 'text-sky-500', border: 'border-sky-500', glow: 'bg-sky-400' },
  17: { base: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', glow: 'bg-emerald-400' },
  18: { base: 'yellow', bg: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500', glow: 'bg-yellow-400' },
  19: { base: 'slate', bg: 'bg-slate-600', text: 'text-slate-600', border: 'border-slate-600', glow: 'bg-slate-500' },
  20: { base: 'zinc', bg: 'bg-zinc-800', text: 'text-zinc-800', border: 'border-zinc-800', glow: 'bg-zinc-700' },
};

export default function App() {
  const RRB_STORAGE_KEY = 'rrb-progress-v1';
  const [authLoading, setAuthLoading] = useState(AUTH_ENABLED);
  const [currentUser, setCurrentUser] = useState(AUTH_ENABLED ? null : LOCAL_USER);
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [authPending, setAuthPending] = useState(false);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirm, setAuthConfirm] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [adminSessions, setAdminSessions] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminMessage, setAdminMessage] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminOverviewLoading, setAdminOverviewLoading] = useState(false);
  const [adminPasswordCurrent, setAdminPasswordCurrent] = useState('');
  const [adminPasswordNext, setAdminPasswordNext] = useState('');
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('');
  const [operation, setOperation] = useState('multiply'); 
  const [levelRange, setLevelRange] = useState('apprentice'); 
  const [difficulty, setDifficulty] = useState('medium'); 
  const [activeTab, setActiveTab] = useState('learn'); 
  
  const currentNumbers = levelRange === 'apprentice' ? [2,3,4,5,6,7,8,9,10] : [11,12,13,14,15,16,17,18,19,20];
  const [selectedTable, setSelectedTable] = useState(2);
  const currentTheme = themes[selectedTable] || themes[2];

  // Table Mastery State
  const [completedTables, setCompletedTables] = useState([]);
  const [isPracticing, setIsPracticing] = useState(false);
  const [practiceAnswers, setPracticeAnswers] = useState(Array(10).fill(''));
  const [practiceErrors, setPracticeErrors] = useState(Array(10).fill(false));

  // Shared Game State
  const [gameMode, setGameMode] = useState(null); 
  const [gameStatus, setGameStatus] = useState('idle'); 
  const [question, setQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [feedback, setFeedback] = useState(null); 
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showTrick, setShowTrick] = useState(false);

  // Direct Entry Division State
  const [inputValue, setInputValue] = useState('');
  const [rrbTopic, setRrbTopic] = useState('percentage');
  const [rrbPage, setRrbPage] = useState(0);
  const RRB_PAGE_SIZE = 4;
  const rrbAutoAdvanceRef = useRef(new Set());
  const [rrbAnswers, setRrbAnswers] = useState({});
  const [rrbResults, setRrbResults] = useState({});
  const rrbTopics = labTopics;
  const rrbQuestionBank = labQuestionBank;
  const rrbDataLoading = false;

  useEffect(() => {
    const validOperations = new Set(['multiply', 'divide', 'rrb']);
    const validRanges = new Set(['apprentice', 'wizard']);
    const validDifficulties = new Set(['easy', 'medium', 'hard']);
    const validTabs = new Set(['learn', 'games']);

    try {
      const raw = localStorage.getItem(APP_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (validOperations.has(parsed?.operation)) setOperation(parsed.operation);
      if (validRanges.has(parsed?.levelRange)) setLevelRange(parsed.levelRange);
      if (validDifficulties.has(parsed?.difficulty)) setDifficulty(parsed.difficulty);
      if (validTabs.has(parsed?.activeTab)) setActiveTab(parsed.activeTab);
      if (Number.isInteger(parsed?.selectedTable)) setSelectedTable(parsed.selectedTable);
      if (Array.isArray(parsed?.completedTables)) {
        const sanitized = parsed.completedTables.filter((value) => Number.isInteger(value) && value >= 2 && value <= 20);
        setCompletedTables([...new Set(sanitized)]);
      }
    } catch {
      // Ignore corrupted local storage.
    }
  }, []);

  useEffect(() => {
    const payload = JSON.stringify({
      operation,
      levelRange,
      difficulty,
      activeTab,
      selectedTable,
      completedTables,
    });
    localStorage.setItem(APP_STORAGE_KEY, payload);
  }, [operation, levelRange, difficulty, activeTab, selectedTable, completedTables]);

  useEffect(() => {
    if (rrbTopics.length === 0) return;
    if (!rrbTopics.some((topic) => topic.id === rrbTopic)) {
      setRrbTopic(rrbTopics[0].id);
    }
  }, [rrbTopics, rrbTopic]);

  const apiFetch = useCallback(async (path, options = {}) => {
    const headers = options.headers ? { ...options.headers } : {};
    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    return fetch(buildApiUrl(path), {
      credentials: 'include',
      ...options,
      headers,
    });
  }, []);

  useEffect(() => {
    if (!AUTH_ENABLED) {
      setAuthLoading(false);
      setCurrentUser(LOCAL_USER);
      return;
    }

    let active = true;
    const loadSession = async () => {
      try {
        const res = await apiFetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (active) setCurrentUser(data.user);
        }
      } catch {
        // Ignore offline errors.
      } finally {
        if (active) setAuthLoading(false);
      }
    };
    loadSession();
    return () => {
      active = false;
    };
  }, [apiFetch]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthNotice('');
    setAuthPending(false);

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: authUsername.trim(),
          password: authPassword,
          remember: rememberMe,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setAuthPassword('');
        setAuthConfirm('');
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (res.status === 403 && data?.code === 'PENDING') {
        setAuthPending(true);
        return;
      }
      setAuthError(data?.error || 'Login failed.');
    } catch {
      setAuthError('Unable to reach the server.');
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthNotice('');
    setAuthPending(false);

    if (authPassword !== authConfirm) {
      setAuthError('Passwords do not match.');
      return;
    }

    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: authUsername.trim(),
          password: authPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAuthError(data?.error || 'Registration failed.');
        return;
      }

      setAuthNotice('Account created. Waiting for admin approval.');
      setAuthMode('login');
      setAuthPassword('');
      setAuthConfirm('');
      setAuthPending(true);
    } catch {
      setAuthError('Unable to reach the server.');
    }
  };

  const handleLogout = async () => {
    if (!AUTH_ENABLED) {
      localStorage.removeItem(APP_STORAGE_KEY);
      localStorage.removeItem(RRB_STORAGE_KEY);
      setCompletedTables([]);
      setOperation('multiply');
      setLevelRange('apprentice');
      setDifficulty('medium');
      setActiveTab('learn');
      setSelectedTable(2);
      setRrbAnswers({});
      setRrbResults({});
      setShowAdminPanel(false);
      return;
    }

    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout.
    } finally {
      setCurrentUser(null);
      setShowAdminPanel(false);
    }
  };

  const fetchPendingUsers = useCallback(async () => {
    setAdminLoading(true);
    setAdminMessage('');
    try {
      const res = await apiFetch('/api/admin/pending');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAdminMessage(data?.error || 'Unable to load pending users.');
        setPendingUsers([]);
      } else {
        const data = await res.json();
        setPendingUsers(data.users || []);
      }
    } catch {
      setAdminMessage('Unable to reach the server.');
      setPendingUsers([]);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  const fetchAdminOverview = useCallback(async () => {
    setAdminOverviewLoading(true);
    setAdminMessage('');
    try {
      const res = await apiFetch('/api/admin/overview');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAdminMessage(data?.error || 'Unable to load admin overview.');
        setAdminSessions([]);
        setAdminUsers([]);
      } else {
        const data = await res.json();
        setAdminSessions(data.sessions || []);
        setAdminUsers(data.users || []);
      }
    } catch {
      setAdminMessage('Unable to reach the server.');
      setAdminSessions([]);
      setAdminUsers([]);
    } finally {
      setAdminOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showAdminPanel && currentUser?.role === 'admin') {
      fetchPendingUsers();
      fetchAdminOverview();
    }
  }, [showAdminPanel, currentUser, fetchPendingUsers, fetchAdminOverview]);

  const handleAdminDecision = async (userId, approved) => {
    setAdminMessage('');
    try {
      const res = await apiFetch('/api/admin/approve', {
        method: 'POST',
        body: JSON.stringify({ userId, approved }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAdminMessage(data?.error || 'Action failed.');
        return;
      }
      setAdminMessage(approved ? 'User approved.' : 'User rejected.');
      fetchPendingUsers();
    } catch {
      setAdminMessage('Unable to reach the server.');
    }
  };

  const handleAdminPasswordChange = async (event) => {
    event.preventDefault();
    setAdminMessage('');

    if (adminPasswordNext !== adminPasswordConfirm) {
      setAdminMessage('New passwords do not match.');
      return;
    }

    try {
      const res = await apiFetch('/api/admin/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: adminPasswordCurrent,
          newPassword: adminPasswordNext,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAdminMessage(data?.error || 'Password update failed.');
        return;
      }
      setAdminMessage('Admin password updated.');
      setAdminPasswordCurrent('');
      setAdminPasswordNext('');
      setAdminPasswordConfirm('');
    } catch {
      setAdminMessage('Unable to reach the server.');
    }
  };

  const isAdmin = AUTH_ENABLED && currentUser?.role === 'admin';
  const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString();
  };

  // Reset Practice mode when table changes
  useEffect(() => {
    setIsPracticing(false);
    setPracticeAnswers(Array(10).fill(''));
    setPracticeErrors(Array(10).fill(false));
  }, [selectedTable, operation]);

  useEffect(() => {
    if (operation === 'divide') {
      setGameMode('direct_entry');
      setGameStatus('playing');
      setScore(0);
      setStreak(0);
      setInputValue('');
      generateQuestion('direct_entry');
    } else {
      setGameStatus('idle');
      setActiveTab('learn');
    }
  }, [operation, levelRange, difficulty]);

  useEffect(() => {
    if (levelRange === 'apprentice' && selectedTable > 10) {
      setSelectedTable(2);
    } else if (levelRange === 'wizard' && selectedTable < 11) {
      setSelectedTable(11);
    }
  }, [levelRange, selectedTable]);

  useEffect(() => {
    const stored = localStorage.getItem(RRB_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.answers && typeof parsed.answers === 'object') setRrbAnswers(parsed.answers);
      if (parsed?.results && typeof parsed.results === 'object') setRrbResults(parsed.results);
    } catch {
      // Ignore corrupted storage.
    }
  }, []);

  useEffect(() => {
    const payload = JSON.stringify({ answers: rrbAnswers, results: rrbResults });
    localStorage.setItem(RRB_STORAGE_KEY, payload);
  }, [rrbAnswers, rrbResults]);

  const rrbQuestions = useMemo(() => {
    const raw = rrbQuestionBank[rrbTopic] || [];
    return raw.map((question, index) => {
      if (typeof question === 'string') {
        return { id: `${rrbTopic}-${index + 1}`, text: question };
      }
      return { ...question, id: question.id || `${rrbTopic}-${index + 1}` };
    });
  }, [rrbTopic, rrbQuestionBank]);

  useEffect(() => {
    setRrbPage(0);
    rrbAutoAdvanceRef.current = new Set();
  }, [rrbTopic]);

  const rrbTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(rrbQuestions.length / RRB_PAGE_SIZE));
  }, [rrbQuestions.length]);

  useEffect(() => {
    if (rrbPage > rrbTotalPages - 1) {
      setRrbPage(Math.max(0, rrbTotalPages - 1));
    }
  }, [rrbPage, rrbTotalPages]);

  const rrbPageQuestions = useMemo(() => {
    const start = rrbPage * RRB_PAGE_SIZE;
    return rrbQuestions.slice(start, start + RRB_PAGE_SIZE);
  }, [rrbQuestions, rrbPage]);

  const rrbPageAnsweredCount = useMemo(() => {
    return rrbPageQuestions.filter((question) => {
      const val = rrbAnswers[question.id];
      return val !== undefined && val.toString().trim().length > 0;
    }).length;
  }, [rrbPageQuestions, rrbAnswers]);

  useEffect(() => {
    if (rrbPageQuestions.length === 0) return;
    const allAnswered = rrbPageQuestions.every((question) => {
      const val = rrbAnswers[question.id];
      return val !== undefined && val.toString().trim().length > 0;
    });
    if (!allAnswered || rrbPage >= rrbTotalPages - 1) return;
    if (rrbAutoAdvanceRef.current.has(rrbPage)) return;
    rrbAutoAdvanceRef.current.add(rrbPage);
    const timer = setTimeout(() => {
      setRrbPage((prev) => Math.min(prev + 1, rrbTotalPages - 1));
    }, 350);
    return () => clearTimeout(timer);
  }, [rrbPageQuestions, rrbAnswers, rrbPage, rrbTotalPages]);

  const handleRrbAnswerChange = (questionId, value) => {
    setRrbAnswers(prev => ({ ...prev, [questionId]: value }));
    setRrbResults(prev => {
      if (!prev[questionId]) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const parseRrbNumber = (raw) => {
    if (raw === null || raw === undefined) return null;
    const cleaned = raw
      .toString()
      .replace(/,/g, '')
      .replace(/(profit|loss)/gi, '')
      .trim();
    if (cleaned.length === 0) return null;
    const num = Number.parseFloat(cleaned);
    return Number.isFinite(num) ? num : null;
  };

  const formatRrbNumber = (value, decimals = 2) => {
    if (!Number.isFinite(value)) return '';
    const rounded = Number(value.toFixed(decimals));
    if (Number.isInteger(rounded)) return rounded.toString();
    return rounded.toFixed(decimals);
  };

  const solveRrbQuestion = (question) => {
    if (question && typeof question === 'object' && question.answer !== undefined) {
      const value = Number(question.answer);
      if (!Number.isFinite(value)) return null;
      const decimals = typeof question.decimals === 'number' ? question.decimals : 2;
      return { value, decimals, display: formatRrbNumber(value, decimals) };
    }

    const text = typeof question === 'string' ? question : question?.text || '';
    let match;

    // Percentage: "5% of 100 is ?"
    match = text.match(/^(\d+(?:\.\d+)?)% of (\d+(?:\.\d+)?) is \?$/i);
    if (match) {
      const percent = Number(match[1]);
      const base = Number(match[2]);
      const value = (base * percent) / 100;
      const decimals = 2;
      return { value, decimals, display: formatRrbNumber(value, decimals) };
    }

    // Percentage increase/decrease
    match = text.match(/^(Increase|Decrease) (\d+(?:\.\d+)?) by (\d+(?:\.\d+)?)%\. Find new value\.?$/i);
    if (match) {
      const direction = match[1].toLowerCase();
      const base = Number(match[2]);
      const percent = Number(match[3]);
      const factor = direction === 'increase' ? 1 + percent / 100 : 1 - percent / 100;
      const value = base * factor;
      const decimals = 2;
      return { value, decimals, display: formatRrbNumber(value, decimals) };
    }

    // Successive increase/decrease
    match = text.match(/^A value (\d+(?:\.\d+)?) is (increased|decreased) by (\d+(?:\.\d+)?)% and then (increased|decreased) by (\d+(?:\.\d+)?)%\. Final value\?$/i);
    if (match) {
      const base = Number(match[1]);
      const firstSign = match[2].toLowerCase() === 'increased' ? 1 : -1;
      const firstPct = Number(match[3]);
      const secondSign = match[4].toLowerCase() === 'increased' ? 1 : -1;
      const secondPct = Number(match[5]);
      const value = base * (1 + (firstSign * firstPct) / 100) * (1 + (secondSign * secondPct) / 100);
      const decimals = 2;
      return { value, decimals, display: formatRrbNumber(value, decimals) };
    }

    // Discount: marked price
    match = text.match(/^Marked price Rs\. (\d+(?:\.\d+)?)\. Discount (\d+(?:\.\d+)?)%\. Selling price\?$/i);
    if (match) {
      const mp = Number(match[1]);
      const discount = Number(match[2]);
      const value = mp * (1 - discount / 100);
      const decimals = 2;
      return { value, decimals, display: formatRrbNumber(value, decimals) };
    }

    // Discount: successive discounts
    match = text.match(/^MP Rs\. (\d+(?:\.\d+)?)\. Successive discounts (\d+(?:\.\d+)?)% and (\d+(?:\.\d+)?)%\. Final price\?$/i);
    if (match) {
      const mp = Number(match[1]);
      const d1 = Number(match[2]);
      const d2 = Number(match[3]);
      const value = mp * (1 - d1 / 100) * (1 - d2 / 100);
      const decimals = 2;
      return { value, decimals, display: formatRrbNumber(value, decimals) };
    }

    // Discount: profit/loss after discount
    match = text.match(/^CP Rs\. (\d+(?:\.\d+)?), MP Rs\. (\d+(?:\.\d+)?), discount (\d+(?:\.\d+)?)%\. Profit\/Loss amount\?$/i);
    if (match) {
      const cp = Number(match[1]);
      const mp = Number(match[2]);
      const discount = Number(match[3]);
      const sp = mp * (1 - discount / 100);
      const diff = sp - cp;
      const label = diff >= 0 ? 'Profit' : 'Loss';
      const decimals = 2;
      const display = `${label} ${formatRrbNumber(Math.abs(diff), decimals)}`;
      return { value: diff, decimals, display, allowAbs: true };
    }

    // Time & Work: combined work rate
    match = text.match(/^A can do work in (\d+(?:\.\d+)?) days, B in (\d+(?:\.\d+)?) days\. Together\?(?: \((\d+) decimals\))?$/i);
    if (match) {
      const a = Number(match[1]);
      const b = Number(match[2]);
      const decimals = match[3] ? Number(match[3]) : 2;
      const value = 1 / (1 / a + 1 / b);
      return { value, decimals, display: formatRrbNumber(value, decimals) };
    }

    // Time & Work: workers and days
    match = text.match(/^(\d+(?:\.\d+)?) workers finish work in (\d+(?:\.\d+)?) days\. (\d+(?:\.\d+)?) workers will take how many days\?$/i);
    if (match) {
      const workers1 = Number(match[1]);
      const days1 = Number(match[2]);
      const workers2 = Number(match[3]);
      const value = (workers1 * days1) / workers2;
      const decimals = 2;
      return { value, decimals, display: formatRrbNumber(value, decimals) };
    }

    // Time & Work: pipes and cisterns
    match = text.match(/^Pipe fills tank in (\d+(?:\.\d+)?) hrs, waste empties in (\d+(?:\.\d+)?) hrs\. Both open\. Time to fill\?$/i);
    if (match) {
      const fill = Number(match[1]);
      const waste = Number(match[2]);
      const value = 1 / (1 / fill - 1 / waste);
      const decimals = 2;
      return { value, decimals, display: formatRrbNumber(value, decimals) };
    }

    // Trains: crossing a pole
    match = text.match(/^Train (\d+(?:\.\d+)?) m crosses pole in (\d+(?:\.\d+)?) sec\. Speed(?: km\/h)?\?$/i);
    if (match) {
      const length = Number(match[1]);
      const timeSec = Number(match[2]);
      const speed = (length / timeSec) * 3.6;
      const decimals = 2;
      return { value: speed, decimals, display: formatRrbNumber(speed, decimals) };
    }

    // Trains: crossing a platform
    match = text.match(/^Train (\d+(?:\.\d+)?) m crosses (\d+(?:\.\d+)?) m platform in (\d+(?:\.\d+)?) sec\. Speed\?$/i);
    if (match) {
      const trainLen = Number(match[1]);
      const platformLen = Number(match[2]);
      const timeSec = Number(match[3]);
      const speed = ((trainLen + platformLen) / timeSec) * 3.6;
      const decimals = 2;
      return { value: speed, decimals, display: formatRrbNumber(speed, decimals) };
    }

    // Trains: two trains crossing each other (opposite direction)
    match = text.match(/^Two trains (\d+(?:\.\d+)?) m & (\d+(?:\.\d+)?) m opposite at (\d+(?:\.\d+)?) km\/h & (\d+(?:\.\d+)?) km\/h\. Crossing time\?$/i);
    if (match) {
      const len1 = Number(match[1]);
      const len2 = Number(match[2]);
      const speed1 = Number(match[3]);
      const speed2 = Number(match[4]);
      const relativeSpeed = ((speed1 + speed2) * 1000) / 3600;
      const time = (len1 + len2) / relativeSpeed;
      const decimals = 2;
      return { value: time, decimals, display: formatRrbNumber(time, decimals) };
    }

    return null;
  };

  const handleRrbCheck = (question) => {
    const userValue = parseRrbNumber(rrbAnswers[question.id]);
    if (userValue === null) {
      setRrbResults(prev => ({ ...prev, [question.id]: { status: 'empty' } }));
      return;
    }

    const solution = solveRrbQuestion(question);
    if (!solution) {
      setRrbResults(prev => ({ ...prev, [question.id]: { status: 'unknown' } }));
      return;
    }

    const decimals = typeof solution.decimals === 'number' ? solution.decimals : 2;
    const roundedCorrect = Number(solution.value.toFixed(decimals));
    const tolerance = decimals <= 2 ? 0.01 : 0.001;
    const isClose = Math.abs(userValue - roundedCorrect) <= tolerance;
    const isCloseAbs = solution.allowAbs ? Math.abs(Math.abs(userValue) - Math.abs(roundedCorrect)) <= tolerance : false;

    setRrbResults(prev => ({
      ...prev,
      [question.id]: {
        status: isClose || isCloseAbs ? 'correct' : 'incorrect',
        answer: solution.display,
      },
    }));
  };

  const handleRrbReset = () => {
    setRrbAnswers({});
    setRrbResults({});
    setRrbPage(0);
    rrbAutoAdvanceRef.current = new Set();
    localStorage.removeItem(RRB_STORAGE_KEY);
  };

  const handlePracticeSubmit = () => {
    let allCorrect = true;
    const newErrors = Array(10).fill(false);
    
    practiceAnswers.forEach((ans, idx) => {
      const isCorrect = Number.parseInt(ans, 10) === selectedTable * (idx + 1);
      if (!isCorrect) {
        allCorrect = false;
        newErrors[idx] = true;
      }
    });
    
    setPracticeErrors(newErrors);
    
    if (allCorrect) {
      if (!completedTables.includes(selectedTable)) {
        setCompletedTables(prev => [...prev, selectedTable]);
      }
      setFeedback('practice_success');
      setTimeout(() => {
        setFeedback(null);
        setIsPracticing(false);
        setPracticeAnswers(Array(10).fill(''));
      }, 3000);
    } else {
      setFeedback('practice_error');
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  const handlePracticeStart = () => {
    setIsPracticing(true);
    setPracticeAnswers(Array(10).fill(''));
    setPracticeErrors(Array(10).fill(false));
    if (completedTables.includes(selectedTable)) {
      setCompletedTables(prev => prev.filter(t => t !== selectedTable));
    }
  };

  const checkDirectAnswer = useCallback(() => {
    if (!question) return;
    const numInput = Number.parseInt(inputValue, 10);
    if (Number.isNaN(numInput)) return;

    if (numInput === question.answer) {
      setFeedback('correct');
      const points = difficulty === 'hard' ? 50 : 15;

      setStreak(prev => {
        setScore(s => s + points + (prev * 5));
        return prev + 1;
      });
      
      setTimeout(() => { 
        setInputValue('');
        generateQuestion('direct_entry'); 
      }, 600);
    } else {
      setFeedback('incorrect');
      setStreak(0);
      setTimeout(() => { 
        setInputValue('');
        setFeedback(null); 
      }, 800);
    }
  }, [question, inputValue, difficulty, operation, levelRange]);

  // Keyboard Support for Numpad
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (operation !== 'divide' || gameStatus !== 'playing' || feedback) return;
      if (e.key >= '0' && e.key <= '9') {
        if (inputValue.length < 4) setInputValue(prev => prev + e.key);
      } else if (e.key === 'Backspace') {
        setInputValue(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter' && inputValue.length > 0) {
        checkDirectAnswer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputValue, operation, gameStatus, feedback, checkDirectAnswer]);

  useEffect(() => {
    if (gameMode !== 'time_attack' || gameStatus !== 'playing') return;
    if (timeLeft <= 0) {
      setGameStatus('gameover');
      return;
    }

    const timerId = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [gameMode, gameStatus, timeLeft]);

  const handleNumpad = (val) => {
    if (feedback) return;
    if (val === 'DEL') setInputValue(prev => prev.slice(0, -1));
    else if (val === 'ENTER') { if (inputValue.length > 0) checkDirectAnswer(); } 
    else { if (inputValue.length < 4) setInputValue(prev => prev + val); }
  };

  const generateTrick = (n1, n2, op) => {
    if (op === 'divide' && difficulty === 'hard') {
      return [
        `Math Trick: Unit Digit Matching!`,
        `You need ${n1} × ? to end in the last digit of ${n1 * n2}.`,
        `Look at the last digit of ${n1}. What can you multiply it by to get the last digit of ${n1*n2}?`,
        `Use that to guess the answer instantly!`
      ];
    }
    if (op === 'divide') {
      return [`Reverse it: ${n1} × ? = ${n1 * n2}`, `Skip count by ${n1}s.`];
    }
    if (n2 === 9) return [`Multiply by 10: ${n1} × 10 = ${n1 * 10}`, `Subtract one group of ${n1}`];
    if (n2 === 5) return [`Multiply by 10, then cut it exactly in half.`];
    return [`Break it up! Do ${n1} × ${Math.floor(n2/2)} and add the rest.`];
  };

  // Advanced Mathematical Engine
  const generateQuestion = useCallback((mode) => {
    const isDiv = operation === 'divide';
    let n1, n2, product;

    if (isDiv) {
      if (difficulty === 'easy') {
        n1 = Math.floor(Math.random() * 9) + 2; 
        n2 = Math.floor(Math.random() * 12) + 2; 
      } else if (difficulty === 'medium') {
        n1 = Math.floor(Math.random() * 14) + 11; 
        n2 = Math.floor(Math.random() * 15) + 5; 
      } else {
        const ntpcDivisors = [17, 19, 23, 27, 29, 31, 37, 43, 47];
        n1 = ntpcDivisors[Math.floor(Math.random() * ntpcDivisors.length)];
        n2 = Math.floor(Math.random() * 80) + 11; 
      }
      product = n1 * n2;
    } else {
      const minN1 = levelRange === 'apprentice' ? 2 : 11;
      const maxN1 = levelRange === 'apprentice' ? 10 : 20;
      n1 = Math.floor(Math.random() * (maxN1 - minN1 + 1)) + minN1;
      n2 = Math.floor(Math.random() * 10) + 1; 
      product = n1 * n2;
    }
    
    let answer, display, options;

    if (mode === 'direct_entry') {
      answer = n2; 
      display = { text: `${product} ÷ ${n1} = ?`, n1: product, n2: n1, type: 'direct' };
      options = []; 
    } else if (mode === 'missing_number') {
      answer = n2;
      display = { text: `${n1} × ? = ${product}`, type: 'missing' };
      const opts = new Set([n2]);
      while(opts.size < 4) opts.add(Math.floor(Math.random() * 10) + 1);
      options = Array.from(opts).sort(() => Math.random() - 0.5);
    } else if (mode === 'true_false') {
      const isTrue = Math.random() > 0.5;
      const offset = (Math.floor(Math.random() * 3) + 1) * (Math.random() > 0.5 ? 1 : -1);
      const shownProduct = isTrue ? product : product + offset;
      answer = isTrue ? 'True' : 'False';
      display = { text: `${n1} × ${n2} = ${shownProduct}`, type: 'missing' }; // Use missing type for centered text rendering
      options = ['True', 'False'];
    } else if (mode === 'imposter') {
      const opts = [];
      const usedProducts = new Set();
      // Generate 3 correct
      while(opts.length < 3) {
        let rn1 = Math.floor(Math.random() * (levelRange === 'apprentice' ? 9 : 10)) + (levelRange === 'apprentice' ? 2 : 11);
        let rn2 = Math.floor(Math.random() * 10) + 1;
        let p = rn1 * rn2;
        if (!usedProducts.has(p)) {
          opts.push({ text: `${rn1} × ${rn2} = ${p}`, isCorrect: true });
          usedProducts.add(p);
        }
      }
      // Generate 1 fake
      let fn1 = Math.floor(Math.random() * (levelRange === 'apprentice' ? 9 : 10)) + (levelRange === 'apprentice' ? 2 : 11);
      let fn2 = Math.floor(Math.random() * 10) + 1;
      let wrongP = (fn1 * fn2) + (Math.floor(Math.random() * 3) + 1);
      opts.push({ text: `${fn1} × ${fn2} = ${wrongP}`, isCorrect: false });
      
      options = opts.sort(() => Math.random() - 0.5);
      answer = options.find(o => !o.isCorrect).text; 
      display = { text: "Find the Fake!", type: 'missing' };
    } else if (mode === 'grid_strike') {
      answer = product;
      display = { n1, n2, type: 'classic' };
      const opts = new Set([product, n1 * (n2 + 1), n1 * (n2 > 1 ? n2 - 1 : 2), (n1+1)*n2]);
      while(opts.size < 9) {
        let rand = product + (Math.floor(Math.random() * 20) - 10);
        if (rand > 0 && rand !== product) opts.add(rand);
      }
      options = Array.from(opts).slice(0, 9).sort(() => Math.random() - 0.5);
    } else {
      // Classic & Time Attack
      answer = product;
      display = { n1, n2, type: 'classic' };
      const opts = new Set([product, n1 * (n2 + 1), n1 * (n2 > 1 ? n2 - 1 : 2)]);
      while(opts.size < 4) {
        let rand = product + (Math.floor(Math.random() * 15) - 7);
        if (rand > 0 && rand !== product) opts.add(rand);
      }
      options = Array.from(opts).slice(0, 4).sort(() => Math.random() - 0.5);
    }
    
    setQuestion({ n1, n2, answer, options, display, trick: generateTrick(n1, n2, operation) });
    setFeedback(null);
    setSelectedAnswer(null);
    setShowTrick(false);
  }, [levelRange, operation, difficulty]);

  const startGame = (mode) => {
    setGameMode(mode);
    setGameStatus('playing');
    setScore(0);
    setStreak(0);
    if (mode === 'time_attack') setTimeLeft(60);
    generateQuestion(mode);
  };

  const handleAnswerClick = (opt) => {
    if (feedback !== null || gameStatus !== 'playing') return; 
    const selectedVal = typeof opt === 'object' ? opt.text : opt;
    setSelectedAnswer(selectedVal);
    
    if (selectedVal === question.answer) {
      setFeedback('correct');
      let points = gameMode === 'grid_strike' || gameMode === 'imposter' ? 15 : 10;
      if (levelRange === 'wizard') points *= 2; 
      if (difficulty === 'hard') points = Math.floor(points * 1.5);
      
      setStreak(prev => {
        setScore(s => s + points + (prev * 2));
        return prev + 1;
      });
      setTimeout(() => { if (gameStatus === 'playing') generateQuestion(gameMode); }, 800);
    } else {
      setFeedback('incorrect');
      setStreak(0);
      setTimeout(() => { if (gameStatus === 'playing') generateQuestion(gameMode); }, 1500);
    }
  };

  if (AUTH_ENABLED && authLoading) {
    return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 app-bg mobile-safe mobile-touch">
        <div className="flex items-center gap-3 rounded-2xl px-6 py-4 app-card">
          <Loader className="animate-spin text-blue-600" size={22} />
          <span className="font-bold text-slate-600">Loading secure session...</span>
        </div>
      </div>
    );
  }

  if (AUTH_ENABLED && !currentUser) {
    return (
    <div className="min-h-[100dvh] w-full flex items-start sm:items-center justify-center p-4 sm:p-6 app-bg overflow-y-auto mobile-safe mobile-touch">
        <div className="w-full max-w-5xl rounded-[2rem] overflow-hidden app-card">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-8 sm:p-10 flex flex-col justify-between bg-gradient-to-br from-white via-slate-50 to-sky-50">
              <div>
                <div className="flex items-center gap-2 text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  <Calculator size={26} className="text-blue-600" />
                  Math Engine
                </div>
                <p className="mt-3 text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                  Secure, admin-approved access to your practice suite. Build streaks, track progress, and level up every day.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 bg-white/70 border border-white rounded-2xl px-4 py-3 shadow-sm">
                  <ShieldCheck className="text-emerald-600" size={20} />
                  <div>
                    <div className="text-sm font-bold text-slate-700">Admin-approved accounts</div>
                    <div className="text-xs text-slate-500">Every login is reviewed before access.</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/70 border border-white rounded-2xl px-4 py-3 shadow-sm">
                  <Users className="text-blue-600" size={20} />
                  <div>
                    <div className="text-sm font-bold text-slate-700">Multiple user profiles</div>
                    <div className="text-xs text-slate-500">Track progress per student securely.</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/70 border border-white rounded-2xl px-4 py-3 shadow-sm">
                  <KeyRound className="text-indigo-600" size={20} />
                  <div>
                    <div className="text-sm font-bold text-slate-700">Session protection</div>
                    <div className="text-xs text-slate-500">Remember-me keeps you signed in safely.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 sm:p-10 bg-white/95 border-l border-slate-100 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">
                    {authMode === 'login' ? 'Welcome back' : 'Request access'}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    {authMode === 'login' ? 'Sign in to continue learning.' : 'Create your account for approval.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                    setAuthError('');
                    setAuthNotice('');
                    setAuthPending(false);
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 transition-colors"
                >
                  {authMode === 'login' ? (
                    <span className="flex items-center gap-1"><UserPlus size={14}/> New user</span>
                  ) : (
                    'Back to login'
                  )}
                </button>
              </div>

              {authError && (
                <div className="mb-3 text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
                  {authError}
                </div>
              )}
              {authNotice && (
                <div className="mb-3 text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                  {authNotice}
                </div>
              )}
              {authPending && (
                <div className="mb-3 text-xs sm:text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                  Your account is pending admin approval.
                </div>
              )}

              <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Username</label>
                  <div className="relative mt-2">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="Enter username"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="Enter password"
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                      required
                    />
                  </div>
                </div>

                {authMode === 'register' && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Confirm password</label>
                    <div className="relative mt-2">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="password"
                        value={authConfirm}
                        onChange={(e) => setAuthConfirm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </div>
                )}

                {authMode === 'login' && (
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                    />
                    Remember me
                  </label>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-black text-sm sm:text-base text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:-translate-y-0.5"
                >
                  {authMode === 'login' ? 'Sign In' : 'Request Access'}
                </button>
              </form>

              <p className="mt-4 text-xs text-slate-500 font-medium">
                Accounts require admin approval before access is granted.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] sm:h-[100svh] w-full flex items-start sm:items-center justify-center p-2 sm:p-4 md:p-6 font-sans selection:bg-blue-200 selection:text-blue-900 app-bg overflow-y-auto sm:overflow-hidden mobile-safe mobile-touch">
      {/* Main Application Container */}
      <div className="w-full max-w-[96rem] 2xl:max-w-[106rem] h-auto sm:h-full max-h-none sm:max-h-full rounded-[2rem] flex flex-col relative overflow-hidden app-card center-stage">

        {showAdminPanel && isAdmin && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
            <div className="w-full max-w-3xl bg-white/90 backdrop-blur-xl rounded-[2rem] border border-white shadow-[0_10px_40px_rgba(0,0,0,0.12)] p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-emerald-600" size={22} />
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-800">Admin Console</h3>
                    <p className="text-xs text-slate-500 font-medium">Approve accounts and manage access</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>

              {adminMessage && (
                <div className="mb-4 text-xs sm:text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                  {adminMessage}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                      <Users size={16} /> Pending approvals
                    </div>
                    <button
                      onClick={fetchPendingUsers}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      Refresh
                    </button>
                  </div>

                  {adminLoading ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <Loader className="animate-spin" size={14} /> Loading...
                    </div>
                  ) : pendingUsers.length === 0 ? (
                    <div className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl p-3">
                      No pending users right now.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {pendingUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2">
                          <div>
                            <div className="text-sm font-bold text-slate-700">{user.username}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(user.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAdminDecision(user.id, true)}
                              className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAdminDecision(user.id, false)}
                              className="px-2 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                      <LogOut size={16} /> Active sessions
                    </div>
                    <button
                      onClick={fetchAdminOverview}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      Refresh
                    </button>
                  </div>

                  {adminOverviewLoading ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <Loader className="animate-spin" size={14} /> Loading...
                    </div>
                  ) : adminSessions.length === 0 ? (
                    <div className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl p-3">
                      No active sessions right now.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {adminSessions.map((session) => (
                        <div key={session.id} className="bg-white border border-slate-200 rounded-xl p-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${session.approved ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                              <div className="text-sm font-bold text-slate-700">{session.username}</div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {session.role}
                              </span>
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400">
                              {formatDateTime(session.created_at)}
                            </div>
                          </div>
                          <div className="mt-1 text-[10px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                            <span>Last seen: {formatDateTime(session.last_seen_at)}</span>
                            <span>Expires: {formatDateTime(session.expires_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                      <User size={16} /> User directory
                    </div>
                    <button
                      onClick={fetchAdminOverview}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      Refresh
                    </button>
                  </div>

                  {adminOverviewLoading ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <Loader className="animate-spin" size={14} /> Loading...
                    </div>
                  ) : adminUsers.length === 0 ? (
                    <div className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl p-3">
                      No users found.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {adminUsers.map((user) => (
                        <div key={user.id} className="bg-white border border-slate-200 rounded-xl p-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-bold text-slate-700">{user.username}</div>
                              <div className="text-[10px] text-slate-500">
                                Role: <span className="font-semibold">{user.role}</span>
                              </div>
                            </div>
                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.approved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                              {user.approved ? 'Approved' : 'Pending'}
                            </div>
                          </div>
                          <div className="mt-1 text-[10px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                            <span>Created: {formatDateTime(user.created_at)}</span>
                            <span>Last login: {formatDateTime(user.last_login_at)}</span>
                            <span>Active sessions: {user.active_sessions}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-sm mb-3">
                    <KeyRound size={16} /> Change admin password
                  </div>
                  <form onSubmit={handleAdminPasswordChange} className="space-y-3">
                    <input
                      type="password"
                      value={adminPasswordCurrent}
                      onChange={(e) => setAdminPasswordCurrent(e.target.value)}
                      placeholder="Current password"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
                      required
                    />
                    <input
                      type="password"
                      value={adminPasswordNext}
                      onChange={(e) => setAdminPasswordNext(e.target.value)}
                      placeholder="New password"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
                      required
                    />
                    <input
                      type="password"
                      value={adminPasswordConfirm}
                      onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl text-sm font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md hover:shadow-lg transition-all"
                    >
                      Update password
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* LIGHT COMPACT HEADER                      */}
        {/* ========================================= */}
        <div className="bg-white/80 z-20 shrink-0 border-b border-slate-200/50 backdrop-blur-md">
          <div className="p-3 md:px-6 flex justify-between items-center gap-2">
            
            {/* Logo */}
            <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center gap-2 tracking-tight">
              <Calculator size={22} className="text-blue-600" /> <span className="hidden sm:block">Math Engine</span>
            </h1>

            {/* Central Toggle */}
            <div className="flex bg-slate-100/80 p-1 rounded-xl shadow-inner gap-1">
              <button 
                onClick={() => setOperation('multiply')}
                className={`flex items-center justify-center gap-1 flex-1 px-2 sm:px-3 py-1.5 rounded-lg font-bold transition-all duration-300 text-[11px] sm:text-sm ${operation === 'multiply' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <X size={14} /> Multiply
              </button>
              <button 
                onClick={() => setOperation('divide')}
                className={`flex items-center justify-center gap-1 flex-1 px-2 sm:px-3 py-1.5 rounded-lg font-bold transition-all duration-300 text-[11px] sm:text-sm ${operation === 'divide' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <div className="text-lg leading-none font-black">÷</div> Divide
              </button>
              <button
                onClick={() => setOperation('rrb')}
                className={`flex items-center justify-center gap-1 flex-1 px-2 sm:px-3 py-1.5 rounded-lg font-bold transition-all duration-300 text-[11px] sm:text-sm ${operation === 'rrb' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Target size={14} /> Quant Lab
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Difficulty Controls */}
              <div className="flex bg-slate-100/80 rounded-xl p-1 items-center shadow-inner">
                <Settings2 size={16} className="text-slate-400 ml-2 mr-1 hidden sm:block" />
                <button onClick={() => setDifficulty('easy')} className={`px-2 sm:px-3 py-1.5 rounded-lg font-bold transition-all text-xs sm:text-sm ${difficulty === 'easy' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Easy</button>
                <button onClick={() => setDifficulty('medium')} className={`px-2 sm:px-3 py-1.5 rounded-lg font-bold transition-all text-xs sm:text-sm ${difficulty === 'medium' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Med</button>
                <button onClick={() => setDifficulty('hard')} className={`px-2 sm:px-3 py-1.5 rounded-lg font-bold transition-all text-xs sm:text-sm ${difficulty === 'hard' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Hard</button>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => setShowAdminPanel(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <ShieldCheck size={14} /> Admin
                  </button>
                )}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 border border-slate-200 shadow-sm">
                  <User size={14} className="text-slate-500" />
                  <span className="text-xs font-bold text-slate-600">{currentUser?.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-white/80 border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {AUTH_ENABLED ? <LogOut size={14} /> : <Delete size={14} />}
                  {AUTH_ENABLED ? 'Logout' : 'Reset Data'}
                </button>
              </div>
            </div>
          </div>

          {/* Multiply Tab Navigation */}
          {operation === 'multiply' && gameStatus === 'idle' && (
            <div className="flex px-2 sm:px-6">
              <button onClick={() => setActiveTab('learn')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm md:text-base font-bold transition-all relative ${activeTab === 'learn' ? 'text-blue-600 bg-white/50 rounded-t-xl border-t border-x border-slate-200/50' : 'text-slate-400 hover:bg-slate-50/50 rounded-t-xl'}`}>
                <BookOpen size={18} /> Complete Tables
                {activeTab === 'learn' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
              </button>
              <button onClick={() => setActiveTab('games')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm md:text-base font-bold transition-all relative ${activeTab === 'games' ? 'text-blue-600 bg-white/50 rounded-t-xl border-t border-x border-slate-200/50' : 'text-slate-400 hover:bg-slate-50/50 rounded-t-xl'}`}>
                <Gamepad2 size={18} /> Training Arcade
                {activeTab === 'games' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
              </button>
            </div>
          )}
        </div>

        {/* ========================================= */}
        {/* MAIN NO-SCROLL CONTENT AREA               */}
        {/* ========================================= */}
        <div className="flex-grow flex flex-col relative w-full overflow-y-auto sm:overflow-hidden">
          
          {/* MULTIPLICATION: TABLE MASTERY */}
          {operation === 'multiply' && activeTab === 'learn' && gameStatus === 'idle' && (
             <div className="w-full h-full flex flex-col items-center justify-start p-4">
              
              {/* Top Controls: Level Pill & Number Selector */}
              <div className="w-full max-w-5xl flex flex-col items-center shrink-0">
                {/* Level Selector Pill */}
                <div className="bg-slate-100/80 p-1 rounded-full mb-4 flex shadow-inner w-full sm:w-auto">
                  <button onClick={() => setLevelRange('apprentice')} className={`flex-1 sm:w-48 flex justify-center items-center gap-2 px-4 py-2 rounded-full font-bold transition-all text-sm ${levelRange === 'apprentice' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Rocket size={16}/> Base (2-10)
                  </button>
                  <button onClick={() => setLevelRange('wizard')} className={`flex-1 sm:w-48 flex justify-center items-center gap-2 px-4 py-2 rounded-full font-bold transition-all text-sm ${levelRange === 'wizard' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Crown size={16}/> Master (11-20)
                  </button>
                </div>

                {/* Number Selector Circles */}
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4 w-full">
                  {currentNumbers.map((num, idx) => {
                    const t = themes[num];
                    const isCompleted = completedTables.includes(num);
                    return (
                      <div key={num} className="relative animate-in zoom-in fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                        <button
                          onClick={() => setSelectedTable(num)}
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full text-lg sm:text-xl font-black transition-all duration-300 transform 
                            ${selectedTable === num ? `${t.bg} text-white scale-110 shadow-lg ring-2 ring-white` : 'bg-white text-slate-500 border border-slate-200 shadow-sm hover:scale-105'}`}
                        >
                          {num}
                        </button>
                        {isCompleted && (
                          <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border-2 border-white shadow-sm z-10 animate-in zoom-in">
                            <CheckCircle2 size={12}/>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Title & Action */}
                <div className="w-full flex justify-between items-center mb-4 px-2">
                  <h3 className={`text-xl sm:text-2xl font-black ${currentTheme.text} flex items-center gap-2`}>
                    Table of {selectedTable}
                  </h3>
                  
                  {!isPracticing ? (
                    <button 
                      onClick={handlePracticeStart}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all text-sm border shadow-sm hover:shadow-md hover:-translate-y-0.5
                        ${completedTables.includes(selectedTable) ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-blue-600 border-blue-200'}`}
                    >
                      <PenTool size={16}/> 
                      {completedTables.includes(selectedTable) ? 'Practice Again' : 'Practice & Master'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => setIsPracticing(false)}
                      className="flex items-center gap-1 bg-slate-100 px-4 py-2 rounded-full font-bold text-slate-500 text-sm hover:bg-slate-200 transition-all border border-slate-200"
                    >
                      <ArrowLeft size={16}/> Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* CELEBRATION OVERLAY */}
              {feedback === 'practice_success' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm animate-in fade-in">
                  <div className="bg-white p-8 rounded-[2rem] text-center shadow-2xl flex flex-col items-center animate-in zoom-in-90 border border-slate-100">
                    <PartyPopper className="text-blue-500 mb-2" size={48} />
                    <h2 className="text-3xl font-black text-slate-800 mb-1">Mastered!</h2>
                    <p className="text-slate-500 font-medium">Table of {selectedTable} complete.</p>
                  </div>
                </div>
              )}

              {/* CONTENT AREA: Grid or Practice (Takes remaining height) */}
              <div className="w-full max-w-6xl flex-grow overflow-y-auto pb-4 custom-scrollbar">
                
                {/* PRACTICE VIEW */}
                {isPracticing ? (
                  <div className="w-full max-w-2xl mx-auto bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 w-full">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((multiplier, index) => (
                        <div key={multiplier} className="flex items-center justify-between bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-sm">
                          <div className="text-sm sm:text-base font-bold text-slate-500 flex items-center justify-center w-1/2 gap-1">
                            <span className={currentTheme.text}>{selectedTable}</span> × <span>{multiplier}</span> =
                          </div>
                          <input 
                            type="number"
                            value={practiceAnswers[index]}
                            onChange={(e) => {
                              const newAns = [...practiceAnswers];
                              newAns[index] = e.target.value;
                              setPracticeAnswers(newAns);
                              const newErr = [...practiceErrors];
                              newErr[index] = false;
                              setPracticeErrors(newErr);
                            }}
                            className={`w-16 sm:w-20 text-center text-lg sm:text-xl font-black py-1.5 rounded-lg outline-none transition-all
                              ${practiceErrors[index] ? 'bg-red-50 text-red-600 border-2 border-red-300' : 'bg-slate-50 border-2 border-slate-100 text-blue-600 focus:border-blue-400 focus:bg-white shadow-inner'}`}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {feedback === 'practice_error' && (
                      <div className="mt-4 text-red-500 text-sm font-bold animate-bounce bg-red-50 px-4 py-1.5 rounded-full">
                        Check the red boxes!
                      </div>
                    )}

                    <button 
                      onClick={handlePracticeSubmit}
                      className="mt-6 bg-blue-600 text-white font-bold text-base px-10 py-3 rounded-full shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all"
                    >
                      Check Answers
                    </button>
                  </div>
                ) : (
                  /* STATIC VIEW: Compact Card Grid */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 w-full h-full pb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((multiplier, idx) => (
                      <div 
                        key={multiplier} 
                        className="animate-in fade-in slide-in-from-bottom-4 bg-white/90 backdrop-blur-sm rounded-2xl p-3 flex flex-col items-center justify-center border border-white shadow-[0_4px_15px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all group"
                        style={{ animationDelay: `${idx * 20}ms`, animationFillMode: 'backwards' }}
                      >
                        <div className="text-slate-400 font-semibold mb-0.5 flex items-center justify-center gap-1 text-xs sm:text-sm">
                          <span className="text-slate-600">{selectedTable}</span> 
                          <span className="text-[10px]">×</span> 
                          <span className="text-slate-600">{multiplier}</span>
                          <span className="text-[10px] ml-0.5">=</span>
                        </div>
                        <div className={`text-3xl sm:text-4xl font-black ${currentTheme.text} transition-transform group-hover:scale-105`}>
                          {selectedTable * multiplier}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* MULTIPLICATION: EXPANDED GAMES MENU       */}
          {/* ========================================= */}
          {operation === 'multiply' && activeTab === 'games' && gameStatus === 'idle' && (
            <div className="w-full h-full flex flex-col items-center justify-start p-4 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-4">
              <div className="w-full max-w-6xl bg-white/60 backdrop-blur-md border border-white text-slate-700 p-4 rounded-2xl mb-6 font-bold flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-1.5 rounded-lg"><Gamepad2 className="text-blue-600" size={20}/></div>
                  <span>Arcade Selection</span>
                </div>
                <div className="flex gap-2 text-xs sm:text-sm">
                  <span className="bg-white/80 px-2 py-1 rounded-md shadow-sm">Lv: {levelRange === 'apprentice' ? '2-10' : '11-20'}</span>
                  <span className="bg-white/80 px-2 py-1 rounded-md shadow-sm text-blue-600 uppercase">{difficulty} Mode</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-6xl pb-4">
                {/* 1. Classic */}
                <button onClick={() => startGame('classic')} className="bg-white/80 backdrop-blur-sm border border-white hover:border-blue-200 hover:shadow-[0_8px_20px_rgba(37,99,235,0.08)] hover:-translate-y-1 transition-all rounded-[1.5rem] p-5 text-left group">
                  <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-500 group-hover:text-white transition-colors"><Star size={20} className="text-blue-500 group-hover:text-white" /></div>
                  <h3 className="text-lg font-black text-slate-800 mb-1">Classic Quiz</h3>
                  <p className="text-slate-500 text-xs font-medium">4 choices. Steady, focused practice.</p>
                </button>
                {/* 2. Time Attack */}
                <button onClick={() => startGame('time_attack')} className="bg-white/80 backdrop-blur-sm border border-white hover:border-orange-200 hover:shadow-[0_8px_20px_rgba(249,115,22,0.08)] hover:-translate-y-1 transition-all rounded-[1.5rem] p-5 text-left group">
                  <div className="bg-orange-50 w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:bg-orange-500 group-hover:text-white transition-colors"><Timer size={20} className="text-orange-500 group-hover:text-white" /></div>
                  <h3 className="text-lg font-black text-slate-800 mb-1">Time Attack</h3>
                  <p className="text-slate-500 text-xs font-medium">60 seconds. How fast can you calculate?</p>
                </button>
                {/* 3. Missing Link */}
                <button onClick={() => startGame('missing_number')} className="bg-white/80 backdrop-blur-sm border border-white hover:border-teal-200 hover:shadow-[0_8px_20px_rgba(20,184,166,0.08)] hover:-translate-y-1 transition-all rounded-[1.5rem] p-5 text-left group">
                  <div className="bg-teal-50 w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:bg-teal-500 group-hover:text-white transition-colors"><HelpCircle size={20} className="text-teal-500 group-hover:text-white" /></div>
                  <h3 className="text-lg font-black text-slate-800 mb-1">Missing Link</h3>
                  <p className="text-slate-500 text-xs font-medium">Find the missing puzzle piece.</p>
                </button>
                {/* 4. True or False */}
                <button onClick={() => startGame('true_false')} className="bg-white/80 backdrop-blur-sm border border-white hover:border-emerald-200 hover:shadow-[0_8px_20px_rgba(16,185,129,0.08)] hover:-translate-y-1 transition-all rounded-[1.5rem] p-5 text-left group">
                  <div className="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><CheckSquare size={20} className="text-emerald-500 group-hover:text-white" /></div>
                  <h3 className="text-lg font-black text-slate-800 mb-1">True or False</h3>
                  <p className="text-slate-500 text-xs font-medium">Fast-paced logic. Is the answer correct?</p>
                </button>
                {/* 5. Grid Strike */}
                <button onClick={() => startGame('grid_strike')} className="bg-white/80 backdrop-blur-sm border border-white hover:border-indigo-200 hover:shadow-[0_8px_20px_rgba(99,102,241,0.08)] hover:-translate-y-1 transition-all rounded-[1.5rem] p-5 text-left group">
                  <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:bg-indigo-500 group-hover:text-white transition-colors"><Grid3X3 size={20} className="text-indigo-500 group-hover:text-white" /></div>
                  <h3 className="text-lg font-black text-slate-800 mb-1">Grid Strike (Bingo)</h3>
                  <p className="text-slate-500 text-xs font-medium">Scan a 3x3 grid to quickly find the right answer.</p>
                </button>
                {/* 6. Find the Imposter */}
                <button onClick={() => startGame('imposter')} className="bg-white/80 backdrop-blur-sm border border-white hover:border-rose-200 hover:shadow-[0_8px_20px_rgba(244,63,94,0.08)] hover:-translate-y-1 transition-all rounded-[1.5rem] p-5 text-left group">
                  <div className="bg-rose-50 w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:bg-rose-500 group-hover:text-white transition-colors"><ShieldAlert size={20} className="text-rose-500 group-hover:text-white" /></div>
                  <h3 className="text-lg font-black text-slate-800 mb-1">Find the Imposter</h3>
                  <p className="text-slate-500 text-xs font-medium">3 equations are correct, 1 is a lie. Spot the fake!</p>
                </button>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* QUANT PRACTICE                             */}
          {/* ========================================= */}
          {operation === 'rrb' && (
            <div className="w-full h-full flex flex-col items-center justify-start p-4 overflow-hidden custom-scrollbar animate-in fade-in slide-in-from-bottom-4 rounded-[1.75rem] bg-gradient-to-br from-emerald-50/65 via-sky-50/60 to-rose-50/55 border border-white/80">
              <div className="w-full max-w-6xl bg-gradient-to-r from-emerald-100/75 via-white/75 to-cyan-100/75 backdrop-blur-md border border-white text-slate-700 p-4 rounded-2xl mb-4 font-bold flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-xl"><Target className="text-emerald-600" size={20}/></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">MATH FOCUS</span>
                    <span className="text-lg sm:text-xl font-black text-slate-800 leading-tight">Quant Practice</span>
                    <span className="text-xs text-slate-500 font-medium">Percentage • Discount • Time & Work • Train Problems</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs sm:text-sm">
                  <span className="bg-white/80 px-2 py-1 rounded-md shadow-sm">
                    Answered: {rrbPageAnsweredCount}/{Math.min(RRB_PAGE_SIZE, Math.max(0, rrbQuestions.length - rrbPage * RRB_PAGE_SIZE))}
                  </span>
                  <span className="bg-white/80 px-2 py-1 rounded-md shadow-sm">Page {rrbPage + 1} / {rrbTotalPages}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRrbPage((prev) => Math.max(0, prev - 1))}
                      disabled={rrbPage === 0}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border ${rrbPage === 0 ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                    >
                      Prev {RRB_PAGE_SIZE}
                    </button>
                    <button
                      onClick={() => setRrbPage((prev) => Math.min(prev + 1, rrbTotalPages - 1))}
                      disabled={rrbPage >= rrbTotalPages - 1}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border ${rrbPage >= rrbTotalPages - 1 ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                    >
                      Next {RRB_PAGE_SIZE}
                    </button>
                  </div>
                  <button
                    onClick={handleRrbReset}
                    className="bg-white/80 px-2 py-1 rounded-md shadow-sm font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 transition-colors"
                  >
                    Reset Progress
                  </button>
                </div>
              </div>

              <div className="w-full max-w-6xl flex flex-wrap gap-2 mb-4 shrink-0">
                {rrbTopics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => setRrbTopic(topic.id)}
                    className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold border transition-all ${
                      rrbTopic === topic.id ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {topic.label}
                    <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${rrbTopic === topic.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {(rrbQuestionBank[topic.id] || []).length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="w-full max-w-6xl flex-grow min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-2 rounded-2xl p-2 bg-gradient-to-br from-white/55 via-sky-50/45 to-emerald-50/45 border border-white/80">
                {rrbDataLoading ? (
                  <div className="w-full bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 text-center text-slate-500 font-medium flex items-center justify-center gap-2">
                    <Loader className="animate-spin text-emerald-600" size={18} />
                    Loading question bank...
                  </div>
                ) : rrbQuestions.length === 0 ? (
                  <div className="w-full bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 text-center text-slate-500 font-medium">
                    Questions will appear here once you share the list.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {rrbPageQuestions.map((question, index) => {
                      const result = rrbResults[question.id];
                      const cardTone = [
                        'from-emerald-50/90 via-white/95 to-cyan-50/75 border-emerald-100',
                        'from-blue-50/90 via-white/95 to-indigo-50/75 border-blue-100',
                        'from-rose-50/90 via-white/95 to-pink-50/75 border-rose-100',
                        'from-amber-50/90 via-white/95 to-orange-50/75 border-amber-100',
                      ][(rrbPage * RRB_PAGE_SIZE + index) % 4];
                      return (
                        <div key={question.id} className={`bg-gradient-to-br ${cardTone} backdrop-blur-sm rounded-2xl p-3 sm:p-4 border shadow-sm flex flex-col gap-3`}>
                          <div className="text-sm sm:text-base text-slate-700 font-semibold leading-relaxed">
                            <span className="text-slate-400 font-black mr-2">Q{rrbPage * RRB_PAGE_SIZE + index + 1}.</span>
                            {question.text}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="Your answer"
                              value={rrbAnswers[question.id] || ''}
                              onChange={(e) => handleRrbAnswerChange(question.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRrbCheck(question);
                              }}
                              className="w-full sm:w-56 text-center text-base sm:text-lg font-black py-2 rounded-xl outline-none transition-all bg-slate-50 border-2 border-slate-100 text-emerald-600 focus:border-emerald-400 focus:bg-white shadow-inner"
                            />
                            <button
                              onClick={() => handleRrbCheck(question)}
                              className="px-4 py-2 rounded-xl font-bold text-sm sm:text-base bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-emerald-500/30 transition-all"
                            >
                              Check
                            </button>
                          </div>
                          {result && (
                            <div
                              className={`text-xs sm:text-sm font-bold flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                                result.status === 'correct'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : result.status === 'incorrect'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : result.status === 'unknown'
                                      ? 'bg-slate-50 text-slate-600 border-slate-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {result.status === 'correct' && (<><CheckCircle2 size={14}/> Correct! Answer: {result.answer}</>)}
                              {result.status === 'incorrect' && (<><X size={14}/> Incorrect. Answer: {result.answer}</>)}
                              {result.status === 'unknown' && (<><HelpCircle size={14}/> Answer key not available.</>)}
                              {result.status === 'empty' && (<><HelpCircle size={14}/> Enter an answer to check.</>)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* DIVISION MODE: DIRECT ENTRY (CHALLENGE FOCUSED) */}
          {/* ========================================= */}
          {operation === 'divide' && question && gameStatus === 'playing' && (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-500">
              
              <div className="w-full max-w-5xl flex justify-between items-center mb-4 bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-sm shrink-0 border border-white">
                <div className="flex items-center gap-3">
                  <div className="bg-pink-100 p-2 rounded-xl"><Zap className="text-pink-500" size={20}/></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Score</span>
                    <span className="text-2xl font-black text-pink-600 leading-none">{score}</span>
                  </div>
                </div>
                {difficulty === 'hard' && (
                  <div className="hidden sm:flex bg-gradient-to-r from-rose-500 to-pink-500 text-white px-3 py-1 rounded-lg items-center gap-2 shadow-sm text-xs font-bold uppercase tracking-wide animate-pulse">
                    <Target size={14}/> Olympiad Level
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl">
                  <Star className="text-amber-400 fill-amber-400" size={16}/>
                  <span className="text-slate-700 font-black text-lg">{streak}</span>
                </div>
              </div>

              <div className="w-full max-w-5xl flex-grow flex flex-col md:flex-row gap-6 justify-center items-center bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-white relative overflow-hidden">
                <div className={`absolute inset-0 z-0 transition-opacity duration-300 ${feedback === 'correct' ? 'opacity-100 bg-green-500' : 'opacity-0'}`}></div>
                <div className={`absolute inset-0 z-0 transition-all duration-300 ${feedback === 'incorrect' ? 'opacity-100 bg-red-50 animate-shake border-4 border-red-500' : 'opacity-0'}`}></div>

                {/* Left Side: Equation */}
                <div className="relative z-10 w-full md:w-1/2 flex flex-col items-center justify-center">
                  {!feedback && !showTrick && (
                    <button onClick={() => setShowTrick(true)} className="mb-4 text-amber-500 bg-amber-50 hover:bg-amber-100 px-4 py-1.5 rounded-full font-bold flex items-center gap-2 border border-amber-200 transition-colors shadow-sm text-xs">
                      <Lightbulb size={14} /> Trick
                    </button>
                  )}
                  {showTrick && !feedback && (
                    <div className="w-full max-w-xs bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left shadow-sm mb-4 animate-in slide-in-from-top-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-amber-800 flex items-center gap-1 text-xs uppercase"><Lightbulb size={14}/> Hack</h4>
                        <button onClick={() => setShowTrick(false)} className="text-amber-600 hover:bg-amber-200 p-1 rounded-full"><X size={14}/></button>
                      </div>
                      <p className="text-amber-900 font-medium text-sm leading-snug">{question.trick[1]}</p>
                    </div>
                  )}

                  <div className={`flex flex-col items-center gap-3 w-full transition-colors ${feedback === 'correct' ? 'text-white' : 'text-slate-800'}`}>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-5xl sm:text-7xl font-black tracking-tighter">{question.display.n1}</span>
                      <span className={`text-3xl sm:text-5xl ${feedback === 'correct' ? 'text-white/70' : 'text-slate-300'}`}>÷</span>
                      <span className="text-5xl sm:text-7xl font-black tracking-tighter">{question.display.n2}</span>
                    </div>
                    
                    <div className={`w-24 sm:w-32 h-16 sm:h-20 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl font-black transition-all mt-2
                      ${feedback === 'correct' ? 'bg-green-600 text-white scale-110 shadow-lg' : 
                        feedback === 'incorrect' ? 'bg-red-100 border-2 border-red-300 text-red-600' : 
                        'bg-slate-50 border-2 border-slate-200 text-blue-600 shadow-inner'}`}
                    >
                      {inputValue || <span className="opacity-20 font-light animate-pulse">|</span>}
                    </div>
                  </div>
                </div>

                {/* Right Side: Numpad */}
                <div className="relative z-10 w-full md:w-1/2 max-w-[280px]">
                  {!feedback && (
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full animate-in slide-in-from-bottom-8">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button key={num} onClick={() => handleNumpad(num.toString())} className="bg-white hover:bg-slate-50 text-slate-700 font-black text-xl py-3 rounded-xl border border-slate-200 shadow-[0_4px_0_0_rgba(226,232,240,1)] active:shadow-none active:translate-y-1 transition-all">
                          {num}
                        </button>
                      ))}
                      <button onClick={() => handleNumpad('DEL')} className="bg-red-50 hover:bg-red-100 text-red-500 font-black flex items-center justify-center py-3 rounded-xl border border-red-100 shadow-[0_4px_0_0_rgba(254,226,226,1)] active:shadow-none active:translate-y-1 transition-all">
                        <Delete size={20}/>
                      </button>
                      <button onClick={() => handleNumpad('0')} className="bg-white hover:bg-slate-50 text-slate-700 font-black text-xl py-3 rounded-xl border border-slate-200 shadow-[0_4px_0_0_rgba(226,232,240,1)] active:shadow-none active:translate-y-1 transition-all">
                        0
                      </button>
                      <button onClick={() => handleNumpad('ENTER')} className="bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center justify-center py-3 rounded-xl shadow-[0_4px_0_0_rgba(37,99,235,1)] active:shadow-none active:translate-y-1 transition-all">
                        ENTER
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* MULTIPLICATION ACTIVE GAMEPLAY            */}
          {/* ========================================= */}
          {operation === 'multiply' && activeTab === 'games' && gameStatus === 'playing' && question && (
             <div className="w-full h-full flex flex-col items-center justify-center p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              <div className="w-full max-w-5xl flex justify-between items-center mb-4 bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-sm shrink-0 border border-white">
                <button onClick={() => setGameStatus('idle')} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm">
                  <ArrowLeft size={16} /> Exit
                </button>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end leading-none">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Score</span>
                    <span className="text-xl font-black text-blue-600">{score}</span>
                  </div>
                  {gameMode === 'time_attack' && (
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-lg font-black text-base ${timeLeft <= 10 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-white border border-slate-200 text-slate-700'}`}>
                      <Timer size={16} /> {timeLeft}s
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full max-w-5xl flex-grow flex flex-col justify-center bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 text-center shadow-lg border border-white relative overflow-hidden min-h-[400px]">
                <div className={`absolute inset-0 z-0 transition-opacity duration-300 ${feedback === 'correct' ? 'opacity-100 bg-green-500' : 'opacity-0'} pointer-events-none`}></div>
                <div className={`absolute inset-0 z-0 transition-opacity duration-300 ${feedback === 'incorrect' ? 'opacity-100 bg-red-500' : 'opacity-0'} pointer-events-none`}></div>

                <div className="relative z-10 flex flex-col h-full justify-between items-center w-full">
                  {!feedback && gameMode !== 'time_attack' && !showTrick && (
                    <button onClick={() => setShowTrick(true)} className="absolute -top-2 right-0 text-amber-500 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full font-bold flex items-center gap-1 border border-amber-200 transition-colors z-20 shadow-sm text-xs">
                      <Lightbulb size={14} /> Trick
                    </button>
                  )}
                  {showTrick && !feedback && (
                    <div className="absolute top-0 left-0 right-0 bg-amber-50 border border-amber-200 rounded-2xl p-3 text-left shadow-lg z-20 animate-in slide-in-from-top-4 max-w-xs mx-auto">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-amber-800 flex items-center gap-1 uppercase tracking-wide text-[10px]"><Lightbulb size={12}/> How to solve</h4>
                        <button onClick={() => setShowTrick(false)} className="text-amber-600 hover:bg-amber-200 p-1 rounded-full"><X size={12}/></button>
                      </div>
                      <ul className="space-y-1 text-amber-900 font-medium text-xs">
                        {question.trick.map((step, i) => (<li key={i} className="flex gap-1.5"><span className="text-amber-500 font-black">•</span> {step}</li>))}
                      </ul>
                    </div>
                  )}
                  
                  <div className={`mb-6 flex-grow flex justify-center items-center ${feedback ? 'text-white' : 'text-slate-800'} ${showTrick ? 'mt-20' : 'mt-2'} transition-all`}>
                     {question.display.type === 'missing' ? (
                       <div className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-wider bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm leading-tight">
                         {question.display.text}
                       </div>
                     ) : (
                       <div className="text-5xl sm:text-7xl font-black flex items-center gap-3 tracking-tighter">
                          <span>{question.display.n1}</span>
                          <span className={`text-3xl sm:text-5xl ${feedback ? 'text-white/50' : 'text-slate-300'}`}>×</span>
                          <span>{question.display.n2}</span>
                        </div>
                     )}
                  </div>

                  <div className={`grid gap-3 w-full ${gameMode === 'grid_strike' ? 'grid-cols-3 max-w-md' : gameMode === 'imposter' ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl' : 'grid-cols-2 max-w-lg'}`}>
                    {question.options.map((opt, idx) => {
                      const optVal = typeof opt === 'object' ? opt.text : opt;
                      let btnState = "bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 shadow-sm";
                      
                      if (feedback) {
                        if (optVal === question.answer) btnState = "bg-white text-green-600 border-none scale-105 shadow-xl"; 
                        else if (optVal === selectedAnswer) btnState = "bg-red-600 text-white border-none"; 
                        else btnState = "bg-white/20 text-white/50 border-none opacity-50"; 
                      } else if (gameMode === 'true_false') {
                        if (optVal === 'True') btnState = "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-sm hover:-translate-y-0.5";
                        if (optVal === 'False') btnState = "bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 shadow-sm hover:-translate-y-0.5";
                      }
                      
                      return (
                        <button key={idx} onClick={() => handleAnswerClick(optVal)} disabled={feedback !== null} className={`font-black rounded-2xl transition-all duration-300 flex items-center justify-center py-4 sm:py-6 ${gameMode === 'grid_strike' ? 'text-xl sm:text-3xl aspect-square' : gameMode === 'imposter' ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'} ${btnState}`}>
                          {optVal}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GAME OVER SCREEN (Shared) */}
          {activeTab === 'games' && gameStatus === 'gameover' && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <div className="animate-in zoom-in duration-500 w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-[2rem] p-8 text-center shadow-[0_10px_40px_rgb(0,0,0,0.08)] border border-white">
                <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Timer className="text-orange-500" size={32} /></div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Time's Up!</h2>
                <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 flex flex-col items-center">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1">Final Score</p>
                  <p className="text-5xl font-black text-blue-600 tracking-tighter">{score}</p>
                </div>
                <div className="flex gap-2 justify-center">
                  <button onClick={() => setGameStatus('idle')} className="flex-1 py-2.5 rounded-xl font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-sm">Menu</button>
                  <button onClick={() => startGame('time_attack')} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 transition-all hover:-translate-y-0.5 text-sm">Play Again</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Internal CSS for Custom scrollbar to ensure cleanliness */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}
