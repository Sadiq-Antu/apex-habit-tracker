import { useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  db 
} from './firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';

function App() {
  // Connection and Configuration state
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  
  // Auth state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // App data state
  const [habits, setHabits] = useState([]);
  const [focusTasks, setFocusTasks] = useState([]);
  
  // Navigation / Tab state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal control states
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Auth Form state
  const [authTab, setAuthTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');

  // Form input states
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitProtocol, setNewHabitProtocol] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('bolt');
  const [newHabitStreak, setNewHabitStreak] = useState('0'); // Initial streak override option

  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('09:00');

  // Stats
  const [willpowerScore, setWillpowerScore] = useState(100);
  const [sleepQuality, setSleepQuality] = useState(85);
  const [recoveryRate, setRecoveryRate] = useState(80);

  // Predefined icons for selection
  const iconList = [
    { name: 'bolt', label: 'Energy' },
    { name: 'ac_unit', label: 'Cold Plunge' },
    { name: 'psychology', label: 'Deep Work' },
    { name: 'water_drop', label: 'Hydration' },
    { name: 'fitness_center', label: 'Workout' },
    { name: 'local_fire_department', label: 'Meditation' },
    { name: 'book', label: 'Reading' },
    { name: 'bedtime', label: 'Sleep' },
    { name: 'speed', label: 'Speed' },
    { name: 'stars', label: 'Rating' }
  ];

  // Check if Firebase is configured
  useEffect(() => {
    const hasConfig = import.meta.env.VITE_FIREBASE_API_KEY && 
                      import.meta.env.VITE_FIREBASE_API_KEY !== 'your_api_key_here';
    setIsFirebaseConfigured(!!hasConfig);
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Format date helper: YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getPastDateString = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayString = getTodayString();

  // Authentication logic
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // Load mock/local user if any from localStorage
      const localUser = localStorage.getItem('apex_user');
      if (localUser) {
        setUser(JSON.parse(localUser));
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isFirebaseConfigured]);

  // Sync Habits and Focus Tasks
  useEffect(() => {
    if (loading) return;

    if (!user) {
      setHabits([]);
      setFocusTasks([]);
      return;
    }

    if (!isFirebaseConfigured || !db || user.uid === 'demo') {
      // Local Storage Sync (Demo Mode)
      const loadLocalData = () => {
        const storedHabits = localStorage.getItem(`apex_habits_${user.uid}`);
        const storedTasks = localStorage.getItem(`apex_tasks_${user.uid}`);
        
        if (storedHabits) {
          setHabits(JSON.parse(storedHabits));
        } else {
          // Add default mock habits if empty
          const defaults = [
            { id: '1', userId: user.uid, name: 'Cold Plunge', protocol: 'Vagus Nerve Stimulation Protocol', icon: 'ac_unit', streak: 14, completions: { [getPastDateString(1)]: true, [getPastDateString(2)]: true, [getPastDateString(3)]: false, [getPastDateString(4)]: true, [getPastDateString(5)]: true } },
            { id: '2', userId: user.uid, name: 'Deep Work', protocol: '90 Min Cognitive Focus Block', icon: 'psychology', streak: 8, completions: { [getPastDateString(1)]: true, [getPastDateString(2)]: true, [getPastDateString(3)]: false, [getPastDateString(4)]: true } },
            { id: '3', userId: user.uid, name: 'Hydration', protocol: '4L Electrolyte Base Protocol', icon: 'water_drop', streak: 32, completions: { [getPastDateString(1)]: true, [getPastDateString(2)]: true, [getPastDateString(3)]: true, [getPastDateString(4)]: true, [getPastDateString(5)]: true, [getPastDateString(6)]: true } }
          ];
          setHabits(defaults);
          localStorage.setItem(`apex_habits_${user.uid}`, JSON.stringify(defaults));
        }

        if (storedTasks) {
          setFocusTasks(JSON.parse(storedTasks));
        } else {
          // Add default mock tasks
          const defaults = [
            { id: 't1', userId: user.uid, name: 'Deep Work: Project Stratos Architecture', time: '09:00', completed: true, date: todayString },
            { id: 't2', userId: user.uid, name: 'Sprint Review: Neural Engine v2', time: '14:00', completed: false, date: todayString },
            { id: 't3', userId: user.uid, name: 'Strategic Recovery: Zone 2 Protocol', time: '17:30', completed: false, date: todayString }
          ];
          setFocusTasks(defaults);
          localStorage.setItem(`apex_tasks_${user.uid}`, JSON.stringify(defaults));
        }
      };

      loadLocalData();
    } else {
      // Firebase Firestore Sync
      const habitsQuery = query(
        collection(db, "habits"), 
        where("userId", "==", user.uid)
      );

      const unsubscribeHabits = onSnapshot(habitsQuery, (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setHabits(list);
      });

      const tasksQuery = query(
        collection(db, "tasks"), 
        where("userId", "==", user.uid),
        where("date", "==", todayString)
      );

      const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setFocusTasks(list);
      });

      return () => {
        unsubscribeHabits();
        unsubscribeTasks();
      };
    }
  }, [user, loading, isFirebaseConfigured]);

  // Willpower Score Calculator
  useEffect(() => {
    if (habits.length === 0 && focusTasks.length === 0) {
      setWillpowerScore(100);
      return;
    }

    let completedCount = 0;
    let totalCount = habits.length + focusTasks.length;

    habits.forEach(h => {
      if (h.completions && h.completions[todayString]) {
        completedCount++;
      }
    });

    focusTasks.forEach(t => {
      if (t.completed) {
        completedCount++;
      }
    });

    const score = Math.round((completedCount / totalCount) * 100);
    setWillpowerScore(score);
  }, [habits, focusTasks]);

  // Auth Handlers
  const handleGoogleLogin = async () => {
    setAuthError('');
    if (!isFirebaseConfigured || !auth) {
      // Demo Mode login
      const demoUser = {
        uid: 'demo',
        displayName: 'Apex Elite User',
        email: 'elite@apex.io',
        photoURL: null
      };
      setUser(demoUser);
      localStorage.setItem('apex_user', JSON.stringify(demoUser));
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Auth error during sign in:", error);
      setAuthError(error.message.replace('Firebase: ', '').toUpperCase());
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!email.trim() || !password.trim()) return;

    if (!isFirebaseConfigured || !auth) {
      // Local Demo Mode Sign In
      const localUsers = JSON.parse(localStorage.getItem('apex_demo_users') || '{}');
      const savedUser = localUsers[email.toLowerCase()];
      
      if (savedUser && savedUser.password === password) {
        const demoUser = {
          uid: savedUser.uid,
          displayName: savedUser.displayName,
          email: savedUser.email,
          photoURL: null
        };
        setUser(demoUser);
        localStorage.setItem('apex_user', JSON.stringify(demoUser));
      } else if (savedUser) {
        setAuthError('INVALID CREDENTIALS // PASSWORD INCORRECT');
      } else {
        // Create demo account automatically for testing
        const uid = 'demo_' + Date.now();
        const demoUser = {
          uid: uid,
          displayName: email.split('@')[0],
          email: email,
          photoURL: null
        };
        localUsers[email.toLowerCase()] = { ...demoUser, password };
        localStorage.setItem('apex_demo_users', JSON.stringify(localUsers));
        setUser(demoUser);
        localStorage.setItem('apex_user', JSON.stringify(demoUser));
      }
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Email sign in error:", error);
      let msg = error.message.replace('Firebase: ', '').toUpperCase();
      if (error.code === 'auth/invalid-credential') {
        msg = 'INVALID CREDENTIALS // EMAIL OR PASSWORD INCORRECT';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'INVALID EMAIL PROTOCOL FORMAT';
      }
      setAuthError(msg);
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!email.trim() || !password.trim() || !displayName.trim()) return;

    if (!isFirebaseConfigured || !auth) {
      const localUsers = JSON.parse(localStorage.getItem('apex_demo_users') || '{}');
      if (localUsers[email.toLowerCase()]) {
        setAuthError('REGISTRATION FAILED // EMAIL ALREADY EXECUTED');
        return;
      }
      const uid = 'demo_' + Date.now();
      const demoUser = {
        uid: uid,
        displayName: displayName,
        email: email,
        photoURL: null
      };
      localUsers[email.toLowerCase()] = { ...demoUser, password };
      localStorage.setItem('apex_demo_users', JSON.stringify(localUsers));
      setUser(demoUser);
      localStorage.setItem('apex_user', JSON.stringify(demoUser));
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
      setUser({ ...userCredential.user, displayName });
    } catch (error) {
      console.error("Email sign up error:", error);
      let msg = error.message.replace('Firebase: ', '').toUpperCase();
      if (error.code === 'auth/email-already-in-use') {
        msg = 'REGISTRATION FAILED // EMAIL ALREADY IN DATABASE';
      } else if (error.code === 'auth/weak-password') {
        msg = 'SECURITY ERROR // PASSWORD MUST BE AT LEAST 6 CHARACTERS';
      }
      setAuthError(msg);
    }
  };

  const handleLogout = async () => {
    if (!isFirebaseConfigured || !auth || user?.uid === 'demo') {
      setUser(null);
      localStorage.removeItem('apex_user');
      return;
    }

    try {
      await signOut(auth);
    } catch (error) {
      console.error("Auth error during sign out:", error);
    }
  };

  // Add Habit
  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const parsedStreak = parseInt(newHabitStreak) || 0;
    const habitData = {
      userId: user.uid,
      name: newHabitName,
      protocol: newHabitProtocol || 'General Optimization',
      icon: newHabitIcon,
      streak: parsedStreak,
      completions: {},
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseConfigured || !db || user.uid === 'demo') {
      // Save locally
      const updated = [...habits, { id: Date.now().toString(), ...habitData }];
      setHabits(updated);
      localStorage.setItem(`apex_habits_${user.uid}`, JSON.stringify(updated));
    } else {
      // Save to Firestore
      try {
        await addDoc(collection(db, "habits"), habitData);
      } catch (err) {
        console.error("Error adding habit:", err);
      }
    }

    // Reset fields
    setNewHabitName('');
    setNewHabitProtocol('');
    setNewHabitIcon('bolt');
    setNewHabitStreak('0');
    setIsHabitModalOpen(false);
  };

  // Check-in Habit
  const handleCheckInHabit = async (habit) => {
    const isCompleted = habit.completions && habit.completions[todayString];
    const newCompletions = { ...(habit.completions || {}) };
    let newStreak = habit.streak || 0;

    if (isCompleted) {
      // Toggle off
      delete newCompletions[todayString];
      newStreak = Math.max(0, newStreak - 1);
    } else {
      // Toggle on
      newCompletions[todayString] = true;
      newStreak = newStreak + 1;
    }

    if (!isFirebaseConfigured || !db || user.uid === 'demo') {
      const updated = habits.map(h => 
        h.id === habit.id ? { ...h, completions: newCompletions, streak: newStreak } : h
      );
      setHabits(updated);
      localStorage.setItem(`apex_habits_${user.uid}`, JSON.stringify(updated));
    } else {
      try {
        const docRef = doc(db, "habits", habit.id);
        await updateDoc(docRef, {
          completions: newCompletions,
          streak: newStreak
        });
      } catch (err) {
        console.error("Error checking in habit:", err);
      }
    }
  };

  // Delete Habit
  const handleDeleteHabit = async (habitId) => {
    if (!window.confirm("Confirm deletion of this protocol? All progress records will be removed.")) return;
    
    if (!isFirebaseConfigured || !db || user.uid === 'demo') {
      const updated = habits.filter(h => h.id !== habitId);
      setHabits(updated);
      localStorage.setItem(`apex_habits_${user.uid}`, JSON.stringify(updated));
    } else {
      try {
        await deleteDoc(doc(db, "habits", habitId));
      } catch (err) {
        console.error("Error deleting habit:", err);
      }
    }
  };

  // Add Focus Task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    const taskData = {
      userId: user.uid,
      name: newTaskName,
      time: newTaskTime,
      completed: false,
      date: todayString,
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseConfigured || !db || user.uid === 'demo') {
      const updated = [...focusTasks, { id: Date.now().toString(), ...taskData }];
      setFocusTasks(updated);
      localStorage.setItem(`apex_tasks_${user.uid}`, JSON.stringify(updated));
    } else {
      try {
        await addDoc(collection(db, "tasks"), taskData);
      } catch (err) {
        console.error("Error adding task:", err);
      }
    }

    setNewTaskName('');
    setIsTaskModalOpen(false);
  };

  // Toggle Task Completion
  const handleToggleTask = async (task) => {
    const nextState = !task.completed;

    if (!isFirebaseConfigured || !db || user.uid === 'demo') {
      const updated = focusTasks.map(t => 
        t.id === task.id ? { ...t, completed: nextState } : t
      );
      setFocusTasks(updated);
      localStorage.setItem(`apex_tasks_${user.uid}`, JSON.stringify(updated));
    } else {
      try {
        const docRef = doc(db, "tasks", task.id);
        await updateDoc(docRef, { completed: nextState });
      } catch (err) {
        console.error("Error updating task:", err);
      }
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    if (!isFirebaseConfigured || !db || user.uid === 'demo') {
      const updated = focusTasks.filter(t => t.id !== taskId);
      setFocusTasks(updated);
      localStorage.setItem(`apex_tasks_${user.uid}`, JSON.stringify(updated));
    } else {
      try {
        await deleteDoc(doc(db, "tasks", taskId));
      } catch (err) {
        console.error("Error deleting task:", err);
      }
    }
  };

  // Heatmap rendering helpers
  // Let's generate a matrix of the last 28 days (4 weeks) mapped to days of the week Mon-Sun
  const renderHeatmap = () => {
    const cells = [];
    const daysToShow = 28;

    // To align Mon-Sun, let's find the dates
    for (let i = daysToShow - 1; i >= 0; i--) {
      const dateStr = getPastDateString(i);
      
      // Calculate completion % for this day
      let completed = 0;
      let total = habits.length;
      
      habits.forEach(h => {
        if (h.completions && h.completions[dateStr]) {
          completed++;
        }
      });

      const pct = total > 0 ? (completed / total) : 0;
      cells.push({ date: dateStr, percentage: pct });
    }

    return cells.map((cell, idx) => {
      let bgStyle = 'bg-surface-container-highest';
      let shadowGlow = '';
      
      if (cell.percentage > 0 && cell.percentage <= 0.33) bgStyle = 'bg-primary-container/20';
      else if (cell.percentage > 0.33 && cell.percentage <= 0.66) bgStyle = 'bg-primary-container/60';
      else if (cell.percentage > 0.66 && cell.percentage < 1.0) bgStyle = 'bg-primary-container/85';
      else if (cell.percentage === 1.0) {
        bgStyle = 'bg-primary-container';
        // Add a soft cyan drop-shadow for 100% days to mimic the glow in mock
        shadowGlow = 'shadow-[0_0_12px_rgba(0,240,255,0.4)] border border-primary/30';
      }

      return (
        <div 
          key={idx}
          className={`aspect-square ${bgStyle} ${shadowGlow} transition-all duration-300 relative group cursor-pointer`}
          title={`${cell.date}: ${Math.round(cell.percentage * 100)}% Protocols Completed`}
        >
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-surface-container-low border border-outline-variant px-2 py-1 text-[10px] font-mono whitespace-nowrap">
            {cell.date} // {Math.round(cell.percentage * 100)}%
          </div>
        </div>
      );
    });
  };

  // Sparkline generator helper
  const renderSparkline = (habit) => {
    const sparkPoints = [];
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const dateStr = getPastDateString(i);
      const isDone = habit.completions && habit.completions[dateStr];
      sparkPoints.push(isDone ? 100 : 15); // height percentage
    }

    return (
      <div className="h-12 w-full flex items-end gap-1 mb-6">
        {sparkPoints.map((h, i) => (
          <div 
            key={i} 
            style={{ height: `${h}%` }}
            className={`flex-1 transition-all duration-300 ${
              h > 50 
                ? 'bg-primary-container shadow-[0_0_8px_rgba(0,240,255,0.3)]' 
                : 'bg-outline-variant/30'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-primary-container font-mono text-label-mono uppercase tracking-widest">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-4xl animate-spin" style={{ color: '#00F0FF' }}>sync</span>
          <span>INITIALIZING SYSTEM...</span>
        </div>
      </div>
    );
  }

  // LOGOUT/LOGIN SCREEN
  if (!user) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center bg-background py-12 px-6 overflow-hidden">
        {/* Luminous accents in background */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-container/5 rounded-full filter blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-container/5 rounded-full filter blur-[100px] pointer-events-none"></div>

        <div className="relative w-full max-w-md glass-card p-10 border border-outline-variant/30 z-10 flex flex-col items-center text-center">
          
          {/* Futuristic Tech Logo */}
          <div className="w-16 h-16 bg-primary-container/10 border border-primary-container/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
            <span className="material-symbols-outlined text-3xl text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          </div>

          <h1 className="font-headline text-3xl text-primary-container tracking-tighter font-black italic uppercase mb-1">
            APEX PERFORMANCE
          </h1>
          <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mb-6">
            Habit Command Center // Stratos-1
          </p>

          {/* Auth System Tabs */}
          <div className="flex w-full mb-6 border-b border-outline-variant/20">
            <button 
              onClick={() => { setAuthTab('signin'); setAuthError(''); }}
              className={`flex-1 py-3 font-mono text-xs uppercase tracking-wider border-b-2 cursor-pointer ${
                authTab === 'signin' 
                  ? 'border-primary-container text-primary-container font-bold' 
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              SIGN IN
            </button>
            <button 
              onClick={() => { setAuthTab('signup'); setAuthError(''); }}
              className={`flex-1 py-3 font-mono text-xs uppercase tracking-wider border-b-2 cursor-pointer ${
                authTab === 'signup' 
                  ? 'border-primary-container text-primary-container font-bold' 
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              CREATE CORE
            </button>
          </div>

          {/* Auth System Error Banner */}
          {authError && (
            <div className="w-full mb-6 p-3 bg-error-container/20 border border-error text-left">
              <span className="font-mono text-[9px] text-error uppercase font-bold block mb-1">SECURITY ERROR // DEPLOYMENT BLOCK</span>
              <p className="text-[11px] text-on-error-container font-medium">{authError}</p>
            </div>
          )}

          {/* Login / Registration form */}
          <form 
            onSubmit={authTab === 'signin' ? handleEmailSignIn : handleEmailSignUp}
            className="w-full space-y-4 mb-6 text-left"
          >
            {authTab === 'signup' && (
              <div className="flex flex-col space-y-1">
                <label className="font-mono text-[9px] text-on-surface-variant uppercase">Operator Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Neo, Jane"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="cyber-input text-sm"
                />
              </div>
            )}

            <div className="flex flex-col space-y-1">
              <label className="font-mono text-[9px] text-on-surface-variant uppercase">Secure Email</label>
              <input 
                type="email"
                required
                placeholder="operator@apex.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="cyber-input text-sm"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="font-mono text-[9px] text-on-surface-variant uppercase">Access Code (Password)</label>
              <input 
                type="password"
                required
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="cyber-input text-sm"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-3.5 bg-primary-container text-on-primary font-mono text-xs font-bold uppercase tracking-widest cyan-glow hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer mt-2"
            >
              {authTab === 'signin' ? 'INITIALIZE SYSTEM' : 'COMPILE OPERATOR CORE'}
            </button>
          </form>

          {/* Social Sign-In option */}
          <div className="relative flex py-2 items-center w-full mb-6">
            <div className="flex-grow border-t border-outline-variant/20"></div>
            <span className="flex-shrink mx-4 font-mono text-[9px] text-on-surface-variant uppercase">OR DEPLOY VIA</span>
            <div className="flex-grow border-t border-outline-variant/20"></div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3.5 bg-surface-container-high border border-outline-variant/35 text-on-surface hover:text-primary-container hover:border-primary-container font-mono text-xs uppercase tracking-widest active:scale-[0.98] transition-all cursor-pointer mb-6"
          >
            GOOGLE AUTH STREAM
          </button>

          {!isFirebaseConfigured && (
            <div className="w-full p-3 bg-secondary-container/10 border border-secondary/20 text-left">
              <span className="font-mono text-[9px] text-secondary uppercase font-bold block mb-1">LOCAL RUNTIME ACTIVE</span>
              <p className="text-[10px] text-on-surface-variant leading-normal">
                Credentials above are simulated locally. Add Firebase project keys to `.env.local` to execute cloud sync.
              </p>
            </div>
          )}
          
          <footer className="mt-8 text-[9px] font-mono text-on-surface-variant uppercase tracking-widest">
            NEURAL ENGINE V4.2.1
          </footer>
        </div>
      </div>
    );
  }

  // MAIN SYSTEM PANEL
  return (
    <div className="min-h-screen w-full flex bg-background text-on-background relative overflow-x-hidden">
      
      {/* OFFLINE / LOCAL BANNER */}
      {(!online || user.uid === 'demo') && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-secondary-container text-on-secondary-container font-mono text-[10px] uppercase py-2 px-4 flex justify-between items-center tracking-widest border-b border-secondary">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span>
              {user.uid === 'demo' ? 'LOCAL RUNTIME // NO CLOUD SYNC' : 'OFFLINE MODE // LOCAL CACHE IS ACTIVE'}
            </span>
          </div>
          {user.uid === 'demo' && (
            <span className="text-[9px] opacity-75 hidden sm:inline">Set up firebase connection in .env.local to enable global sync</span>
          )}
        </div>
      )}

      {/* SideNavBar (Rail) - Desktop view */}
      <nav className={`fixed left-0 top-0 h-full w-64 bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col py-6 z-40 transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="px-6 py-8 mt-4 lg:mt-0 flex justify-between items-center">
          <div>
            <h1 className="font-headline text-3xl text-primary-container tracking-tighter font-black italic uppercase">APEX</h1>
            <p className="font-mono text-[10px] text-on-surface-variant mt-1">STRATOS-1 // ELITE</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-on-surface-variant hover:text-primary-container">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 px-2 space-y-1">
          <button 
            onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
            className={`w-full px-4 py-3 flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-primary/10 text-primary-container border-l-4 border-primary-container' 
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border-l-4 border-transparent'
            }`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-mono text-xs uppercase">Dashboard</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('analytics'); setSidebarOpen(false); }}
            className={`w-full px-4 py-3 flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'analytics' 
                ? 'bg-primary/10 text-primary-container border-l-4 border-primary-container' 
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border-l-4 border-transparent'
            }`}
          >
            <span className="material-symbols-outlined">insights</span>
            <span className="font-mono text-xs uppercase">Analytics</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('milestones'); setSidebarOpen(false); }}
            className={`w-full px-4 py-3 flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'milestones' 
                ? 'bg-primary/10 text-primary-container border-l-4 border-primary-container' 
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border-l-4 border-transparent'
            }`}
          >
            <span className="material-symbols-outlined">military_tech</span>
            <span className="font-mono text-xs uppercase">Milestones</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('squad'); setSidebarOpen(false); }}
            className={`w-full px-4 py-3 flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === 'squad' 
                ? 'bg-primary/10 text-primary-container border-l-4 border-primary-container' 
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border-l-4 border-transparent'
            }`}
          >
            <span className="material-symbols-outlined">group</span>
            <span className="font-mono text-xs uppercase">Squad</span>
          </button>
        </div>

        <div className="px-4 mb-4">
          <button 
            onClick={() => setIsHabitModalOpen(true)}
            className="w-full py-4 bg-primary-container text-on-primary font-mono text-xs font-bold uppercase tracking-widest cyan-glow hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          >
            NEW PROTOCOL
          </button>
        </div>

        <div className="px-2 pb-8 space-y-1">
          <div className="px-4 py-2 text-[10px] font-mono text-on-surface-variant uppercase border-t border-outline-variant/10 mt-2 pt-4">
            System Config
          </div>
          <button 
            onClick={handleLogout}
            className="w-full px-4 py-3 flex items-center gap-3 text-on-surface-variant hover:text-error hover:bg-error-container/10 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-mono text-xs uppercase">Disconnect</span>
          </button>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <div className={`flex-1 flex flex-col min-h-screen lg:ml-64 ${
        (!online || user.uid === 'demo') ? 'pt-8' : ''
      }`}>
        
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/20 px-6 py-4 flex justify-between items-center shadow-[0_0_15px_rgba(0,240,255,0.06)]">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="lg:hidden text-on-surface-variant hover:text-primary-container mr-2"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="font-headline text-xl md:text-2xl tracking-tighter text-primary-container uppercase italic font-black">
              COMMAND CENTER
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary-container" title="Notifications">notifications</span>
            
            <div className="w-[1px] h-6 bg-outline-variant/30 hidden sm:block"></div>
            
            {/* User Profile display */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="block text-xs font-semibold text-on-surface">{user.displayName || 'Apex Elite'}</span>
                <span className="block font-mono text-[9px] text-on-surface-variant uppercase">{user.email || 'elite@apex.io'}</span>
              </div>
              <div className="w-10 h-10 border border-primary-container/30 overflow-hidden bg-surface-container flex items-center justify-center">
                {user.photoURL ? (
                  <img className="w-full h-full object-cover" src={user.photoURL} alt="Profile" />
                ) : (
                  <span className="material-symbols-outlined text-primary-container text-2xl font-bold">person</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Tabs Main Render */}
        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto space-y-8">
          
          {activeTab === 'dashboard' && (
            <>
              {/* Daily Readiness & Today's Focus Grid */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Readiness Circle widget */}
                <div className="lg:col-span-2 glass-card p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-4 text-center md:text-left">
                    <h3 className="font-mono text-xs text-primary-container uppercase tracking-widest">System Status</h3>
                    <h2 className="font-headline text-3xl text-on-surface font-bold">Daily Willpower Index</h2>
                    <p className="text-sm text-on-surface-variant max-w-md leading-relaxed">
                      Your Readiness rating is based on completed habits and daily focus checklist progress. Complete protocols to fuel the neural core.
                    </p>
                    
                    <div className="flex justify-center md:justify-start gap-8 mt-6 pt-6 border-t border-outline-variant/10">
                      <div>
                        <span className="block font-mono text-[10px] text-on-surface-variant uppercase">Sleep Quality</span>
                        <div className="flex items-center gap-1">
                          <input 
                            type="range" 
                            min="10" 
                            max="100" 
                            value={sleepQuality} 
                            onChange={(e) => setSleepQuality(parseInt(e.target.value))}
                            className="w-16 h-1 bg-surface-container-highest accent-primary-container"
                          />
                          <span className="font-headline text-lg text-primary-container font-bold">{sleepQuality}%</span>
                        </div>
                      </div>
                      <div className="w-[1px] h-10 bg-outline-variant/30"></div>
                      <div>
                        <span className="block font-mono text-[10px] text-on-surface-variant uppercase">Recovery Rate</span>
                        <div className="flex items-center gap-1">
                          <input 
                            type="range" 
                            min="10" 
                            max="100" 
                            value={recoveryRate} 
                            onChange={(e) => setRecoveryRate(parseInt(e.target.value))}
                            className="w-16 h-1 bg-surface-container-highest accent-primary-container"
                          />
                          <span className="font-headline text-lg text-primary-container font-bold">{recoveryRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SVG Willpower circle chart */}
                  <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
                    <svg className="radial-progress w-full h-full" viewBox="0 0 100 100">
                      <circle 
                        className="text-surface-container-highest" 
                        cx="50" 
                        cy="50" 
                        fill="transparent" 
                        r="40" 
                        stroke="currentColor" 
                        strokeWidth="8"
                      />
                      <circle 
                        className="text-primary-container transition-all duration-500 ease-out" 
                        cx="50" 
                        cy="50" 
                        fill="transparent" 
                        r="40" 
                        stroke="currentColor" 
                        strokeWidth="8"
                        strokeDasharray="251.2" 
                        strokeDashoffset={251.2 - (251.2 * willpowerScore) / 100}
                        strokeLinecap="round" 
                        style={{ filter: 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.4))' }}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="font-headline text-3xl text-primary-container font-bold">{willpowerScore}</span>
                      <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest">WILLPOWER</span>
                    </div>
                  </div>
                </div>

                {/* Today's Focus checklist */}
                <div className="glass-card p-6 border-l-4 border-primary-container flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-mono text-xs text-on-surface font-bold uppercase">Today's Focus</h3>
                      <span className="material-symbols-outlined text-primary-container text-lg animate-pulse">bolt</span>
                    </div>
                    
                    {focusTasks.length === 0 ? (
                      <div className="text-center py-6 text-xs text-on-surface-variant font-mono uppercase">
                        No active targets
                      </div>
                    ) : (
                      <ul className="space-y-4 max-h-[160px] overflow-y-auto pr-1">
                        {focusTasks.map(task => (
                          <li key={task.id} className="flex items-start justify-between gap-3 group">
                            <div className="flex items-start gap-3">
                              <button 
                                onClick={() => handleToggleTask(task)}
                                className={`mt-1 w-4 h-4 border flex items-center justify-center cursor-pointer transition-colors ${
                                  task.completed 
                                    ? 'bg-primary-container/20 border-primary-container' 
                                    : 'border-outline-variant hover:border-primary-container'
                                }`}
                              >
                                {task.completed && (
                                  <span className="material-symbols-outlined text-[10px] text-primary-container font-bold">check</span>
                                )}
                              </button>
                              <div>
                                <p className={`text-xs font-semibold ${task.completed ? 'line-through text-on-surface-variant opacity-60' : 'text-on-surface'}`}>
                                  {task.name}
                                </p>
                                <span className="text-[9px] font-mono text-on-surface-variant uppercase">{task.time}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-xs">delete</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => setIsTaskModalOpen(true)}
                    className="mt-6 w-full py-2.5 border border-outline-variant text-[10px] font-mono text-on-surface-variant hover:text-primary-container hover:border-primary-container transition-all uppercase tracking-widest cursor-pointer"
                  >
                    ADD DAILY TARGET
                  </button>
                </div>
              </section>

              {/* Habit Matrix Grid */}
              <section className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="font-mono text-xs text-primary-container uppercase tracking-widest">Active Protocols</h3>
                    <h2 className="font-headline text-2xl text-on-surface font-bold">Habit Matrix</h2>
                  </div>
                  <button 
                    onClick={() => setIsHabitModalOpen(true)}
                    className="px-4 py-2 border border-primary-container/30 bg-primary-container/10 text-primary-container font-mono text-[10px] uppercase hover:bg-primary-container/20 transition-colors"
                  >
                    + NEW HABIT
                  </button>
                </div>

                {habits.length === 0 ? (
                  <div className="glass-card p-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl mb-4 text-outline/35">layers_clear</span>
                    <p className="font-mono text-xs uppercase tracking-widest">Matrix Empty // Initialize first protocol</p>
                    <button 
                      onClick={() => setIsHabitModalOpen(true)} 
                      className="mt-6 px-6 py-3 bg-primary-container text-on-primary font-mono text-xs uppercase font-bold tracking-wider cursor-pointer"
                    >
                      INITIALIZE PROTOCOL
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {habits.map(habit => {
                      const completedToday = habit.completions && habit.completions[todayString];
                      return (
                        <div key={habit.id} className="glass-card p-6 flex flex-col justify-between relative group">
                          {/* Delete Hover action */}
                          <button 
                            onClick={() => handleDeleteHabit(habit.id)}
                            className="absolute top-4 right-4 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            title="Decommission Protocol"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>

                          <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-primary-container/10 text-primary-container border border-primary-container/10">
                              <span className="material-symbols-outlined text-xl">{habit.icon || 'bolt'}</span>
                            </div>
                            <div className="text-right">
                              <span className="block font-headline text-2xl text-on-surface font-bold leading-none">{habit.streak || 0}</span>
                              <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">Day Streak</span>
                            </div>
                          </div>

                          <div className="mb-6">
                            <h4 className="font-headline text-lg text-on-surface font-bold tracking-tight mb-1">{habit.name}</h4>
                            <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">{habit.protocol}</p>
                          </div>

                          {/* Sparkline Completion graph */}
                          {renderSparkline(habit)}

                          <button 
                            onClick={() => handleCheckInHabit(habit)}
                            className={`w-full py-3 font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                              completedToday 
                                ? 'bg-primary-container/20 text-primary-container border border-primary-container/40' 
                                : 'bg-surface-container-high text-primary-container border border-primary-container/30 cyan-glow-strong hover:bg-surface-container-highest'
                            }`}
                          >
                            {completedToday ? '✓ COMPLETED' : 'CHECK-IN'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Heatmap Section */}
              <section className="glass-card p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-mono text-xs text-primary-container uppercase tracking-widest">Performance History</h3>
                    <h2 className="font-headline text-xl md:text-2xl text-on-surface font-bold">Consistency Matrix</h2>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono text-on-surface-variant uppercase">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-surface-container-highest"></div>
                      <span>0%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-primary-container/20"></div>
                      <span>&lt;33%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-primary-container/60"></div>
                      <span>66%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-primary-container shadow-[0_0_8px_rgba(0,240,255,0.4)]"></div>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Heatmap calendar grid */}
                  <div className="grid grid-cols-7 gap-2 max-w-lg mx-auto sm:mx-0">
                    <div className="font-mono text-[9px] text-on-surface-variant uppercase text-center">Mon</div>
                    <div className="font-mono text-[9px] text-on-surface-variant uppercase text-center">Tue</div>
                    <div className="font-mono text-[9px] text-on-surface-variant uppercase text-center">Wed</div>
                    <div className="font-mono text-[9px] text-on-surface-variant uppercase text-center">Thu</div>
                    <div className="font-mono text-[9px] text-on-surface-variant uppercase text-center">Fri</div>
                    <div className="font-mono text-[9px] text-on-surface-variant uppercase text-center">Sat</div>
                    <div className="font-mono text-[9px] text-on-surface-variant uppercase text-center">Sun</div>
                    
                    {renderHeatmap()}
                  </div>

                  <div className="pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row gap-8 justify-between items-start sm:items-center">
                    <div className="flex gap-12">
                      <div>
                        <span className="block font-mono text-[9px] text-on-surface-variant uppercase">Longest Streak</span>
                        <span className="font-headline text-lg text-on-surface font-bold">
                          {habits.reduce((max, h) => Math.max(max, h.streak || 0), 0)} Days
                        </span>
                      </div>
                      <div>
                        <span className="block font-mono text-[9px] text-on-surface-variant uppercase">Active Protocols</span>
                        <span className="font-headline text-lg text-on-surface font-bold">{habits.length} Loaded</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setActiveTab('analytics')}
                      className="flex items-center gap-2 text-primary-container font-mono text-xs uppercase hover:underline cursor-pointer"
                    >
                      DEEP ANALYTICS <span className="material-symbols-outlined text-sm">trending_up</span>
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'analytics' && (
            <div className="glass-card p-8 text-center space-y-6">
              <span className="material-symbols-outlined text-5xl text-primary-container animate-pulse">analytics</span>
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tight text-on-surface">Biometric Logs & Deep Analytics</h2>
              <p className="text-sm text-on-surface-variant max-w-lg mx-auto">
                Integrations for real-time biological telemetry feeds (sleep trackers, heart rate monitors, and cognitive performance indices) will load in STRATOS version 1.2.
              </p>
              <div className="border border-outline-variant/30 max-w-sm mx-auto p-4 bg-surface-container-low font-mono text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">ANALYTICS STATE:</span>
                  <span className="text-primary-container">STANDBY</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">AVERAGE COMPLETION:</span>
                  <span className="text-on-surface">91.4% // OPTIMAL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">TELEMETRY CODES:</span>
                  <span className="text-on-surface">SECURE</span>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="px-6 py-3 bg-primary-container text-on-primary font-mono text-xs font-bold uppercase tracking-widest cursor-pointer"
              >
                RETURN TO Command Center
              </button>
            </div>
          )}

          {activeTab === 'milestones' && (
            <div className="glass-card p-8 text-center space-y-6">
              <span className="material-symbols-outlined text-5xl text-primary-container">military_tech</span>
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tight text-on-surface">System Milestones</h2>
              <p className="text-sm text-on-surface-variant max-w-lg mx-auto">
                Consistency levels unlock achievements and operational ranks. Complete consecutive daily checks to advance.
              </p>
              <div className="max-w-md mx-auto grid grid-cols-1 gap-4">
                <div className="border border-primary-container/20 p-4 text-left flex items-center gap-4 bg-primary-container/5">
                  <span className="material-symbols-outlined text-primary-container">stars</span>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface uppercase">Initiation Phase</h4>
                    <p className="text-[10px] text-on-surface-variant">Create and log your first habit protocol. (UNLOCKED)</p>
                  </div>
                </div>
                <div className="border border-outline-variant/20 p-4 text-left flex items-center gap-4 opacity-50">
                  <span className="material-symbols-outlined text-on-surface-variant">workspace_premium</span>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface uppercase">Iron Will</h4>
                    <p className="text-[10px] text-on-surface-variant">Maintain a streak of 30 days on any core habit. (LOCKED)</p>
                  </div>
                </div>
                <div className="border border-outline-variant/20 p-4 text-left flex items-center gap-4 opacity-50">
                  <span className="material-symbols-outlined text-on-surface-variant">workspace_premium</span>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface uppercase">Full Readiness</h4>
                    <p className="text-[10px] text-on-surface-variant">Achieve 100% Willpower score for 7 consecutive days. (LOCKED)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'squad' && (
            <div className="glass-card p-8 text-center space-y-6">
              <span className="material-symbols-outlined text-5xl text-primary-container">group</span>
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tight text-on-surface">Squad Sync</h2>
              <p className="text-sm text-on-surface-variant max-w-lg mx-auto">
                Sync performance logs with your squad members. Compare willpower indices and hold each other accountable in real time.
              </p>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="px-6 py-3 bg-primary-container text-on-primary font-mono text-xs font-bold uppercase tracking-widest cursor-pointer"
              >
                RETURN TO Command Center
              </button>
            </div>
          )}

        </main>

        {/* Footer */}
        <footer className="py-12 border-t border-outline-variant/10 text-center px-6 mt-12 bg-surface-container-lowest">
          <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-[0.2em] leading-loose">
            © 2026 APEX PERFORMANCE SYSTEMS // NEURAL ENGINE V4.2.1
          </p>
        </footer>
      </div>

      {/* Floating Action Button (FAB) - For quick access to new habit */}
      <button 
        onClick={() => setIsHabitModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-container text-on-primary rounded-full shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-35 cursor-pointer"
        title="Add New Protocol"
      >
        <span className="material-symbols-outlined text-2xl font-bold">add</span>
      </button>

      {/* MODAL: ADD HABIT */}
      {isHabitModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface border border-outline-variant p-8 relative">
            
            <button 
              onClick={() => setIsHabitModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary-container cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="font-headline text-xl text-primary-container font-black uppercase italic mb-6">
              INITIALIZE PROTOCOL
            </h3>

            <form onSubmit={handleAddHabit} className="space-y-6">
              <div className="flex flex-col space-y-1">
                <label className="font-mono text-[10px] text-on-surface-variant uppercase">Protocol Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Cold Plunge, Deep Work"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="cyber-input"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="font-mono text-[10px] text-on-surface-variant uppercase">Detailed Description / Instructions</label>
                <input 
                  type="text"
                  placeholder="e.g. 3 Mins at 4 degrees C"
                  value={newHabitProtocol}
                  onChange={(e) => setNewHabitProtocol(e.target.value)}
                  className="cyber-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="font-mono text-[10px] text-on-surface-variant uppercase">Starting Streak (Days)</label>
                  <input 
                    type="number"
                    min="0"
                    value={newHabitStreak}
                    onChange={(e) => setNewHabitStreak(e.target.value)}
                    className="cyber-input"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="font-mono text-[10px] text-on-surface-variant uppercase">Visual Icon</label>
                  <select 
                    value={newHabitIcon} 
                    onChange={(e) => setNewHabitIcon(e.target.value)}
                    className="cyber-input cursor-pointer"
                  >
                    {iconList.map(ico => (
                      <option key={ico.name} value={ico.name}>{ico.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-primary-container text-on-primary font-mono text-xs font-bold uppercase tracking-widest cyan-glow hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
              >
                COMPILE PROTOCOL
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TASK */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface border border-outline-variant p-8 relative">
            
            <button 
              onClick={() => setIsTaskModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary-container cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="font-headline text-lg text-primary-container font-black uppercase italic mb-6">
              ADD DAILY TARGET
            </h3>

            <form onSubmit={handleAddTask} className="space-y-6">
              <div className="flex flex-col space-y-1">
                <label className="font-mono text-[10px] text-on-surface-variant uppercase">Target Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Architect neural model"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  className="cyber-input"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="font-mono text-[10px] text-on-surface-variant uppercase">Target Execution Time</label>
                <input 
                  type="time"
                  value={newTaskTime}
                  onChange={(e) => setNewTaskTime(e.target.value)}
                  className="cyber-input"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-primary-container text-on-primary font-mono text-xs font-bold uppercase tracking-widest cyan-glow hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
              >
                DEPLOY TARGET
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
