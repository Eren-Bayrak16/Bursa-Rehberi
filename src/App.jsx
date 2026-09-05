import { useState, useEffect, useRef } from 'react'
import { useGoogleLogin } from '@react-oauth/google';
import ReactMarkdown from 'react-markdown';
import './App.css'
import arkaplan from './assets/arkaplan.png'
import { locationData } from './data/locationData';
import { 
  FaPills, FaLandmark, FaBus, FaFutbol, FaMapMarkerAlt, FaGoogle, 
  FaRobot, FaUserCircle, FaSun, FaCloudSun, FaTree, FaMountain, 
  FaWater, FaCity, FaTram, FaUtensils, FaStore, FaMosque, FaTheaterMasks, FaLeaf, FaPizzaSlice, FaShieldAlt, FaTimes, FaKey, FaCogs, FaInfoCircle, FaFilter, FaTrophy, FaBolt, FaPlus, FaTrash, FaSearch, FaClock, FaCalendarAlt, FaCheckCircle, FaEdit, FaCoins, FaCopy, FaRedo, FaVolumeUp, FaStop, FaPencilAlt, FaCheck 
} from 'react-icons/fa'

const ADMIN_EMAIL = "bayrakeren228@gmail.com";
const API_BASE_URL = "http://172.16.12.253.nip.io:8000";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [lang, setLang] = useState('TR');
  
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEditIdx, setLoadingEditIdx] = useState(null);
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [showContextWarning, setShowContextWarning] = useState(false);
  const [currentPercentage, setCurrentPercentage] = useState(0);
  const [limitReached, setLimitReached] = useState(false);

  const [weatherBursa, setWeatherBursa] = useState({ temp: '--', condition: 'Yükleniyor...' });
  const [weatherUludag, setWeatherUludag] = useState({ temp: '--', condition: 'Yükleniyor...' });

  const [modelsList, setModelsList] = useState([]);
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash');
  const [userApiKey, setUserApiKey] = useState('');
  const [isApiKeySaved, setIsApiKeySaved] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKeyInput, setTempApiKeyInput] = useState('');
  const [apiKeyErrorMsg, setApiKeyErrorMsg] = useState('');
  const [isKeyInvalidOrDeleted, setIsKeyInvalidOrDeleted] = useState(false);
  const [validatingKey, setValidatingKey] = useState(false);

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminTab, setAdminTab] = useState('stats');
  const [adminStats, setAdminStats] = useState(null);
  const [selectedUserFilter, setSelectedUserFilter] = useState('ALL');
  const [adminDateFilter, setAdminDateFilter] = useState('TODAY');
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [adminPage, setAdminPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedModalItem, setSelectedModalItem] = useState(null);
  const [currentChatId, setCurrentChatId] = useState('');

  const [openRouterModels, setOpenRouterModels] = useState([]);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [fetchingOpenRouter, setFetchingOpenRouter] = useState(false);

  const [systemApiKeyInput, setSystemApiKeyInput] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [speakingIdx, setSpeakingIdx] = useState(null);
  
  const abortControllerRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchModels();
    fetchOpenRouterCatalog();
    fetchWeatherData();
    setCurrentChatId(Math.random().toString(36).substring(2, 10));
  }, []);

  const fetchWeatherData = async () => {
    try {
      const resBursa = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.1826&longitude=29.0665&current=temperature_2m,weather_code');
      const dataBursa = await resBursa.json();
      if (dataBursa && dataBursa.current) {
        setWeatherBursa({
          temp: Math.round(dataBursa.current.temperature_2m),
          condition: getWeatherDescription(dataBursa.current.weather_code)
        });
      }

      const resUludagReal = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.0716&longitude=29.2211&current=temperature_2m,weather_code');
      const dataUludag = await resUludagReal.json();
      if (dataUludag && dataUludag.current) {
        setWeatherUludag({
          temp: Math.round(dataUludag.current.temperature_2m),
          condition: getWeatherDescription(dataUludag.current.weather_code)
        });
      }
    } catch (err) {
      setWeatherBursa({ temp: '30', condition: 'Açık' });
      setWeatherUludag({ temp: '16', condition: 'Serin' });
    }
  };

  const getWeatherDescription = (code) => {
    if (code === 0) return 'Açık';
    if ([1, 2, 3].includes(code)) return 'Parçalı Bulutlu';
    if ([45, 48].includes(code)) return 'Sisli';
    if ([51, 53, 55, 56, 57, 61, 63, 65].includes(code)) return 'Yağmurlu';
    if ([71, 73, 75, 77].includes(code)) return 'Karlı';
    return 'Açık';
  };

  useEffect(() => {
    if (loadingEditIdx === null) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, loading, loadingEditIdx]);

  const fetchModels = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/models`);
      const data = await res.json();
      if (res.ok && data.models) {
        setModelsList(data.models);
        const selectableModels = data.models.filter(m => !m.is_default_free);
        if (selectableModels.length > 0 && (!selectedModel || selectedModel === '')) {
          setSelectedModel(selectableModels[0].model_key);
        }
      }
    } catch (err) {
      console.log("Modeller yüklenemedi.");
    }
  };

  const fetchOpenRouterCatalog = async () => {
    setFetchingOpenRouter(true);
    try {
      const res = await fetch('https://openrouter.ai/api/v1/models');
      const data = await res.json();
      if (data && data.data) {
        setOpenRouterModels(data.data);
      }
    } catch (err) {
      console.log("OpenRouter katalog verisi alınamadı.");
    } finally {
      setFetchingOpenRouter(false);
    }
  };

  useEffect(() => {
    let interval = null;
    if (loading || loadingEditIdx !== null) {
      setElapsedTime(0);
      interval = setInterval(() => {
        setElapsedTime((prevTime) => Number((prevTime + 0.1).toFixed(1)));
      }, 100);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [loading, loadingEditIdx]);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      setErrorMessage('');
      setCurrentChatId(Math.random().toString(36).substring(2, 10));
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${credentialResponse.access_token}` },
        });
        const data = await res.json();
        const email = data.email || "bayrakeren228@gmail.com";
        setUserEmail(email);

        try {
          const keyRes = await fetch(`${API_BASE_URL}/api/get-key?email=${encodeURIComponent(email)}`);
          const keyData = await keyRes.json();
          if (keyData.api_key && keyData.api_key.trim() !== '') {
            setUserApiKey(keyData.api_key);
            setIsApiKeySaved(true);
            setIsKeyInvalidOrDeleted(false);
            setShowApiKeyModal(false);
          } else {
            setUserApiKey('');
            setIsApiKeySaved(false);
            setIsKeyInvalidOrDeleted(false);
            setApiKeyErrorMsg('');
            setShowApiKeyModal(true);
          }
        } catch (keyErr) {
          setUserApiKey('');
          setIsApiKeySaved(false);
          setIsKeyInvalidOrDeleted(false);
          setApiKeyErrorMsg('');
          setShowApiKeyModal(true);
        }

      } catch (err) {
        setUserEmail("bayrakeren228@gmail.com");
        setUserApiKey('');
        setIsApiKeySaved(false);
        setIsKeyInvalidOrDeleted(false);
        setApiKeyErrorMsg('');
        setShowApiKeyModal(true);
      }
      setIsLoggedIn(true);
      setPrompt('');       
      setChatHistory([]);   
    },
  });

  const handleSaveUserApiKey = async (e) => {
    e.preventDefault();
    setApiKeyErrorMsg('');

    const trimmedKey = tempApiKeyInput.trim();
    const expectedLength = 73;

    if (!trimmedKey) {
      setApiKeyErrorMsg("API anahtarı boş bırakılamaz!");
      return;
    }

    if (!trimmedKey.startsWith('sk-or-v1-')) {
      setApiKeyErrorMsg("Hatalı Format: OpenRouter anahtarları 'sk-or-v1-' ile başlamalıdır.");
      return;
    }

    if (trimmedKey.length !== expectedLength) {
      setApiKeyErrorMsg(`Hatalı Uzunluk: Girdiğiniz anahtar ${trimmedKey.length} karakter. 73 karakter olmalıdır.`);
      return;
    }

    setValidatingKey(true);

    try {
      const testRes = await fetch(`${API_BASE_URL}/api/test-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: trimmedKey }),
      });

      const testData = await testRes.json();

      if (!testRes.ok) {
        setApiKeyErrorMsg(testData.detail || "Geçersiz API Anahtarı! OpenRouter bu anahtarı reddetti.");
        setValidatingKey(false);
        return;
      }

      await fetch(`${API_BASE_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: "Test",
          kullanici_adi: userEmail,
          user_api_key: trimmedKey,
          chat_id: currentChatId
        }),
      });

      setUserApiKey(trimmedKey);
      setIsApiKeySaved(true);
      setIsKeyInvalidOrDeleted(false);
      setShowApiKeyModal(false);
      setTempApiKeyInput('');
      setApiKeyErrorMsg('');
      setErrorMessage('');
      alert("API Anahtarınız başarıyla doğrulandı ve kaydedildi!");

    } catch (err) {
      setApiKeyErrorMsg("Sunucuya bağlanılamadı. API anahtarı doğrulanamadı.");
    } finally {
      setValidatingKey(false);
    }
  };

  const handleCopyText = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        alert("Metin panoya kopyalandı!");
      }).catch(() => {
        fallbackCopyText(text);
      });
    } else {
      fallbackCopyText(text);
    }
  };

  const fallbackCopyText = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      alert("Metin panoya kopyalandı!");
    } catch (err) {
      alert("Kopyalanamadı.");
    }
    document.body.removeChild(textArea);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
    setLoadingEditIdx(null);
    setErrorMessage("Yapay zeka yanıtı durduruldu.");
  };

  const handleAskAI = async (textToAsk = prompt, editIdx = null) => {
    if (limitReached) return;
    const finalPrompt = textToAsk || prompt;
    if (!finalPrompt.trim()) return;

    if (isLoggedIn && (!userApiKey || !userApiKey.trim())) {
      setIsKeyInvalidOrDeleted(true);
      setShowApiKeyModal(true);
      return;
    }
    
    if (editIdx !== null) {
      setLoadingEditIdx(editIdx);
    } else {
      setLoading(true);
    }
    setErrorMessage('');

    abortControllerRef.current = new AbortController();

    if (isLoggedIn && userApiKey) {
      try {
        const testRes = await fetch(`${API_BASE_URL}/api/test-key`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: userApiKey }),
          signal: abortControllerRef.current.signal,
        });
        
        if (!testRes.ok) {
          setUserApiKey('');
          setIsApiKeySaved(false);
          setLoading(false);
          setLoadingEditIdx(null);
          setIsKeyInvalidOrDeleted(true);
          setShowApiKeyModal(true);
          
          await fetch(`${API_BASE_URL}/api/clear-key?email=${encodeURIComponent(userEmail)}`, {
            method: 'POST'
          });
          return;
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    const newQuestion = finalPrompt;
    if (editIdx === null) {
      setCurrentQuestion(newQuestion);
    }
    setPrompt('');

    let baseHistory = editIdx !== null ? chatHistory.slice(0, editIdx) : chatHistory;

    let formattedMessages = [];
    baseHistory.forEach(item => {
      formattedMessages.push({ role: 'user', content: item.prompt });
      formattedMessages.push({ role: 'assistant', content: item.response });
    });
    formattedMessages.push({ role: 'user', content: newQuestion });

    try {
      const res = await fetch(`${API_BASE_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: formattedMessages,
          kullanici_adi: isLoggedIn ? userEmail : 'Misafir',
          user_api_key: isLoggedIn ? userApiKey : '', 
          model_secimi: isLoggedIn ? selectedModel : '', 
          chat_id: currentChatId
        }),
        signal: abortControllerRef.current.signal,
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsApiKeySaved(true);
        setIsKeyInvalidOrDeleted(false);
        const newEntry = { prompt: newQuestion, response: data.response, isEditing: false, editText: '' };
        
        setChatHistory([...baseHistory, newEntry]);
        setCurrentQuestion('');

        if (data.context_percentage !== undefined) {
          setCurrentPercentage(data.context_percentage);
        }

        if (data.context_percentage >= 100) {
          setLimitReached(true);
          setShowContextWarning(false);
        } else if (data.context_warning) {
          setShowContextWarning(true);
        }
      } else {
        let rawDetail = data.detail || '';
        let userFriendlyMsg = 'Şu anda yapay zeka servislerinde geçici bir yoğunluk yaşanıyor. Lütfen biraz sonra tekrar deneyin.';
        
        if (res.status === 402 || rawDetail.toLowerCase().includes('credits') || rawDetail.toLowerCase().includes('balance') || rawDetail.toLowerCase().includes('insufficient')) {
          userFriendlyMsg = 'OpenRouter hesabınızda bu işlem için yeterli bakiye veya kredi kalmadı. Lütfen hesabınızı kontrol edin.';
          setErrorMessage(userFriendlyMsg);
        } else if (res.status === 401 || rawDetail.includes('401') || rawDetail.toLowerCase().includes('key') || rawDetail.toLowerCase().includes('unauthorized') || rawDetail.toLowerCase().includes('geçersiz') || rawDetail.toLowerCase().includes('silinmiş') || rawDetail.toLowerCase().includes('auth') || rawDetail.toLowerCase().includes('not found')) {
          userFriendlyMsg = 'OpenRouter API anahtarınız silinmiş veya geçersiz hale gelmiş. Lütfen yeni bir anahtar girin.';
          setUserApiKey(''); 
          setIsApiKeySaved(false);
          setErrorMessage(userFriendlyMsg);
          if (isLoggedIn) {
            setIsKeyInvalidOrDeleted(true);
            setShowApiKeyModal(true);
          }
        } else if (rawDetail.includes('Sistemde misafir API anahtarı tanımlanmamış')) {
          userFriendlyMsg = 'Sistemde misafir API anahtarı tanımlanmamış. Lütfen admin panelinden sistem API anahtarını girin.';
          setErrorMessage(userFriendlyMsg);
        } else if (rawDetail) {
          userFriendlyMsg = rawDetail;
          setErrorMessage(userFriendlyMsg);
        } else {
          setErrorMessage(userFriendlyMsg);
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setErrorMessage('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı veya backend servisinin açık olduğunu kontrol edin.');
      }
    } finally {
      setLoading(false);
      setLoadingEditIdx(null);
    }
  };

  const handleEditSubmit = (idx, textToSubmit) => {
    const finalEditText = textToSubmit !== undefined ? textToSubmit : chatHistory[idx].editText;
    if (!finalEditText || !finalEditText.trim()) return;

    const updated = [...chatHistory];
    updated[idx] = {
      ...updated[idx],
      prompt: finalEditText.trim(),
      isEditing: false,
      editText: ''
    };
    setChatHistory(updated);

    handleAskAI(finalEditText.trim(), idx);
  };

  const handleRequestSummary = async () => {
    setShowContextWarning(false);
    setLoading(true);
    setErrorMessage('');

    let summaryPromptMessages = [];
    chatHistory.forEach(item => {
      summaryPromptMessages.push({ role: 'user', content: item.prompt });
      summaryPromptMessages.push({ role: 'assistant', content: item.response });
    });
    summaryPromptMessages.push({ 
      role: 'user', 
      content: "Lütfen yukarıdaki tüm konuşma geçmişimizi detaylı bir şekilde özetle." 
    });

    try {
      const res = await fetch(`${API_BASE_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: summaryPromptMessages,
          kullanici_adi: isLoggedIn ? userEmail : 'Misafir',
          user_api_key: isLoggedIn ? userApiKey : '', 
          model_secimi: isLoggedIn ? selectedModel : '', 
          chat_id: currentChatId
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setChatHistory(prev => [...prev, { prompt: "Konuşmanın özetini çıkarır mısın?", response: data.response, isEditing: false, editText: '' }]);
        setLimitReached(true);
      } else {
        setErrorMessage("Özet oluşturulamadı.");
      }
    } catch (err) {
      setErrorMessage("Sunucu bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewSession = () => {
    setChatHistory([]);
    setCurrentChatId(Math.random().toString(36).substring(2, 10));
    setShowContextWarning(false);
    setLimitReached(false);
    setCurrentPercentage(0);
    setPrompt('');
  };

  const handlePresetClick = (soruMetni) => {
    if (limitReached) return;
    setSelectedLocation(null); 
    setPrompt(soruMetni);
    handleAskAI(soruMetni);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail('');
    setUserApiKey('');
    setIsApiKeySaved(false);
    setShowApiKeyModal(false);
    setIsKeyInvalidOrDeleted(false);
    setPrompt('');
    setChatHistory([]);
    setErrorMessage('');
    setShowAdminPanel(false);
    setSelectedLocation(null);
    setLimitReached(false);
    setCurrentPercentage(0);
  };

  const fetchAdminStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stats?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (res.ok) {
        setAdminStats(data);
        setShowAdminPanel(true);
      } else {
        alert("Yetki Hatası: " + (data.detail || 'Bilinmeyen hata'));
      }
    } catch (err) {
      alert("Admin paneline bağlanılamadı.");
    }
  };

  const addModelToSystem = async (modelObj) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/models?email=${encodeURIComponent(userEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model_key: modelObj.id, 
          model_name: modelObj.name,
          is_default_free: false 
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`"${modelObj.name}" başarıyla sisteme eklendi!`);
        fetchModels();
      } else {
        alert("Hata: " + (data.detail || "Model eklenemedi"));
      }
    } catch (err) {
      alert("Sunucu bağlantı hatası.");
    }
  };

  const handleSetFreeModel = async (modelId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/models/set-free/${modelId}?email=${encodeURIComponent(userEmail)}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        alert("Misafir modeli ayarı güncellendi!");
        fetchModels();
      } else {
        alert("Hata: " + (data.detail || "Güncellenemedi"));
      }
    } catch (err) {
      alert("Sunucu bağlantı hatası.");
    }
  };

  const handleDeleteModel = async (modelId) => {
    if (modelsList.length <= 1) {
      alert("Sistemde en az 1 model kalması zorunludur. Son model silinemez!");
      return;
    }
    if (!window.confirm("Bu modeli silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/models/${modelId}?email=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        alert("Model silindi.");
        fetchModels();
      } else {
        alert("Hata: " + (data.detail || "Model silinemedi"));
      }
    } catch (err) {
      alert("Sunucu bağlantı hatası.");
    }
  };

  const handleSaveSystemKey = async (e) => {
    e.preventDefault();
    const trimmedSysKey = systemApiKeyInput.trim();
    const expectedLength = 73;

    if (!trimmedSysKey) {
      alert("Lütfen bir API anahtarı girin.");
      return;
    }

    if (!trimmedSysKey.startsWith('sk-or-v1-')) {
      alert("Hatalı Format: Sistem API anahtarı 'sk-or-v1-' ile başlamalıdır!");
      return;
    }

    if (trimmedSysKey.length !== expectedLength) {
      alert(`Hatalı Uzunluk: Girdiğiniz anahtar ${trimmedSysKey.length} karakter. OpenRouter anahtarları tam olarak ${expectedLength} karakter olmalıdır!`);
      return;
    }

    try {
      const testRes = await fetch(`${API_BASE_URL}/api/test-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: trimmedSysKey }),
      });

      const testData = await testRes.json();

      if (!testRes.ok) {
        alert("Geçersiz API Anahtarı! OpenRouter bu anahtarı reddetti. Hatalı anahtar sisteme kaydedilmedi.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/admin/set-system-key?email=${encodeURIComponent(userEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_api_key: trimmedSysKey })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Sistem misafir API anahtarı başarıyla test edildi, şifrelenip kaydedildi!");
        setSystemApiKeyInput('');
      } else {
        alert("Hata: " + (data.detail || "Kaydedilemedi"));
      }
    } catch (err) {
      alert("Sunucu bağlantı hatası. API anahtarı test edilemedi.");
    }
  };

  const rawHistory = adminStats?.history || [];
  const now = new Date();
  const filteredByDate = rawHistory.filter(item => {
    if (!item.created_at) return true;
    const itemDate = new Date(item.created_at);
    if (adminDateFilter === 'TODAY') {
      return itemDate.toDateString() === now.toDateString();
    } else if (adminDateFilter === '7DAYS') {
      const diffTime = Math.abs(now - itemDate);
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    } else if (adminDateFilter === '30DAYS') {
      const diffTime = Math.abs(now - itemDate);
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    }
    return true;
  });

  const getFilterLabel = () => {
    switch (adminDateFilter) {
      case 'TODAY': return 'Bugünkü';
      case '7DAYS': return 'Son 7 Günlük';
      case '30DAYS': return 'Son 30 Günlük';
      case 'ALL': return 'Tüm Zamanların';
      default: return '';
    }
  };
  const filterLabel = getFilterLabel();

  const uniqueUsersList = Array.from(new Set(filteredByDate.map(item => item.kullanici_adi)));
  const filteredHistory = filteredByDate.filter(item => selectedUserFilter === 'ALL' || item.kullanici_adi === selectedUserFilter);

  const hourlyTraffic = Array(24).fill(0);
  filteredByDate.forEach(item => {
    if (item.created_at) {
      const hour = new Date(item.created_at).getHours();
      hourlyTraffic[hour] += 1;
    }
  });

  const daysMap = { 'Mon': 'Pzt', 'Tue': 'Sal', 'Wed': 'Çar', 'Thu': 'Per', 'Fri': 'Cum', 'Sat': 'Cmt', 'Sun': 'Paz' };
  const last7DaysCounts = { 'Pzt': 0, 'Sal': 0, 'Çar': 0, 'Per': 0, 'Cum': 0, 'Cmt': 0, 'Paz': 0 };
  filteredByDate.forEach(item => {
    if (item.created_at) {
      const dStr = new Date(item.created_at).toLocaleDateString('en-US', { weekday: 'short' });
      const trDay = daysMap[dStr];
      if (trDay && last7DaysCounts[trDay] !== undefined) {
        last7DaysCounts[trDay] += 1;
      }
    }
  });

  const modelCounts = {};
  const modelStats = {};
  const modelTokens = {};

  filteredByDate.forEach(item => {
    let m = item.model_adi || 'google/gemini-2.5-flash';
    if (!modelCounts[m]) {
      modelCounts[m] = 0;
      modelStats[m] = { totalTime: 0, count: 0, totalTokens: 0 };
      modelTokens[m] = 0;
    }
    modelCounts[m] += 1;
    modelTokens[m] += Number(item.total_tokens || 0);
    modelStats[m].totalTime += Number(item.sure || 0.1);
    modelStats[m].totalTokens += Number(item.total_tokens || 0);
    modelStats[m].count += 1;
  });

  const sortedModelsByUsage = Object.entries(modelCounts).sort((a, b) => b[1] - a[1]);
  const sortedModelsByToken = Object.entries(modelTokens).sort((a, b) => b[1] - a[1]);
  let totalPeriodCost = 0;

  const modelEfficiency = Object.keys(modelStats).map(m => {
    const stats = modelStats[m];
    const validHistory = filteredByDate.filter(item => (item.model_adi || 'google/gemini-2.5-flash') === m && Number(item.sure || 0) > 0.1);
    let totalTokensForModel = 0, totalTimeForModel = 0;
    validHistory.forEach(item => {
      totalTokensForModel += Number(item.total_tokens || 0);
      totalTimeForModel += Number(item.sure);
    });
    const tokensPerSecond = totalTimeForModel > 0 ? Math.round(totalTokensForModel / totalTimeForModel) : 0;
    const avgTime = stats.count > 0 ? (stats.totalTime / stats.count).toFixed(2) : '0.00';
    const totalTokensCount = stats.totalTokens.toLocaleString('tr-TR');
    let costPerToken = 0.000002; 
    const isModelFree = m.includes('free') || m.includes('flash');
    if (isModelFree) costPerToken = 0.0;
    const estimatedCostNum = stats.totalTokens * costPerToken;
    totalPeriodCost += estimatedCostNum;
    const estimatedCost = isModelFree ? "Free" : `$${estimatedCostNum.toFixed(6)}`;
    return { model: m, avgTime, totalTokensCount, tokensPerSecond, totalUses: stats.count, estimatedCost, isModelFree };
  }).sort((a, b) => b.tokensPerSecond - a.tokensPerSecond);

  const filteredOpenRouterModels = openRouterModels.filter(m => 
    m.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) || 
    m.id.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  return (
    <div 
      className="hero-section" 
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.35)), url(${arkaplan})` 
      }}
    >
      
      <aside className="sidebar">
        <div className="sidebar-brand" onClick={() => setSelectedLocation(null)} style={{ cursor: 'pointer' }}>
          <span className="logo-icon"><FaMapMarkerAlt /></span> Bursa
        </div>
        
        <div className="sidebar-section-title">{lang === 'TR' ? 'ŞEHRİ KEŞFEDİN' : 'EXPLORE CITY'}</div>
        <ul className="sidebar-menu">
          <li><a href="#top" onClick={(e) => { e.preventDefault(); setSelectedLocation("Trilye"); }}><FaCity /> Trilye</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); setSelectedLocation("Uludağ"); }}><FaMountain /> Uludağ</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); setSelectedLocation("Mudanya"); }}><FaMapMarkerAlt /> Mudanya</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); setSelectedLocation("Teleferik"); }}><FaTram /> {lang === 'TR' ? 'Teleferik' : 'Cable Car'}</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); setSelectedLocation("Botanic Park"); }}><FaTree /> Botanik Park</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); setSelectedLocation("Suuçtu Şelalesi"); }}><FaWater /> {lang === 'TR' ? 'Suuçtu Şelalesi' : 'Suuctu Waterfall'}</a></li>
        </ul>

        <div className="sidebar-section-title">{lang === 'TR' ? 'TARİH & KÜLTÜR' : 'HISTORY & CULTURE'}</div>
        <ul className="sidebar-menu">
          <li><a href="#top" onClick={(e) => { e.preventDefault(); setSelectedLocation("Cumalıkızık"); }}><FaLandmark /> Cumalıkızık</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); setSelectedLocation("Koza Han"); }}><FaStore /> Koza Han</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); setSelectedLocation("Ulu Cami"); }}><FaMosque /> Ulu Cami</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); setSelectedLocation("Karagöz Müzesi"); }}><FaTheaterMasks /> Karagöz Müzesi</a></li>
        </ul>

        <div className="sidebar-section-title">{lang === 'TR' ? 'BURSA TATLARI' : 'BURSA TASTES'}</div>
        <ul className="sidebar-menu">
          <li><a href="#top" onClick={(e) => { e.preventDefault(); setSelectedLocation("İskender Kebap"); }}><FaUtensils /> İskender Kebap</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); setSelectedLocation("İnegöl Köfte"); }}><FaUtensils /> İnegöl Köfte</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); setSelectedLocation("Kestane Şekeri"); }}><FaUtensils /> Kestane Şekeri</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); setSelectedLocation("Kemalpaşa Tatlısı"); }}><FaUtensils /> Kemalpaşa Tatlısı</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); setSelectedLocation("Bursa Şeftalisi"); }}><FaLeaf /> Bursa Şeftalisi</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); setSelectedLocation("Cantık"); }}><FaPizzaSlice /> Cantık</a></li>
        </ul>

        <div className="sidebar-weather">
          <div className="weather-title">{lang === 'TR' ? 'HAVA DURUMU' : 'WEATHER'}</div>
          <div className="weather-item">
            <FaSun style={{ color: '#fbbf24', fontSize: '14px' }} />
            <span>Bursa: <strong>{weatherBursa.temp}°C</strong> - {weatherBursa.condition}</span>
          </div>
          <div className="weather-item">
            <FaCloudSun style={{ color: '#fcd34d', fontSize: '14px' }} />
            <span>Uludağ: <strong>{weatherUludag.temp}°C</strong> - {weatherUludag.condition}</span>
          </div>
        </div>
      </aside>

      <div className="top-right-panel" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div className="lang-selector">
          <button className={lang === 'TR' ? 'lang-btn active' : 'lang-btn'} onClick={() => setLang('TR')}>TR</button>
          <button className={lang === 'EN' ? 'lang-btn active' : 'lang-btn'} onClick={() => setLang('EN')}>EN</button>
        </div>

        {limitReached && (
          <button 
            onClick={handleStartNewSession}
            style={{
              background: '#4ade80', color: '#000', border: 'none', padding: '8px 14px',
              borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex',
              alignItems: 'center', gap: '6px', fontSize: '12px', boxShadow: '0 4px 12px rgba(74,222,128,0.3)'
            }}
          >
            ✨ Yeni Oturuma Başla
          </button>
        )}

        {isLoggedIn && userEmail === ADMIN_EMAIL && (
          <button 
            onClick={fetchAdminStats}
            style={{
              background: '#22c55e', color: 'white', border: 'none', padding: '8px 14px',
              borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex',
              alignItems: 'center', gap: '6px', fontSize: '12px', boxShadow: '0 4px 12px rgba(34,197,94,0.3)'
            }}
          >
            <FaShieldAlt /> Admin Paneli
          </button>
        )}

        {!isLoggedIn ? (
          <button className="btn btn-google" onClick={() => loginWithGoogle()} style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '12px' }}>
            <FaGoogle /> Giriş Yap
          </button>
        ) : (
          <div className="user-profile" onClick={handleLogout}>
            <FaUserCircle size={15} />
            <span>{lang === 'TR' ? 'Çıkış Yap' : 'Log Out'}</span>
          </div>
        )}
      </div>

      <div className="hero-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: chatHistory.length > 0 || loading ? 'flex-end' : 'center', height: '100%', paddingBottom: '20px', position: 'relative', boxSizing: 'border-box' }}>
        
        {showContextWarning && !limitReached && (
          <div style={{
            background: 'rgba(24, 24, 27, 0.95)', backdropFilter: 'blur(15px)', 
            border: '1px solid rgba(59, 130, 246, 0.5)', padding: '16px 20px', 
            borderRadius: '16px', color: '#f1f5f9', fontSize: '13px',
            display: 'flex', flexDirection: 'column', gap: '12px', width: '90%', maxWidth: '900px', 
            margin: '0 auto 12px auto', boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontWeight: 'bold' }}>
              <FaRobot /> Sohbet Hafızası Uyarısı (%{currentPercentage} Doluluk)
            </div>
            <p style={{ margin: 0, color: '#d4d4d8', lineHeight: '1.5' }}>
              Konuşma geçmişimiz hafıza sınırına yaklaştı. Konuşmanın tamamının özetini alıp yeni oturuma geçmek ister misiniz?
            </p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={handleRequestSummary}
                style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>📝</span> Konuşmanın Özetini İste
              </button>
              <button 
                onClick={handleStartNewSession}
                style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#4ade80', padding: '8px 14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
              >
                ✨ Doğrudan Yeni Oturuma Başla
              </button>
              <button 
                onClick={() => setShowContextWarning(false)}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#a1a1aa', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', marginLeft: 'auto' }}
              >
                Kapat
              </button>
            </div>
          </div>
        )}

        {(chatHistory.length > 0 || loading) && (
          <div style={{ flex: 1, overflowY: 'auto', width: '100%', maxWidth: '900px', margin: '0 auto', padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: 'calc(100vh - 220px)' }}>
            {chatHistory.map((chat, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', alignSelf: 'flex-end', maxWidth: '85%' }}>
                  {!chat.isEditing && (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button 
                        onClick={() => handleCopyText(chat.prompt)}
                        title="İstemi Kopyala"
                        style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <FaCopy size={11} />
                      </button>
                      <button 
                        onClick={() => {
                          const updated = [...chatHistory];
                          updated[idx].isEditing = true;
                          updated[idx].editText = chat.prompt;
                          setChatHistory(updated);
                        }}
                        title="İstemi Düzenle"
                        style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <FaPencilAlt size={11} />
                      </button>
                    </div>
                  )}

                  {chat.isEditing ? (
                    <div style={{ background: '#2563eb', padding: '8px 12px', borderRadius: '14px', display: 'flex', gap: '6px', alignItems: 'center', boxShadow: '0 4px 15px rgba(37,99,235,0.4)' }}>
                      <input 
                        type="text" 
                        value={chat.editText !== undefined ? chat.editText : chat.prompt}
                        onChange={(e) => {
                          const updated = [...chatHistory];
                          updated[idx].editText = e.target.value;
                          setChatHistory(updated);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit(idx, chat.editText)}
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '6px 10px', borderRadius: '8px', outline: 'none', fontSize: '14px', width: '220px' }}
                        autoFocus
                      />
                      <button 
                        onClick={() => handleEditSubmit(idx, chat.editText)}
                        title="Onayla"
                        style={{ background: '#4ade80', color: '#000', border: 'none', width: '26px', height: '26px', borderRadius: '50%', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <FaCheck size={11} />
                      </button>
                      <button 
                        onClick={() => {
                          const updated = [...chatHistory];
                          updated[idx].isEditing = false;
                          setChatHistory(updated);
                        }}
                        title="İptal"
                        style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', width: '26px', height: '26px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <FaTimes size={11} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ background: '#2563eb', color: 'white', padding: '12px 18px', borderRadius: '18px 18px 4px 18px', fontSize: '14px', wordBreak: 'break-word', boxShadow: '0 4px 15px rgba(37,99,235,0.3)', lineHeight: '1.5' }}>
                      {chat.prompt}
                    </div>
                  )}

                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, fontSize: '12px' }}>
                    <FaUserCircle />
                  </div>
                </div>
                
                {loadingEditIdx === idx ? (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', alignSelf: 'flex-start', maxWidth: '85%' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, fontSize: '12px', marginTop: '2px' }}>
                      <FaRobot />
                    </div>
                    <div style={{ 
                      background: 'rgba(18, 18, 20, 0.95)', 
                      backdropFilter: 'blur(20px)', 
                      border: '1px solid rgba(74, 222, 128, 0.3)', 
                      padding: '16px 20px', 
                      borderRadius: '4px 18px 18px 18px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      color: '#f1f5f9', 
                      boxShadow: '0 15px 35px rgba(0,0,0,0.6)'
                    }}>
                      <div style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '12px' }}>
                        Bursa AI Rehberi
                      </div>
                      <span style={{ color: '#9ca3af', fontSize: '13px', fontStyle: 'italic' }}>
                        Yapay zeka düşünüyor...
                      </span>
                      <span style={{ color: '#facc15', fontSize: '12px', fontStyle: 'italic', background: 'rgba(250, 204, 21, 0.15)', padding: '3px 10px', borderRadius: '8px', fontWeight: 'bold', marginLeft: 'auto', minWidth: '45px', textAlign: 'center' }}>
                        {elapsedTime.toFixed(1)}s
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', alignSelf: 'flex-start', maxWidth: '85%' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, fontSize: '12px', marginTop: '2px' }}>
                      <FaRobot />
                    </div>
                    <div style={{ background: 'rgba(24, 24, 27, 0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#f1f5f9', padding: '16px 20px', borderRadius: '4px 18px 18px 18px', fontSize: '14px', lineHeight: '1.7', boxShadow: '0 15px 35px rgba(0,0,0,0.5)', width: '100%' }}>
                      <div style={{ color: '#4ade80', fontWeight: 'bold', marginBottom: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Bursa AI Rehberi
                      </div>
                      <ReactMarkdown>{chat.response}</ReactMarkdown>

                      <div style={{ display: 'flex', gap: '16px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', alignItems: 'center' }}>
                        <button 
                          onClick={() => handleCopyText(chat.response)}
                          title="Yanıtı Kopyala"
                          style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', transition: 'color 0.2s' }}
                        >
                          <FaCopy /> Kopyala
                        </button>
                        <button 
                          onClick={() => handleAskAI(chat.prompt)}
                          title="Yeniden Sor"
                          style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}
                        >
                          <FaRedo /> Yeniden Sor
                        </button>
                        <button 
                          onClick={() => {
                            if (speakingIdx === idx) {
                              window.speechSynthesis.cancel();
                              setSpeakingIdx(null);
                            } else {
                              window.speechSynthesis.cancel();
                              const utterance = new SpeechSynthesisUtterance(chat.response);
                              utterance.lang = 'tr-TR';
                              utterance.onend = () => setSpeakingIdx(null);
                              window.speechSynthesis.speak(utterance);
                              setSpeakingIdx(idx);
                            }
                          }}
                          title={speakingIdx === idx ? "Durdur" : "Sesli Oku"}
                          style={{ background: 'transparent', border: 'none', color: speakingIdx === idx ? '#4ade80' : '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}
                        >
                          {speakingIdx === idx ? <><FaStop /> Durdur</> : <><FaVolumeUp /> Sesli Oku</>}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ))}

            {loading && loadingEditIdx === null && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', alignSelf: 'flex-end', maxWidth: '85%' }}>
                  <div style={{ background: '#2563eb', color: 'white', padding: '12px 18px', borderRadius: '18px 18px 4px 18px', fontSize: '14px', wordBreak: 'break-word', boxShadow: '0 4px 15px rgba(37,99,235,0.3)', lineHeight: '1.5' }}>
                    {currentQuestion}
                  </div>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, fontSize: '12px' }}>
                    <FaUserCircle />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', alignSelf: 'flex-start', maxWidth: '85%' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, fontSize: '12px', marginTop: '2px' }}>
                    <FaRobot />
                  </div>
                  <div style={{ 
                    background: 'rgba(24, 24, 27, 0.95)', 
                    backdropFilter: 'blur(20px)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    padding: '16px 20px', 
                    borderRadius: '4px 18px 18px 18px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    color: '#f1f5f9', 
                    boxShadow: '0 15px 35px rgba(0,0,0,0.5)'
                  }}>
                    <div style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '12px' }}>
                      Bursa AI Rehberi
                    </div>
                    <span style={{ color: '#9ca3af', fontSize: '13px', fontStyle: 'italic' }}>
                      Yapay zeka düşünüyor...
                    </span>
                    <span style={{ color: '#facc15', fontSize: '12px', fontStyle: 'italic', background: 'rgba(250, 204, 21, 0.15)', padding: '3px 10px', borderRadius: '8px', fontWeight: 'bold', marginLeft: 'auto', minWidth: '45px', textAlign: 'center' }}>
                      {elapsedTime.toFixed(1)}s
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {chatHistory.length === 0 && !loading && (
          <>
            <h1 className="main-title">BURSA'YI <br /> KEŞFET</h1>
            <p className="main-subtitle">
              {lang === 'TR' 
                ? "Yapay zekâ destekli rehberinizle şehri keşfetme zamanı geldi." 
                : "It's time to explore the city with your AI-powered guide."}
            </p>
          </>
        )}
        
        {isLoggedIn && (
          <div style={{
            display: 'flex', gap: '10px', width: '90%', maxWidth: '900px', margin: '0 auto 10px auto',
            background: 'rgba(24, 24, 27, 0.9)', backdropFilter: 'blur(15px)', padding: '12px 18px',
            borderRadius: '16px', border: '1px solid rgba(34, 197, 94, 0.4)', alignItems: 'center', flexWrap: 'wrap', boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontSize: '13px', fontWeight: '600' }}>
              <FaCogs /> Model:
            </div>
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                padding: '8px 12px', borderRadius: '10px', outline: 'none', fontSize: '13px', cursor: 'pointer', flex: 1
              }}
            >
              {modelsList
                .filter(m => !m.is_default_free)
                .map((m) => (
                  <option key={m.id} value={m.model_key}>{m.model_name} ({m.model_key})</option>
                ))}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(34,197,94,0.1)', padding: '6px 12px', borderRadius: '8px' }}>
              <FaCheckCircle style={{ color: '#4ade80' }} />
              <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: '600' }}>API Key Güvenle Kaydedildi</span>
              <button 
                onClick={async () => { 
                  setUserApiKey(''); 
                  setIsApiKeySaved(false); 
                  setIsKeyInvalidOrDeleted(false);
                  setTempApiKeyInput(''); 
                  setApiKeyErrorMsg(''); 
                  setShowApiKeyModal(true); 
                  try {
                    await fetch(`${API_BASE_URL}/api/clear-key?email=${encodeURIComponent(userEmail)}`, {
                      method: 'POST'
                    });
                  } catch (err) {
                  }
                }} 
                style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#60a5fa', cursor: 'pointer', fontSize: '12px', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}
              >
                <FaEdit /> Değiştir
              </button>
            </div>
          </div>
        )}

        {!isLoggedIn && chatHistory.length === 0 && !loading && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', width: '90%', maxWidth: '900px', margin: '0 auto 10px auto',
            background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', padding: '10px 16px',
            borderRadius: '14px', boxSizing: 'border-box'
          }}>
            <FaInfoCircle style={{ color: '#4ade80', fontSize: '16px', flexShrink: 0 }} />
            <span style={{ color: '#ffffff', fontSize: '13px' }}>
              Şu anda <strong style={{ color: '#4ade80' }}>ücretsiz modda</strong> soru soruyorsunuz. Kendi API anahtarınızla bağlanmak için sağ üstten <strong style={{ color: '#4ade80' }}>Google ile Giriş Yapabilirsiniz</strong>.
            </span>
          </div>
        )}

        <div className="action-buttons" style={{ flexDirection: 'column', width: '90%', maxWidth: '1200px', margin: '0 auto', alignItems: 'center', boxSizing: 'border-box' }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '900px' }}>
            
            {limitReached ? (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)',
                padding: '16px 20px', borderRadius: '16px', color: '#f87171', fontSize: '14px',
                textAlign: 'center', fontWeight: 'bold', width: '100%', boxSizing: 'border-box'
              }}>
                🔒 Konuşma limiti tamamlandı. Yeni bir oturuma başlayabilirsiniz.
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <input 
                  type="text" 
                  value={prompt} 
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleAskAI()}
                  placeholder={lang === 'TR' ? "Bursa hakkında ne öğrenmek istiyorsun?" : "What do you want to learn about Bursa?"} 
                  style={{
                    flex: 1, padding: '14px 20px', borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.2)', background: 'rgba(0, 0, 0, 0.6)',
                    color: 'white', outline: 'none', backdropFilter: 'blur(10px)', fontSize: '14px'
                  }}
                />

                {loading ? (
                  <button 
                    onClick={handleStopGeneration}
                    style={{
                      background: '#ef4444', color: 'white', border: 'none',
                      padding: '14px 24px', borderRadius: '20px', cursor: 'pointer',
                      fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px',
                      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
                    }}
                  >
                    <FaStop /> {lang === 'TR' ? 'Durdur' : 'Stop'}
                  </button>
                ) : (
                  <button 
                    className="btn btn-ai" 
                    onClick={() => handleAskAI()}
                    style={{ padding: '14px 24px', borderRadius: '20px', cursor: 'pointer', fontSize: '14px' }}
                  >
                    <FaRobot /> {lang === 'TR' ? 'Sor' : 'Ask'}
                  </button>
                )}
              </div>
            )}

            {errorMessage && (
              <div style={{
                background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.2)',
                padding: '12px 18px', borderRadius: '14px', color: '#18181b', fontSize: '13px',
                display: 'flex', alignItems: 'center', gap: '8px', width: '100%', fontWeight: '500',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
              }}>
                <span style={{ fontSize: '16px' }}>⚠️</span> <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {selectedLocation && locationData[selectedLocation] ? (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.95)), url(' + arkaplan + ')',
            backgroundSize: 'cover', backgroundPosition: 'center',
            zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'flex-start', padding: '40px 20px', overflowY: 'auto',
            color: '#f4f4f5', animation: 'fadeIn 0.4s ease-in-out'
          }}>
            <div style={{ 
              width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px',
              padding: '0 10px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ color: '#4ade80', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>BURSA KEŞİF REHBERİ</span>
                <h1 style={{ margin: '5px 0 0 0', fontSize: '32px', color: '#ffffff', fontWeight: '800', minHeight: '40px' }}>{locationData[selectedLocation].title}</h1>
                <p style={{ margin: '5px 0 0 0', fontSize: '15px', color: '#a1a1aa', fontStyle: 'italic' }}>{locationData[selectedLocation].subtitle}</p>
              </div>
              <button 
                onClick={() => setSelectedLocation(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white', padding: '10px 20px', borderRadius: '14px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                  transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}
              >
                <FaTimes /> Ana Sayfaya Dön
              </button>
            </div>

            <div style={{
              width: '100%', maxWidth: '1000px', background: 'rgba(24, 24, 27, 0.9)',
              backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '24px', padding: '30px', boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
              display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left',
              maxHeight: '75vh', overflowY: 'auto'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', color: '#4ade80', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📖 {["İskender Kebap", "İnegöl Köfte", "Kestane Şekeri", "Kemalpaşa Tatlısı", "Bursa Şeftalisi", "Cantık"].includes(selectedLocation) 
                    ? "Lezzet Hakkında Detaylı Bilgi" 
                    : "Mekan Hakkında Detaylı Tanıtım"}
                </h3>
                <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#ffffff', margin: 0 }}>
                  {locationData[selectedLocation].description}
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '16px', color: '#4ade80', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⭐ Öne Çıkan Özellikler & Noktalar</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {locationData[selectedLocation].highlights.map((h, idx) => (
                    <span key={idx} style={{ background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', color: '#ffffff', fontWeight: '500' }}>
                      ✓ {h}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '16px', color: '#4ade80', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🤖 {["İskender Kebap", "İnegöl Köfte", "Kestane Şekeri", "Kemalpaşa Tatlısı", "Bursa Şeftalisi", "Cantık"].includes(selectedLocation) 
                    ? "Yapay Zeka Rehberine Bu Lezzet İçin Sorulabilecek Sorular:" 
                    : "Yapay Zeka Rehberine Bu Mekan İçin Sorulabilecek Sorular:"}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {locationData[selectedLocation].suggestedQuestions.map((q, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        setSelectedLocation(null);
                        handlePresetClick(q);
                      }}
                      style={{
                        background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)',
                        color: '#ffffff', padding: '14px 18px', borderRadius: '14px', cursor: 'pointer',
                        textAlign: 'left', fontSize: '14px', transition: 'all 0.2s', fontWeight: '600',
                        display: 'flex', alignItems: 'center', gap: '10px'
                      }}
                    >
                      <span>💬</span> {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          chatHistory.length === 0 && !loading && (
            <div className="services-grid">
              <a href="https://www.beo.org.tr/nobetci-eczaneler" target="_blank" rel="noopener noreferrer" className="service-card">
                <span className="icon"><FaPills /></span>
                <h3>{lang === 'TR' ? 'Nöbetçi Eczaneler' : 'On-Duty Pharmacies'}</h3>
                <p>{lang === 'TR' ? 'Size en yakın nöbetçi eczaneyi anında bulun, tek tıkla yol tarifini alın.' : 'Find the nearest on-duty pharmacy instantly, get directions with one click.'}</p>
              </a>

              <div onClick={() => setSelectedLocation("Bursa Tanıtımı")} className="service-card" style={{ cursor: 'pointer' }}>
                <span className="icon"><FaLandmark /></span>
                <h3>{lang === 'TR' ? 'Bursa Tanıtımı' : 'City Overview'}</h3>
                <p>{lang === 'TR' ? "Bursa'nın tarihi, kültürü ve genel yapısı hakkında kapsamlı bilgi alın." : "Get comprehensive information about Bursa's history, culture and general structure."}</p>
              </div>
              
              <a href="https://www.burulas.com.tr/" target="_blank" rel="noopener noreferrer" className="service-card">
                <span className="icon"><FaBus /></span>
                <h3>{lang === 'TR' ? 'Ulaşım' : 'Timetables'}</h3>
                <p>{lang === 'TR' ? 'BURULAŞ hatlarında canlı sefer saatlerini görün, güzergahınızı planlayın.' : 'See live departure times on BURULAŞ lines and plan your route.'}</p>
              </a>
              
              <a href="https://www.passo.com.tr" target="_blank" rel="noopener noreferrer" className="service-card">
                <span className="icon"><FaFutbol /></span>
                <h3>{lang === 'TR' ? 'Maç Biletleri' : 'Match Tickets'}</h3>
                <p>{lang === 'TR' ? "Bursaspor'un güncel maç takvimi, tribün doluluk oranları ve bilet durumu." : "Bursaspor's current match schedule, stand occupancy rates and ticket status."}</p>
              </a>
            </div>
          )
        )}
      </div>

      {showApiKeyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5000, padding: '20px'
        }}>
          <div style={{
            background: '#18181b', border: '1px solid rgba(34,197,94,0.4)',
            borderRadius: '20px', width: '100%', maxWidth: '520px', padding: '30px',
            display: 'flex', flexDirection: 'column', gap: '20px', color: '#f4f4f5',
            boxShadow: '0 25px 50px rgba(0,0,0,0.9)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#4ade80', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaKey /> OpenRouter API Anahtarı Doğrulama
              </h3>
              <button 
                onClick={() => { 
                  setShowApiKeyModal(false); 
                  setApiKeyErrorMsg(''); 
                  setIsKeyInvalidOrDeleted(false);
                  if (!userApiKey || !userApiKey.trim()) {
                    handleLogout();
                  }
                }} 
                style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '18px' }}
              >
                <FaTimes />
              </button>
            </div>

            {isKeyInvalidOrDeleted ? (
              <p style={{ fontSize: '13px', color: '#f87171', margin: 0, lineHeight: '1.5', fontWeight: 'bold' }}>
                ⚠️ OpenRouter API anahtarınız silinmiş veya geçersiz hale gelmiş. Devam etmek için lütfen geçerli bir anahtar girin.
              </p>
            ) : (
              <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0, lineHeight: '1.5' }}>
                OpenRouter API anahtarınız <strong>sk-or-v1-</strong> ile başlamalı, tam olarak <strong>73 karakter</strong> olmalı ve geçerli bir OpenRouter anahtarı olmalıdır. Yanlış veya sahte anahtarlar kesinlikle kabul edilmez.
              </p>
            )}
            
            <form onSubmit={handleSaveUserApiKey} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input 
                type="password"
                placeholder="sk-or-v1-..."
                value={tempApiKeyInput}
                onChange={(e) => setTempApiKeyInput(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '12px', background: '#27272a',
                  border: '1px solid rgba(255,255,255,0.2)', color: 'white', outline: 'none', fontSize: '14px', fontFamily: 'monospace',
                  boxSizing: 'border-box'
                }}
              />

              {apiKeyErrorMsg && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)',
                  padding: '10px 14px', borderRadius: '10px', color: '#f87171', fontSize: '12px',
                  display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500'
                }}>
                  <span>⚠️</span> <span>{apiKeyErrorMsg}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={validatingKey}
                style={{
                  background: '#4ade80', color: '#000000', border: 'none', padding: '12px',
                  borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '4px',
                  opacity: validatingKey ? 0.7 : 1
                }}
              >
                {validatingKey ? '⏳ Doğrulanıyor...' : '🔒 Doğrula ve Güvenle Kaydet'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showAdminPanel && adminStats && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px'
        }}>
          <div style={{
            background: '#18181b', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px', width: '96vw', maxWidth: '1450px', height: '96vh', maxHeight: '96vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', color: '#f4f4f5'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#27272a', flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80' }}>
                  <FaShieldAlt /> Yönetici Paneli
                </h2>
                
                <div style={{ display: 'flex', background: '#18181b', borderRadius: '8px', padding: '3px', border: '1px solid rgba(255,255,255,0.1)', gap: '4px' }}>
                  <button
                    onClick={() => setAdminTab('stats')}
                    style={{
                      background: adminTab === 'stats' ? '#4ade80' : 'transparent',
                      color: adminTab === 'stats' ? '#000000' : '#a1a1aa',
                      border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
                      fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    📊 Analitik & İstatistikler
                  </button>
                  <button
                    onClick={() => setAdminTab('models')}
                    style={{
                      background: adminTab === 'models' ? '#4ade80' : 'transparent',
                      color: adminTab === 'models' ? '#000000' : '#a1a1aa',
                      border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
                      fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    ⚙️ Model Yönetimi
                  </button>
                </div>
              </div>

              <button onClick={() => setShowAdminPanel(false)} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '18px' }}>
                <FaTimes />
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {adminTab === 'stats' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', background: '#27272a', borderRadius: '8px', padding: '3px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {[['TODAY', 'Bugün'], ['7DAYS', 'Son 7 Gün'], ['30DAYS', 'Son 30 Gün'], ['ALL', 'Tümü']].map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => { setAdminDateFilter(key); setAdminPage(1); }}
                          style={{
                            background: adminDateFilter === key ? '#4ade80' : 'transparent',
                            color: adminDateFilter === key ? '#000000' : '#a1a1aa',
                            border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
                            fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                    <div style={{ background: '#27272a', padding: '16px', borderRadius: '14px', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#a1a1aa' }}>
                        {filterLabel} Kullanıcı Sayısı
                      </h4>
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#4ade80' }}>{uniqueUsersList.length}</span>
                    </div>
                    <div style={{ background: '#27272a', padding: '16px', borderRadius: '14px', border: '1px solid rgba(59,130,246,0.2)' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#a1a1aa' }}>
                        {filterLabel} Soru Sayısı
                      </h4>
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#60a5fa' }}>{filteredByDate.length}</span>
                    </div>
                    <div style={{ background: '#27272a', padding: '16px', borderRadius: '14px', border: '1px solid rgba(248,113,113,0.3)' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#a1a1aa' }}>
                        {filterLabel} Maliyet
                      </h4>
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#f87171' }}>${totalPeriodCost.toFixed(6)}</span>
                    </div>
                  </div>

                  <div style={{ background: '#27272a', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaClock /> Saatlik Soru Dağılımı (Saat Dilimlerine Göre)
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '75px', gap: '4px', paddingTop: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      {hourlyTraffic.map((count, hour) => {
                        const maxVal = Math.max(...hourlyTraffic, 1);
                        const heightPercent = Math.max((count / maxVal) * 55, count > 0 ? 15 : 4);
                        return (
                          <div key={hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                            {count > 0 && <span style={{ fontSize: '9px', color: '#c084fc', marginBottom: '2px' }}>{count}</span>}
                            <div style={{ width: '100%', height: `${heightPercent}px`, background: count > 0 ? '#c084fc' : 'rgba(255,255,255,0.05)', borderRadius: '3px 3px 0 0' }}></div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#a1a1aa', marginTop: '6px' }}>
                      <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
                    </div>
                  </div>

                  <div style={{ background: '#27272a', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaCalendarAlt /> Günlere Göre Soru Dağılımı
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '75px', gap: '12px', paddingTop: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', justifyContent: 'space-around' }}>
                      {Object.entries(last7DaysCounts).map(([dayName, count]) => {
                        const maxVal = Math.max(...Object.values(last7DaysCounts), 1);
                        const heightPercent = Math.max((count / maxVal) * 60, count > 0 ? 15 : 4);
                        return (
                          <div key={dayName} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                            {count > 0 && <span style={{ fontSize: '10px', color: '#fbbf24', marginBottom: '2px' }}>{count}</span>}
                            <div style={{ width: '70%', height: `${heightPercent}px`, background: count > 0 ? '#fbbf24' : 'rgba(255,255,255,0.05)', borderRadius: '4px 4px 0 0' }}></div>
                            <span style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '6px' }}>{dayName}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div style={{ background: '#27272a', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <h3 style={{ fontSize: '14px', marginBottom: '14px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaTrophy /> Model Kullanım Sıralaması
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                        {sortedModelsByUsage.map(([modelName, count], idx) => {
                          const percentage = filteredByDate.length > 0 ? Math.round((count / filteredByDate.length) * 100) : 0;
                          return (
                            <div key={modelName} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span style={{ color: '#e4e4e7', fontFamily: 'monospace' }}>#{idx + 1} {modelName}</span>
                                <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{count} soru (%{percentage})</span>
                              </div>
                              <div style={{ width: '100%', background: '#3f3f46', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${percentage}%`, background: '#4ade80', height: '100%', borderRadius: '4px' }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ background: '#27272a', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <h3 style={{ fontSize: '14px', marginBottom: '14px', color: '#facc15', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaCoins /> Token Tüketim Sıralaması
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                        {sortedModelsByToken.map(([modelName, totalTok], idx) => {
                          const maxTok = Math.max(...Object.values(modelTokens), 1);
                          const percentage = Math.round((totalTok / maxTok) * 100);
                          return (
                            <div key={modelName} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span style={{ color: '#e4e4e7', fontFamily: 'monospace' }}>#{idx + 1} {modelName}</span>
                                <span style={{ color: '#facc15', fontWeight: 'bold' }}>{totalTok.toLocaleString('tr-TR')} token</span>
                              </div>
                              <div style={{ width: '100%', background: '#3f3f46', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${percentage}%`, background: '#facc15', height: '100%', borderRadius: '4px' }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ background: '#27272a', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <h3 style={{ fontSize: '14px', marginBottom: '14px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaBolt /> Model Verimlilik (Token/sn)
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                        {modelEfficiency.map((item, idx) => (
                          <div key={item.model} style={{ background: '#18181b', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: `4px solid ${idx === 0 ? '#4ade80' : '#60a5fa'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#60a5fa', fontWeight: 'bold', fontFamily: 'monospace' }}>{item.model}</span>
                              <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{item.tokensPerSecond} t/sn</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', fontSize: '10.5px' }}>
                              <span>Süre: <strong style={{ color: '#e4e4e7' }}>{item.avgTime}s</strong> | Toplam Token: <strong style={{ color: '#c084fc' }}>{item.totalTokensCount}</strong></span>
                              <span>Maliyet: <strong style={{ color: item.isModelFree ? '#4ade80' : '#f87171' }}>{item.estimatedCost}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <h3 style={{ fontSize: '15px', margin: 0, color: '#e4e4e7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaFilter /> Soru-Cevap Geçmişi ({filteredHistory.length})
                      </h3>
                      
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select 
                          value={selectedUserFilter}
                          onChange={(e) => { setSelectedUserFilter(e.target.value); setAdminPage(1); }}
                          style={{
                            background: '#18181b', color: 'white', border: '1px solid rgba(255,255,255,0.15)',
                            padding: '6px 10px', borderRadius: '10px', outline: 'none', fontSize: '12px', cursor: 'pointer'
                          }}
                        >
                          <option value="ALL">Tüm Kullanıcılar</option>
                          {uniqueUsersList.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#a1a1aa' }}>
                          <span>Kayıt:</span>
                          <select 
                            value={rowsPerPage} 
                            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setAdminPage(1); }}
                            style={{ background: '#18181b', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px', outline: 'none' }}
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ background: '#1f1f23', color: '#4ade80', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '12px' }}>Query ID</th>
                            <th style={{ padding: '12px' }}>Chat ID</th>
                            <th style={{ padding: '12px' }}>Request ID</th>
                            <th style={{ padding: '12px' }}>Soran</th>
                            <th style={{ padding: '12px' }}>Model</th>
                            <th style={{ padding: '12px' }}>Süre</th>
                            <th style={{ padding: '12px' }}>Hız</th>
                            <th style={{ padding: '12px' }}>Maliyet</th>
                            <th style={{ padding: '12px' }}>Tarih</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredHistory.length === 0 ? (
                            <tr>
                              <td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: '#a1a1aa' }}>Kayıt bulunamadı.</td>
                            </tr>
                          ) : (
                            filteredHistory
                              .slice((adminPage - 1) * rowsPerPage, adminPage * rowsPerPage)
                              .map((item, index) => {
                                const globalQueryId = (adminPage - 1) * rowsPerPage + index + 1;
                                const tokens = Number(item.total_tokens || 0);
                                const timeSec = Number(item.sure || 0.1);
                                const speed = timeSec > 0 ? Math.round(tokens / timeSec) : 0;
                                
                                let costRate = 0.000002;
                                const isRowFree = (item.model_adi || '').includes('free') || (item.model_adi || '').includes('flash');
                                if (isRowFree) costRate = 0.0;

                                const costNum = tokens * costRate;
                                const rowCostText = isRowFree ? "Free" : `$${costNum.toFixed(6)}`;

                                return (
                                  <tr 
                                    key={item.id} 
                                    onClick={() => setSelectedModalItem(item)}
                                    title="Detayları görmek için tıklayın"
                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#18181b', cursor: 'pointer', transition: 'background 0.15s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#27272a'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#18181b'}
                                  >
                                    <td onClick={() => setSelectedModalItem(item)} style={{ padding: '12px', fontFamily: 'monospace', color: '#4ade80', cursor: 'pointer' }}>#{globalQueryId}</td>
                                    <td onClick={() => setSelectedModalItem(item)} style={{ padding: '12px', fontFamily: 'monospace', color: '#c084fc', cursor: 'pointer' }}>{item.chat_id || 'N/A'}</td>
                                    <td onClick={() => setSelectedModalItem(item)} style={{ padding: '12px', fontFamily: 'monospace', color: '#facc15', cursor: 'pointer' }}>{item.request_id || 'N/A'}</td>
                                    <td onClick={() => setSelectedModalItem(item)} style={{ padding: '12px', color: '#e4e4e7', cursor: 'pointer' }}>{item.kullanici_adi}</td>
                                    <td onClick={() => setSelectedModalItem(item)} style={{ padding: '12px', color: '#60a5fa', cursor: 'pointer' }}>{item.model_adi}</td>
                                    <td onClick={() => setSelectedModalItem(item)} style={{ padding: '12px', color: '#facc15', cursor: 'pointer' }}>{item.sure}s</td>
                                    <td onClick={() => setSelectedModalItem(item)} style={{ padding: '12px', color: '#4ade80', cursor: 'pointer' }}>{speed} t/sn</td>
                                    <td onClick={() => setSelectedModalItem(item)} style={{ padding: '12px', color: isRowFree ? '#4ade80' : '#f87171', cursor: 'pointer' }}>{rowCostText}</td>
                                    <td onClick={() => setSelectedModalItem(item)} style={{ padding: '12px', color: '#a1a1aa', fontSize: '11px', cursor: 'pointer' }}>{item.created_at}</td>
                                  </tr>
                                );
                              })
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
                        Toplam {filteredHistory.length} kayıt | Sayfa {adminPage} / {Math.ceil(filteredHistory.length / rowsPerPage) || 1}
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {Array.from({ length: Math.ceil(filteredHistory.length / rowsPerPage) }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => setAdminPage(pageNum)}
                            style={{
                              background: adminPage === pageNum ? '#4ade80' : '#27272a',
                              color: adminPage === pageNum ? '#000000' : '#e4e4e7',
                              border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
                              fontWeight: 'bold', cursor: 'pointer'
                            }}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontSize: '15px', color: '#4ade80', margin: 0 }}>🤖 Sistemdeki Aktif Modeller</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {modelsList.map((m) => (
                      <div key={m.id} style={{
                        background: '#27272a', padding: '12px 16px', borderRadius: '12px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: m.is_default_free ? '1px solid #4ade80' : '1px solid rgba(255,255,255,0.05)'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px' }}>{m.model_name}</span>
                            {m.is_default_free && (
                              <span style={{ background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', fontSize: '11px', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                                ⭐️ Ücretsiz Misafir Modeli
                              </span>
                            )}
                          </div>
                          <span style={{ color: '#a1a1aa', fontSize: '12px', fontFamily: 'monospace' }}>{m.model_key}</span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button 
                            onClick={() => handleSetFreeModel(m.id)}
                            style={{
                              background: m.is_default_free ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                              color: m.is_default_free ? '#f87171' : '#60a5fa',
                              border: m.is_default_free ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                              padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                            }}
                          >
                            {m.is_default_free ? 'Misafir Modelini Kaldır' : 'Misafir Modeli Yap'}
                          </button>
                          
                          <button 
                            onClick={() => handleDeleteModel(m.id)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)',
                              padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                              display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                          >
                            <FaTrash /> Sil
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ fontSize: '15px', color: '#4ade80', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaSearch /> OpenRouter Model Kataloğundan Ekle
                    </h3>
                    
                    <input 
                      type="text" 
                      placeholder="Model ara (Örn: Claude, GPT, Gemini, Llama)..." 
                      value={modelSearchQuery}
                      onChange={(e) => setModelSearchQuery(e.target.value)}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: '12px', background: '#27272a',
                        border: '1px solid rgba(255,255,255,0.15)', color: 'white', outline: 'none', fontSize: '13px', boxSizing: 'border-box'
                      }}
                    />

                    <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px', background: '#121214' }}>
                      {fetchingOpenRouter ? (
                        <div style={{ textAlign: 'center', color: '#a1a1aa', padding: '20px', fontSize: '13px' }}>OpenRouter modelleri yükleniyor...</div>
                      ) : filteredOpenRouterModels.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#a1a1aa', padding: '20px', fontSize: '13px' }}>Model bulunamadı.</div>
                      ) : (
                        filteredOpenRouterModels.slice(0, 30).map((m) => {
                          const isAlreadyAdded = modelsList.some(existing => existing.model_key === m.id);
                          return (
                            <div key={m.id} style={{
                              background: '#27272a', padding: '10px 14px', borderRadius: '10px',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px'
                            }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '70%' }}>
                                <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{m.name}</span>
                                <span style={{ color: '#a1a1aa', fontSize: '11px', fontFamily: 'monospace' }}>{m.id}</span>
                              </div>

                              <button
                                disabled={isAlreadyAdded}
                                onClick={() => addModelToSystem(m)}
                                style={{
                                  background: isAlreadyAdded ? 'rgba(39, 39, 42, 0.5)' : '#4ade80',
                                  color: isAlreadyAdded ? '#71717a' : '#000000',
                                  border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold',
                                  cursor: isAlreadyAdded ? 'not-allowed' : 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                              >
                                {isAlreadyAdded ? <><FaCheckCircle /> Ekli</> : <><FaPlus /> Sisteme Ekle</>}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '10px' }}>
                    <h3 style={{ fontSize: '15px', color: '#facc15', marginBottom: '14px' }}>🔑 Misafirler İçin Sistem API Anahtarı Tanımla</h3>
                    <form onSubmit={handleSaveSystemKey} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>OpenRouter API Key (Misafirler için ortak kullanılacak):</label>
                        <input 
                          type="password" 
                          placeholder="sk-or-v1-..." 
                          value={systemApiKeyInput}
                          onChange={(e) => setSystemApiKeyInput(e.target.value)}
                          style={{
                            width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#27272a',
                            border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', fontSize: '13px', fontFamily: 'monospace'
                          }}
                        />
                      </div>
                      <button 
                        type="submit"
                        style={{
                          background: '#facc15', color: '#000000', border: 'none', padding: '12px',
                          borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px',
                          marginTop: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px'
                        }}
                      >
                        🔒 Anahtarı Şifrele ve Kaydet
                      </button>
                    </form>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {selectedModalItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5000, padding: '20px'
        }}>
          <div style={{
            background: '#18181b', border: '1px solid rgba(34,197,94,0.4)',
            borderRadius: '20px', width: '90vw', maxWidth: '900px', height: '85vh', maxHeight: '85vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#f4f4f5',
            boxShadow: '0 25px 50px rgba(0,0,0,0.9)'
          }}>
            <div style={{ padding: '18px 24px', background: '#27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px', color: '#4ade80', fontFamily: 'monospace', flexWrap: 'wrap' }}>
                <span>Query #{selectedModalItem.id}</span> 
                <span>• Chat: {selectedModalItem.chat_id || 'N/A'}</span> 
                <span style={{ color: '#facc15' }}>• {selectedModalItem.request_id || 'N/A'}</span>
              </div>
              <button onClick={() => setSelectedModalItem(null)} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '18px' }}>
                <FaTimes />
              </button>
            </div>
            <div style={{ padding: '28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px', flex: 1 }}>
              <div>
                <strong style={{ color: '#60a5fa', display: 'block', marginBottom: '6px' }}>Soran Kullanıcı / Soru:</strong>
                <div style={{ background: '#27272a', padding: '14px 18px', borderRadius: '10px', color: '#ffffff' }}>
                  {selectedModalItem.prompt}
                </div>
              </div>
              <div>
                <strong style={{ color: '#4ade80', display: 'block', marginBottom: '6px' }}>Yapay Zeka Yanıtı:</strong>
                <div style={{ background: '#27272a', padding: '16px 18px', borderRadius: '10px', color: '#f1f5f9', lineHeight: '1.7' }}>
                  <ReactMarkdown>{selectedModalItem.response}</ReactMarkdown>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#a1a1aa', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', flexWrap: 'wrap', gap: '8px', marginTop: 'auto' }}>
                <span>Model: <strong style={{ color: '#e4e4e7' }}>{selectedModalItem.model_adi}</strong></span>
                <span>Süre: <strong style={{ color: '#facc15' }}>{selectedModalItem.sure}s</strong></span>
                <span>Token: <strong style={{ color: '#c084fc' }}>{selectedModalItem.total_tokens}</strong></span>
                <span>Hız: <strong style={{ color: '#4ade80' }}>{Number(selectedModalItem.sure) > 0 ? Math.round(Number(selectedModalItem.total_tokens || 0) / Number(selectedModalItem.sure)) : 0} t/sn</strong></span>
                <span>Maliyet: <strong style={{ color: ((selectedModalItem.model_adi || '').includes('free') || (selectedModalItem.model_adi || '').includes('flash')) ? '#4ade80' : '#f87171' }}>
                  {((selectedModalItem.model_adi || '').includes('free') || (selectedModalItem.model_adi || '').includes('flash')) ? "Free" : `$${(Number(selectedModalItem.total_tokens || 0) * 0.000002).toFixed(6)}`}
                </strong></span>
                <span>Tarih: <strong style={{ color: '#e4e4e7' }}>{selectedModalItem.created_at}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
