import React, { useState, useEffect, useRef } from 'react';
import { 
  defaultTeacherProfile, 
  defaultStudents, 
  getCurrentMonthKey, 
  getInitialPayments, 
  formatRupiah, 
  formatMonthLabel,
  MONTH_NAMES,
  getWhatsAppReceiptUrl,
  getWhatsAppReminderUrl 
} from './data';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Settings, 
  CheckCircle2, 
  Clock, 
  PlusCircle, 
  Search, 
  Phone, 
  Printer, 
  Download, 
  Upload, 
  RotateCcw, 
  Calendar, 
  Banknote, 
  Check, 
  AlertCircle, 
  UserPlus, 
  Edit3, 
  Trash2, 
  MessageCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Award,
  Heart,
  X,
  Moon,
  Sun,
  AlertTriangle
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('beranda');
  const [teacher, setTeacher] = useState(() => {
    const saved = localStorage.getItem('spp_teacher');
    return saved ? JSON.parse(saved) : defaultTeacherProfile;
  });

  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('spp_students');
    return saved ? JSON.parse(saved) : defaultStudents;
  });

  const currentMonthKey = getCurrentMonthKey();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

  const [payments, setPayments] = useState(() => {
    const saved = localStorage.getItem('spp_payments');
    return saved ? JSON.parse(saved) : getInitialPayments(currentMonthKey);
  });

  const [fontSizeLevel, setFontSizeLevel] = useState(() => {
    return localStorage.getItem('spp_fontsize') || 'normal';
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('spp_darkmode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('spp_teacher', JSON.stringify(teacher));
  }, [teacher]);

  useEffect(() => {
    localStorage.setItem('spp_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('spp_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('spp_fontsize', fontSizeLevel);
  }, [fontSizeLevel]);

  useEffect(() => {
    localStorage.setItem('spp_darkmode', isDarkMode);
  }, [isDarkMode]);

  // Modal State Catat Bayar
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payStudent, setPayStudent] = useState(null);
  const [payAmountFormatted, setPayAmountFormatted] = useState('');
  const [payMethod, setPayMethod] = useState('Tunai');
  const [payDurationMonths, setPayDurationMonths] = useState(1);
  const [payNote, setPayNote] = useState('');
  const [successPaymentData, setSuccessPaymentData] = useState(null);

  // Modal Tambah/Edit Santri
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({ 
    name: '', 
    parentName: '', 
    phone: '', 
    nominal: teacher.monthlyDefault,
    joinedDate: new Date().toISOString().split('T')[0]
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const fileInputRef = useRef(null);

  const getFontSizeClass = () => {
    if (fontSizeLevel === 'xl') return 'text-base [&_input]:text-base [&_button]:text-sm';
    if (fontSizeLevel === 'large') return 'text-sm [&_input]:text-sm [&_button]:text-xs';
    return 'text-xs sm:text-sm [&_input]:text-xs sm:[&_input]:text-sm [&_button]:text-xs sm:[&_button]:text-sm';
  };

  const formatNumberWithDots = (val) => {
    if (val === undefined || val === null || val === '') return '';
    const cleanNum = String(val).replace(/\D/g, '');
    if (!cleanNum) return '';
    return Number(cleanNum).toLocaleString('id-ID');
  };

  const parseFormattedNumber = (val) => {
    if (!val) return 0;
    return Number(String(val).replace(/\./g, '')) || 0;
  };

  const isStudentPaidInMonth = (studentId, month) => {
    return payments.find(p => p.studentId === studentId && p.month === month);
  };

  const isStudentActiveInMonth = (student, monthKey) => {
    if (!student.joinedDate) return true;
    const studentMonthKey = student.joinedDate.slice(0, 7);
    return studentMonthKey <= monthKey;
  };

  const getUnpaidMonthsCount = (student, upToMonthKey) => {
    if (!isStudentActiveInMonth(student, upToMonthKey)) return 0;
    const [joinY, joinM] = (student.joinedDate || upToMonthKey + '-01').slice(0, 7).split('-').map(Number);
    const [targetY, targetM] = upToMonthKey.split('-').map(Number);

    let unpaidCount = 0;
    let currY = joinY;
    let currM = joinM;

    while (currY < targetY || (currY === targetY && currM <= targetM)) {
      const mStr = String(currM).padStart(2, '0');
      const mKey = `${currY}-${mStr}`;
      if (!isStudentPaidInMonth(student.id, mKey)) {
        unpaidCount++;
      }
      currM++;
      if (currM > 12) {
        currM = 1;
        currY++;
      }
    }
    return unpaidCount;
  };

  const eligibleStudentsForMonth = students.filter(s => s.status === 'active' && isStudentActiveInMonth(s, selectedMonth));
  const totalSantriCount = eligibleStudentsForMonth.length;
  const paidStudentsCount = eligibleStudentsForMonth.filter(s => isStudentPaidInMonth(s.id, selectedMonth)).length;
  const unpaidStudentsCount = totalSantriCount - paidStudentsCount;
  
  const totalCollectedThisMonth = payments
    .filter(p => {
      const st = students.find(s => s.id === p.studentId);
      return p.month === selectedMonth && st && isStudentActiveInMonth(st, selectedMonth);
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const openPayModal = (student) => {
    setPayStudent(student);
    const baseNominal = student.nominal || teacher.monthlyDefault;
    setPayAmountFormatted(formatNumberWithDots(baseNominal));
    setPayMethod('Tunai');
    setPayDurationMonths(1);
    setPayNote('');
    setIsPayModalOpen(true);
  };

  const handleSavePayment = (e) => {
    e.preventDefault();
    if (!payStudent) return;

    const rawAmount = parseFormattedNumber(payAmountFormatted);
    const singleMonthAmount = Math.round(rawAmount / payDurationMonths);

    const [yearStr, monthStr] = selectedMonth.split('-');
    let currentY = parseInt(yearStr, 10);
    let currentM = parseInt(monthStr, 10);

    let updatedPayments = [...payments];

    for (let i = 0; i < payDurationMonths; i++) {
      const mFormatted = String(currentM).padStart(2, '0');
      const targetMonthKey = `${currentY}-${mFormatted}`;

      const existingIndex = updatedPayments.findIndex(p => p.studentId === payStudent.id && p.month === targetMonthKey);

      const paymentRecord = {
        id: existingIndex >= 0 ? updatedPayments[existingIndex].id : 'p_' + Date.now() + '_' + i,
        studentId: payStudent.id,
        month: targetMonthKey,
        amount: singleMonthAmount,
        date: new Date().toISOString().split('T')[0],
        method: payMethod,
        note: payDurationMonths > 1 ? `Bayar ${payDurationMonths} bln (${i + 1}/${payDurationMonths})` : payNote
      };

      if (existingIndex >= 0) {
        updatedPayments[existingIndex] = paymentRecord;
      } else {
        updatedPayments = [paymentRecord, ...updatedPayments];
      }

      currentM++;
      if (currentM > 12) {
        currentM = 1;
        currentY++;
      }
    }

    setPayments(updatedPayments);
    setIsPayModalOpen(false);
    setSuccessPaymentData({ student: payStudent, amount: rawAmount, month: selectedMonth, duration: payDurationMonths });
  };

  const handleCancelPayment = (studentId) => {
    if (window.confirm("Batalkan status lunas untuk santri ini?")) {
      setPayments(payments.filter(p => !(p.studentId === studentId && p.month === selectedMonth)));
    }
  };

  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (!studentForm.name.trim()) return;

    const nominalNum = parseFormattedNumber(studentForm.nominal);

    if (editingStudent) {
      setStudents(students.map(s => s.id === editingStudent.id ? { ...s, ...studentForm, nominal: nominalNum } : s));
    } else {
      const newS = {
        id: 's_' + Date.now(),
        ...studentForm,
        nominal: nominalNum,
        status: 'active'
      };
      setStudents([newS, ...students]);
    }
    setIsStudentModalOpen(false);
    setEditingStudent(null);
  };

  const handleResetDemo = () => {
    if (window.confirm("Muat data contoh awal? Data saat ini akan diganti.")) {
      setTeacher(defaultTeacherProfile);
      setStudents(defaultStudents);
      setPayments(getInitialPayments(currentMonthKey));
    }
  };

  // Fitur Hapus Semua Data (Clean Clear)
  const handleClearAllData = () => {
    if (window.confirm("PERINGATAN: Yakin ingin menghapus seluruh data santri dan riwayat pembayaran? Tindakan ini tidak dapat dibatalkan.")) {
      if (window.confirm("Konfirmasi sekali lagi: Semua data akan dihapus total dan dikosongkan.")) {
        setTeacher({ name: "Guru Ngaji", tpaName: "Tempat Pengajian", phone: "081234567890", monthlyDefault: 50000 });
        setStudents([]);
        setPayments([]);
        localStorage.clear();
        alert("Semua data berhasil dihapus. Aplikasi bersih dan siap diatur ulang!");
      }
    }
  };

  const handleBackupData = () => {
    const backupObj = { teacher, students, payments, backupDate: new Date().toISOString() };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `buku_spp_ngaji_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRestoreData = (e) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed.teacher && parsed.students && parsed.payments) {
            setTeacher(parsed.teacher);
            setStudents(parsed.students);
            setPayments(parsed.payments);
            alert("Data berhasil dipulihkan!");
          } else {
            alert("Format file tidak valid.");
          }
        } catch (err) {
          alert("Gagal membaca file.");
        }
      };
    }
  };

  const getMonthOptions = () => {
    const list = [];
    const now = new Date();
    for (let i = -5; i <= 2; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      list.push({ key: `${y}-${m}`, label: formatMonthLabel(`${y}-${m}`) });
    }
    return list;
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0B0F17] text-slate-100' : 'bg-[#F4F6F9] text-slate-800'} flex flex-col justify-between font-sans selection:bg-emerald-100 transition-colors duration-200 ${getFontSizeClass()}`}>
      
      {/* HEADER UTAMA */}
      <header className={`${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200/80'} backdrop-blur-md border-b sticky top-0 z-30 shadow-2xs no-print`}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-amber-300 flex items-center justify-center shadow-xs shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="font-bold tracking-tight text-sm sm:text-base truncate">
                  {teacher.name}
                </h1>
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-emerald-500/20 shrink-0">
                  Guru Ngaji
                </span>
              </div>
              <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'} text-[11px] truncate`}>{teacher.tpaName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-100 border-slate-200 text-slate-600'} transition active:scale-95`}
              title="Ganti Mode Tampilan"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className={`flex items-center ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'} p-1 rounded-xl border`}>
              <button 
                onClick={() => setFontSizeLevel('normal')} 
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${fontSizeLevel === 'normal' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-400'}`}
              >
                A
              </button>
              <button 
                onClick={() => setFontSizeLevel('large')} 
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${fontSizeLevel === 'large' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-400'}`}
              >
                A+
              </button>
              <button 
                onClick={() => setFontSizeLevel('xl')} 
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${fontSizeLevel === 'xl' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-400'}`}
              >
                A++
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* KONTEN UTAMA */}
      <main className="max-w-2xl w-full mx-auto p-4 sm:p-5 flex-1 mb-24 space-y-4 no-print">
        
        {/* ================= TAB 1: BERANDA ================= */}
        {activeTab === 'beranda' && (
          <div className="space-y-4">
            
            {/* KARTU RINGKASAN BULANAN */}
            <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-3xl p-5 border shadow-xs space-y-4`}>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-700/10">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Periode Aktif</span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                    <select 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className={`${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'} border rounded-xl px-3.5 py-2 font-bold focus:outline-none focus:border-emerald-600 cursor-pointer text-xs sm:text-sm`}
                    >
                      {getMonthOptions().map(m => (
                        <option key={m.key} value={m.key}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-left sm:text-right w-full sm:w-auto flex justify-between sm:block pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-700/10">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Kas Masuk</span>
                  <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatRupiah(totalCollectedThisMonth)}
                  </div>
                </div>
              </div>

              {/* STATISTIK GRID */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`${isDarkMode ? 'bg-emerald-950/30 border-emerald-900/40' : 'bg-emerald-50/70 border-emerald-100'} rounded-2xl p-3.5 border flex items-center gap-3`}>
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-base sm:text-lg font-black ${isDarkMode ? 'text-emerald-300' : 'text-emerald-950'} truncate`}>{paidStudentsCount} <span className="text-xs font-normal opacity-60">/ {totalSantriCount}</span></div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate">Sudah Lunas</div>
                  </div>
                </div>

                <div className={`${isDarkMode ? 'bg-amber-950/30 border-amber-900/40' : 'bg-amber-50/70 border-amber-100'} rounded-2xl p-3.5 border flex items-center gap-3`}>
                  <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-base sm:text-lg font-black ${isDarkMode ? 'text-amber-300' : 'text-amber-950'} truncate`}>{unpaidStudentsCount} <span className="text-xs font-normal opacity-60">santri</span></div>
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400 truncate">Belum Bayar</div>
                  </div>
                </div>
              </div>

            </div>

            {/* PENCARIAN & FILTER */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari nama santri atau wali..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} border rounded-2xl font-medium focus:outline-none focus:border-emerald-600 shadow-2xs transition`}
                />
              </div>

              <div className={`flex gap-1 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} p-1.5 rounded-2xl border shadow-2xs shrink-0`}>
                <button 
                  onClick={() => setFilterStatus('all')}
                  className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl font-bold text-xs transition ${filterStatus === 'all' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Semua
                </button>
                <button 
                  onClick={() => setFilterStatus('belum')}
                  className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl font-bold text-xs transition ${filterStatus === 'belum' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Belum
                </button>
                <button 
                  onClick={() => setFilterStatus('lunas')}
                  className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl font-bold text-xs transition ${filterStatus === 'lunas' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Lunas
                </button>
              </div>
            </div>

            {/* DAFTAR SANTRI */}
            <div className="space-y-3">
              {eligibleStudentsForMonth
                .filter(s => {
                  const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                        s.parentName.toLowerCase().includes(searchQuery.toLowerCase());
                  const isPaid = isStudentPaidInMonth(s.id, selectedMonth);
                  if (filterStatus === 'lunas') return matchesSearch && isPaid;
                  if (filterStatus === 'belum') return matchesSearch && !isPaid;
                  return matchesSearch;
                })
                .map(student => {
                  const payment = isStudentPaidInMonth(student.id, selectedMonth);
                  const isPaid = !!payment;
                  const unpaidCount = getUnpaidMonthsCount(student, selectedMonth);

                  return (
                    <div 
                      key={student.id} 
                      className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-3xl p-4 sm:p-5 border transition shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 ${
                        isPaid ? 'border-emerald-500/30 bg-emerald-500/3' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0 w-full sm:w-auto">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm sm:text-base shrink-0 shadow-2xs ${
                          isPaid ? 'bg-emerald-600 text-white' : isDarkMode ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {isPaid ? <Check className="w-5 h-5 stroke-[2.5]" /> : student.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'} truncate text-sm sm:text-base flex items-center gap-2`}>
                            {student.name}
                            {!isPaid && unpaidCount > 1 && (
                              <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-rose-500/20 flex items-center gap-1 shrink-0">
                                <AlertTriangle className="w-3 h-3" /> Nunggak {unpaidCount} bln
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium truncate mt-0.5">Wali: {student.parentName} ({student.phone})</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={`text-xs font-semibold ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} px-2.5 py-1 rounded-lg`}>
                              SPP: {formatRupiah(student.nominal)}
                            </span>
                            {isPaid ? (
                              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Lunas ({payment.method})
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> Belum
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tombol Aksi */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-700/10 shrink-0">
                        {isPaid ? (
                          <>
                            <a 
                              href={getWhatsAppReceiptUrl(student, payment.amount, selectedMonth, teacher.name)}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 transition shadow-2xs active:scale-95"
                              title="Kirim Kuitansi WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" /> Kuitansi WA
                            </a>
                            <button 
                              onClick={() => handleCancelPayment(student.id)}
                              className={`${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-rose-950 hover:text-rose-300' : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600'} font-semibold p-2.5 rounded-2xl text-xs transition`}
                              title="Batalkan Status Lunas"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <a 
                              href={getWhatsAppReminderUrl(student, selectedMonth, teacher.name)}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={`${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} font-semibold px-3 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 transition`}
                              title="Kirim Pesan Pengingat"
                            >
                              <MessageCircle className="w-4 h-4 text-slate-400" /> Ingatkan
                            </a>
                            <button 
                              onClick={() => openPayModal(student)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-95"
                            >
                              <Banknote className="w-4 h-4" /> Bayar
                            </button>
                          </>
                        )}
                      </div>

                    </div>
                  );
                })}

              {eligibleStudentsForMonth.length === 0 && (
                <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-3xl p-10 text-center border shadow-2xs`}>
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="font-semibold text-slate-400 text-sm">Belum ada santri yang bergabung pada bulan {formatMonthLabel(selectedMonth)}.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ================= TAB 2: DAFTAR SANTRI ================= */}
        {activeTab === 'santri' && (
          <div className="space-y-4">
            
            <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-3xl p-5 border shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4`}>
              <div>
                <h2 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Daftar Santri Ngaji</h2>
                <p className="text-xs text-slate-400 mt-0.5">Kelola data anak didik, tanggal gabung & nominal SPP.</p>
              </div>
              <button 
                onClick={() => {
                  setEditingStudent(null);
                  setStudentForm({ 
                    name: '', 
                    parentName: '', 
                    phone: '', 
                    nominal: formatNumberWithDots(teacher.monthlyDefault),
                    joinedDate: new Date().toISOString().split('T')[0]
                  });
                  setIsStudentModalOpen(true);
                }}
                className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-5 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-2xs transition active:scale-95 text-xs sm:text-sm"
              >
                <UserPlus className="w-4 h-4" /> Tambah Santri Baru
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {students.map(student => (
                <div key={student.id} className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-3xl p-4.5 border shadow-2xs flex flex-col justify-between gap-3.5`}>
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'} truncate text-base`}>{student.name}</h3>
                        <p className="text-xs text-slate-400 truncate mt-0.5">Wali: {student.parentName}</p>
                      </div>
                      <span className={`${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-800'} text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0`}>
                        {formatRupiah(student.nominal)}/bln
                      </span>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-slate-700/10 space-y-1.5 text-xs text-slate-400 font-medium">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{student.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Gabung: {student.joinedDate || 'Belum diatur'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button 
                      onClick={() => {
                        setEditingStudent(student);
                        setStudentForm({ 
                          name: student.name, 
                          parentName: student.parentName, 
                          phone: student.phone, 
                          nominal: formatNumberWithDots(student.nominal),
                          joinedDate: student.joinedDate || new Date().toISOString().split('T')[0]
                        });
                        setIsStudentModalOpen(true);
                      }}
                      className={`flex-1 ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} font-semibold py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition`}
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Ubah
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm(`Hapus data ${student.name}?`)) {
                          setStudents(students.filter(s => s.id !== student.id));
                        }
                      }}
                      className={`${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-rose-950 hover:text-rose-300' : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600'} font-semibold p-2.5 rounded-2xl text-xs transition`}
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ================= TAB 3: LAPORAN ================= */}
        {activeTab === 'laporan' && (
          <div className="space-y-4">
            
            <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-3xl p-5 border shadow-2xs space-y-4`}>
              <h2 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Rekapitulasi Kas</h2>
              <p className="text-xs text-slate-400">Laporan keuangan iuran SPP bulanan.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className={`${isDarkMode ? 'bg-emerald-950/30 border-emerald-900/40' : 'bg-emerald-50/70 border-emerald-100'} rounded-2xl p-4 border`}>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Bulan {formatMonthLabel(selectedMonth)}</span>
                  <div className={`text-xl font-extrabold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-950'} mt-1`}>
                    {formatRupiah(totalCollectedThisMonth)}
                  </div>
                </div>

                <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'} rounded-2xl p-4 border`}>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Keseluruhan</span>
                  <div className={`text-xl font-extrabold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'} mt-1`}>
                    {formatRupiah(payments.reduce((sum, p) => sum + p.amount, 0))}
                  </div>
                </div>
              </div>
            </div>

            <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-3xl p-5 border shadow-2xs space-y-4`}>
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-700/10">
                <h3 className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'} text-sm sm:text-base`}>Riwayat Masuk ({formatMonthLabel(selectedMonth)})</h3>
                <button 
                  onClick={() => window.print()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition shadow-2xs"
                >
                  <Printer className="w-4 h-4" /> Cetak / PDF Laporan
                </button>
              </div>

              <div className="space-y-3">
                {payments
                  .filter(p => {
                    const st = students.find(s => s.id === p.studentId);
                    return p.month === selectedMonth && st && isStudentActiveInMonth(st, selectedMonth);
                  })
                  .map(payment => {
                    const student = students.find(s => s.id === payment.studentId);
                    return (
                      <div key={payment.id} className={`flex items-center justify-between p-3.5 ${isDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200/60'} rounded-2xl border gap-3`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'} text-xs sm:text-sm truncate`}>{student ? student.name : 'Santri'}</h4>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{payment.date} • {payment.method} {payment.note ? `• ${payment.note}` : ''}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">{formatRupiah(payment.amount)}</div>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md">Lunas</span>
                        </div>
                      </div>
                    );
                  })}

                {payments.filter(p => {
                  const st = students.find(s => s.id === p.studentId);
                  return p.month === selectedMonth && st && isStudentActiveInMonth(st, selectedMonth);
                }).length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">
                    Belum ada pembayaran tercatat di bulan ini.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 4: PENGATURAN ================= */}
        {activeTab === 'pengaturan' && (
          <div className="space-y-4">
            
            <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-3xl p-5 border shadow-2xs space-y-4`}>
              <h2 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Pengaturan Profil</h2>
              <p className="text-xs text-slate-400">Ubah nama guru dan informasi TPA.</p>

              <div className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Nama Guru</label>
                  <input 
                    type="text" 
                    value={teacher.name}
                    onChange={(e) => setTeacher({...teacher, name: e.target.value})}
                    className={`w-full px-4 py-3 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl font-medium focus:outline-none focus:border-emerald-600 transition`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Nama Tempat Pengajian</label>
                  <input 
                    type="text" 
                    value={teacher.tpaName}
                    onChange={(e) => setTeacher({...teacher, tpaName: e.target.value})}
                    className={`w-full px-4 py-3 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl font-medium focus:outline-none focus:border-emerald-600 transition`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Nominal SPP Default (Rp)</label>
                  <input 
                    type="text" 
                    value={formatNumberWithDots(teacher.monthlyDefault)}
                    onChange={(e) => setTeacher({...teacher, monthlyDefault: parseFormattedNumber(e.target.value)})}
                    className={`w-full px-4 py-3 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl font-medium focus:outline-none focus:border-emerald-600 transition`}
                  />
                </div>
              </div>
            </div>

            {/* BACKUP & RESTORE */}
            <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-3xl p-5 border shadow-2xs space-y-3.5`}>
              <h3 className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'} text-sm`}>Cadangkan & Pulihkan Data</h3>
              <p className="text-xs text-slate-400">Simpan file cadangan data santri ke memori HP agar aman jika ganti HP.</p>
              
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button 
                  onClick={handleBackupData}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4.5 py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-2xs active:scale-95"
                >
                  <Download className="w-4 h-4" /> Download Cadangan (.json)
                </button>
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className={`${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} font-semibold px-4.5 py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition`}
                >
                  <Upload className="w-4 h-4" /> Pulihkan dari File
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleRestoreData} 
                  accept=".json" 
                  className="hidden" 
                />
              </div>
            </div>

            {/* HAPUS SEMUA DATA (BERSIH TOTAL) */}
            <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-3xl p-5 border shadow-2xs space-y-3`}>
              <h3 className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'} text-sm`}>Hapus Semua Data (Kosongkan)</h3>
              <p className="text-xs text-slate-400">Gunakan opsi ini jika aplikasi ingin dipakai oleh guru ngaji lain dari awal.</p>
              <button 
                onClick={handleClearAllData}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-semibold px-4.5 py-3 rounded-2xl text-xs flex items-center gap-2 transition border border-rose-500/20"
              >
                <Trash2 className="w-4 h-4" /> Hapus Semua Data Sekarang
              </button>
            </div>

            <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-3xl p-5 border shadow-2xs space-y-3`}>
              <h3 className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'} text-sm`}>Reset Contoh Awal</h3>
              <button 
                onClick={handleResetDemo}
                className={`${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} font-semibold px-4.5 py-3 rounded-2xl text-xs flex items-center gap-2 transition`}
              >
                <RotateCcw className="w-4 h-4" /> Muat Data Contoh Awal
              </button>
            </div>

          </div>
        )}

      </main>

      {/* ================= NAVIGASI BAWAH ================= */}
      <nav aria-label="Navigasi Utama" className={`${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200/80'} backdrop-blur-md border-t shadow-2xl fixed bottom-0 left-0 right-0 z-30 no-print`}>
        <div className="max-w-2xl mx-auto px-3 py-2.5 flex items-center justify-around">
          
          <button 
            onClick={() => setActiveTab('beranda')}
            className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-2xl transition ${activeTab === 'beranda' ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[11px]">Beranda</span>
          </button>

          <button 
            onClick={() => setActiveTab('santri')}
            className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-2xl transition ${activeTab === 'santri' ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[11px]">Santri</span>
          </button>

          <button 
            onClick={() => setActiveTab('laporan')}
            className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-2xl transition ${activeTab === 'laporan' ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[11px]">Laporan</span>
          </button>

          <button 
            onClick={() => setActiveTab('pengaturan')}
            className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-2xl transition ${activeTab === 'pengaturan' ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[11px]">Pengaturan</span>
          </button>

        </div>
      </nav>

      {/* ================= TEMPLATE CETAK KHUSUS (BERSIH, HALAMAN TUNGGAL) ================= */}
      <div className="print-only hidden p-10 bg-white text-slate-900 font-sans">
        <div className="text-center pb-6 border-b-2 border-slate-900 mb-6">
          <h2 className="text-2xl font-black uppercase tracking-wider">{teacher.tpaName}</h2>
          <p className="text-xs font-bold text-slate-600 tracking-widest mt-1">LAPORAN KAS IURAN SPP BULANAN</p>
          <p className="text-base font-extrabold text-emerald-800 mt-1.5">Periode: {formatMonthLabel(selectedMonth)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Pengajar: {teacher.name}</p>
        </div>

        <div className="mb-6 flex justify-between items-center text-xs font-bold bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>Total Santri Lunas: <span className="text-emerald-800">{paidStudentsCount} dari {totalSantriCount} santri</span></div>
          <div>Total Kas Masuk: <span className="text-emerald-800">{formatRupiah(totalCollectedThisMonth)}</span></div>
        </div>

        <table className="w-full border-collapse border border-slate-300 text-left text-xs mb-10">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 p-2.5 text-center w-12">No</th>
              <th className="border border-slate-300 p-2.5">Nama Santri</th>
              <th className="border border-slate-300 p-2.5">Wali Santri</th>
              <th className="border border-slate-300 p-2.5 text-center">Tanggal</th>
              <th className="border border-slate-300 p-2.5 text-center">Metode</th>
              <th className="border border-slate-300 p-2.5 text-right">Nominal</th>
            </tr>
          </thead>
          <tbody>
            {payments
              .filter(p => {
                const st = students.find(s => s.id === p.studentId);
                return p.month === selectedMonth && st && isStudentActiveInMonth(st, selectedMonth);
              })
              .map((payment, idx) => {
                const student = students.find(s => s.id === payment.studentId);
                return (
                  <tr key={payment.id}>
                    <td className="border border-slate-300 p-2.5 text-center">{idx + 1}</td>
                    <td className="border border-slate-300 p-2.5 font-bold">{student ? student.name : '-'}</td>
                    <td className="border border-slate-300 p-2.5">{student ? student.parentName : '-'}</td>
                    <td className="border border-slate-300 p-2.5 text-center">{payment.date}</td>
                    <td className="border border-slate-300 p-2.5 text-center">{payment.method}</td>
                    <td className="border border-slate-300 p-2.5 text-right font-bold">{formatRupiah(payment.amount)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        <div className="flex justify-between items-end pt-10 text-xs">
          <div>
            <p className="text-slate-400">Dicetak otomatis dari Aplikasi Buku SPP Ngaji.</p>
          </div>
          <div className="text-center">
            <p className="mb-14">Guru Pengajar,</p>
            <p className="font-bold underline">{teacher.name}</p>
          </div>
        </div>
      </div>

      {/* ================= MODAL: CATAT PEMBAYARAN ================= */}
      {isPayModalOpen && payStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} rounded-3xl max-w-sm w-full p-5 shadow-2xl border animate-in fade-in zoom-in-95 duration-150 space-y-4`}>
            
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-700/10">
              <h3 className="font-bold text-sm sm:text-base">Catat Pembayaran SPP</h3>
              <button 
                onClick={() => setIsPayModalOpen(false)}
                className={`w-8 h-8 ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'} rounded-full flex items-center justify-center text-xs`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3.5">
              
              <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200/80'} p-3.5 rounded-2xl border flex justify-between items-center`}>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Santri</span>
                  <div className="font-bold text-xs sm:text-sm truncate mt-0.5">{payStudent.name}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Bulan Aktif</span>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">{formatMonthLabel(selectedMonth)}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Durasi Pembayaran</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setPayDurationMonths(1);
                      const base = payStudent.nominal || teacher.monthlyDefault;
                      setPayAmountFormatted(formatNumberWithDots(base));
                    }}
                    className={`py-2.5 rounded-xl font-semibold text-xs border transition ${payDurationMonths === 1 ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs' : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                  >
                    1 Bulan
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setPayDurationMonths(2);
                      const base = (payStudent.nominal || teacher.monthlyDefault) * 2;
                      setPayAmountFormatted(formatNumberWithDots(base));
                    }}
                    className={`py-2.5 rounded-xl font-semibold text-xs border transition ${payDurationMonths === 2 ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs' : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                  >
                    2 Bulan
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setPayDurationMonths(3);
                      const base = (payStudent.nominal || teacher.monthlyDefault) * 3;
                      setPayAmountFormatted(formatNumberWithDots(base));
                    }}
                    className={`py-2.5 rounded-xl font-semibold text-xs border transition ${payDurationMonths === 3 ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs' : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                  >
                    3 Bulan
                  </button>
                </div>
                {payDurationMonths > 1 && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1.5">
                    ✨ Otomatis melunasi untuk {payDurationMonths} bulan berturut-turut.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Total Nominal (Rp)</label>
                <input 
                  type="text" 
                  value={payAmountFormatted}
                  onChange={(e) => setPayAmountFormatted(formatNumberWithDots(e.target.value))}
                  required
                  placeholder="50.000"
                  className={`w-full px-4 py-3 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-2xl font-bold focus:outline-none focus:border-emerald-600 box-border`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Metode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setPayMethod('Tunai')}
                    className={`py-2.5 rounded-xl font-semibold text-xs border transition ${payMethod === 'Tunai' ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs' : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                  >
                    Tunai
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPayMethod('Transfer')}
                    className={`py-2.5 rounded-xl font-semibold text-xs border transition ${payMethod === 'Transfer' ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs' : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                  >
                    Transfer
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Catatan</label>
                <input 
                  type="text" 
                  placeholder="Opsional"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className={`w-full px-4 py-2.5 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-xl text-xs focus:outline-none focus:border-emerald-600 box-border`}
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className={`flex-1 ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} font-semibold py-3 rounded-2xl text-xs transition`}
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-2xl text-xs shadow-2xs transition active:scale-95"
                >
                  Simpan Lunas
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL: SUKSES / KIRIM WA ================= */}
      {successPaymentData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} rounded-3xl max-w-sm w-full p-6 shadow-2xl border text-center space-y-4`}>
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-2xs">
              <Check className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-base">Pembayaran Tersimpan</h3>
              <p className="text-xs text-slate-400 mt-1">
                SPP {successPaymentData.student.name} sebesar {formatRupiah(successPaymentData.amount)} 
                {successPaymentData.duration > 1 ? ` untuk ${successPaymentData.duration} bulan berturut-turut` : ''} tercatat lunas.
              </p>
            </div>
            <div className="pt-1 flex flex-col gap-2.5">
              <a 
                href={getWhatsAppReceiptUrl(successPaymentData.student, successPaymentData.amount, successPaymentData.month, teacher.name)}
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => setSuccessPaymentData(null)}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-2xs transition"
              >
                <MessageCircle className="w-4 h-4" /> Kirim Kuitansi WA
              </a>
              <button 
                onClick={() => setSuccessPaymentData(null)}
                className={`w-full ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} font-semibold py-2.5 rounded-2xl text-xs transition`}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH/EDIT SANTRI ================= */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} rounded-3xl w-full max-w-sm p-5 shadow-2xl border space-y-3.5 box-border overflow-hidden`}>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-700/10">
              <h3 className="font-bold text-sm sm:text-base">{editingStudent ? 'Ubah Santri' : 'Tambah Santri'}</h3>
              <button 
                onClick={() => setIsStudentModalOpen(false)}
                className={`w-8 h-8 ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'} rounded-full flex items-center justify-center text-xs`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3.5 w-full">
              <div className="w-full">
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Nama Santri</label>
                <input 
                  type="text" 
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({...studentForm, name: e.target.value})}
                  required
                  className={`w-full px-4 py-3 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl text-xs focus:outline-none focus:border-emerald-600 box-border block`}
                />
              </div>

              <div className="w-full">
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Nama Wali</label>
                <input 
                  type="text" 
                  value={studentForm.parentName}
                  onChange={(e) => setStudentForm({...studentForm, parentName: e.target.value})}
                  required
                  className={`w-full px-4 py-3 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl text-xs focus:outline-none focus:border-emerald-600 box-border block`}
                />
              </div>

              <div className="w-full">
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">No. WhatsApp Wali</label>
                <input 
                  type="text" 
                  value={studentForm.phone}
                  onChange={(e) => setStudentForm({...studentForm, phone: e.target.value})}
                  required
                  className={`w-full px-4 py-3 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl text-xs focus:outline-none focus:border-emerald-600 box-border block`}
                />
              </div>

              <div className="w-full">
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Tanggal Bergabung</label>
                <div className={`w-full overflow-hidden rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'} box-border`}>
                  <input 
                    type="date" 
                    value={studentForm.joinedDate}
                    onChange={(e) => setStudentForm({...studentForm, joinedDate: e.target.value})}
                    required
                    style={{ width: '100%', maxWidth: '100%', minWidth: '0', boxSizing: 'border-box' }}
                    className="w-full px-4 py-3 bg-transparent text-xs focus:outline-none font-medium block border-0 shadow-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block leading-tight">Santri hanya muncul pada bulan setelah/saat tanggal ini.</span>
              </div>

              <div className="w-full">
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Nominal SPP (Rp)</label>
                <input 
                  type="text" 
                  value={studentForm.nominal}
                  onChange={(e) => setStudentForm({...studentForm, nominal: formatNumberWithDots(e.target.value)})}
                  required
                  placeholder="50.000"
                  className={`w-full px-4 py-3 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl text-xs focus:outline-none focus:border-emerald-600 font-bold box-border block`}
                />
              </div>

              <div className="pt-2 flex gap-2.5 w-full">
                <button 
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className={`flex-1 ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} font-semibold py-3 rounded-2xl text-xs transition`}
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-2xl text-xs shadow-2xs transition"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
