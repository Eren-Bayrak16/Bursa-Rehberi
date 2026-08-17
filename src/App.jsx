import { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google';
import './App.css'
import arkaplan from './assets/arkaplan.png'
import { locationData } from './data/locationData';
import { 
  FaPills, FaLandmark, FaBus, FaFutbol, FaMapMarkerAlt, FaGoogle, 
  FaRobot, FaUserCircle, FaSun, FaCloudSun, FaTree, FaMountain, 
  FaWater, FaCity, FaTram, FaUtensils, FaStore, FaMosque, FaTheaterMasks, FaLeaf, FaPizzaSlice, FaShieldAlt, FaTimes, FaKey, FaCogs, FaInfoCircle, FaFilter, FaTrophy, FaBolt, FaSearch 
} from 'react-icons/fa'

const ADMIN_EMAIL = "bayrakeren228@gmail.com";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [lang, setLang] = useState('TR');
  
  const [prompt, setPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash');
  const [userApiKey, setUserApiKey] = useState('');

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [selectedAdminUser, setSelectedAdminUser] = useState('ALL');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminDateFilter, setAdminDateFilter] = useState('TODAY'); // TODAY, 7DAYS, 30DAYS, ALL
  const [selectedLocation, setSelectedLocation] = useState(null);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${credentialResponse.access_token}` },
        });
        const data = await res.json();
        setUserEmail(data.email || "bayrakeren228@gmail.com");
      } catch (err) {
        setUserEmail("bayrakeren228@gmail.com");
      }
      setIsLoggedIn(true);
      setPrompt('');       
      setAiResponse('');   
    },
  });

  const handleAskAI = async (textToAsk = prompt) => {
    const finalPrompt = textToAsk || prompt;
    if (!finalPrompt.trim()) return;
    
    if (isLoggedIn && (!userApiKey || !userApiKey.trim())) {
      alert("Google ile giriş yaptığınız için kendi OpenRouter API anahtarınızı girmeniz gerekmektedir!");
      return;
    }
    
    setLoading(true);
    setAiResponse('');
    
    try {
      const res = await fetch('http://172.16.12.253.nip.io:8000/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: finalPrompt,
          kullanici_adi: userEmail || 'Misafir',
          user_api_key: isLoggedIn ? userApiKey : '', 
          model_secimi: selectedModel 
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setAiResponse(data.response);
      } else {
        setAiResponse('Bir hata oluştu: ' + (data.detail || 'Bilinmeyen hata'));
      }
    } catch (err) {
      setAiResponse('Sunucuya bağlanılamadı. Python backend açık mı?');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (soruMetni) => {
    setSelectedLocation(null); 
    setPrompt(soruMetni);
    handleAskAI(soruMetni);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail('');
    setUserApiKey('');
    setPrompt('');
    setAiResponse('');
    setShowAdminPanel(false);
    setSelectedLocation(null);
  };

  const fetchAdminStats = async () => {
    try {
      const res = await fetch(`http://172.16.12.253.nip.io:8000/api/admin/stats?email=${encodeURIComponent(userEmail)}`);
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

  return (
    <div 
      className="hero-section" 
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.3)), url(${arkaplan})` 
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
          <li><a href="#top" onClick={(e) => { e.preventDefault(); setSelectedLocation("Botanic Park"); }}><FaTree /> Botanic Park</a></li>
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
            <span>Bursa <strong>32°C</strong> - Açık</span>
          </div>
          <div className="weather-item">
            <FaCloudSun style={{ color: '#fcd34d', fontSize: '14px' }} />
            <span>Uludağ: <strong>16°C</strong> •</span>
          </div>
        </div>
      </aside>

      <div className="top-right-panel" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div className="lang-selector">
          <button className={lang === 'TR' ? 'lang-btn active' : 'lang-btn'} onClick={() => setLang('TR')}>TR</button>
          <button className={lang === 'EN' ? 'lang-btn active' : 'lang-btn'} onClick={() => setLang('EN')}>EN</button>
        </div>

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

      <div className="hero-content">
        
        <h1 className="main-title">BURSA'YI <br /> KEŞFET</h1>
        <p className="main-subtitle">
          {lang === 'TR' 
            ? "Yapay zekâ destekli rehberinizle şehri keşfetme zamanı geldi." 
            : "It's time to explore the city with your AI-powered guide."}
        </p>
        
        {isLoggedIn ? (
          <div style={{
            display: 'flex', gap: '10px', width: '90%', maxWidth: '900px', marginBottom: '15px',
            background: 'rgba(24, 24, 27, 0.85)', backdropFilter: 'blur(15px)', padding: '12px 18px',
            borderRadius: '16px', border: '1px solid rgba(34, 197, 94, 0.4)', alignItems: 'center', flexWrap: 'wrap',
            animation: 'fadeIn 0.3s ease-in-out'
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
              <option value="google/gemini-2.5-flash">Gemini Flash</option>
              <option value="deepseek/deepseek-chat">DeepSeek V3</option>
              <option value="openai/gpt-4o-mini">GPT-4o-mini</option>
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#facc15', fontSize: '13px', fontWeight: '600' }}>
              <FaKey /> API Key Giriniz:
            </div>
            <input 
              type="password"
              autoComplete="new-password"
              data-lpignore="true"
              value={userApiKey}
              onChange={(e) => setUserApiKey(e.target.value)}
              placeholder="OpenRouter API Key zorunludur"
              style={{
                background: 'rgba(0,0,0,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                padding: '8px 12px', borderRadius: '10px', outline: 'none', fontSize: '13px', width: '220px'
              }}
            />
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', width: '90%', maxWidth: '900px', marginBottom: '15px',
            background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', padding: '10px 16px',
            borderRadius: '14px'
          }}>
            <FaInfoCircle style={{ color: '#4ade80', fontSize: '16px', flexShrink: 0 }} />
            <span style={{ color: '#ffffff', fontSize: '13px' }}>
              Şu anda <strong style={{ color: '#4ade80' }}>ücretsiz modda</strong> soru soruyorsunuz. Kendi API anahtarınızla bağlanmak için sağ üstten <strong style={{ color: '#4ade80' }}>Google ile Giriş Yapabilirsiniz</strong>.
            </span>
          </div>
        )}

        <div className="action-buttons" style={{ flexDirection: 'column', width: '90%', maxWidth: '1200px', alignItems: 'center' }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <input 
                type="text" 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                placeholder={lang === 'TR' ? "Bursa hakkında ne öğrenmek istiyorsun?" : "What do you want to learn about Bursa?"} 
                style={{
                  flex: 1, padding: '14px 20px', borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)', background: 'rgba(0, 0, 0, 0.5)',
                  color: 'white', outline: 'none', backdropFilter: 'blur(10px)', fontSize: '14px'
                }}
              />
              <button 
                className="btn btn-ai" 
                onClick={() => handleAskAI()}
                disabled={loading}
                style={{ padding: '14px 24px', borderRadius: '20px', cursor: 'pointer', fontSize: '14px' }}
              >
                <FaRobot /> {lang === 'TR' ? 'Sor' : 'Ask'}
              </button>
            </div>

            {(loading || aiResponse) && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(34, 197, 94, 0.5)', padding: '20px 24px',
                borderRadius: '18px', color: '#f1f5f9', textAlign: 'left',
                fontSize: '13px', lineHeight: '1.5', width: '100%',
                maxHeight: '335px', overflowY: 'auto', boxShadow: '0 15px 35px rgba(0,0,0,0.7)'
              }}>
                <strong style={{ color: '#4ade80', display: 'block', marginBottom: '8px', fontSize: '14px' }}>Yapay Zeka Rehberi:</strong>
                {loading ? (
                  <p style={{ margin: 0, color: '#9ca3af', fontStyle: 'italic' }}>
                    {lang === 'TR' ? 'Yapay zeka düşünüyor...' : 'AI is thinking...'}
                  </p>
                ) : (
                  <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{aiResponse}</p>
                )}
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
          !aiResponse && !loading && (
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

      {showAdminPanel && adminStats && (() => {
        const rawHistory = adminStats.history || [];
        
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

        const uniqueUsers = Array.from(new Set(filteredByDate.map(item => item.kullanici_adi)));
        
        const filteredHistory = filteredByDate.filter(item => {
          const matchUser = selectedAdminUser === 'ALL' || item.kullanici_adi === selectedAdminUser;
          const matchSearch = !adminSearchQuery.trim() || 
            item.prompt.toLowerCase().includes(adminSearchQuery.toLowerCase()) || 
            item.response.toLowerCase().includes(adminSearchQuery.toLowerCase());
          return matchUser && matchSearch;
        });

        const modelCounts = {};
        const modelStats = {};

        filteredByDate.forEach(item => {
          let m = item.model_adi || 'google/gemini-2.5-flash';
          if (!modelCounts[m]) {
            modelCounts[m] = 0;
            modelStats[m] = { totalTime: 0, count: 0, totalChars: 0 };
          }
          modelCounts[m] += 1;
          
          modelStats[m].totalTime += Number(item.sure || 0.1);
          modelStats[m].totalChars += (item.response || '').length;
          modelStats[m].count += 1;
        });

        const sortedModelsByUsage = Object.entries(modelCounts).sort((a, b) => b[1] - a[1]);

        let totalPeriodCost = 0;

        const modelEfficiency = Object.keys(modelStats).map(m => {
          const stats = modelStats[m];
          const validHistory = filteredByDate.filter(item => (item.model_adi || 'google/gemini-2.5-flash') === m && Number(item.sure || 0) > 0.1);
          
          let totalCharsForModel = 0;
          let totalTimeForModel = 0;
          
          validHistory.forEach(item => {
            totalCharsForModel += (item.response || '').length;
            totalTimeForModel += Number(item.sure);
          });

          const charsPerSecond = totalTimeForModel > 0 ? Math.round(totalCharsForModel / totalTimeForModel) : 0;
          const avgTime = stats.count > 0 ? (stats.totalTime / stats.count).toFixed(2) : '0.00';
          const avgChars = stats.count > 0 ? Math.round(stats.totalChars / stats.count).toLocaleString('tr-TR') : '0';
          const totalCharsCount = stats.totalChars.toLocaleString('tr-TR');

          let costPerChar = 0.000002; 
          if (m.includes('free') || m.includes('flash')) costPerChar = 0.0;
          const estimatedCostNum = stats.totalChars * costPerChar;
          totalPeriodCost += estimatedCostNum;
          const estimatedCost = estimatedCostNum.toFixed(4);

          return { model: m, avgTime, avgChars, totalCharsCount, charsPerSecond, totalUses: stats.count, estimatedCost };
        }).sort((a, b) => b.charsPerSecond - a.charsPerSecond);

        const hourlyTraffic = Array(24).fill(0);
        filteredByDate.forEach(item => {
          if (item.created_at) {
            const dateObj = new Date(item.created_at);
            const hour = dateObj.getHours();
            if (!isNaN(hour)) hourlyTraffic[hour]++;
          }
        });

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
          }}>
            <div style={{
              background: '#18181b', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px', width: '100%', maxWidth: '1050px', maxHeight: '90vh',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', color: '#f4f4f5'
            }}>
              <div style={{
                padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#27272a'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80' }}>
                    <FaShieldAlt /> Yönetici Paneli & Model Karşılaştırma Analitiği
                  </h2>
                  
                  <div style={{ display: 'flex', background: '#18181b', borderRadius: '8px', padding: '3px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {[['TODAY', 'Bugün'], ['7DAYS', 'Son 7 Gün'], ['30DAYS', 'Son 30 Gün'], ['ALL', 'Tümü']].map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setAdminDateFilter(key)}
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

                <button onClick={() => setShowAdminPanel(false)} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '18px' }}>
                  <FaTimes />
                </button>
              </div>

              <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Üst Özet Kartları (Toplam Maliyet Kartı Eklendi) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#27272a', padding: '14px', borderRadius: '14px', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#a1a1aa' }}>Dönem Kullanıcı</h4>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#4ade80' }}>{uniqueUsers.length}</span>
                  </div>
                  <div style={{ background: '#27272a', padding: '14px', borderRadius: '14px', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#a1a1aa' }}>Dönem Soru</h4>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#60a5fa' }}>{filteredByDate.length}</span>
                  </div>
                  <div style={{ background: '#27272a', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#a1a1aa' }}>Toplam Kullanıcı</h4>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#c084fc' }}>{adminStats.total_unique_users}</span>
                  </div>
                  <div style={{ background: '#27272a', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#a1a1aa' }}>Toplam Soru</h4>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fbbf24' }}>{rawHistory.length}</span>
                  </div>
                  <div style={{ background: '#27272a', padding: '14px', borderRadius: '14px', border: '1px solid rgba(248,113,113,0.3)' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#a1a1aa' }}>Dönem Maliyet</h4>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#f87171' }}>${totalPeriodCost.toFixed(4)}</span>
                  </div>
                </div>

                {/* Model Karşılaştırmaları */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  
                  {/* Kullanım Sıralaması */}
                  <div style={{ background: '#27272a', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ fontSize: '14px', marginBottom: '14px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaTrophy /> Model Kullanım Sıralaması (En Çok Tercih Edilen)
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

                  {/* Verimlilik ve Maliyet Karşılaştırması (Harf/Karakter bilgisi eklendi) */}
                  <div style={{ background: '#27272a', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ fontSize: '14px', marginBottom: '14px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaBolt /> Model Verimlilik & Tahmini Maliyet
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {modelEfficiency.map((item, idx) => (
                        <div key={item.model} style={{ background: '#18181b', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: `4px solid ${idx === 0 ? '#4ade80' : '#60a5fa'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#60a5fa', fontWeight: 'bold', fontFamily: 'monospace' }}>{item.model}</span>
                            <span style={{ color: '#4ade80', fontWeight: 'bold' }}>Hız: {item.charsPerSecond} harf/sn</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', fontSize: '11px' }}>
                            <span>Süre: <strong style={{ color: '#e4e4e7' }}>{item.avgTime}s</strong></span>
                            <span>Toplam Harf: <strong style={{ color: '#c084fc' }}>{item.totalCharsCount}</strong></span>
                            <span>Kullanım: <strong style={{ color: '#facc15' }}>{item.totalUses}</strong></span>
                            <span>Maliyet: <strong style={{ color: '#f87171' }}>${item.estimatedCost}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Saatlik ve Günlük Trafik Analizi */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Saatlik Trafik */}
                  <div style={{ background: '#27272a', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ fontSize: '14px', marginBottom: '14px', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ⏰ Kullanıcıların Yoğunluk Saatleri (Saatlik Trafik Trendi)
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '80px', paddingBottom: '10px', borderBottom: '1px solid #3f3f46' }}>
                      {hourlyTraffic.map((count, hour) => {
                        const maxVal = Math.max(...hourlyTraffic, 1);
                        const heightPercent = Math.max((count / maxVal) * 100, 8);
                        const totalFiltered = filteredByDate.length || 1;
                        const percentOfTotal = Math.round((count / totalFiltered) * 100);
                        const hoverTitle = `${hour.toString().padStart(2, '0')}:00\n${count} soru\n%${percentOfTotal} toplam kullanım`;
                        return (
                          <div key={hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', cursor: 'pointer' }} title={hoverTitle}>
                            <span style={{ fontSize: '9px', color: '#a1a1aa', marginBottom: '2px' }}>{count > 0 ? count : ''}</span>
                            <div style={{ width: '100%', background: count > 0 ? '#c084fc' : '#3f3f46', height: `${heightPercent}%`, borderRadius: '3px 3px 0 0', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#d8b4fe'} onMouseLeave={(e) => e.target.style.background = count > 0 ? '#c084fc' : '#3f3f46'}></div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#a1a1aa', marginTop: '4px' }}>
                      <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
                    </div>
                  </div>

                  {/* Günlük Trafik (Son 7 Gün) */}
                  <div style={{ background: '#27272a', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ fontSize: '14px', marginBottom: '14px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📅 Günlük Trafik (Son 7 Günlük Dağılım)
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '80px', paddingBottom: '10px', borderBottom: '1px solid #3f3f46' }}>
                      {Array.from({ length: 7 }).map((_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() - (6 - i));
                        const dateStr = date.toISOString().split('T')[0];
                        const dailyCount = rawHistory.filter(h => h.created_at && h.created_at.startsWith(dateStr)).length;
                        const totalRaw = rawHistory.length || 1;
                        const percentDaily = Math.round((dailyCount / totalRaw) * 100);
                        const hoverTitle = `${date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}\n${dailyCount} soru\n%${percentDaily} toplam kullanım`;
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', cursor: 'pointer' }} title={hoverTitle}>
                            <span style={{ fontSize: '10px', color: '#a1a1aa', marginBottom: '4px' }}>{dailyCount > 0 ? dailyCount : ''}</span>
                            <div style={{ width: '100%', background: dailyCount > 0 ? '#fbbf24' : '#3f3f46', height: `${Math.max((dailyCount / 10) * 100, 12)}%`, borderRadius: '4px 4px 0 0', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#fde68a'} onMouseLeave={(e) => e.target.style.background = dailyCount > 0 ? '#fbbf24' : '#3f3f46'}></div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a1a1aa', marginTop: '6px', padding: '0 4px' }}>
                      {Array.from({ length: 7 }).map((_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() - (6 - i));
                        return <span key={i}>{date.toLocaleDateString('tr-TR', { weekday: 'short' })}</span>;
                      })}
                    </div>
                  </div>

                </div>

                {/* Soru Arama, Rozet ve Geçmiş */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '15px', margin: 0, color: '#e4e4e7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaFilter /> Kullanıcı Soru ve Cevap Geçmişi ({filteredHistory.length})
                      </h3>

                      {adminSearchQuery.trim() && (
                        <div style={{
                          background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)',
                          color: '#4ade80', padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                          display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500'
                        }}>
                          <span>🔍 Aranan: "{adminSearchQuery}"</span>
                          <span 
                            onClick={() => setAdminSearchQuery('')} 
                            style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginLeft: '2px' }}
                            title="Aramayı Temizle"
                          >
                            ×
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <FaSearch style={{ position: 'absolute', left: '10px', color: '#a1a1aa', fontSize: '12px' }} />
                        <input 
                          type="text"
                          value={adminSearchQuery}
                          onChange={(e) => setAdminSearchQuery(e.target.value)}
                          placeholder="Soru ara (Örn: Uludağ)..."
                          style={{
                            background: '#27272a', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                            padding: '6px 12px 6px 30px', borderRadius: '8px', fontSize: '12px', outline: 'none', width: '180px'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Kullanıcı:</span>
                        <select 
                          value={selectedAdminUser} 
                          onChange={(e) => setSelectedAdminUser(e.target.value)}
                          style={{
                            background: '#27272a', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                            padding: '6px 12px', borderRadius: '8px', fontSize: '12px', outline: 'none', cursor: 'pointer'
                          }}
                        >
                          <option value="ALL">Tüm Kullanıcılar</option>
                          {uniqueUsers.map((u, idx) => (
                            <option key={idx} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredHistory.length === 0 ? (
                      <p style={{ fontSize: '13px', color: '#a1a1aa', textAlign: 'center', padding: '20px' }}>Aradığınız kriterlere uygun soru geçmişi bulunamadı.</p>
                    ) : (
                      filteredHistory.map((item) => {
                        const highlightText = (text) => {
                          if (!adminSearchQuery.trim()) return text;
                          const parts = text.split(new RegExp(`(${adminSearchQuery})`, 'gi'));
                          return parts.map((part, i) => 
                            part.toLowerCase() === adminSearchQuery.toLowerCase() ? (
                              <mark key={i} style={{ background: '#facc15', color: '#000', padding: '0 2px', borderRadius: '3px', fontWeight: 'bold' }}>{part}</mark>
                            ) : part
                          );
                        };

                        return (
                          <div key={item.id} style={{
                            background: '#27272a', padding: '14px 18px', borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', fontSize: '11px' }}>
                              <span>Soran: <strong style={{ color: '#4ade80' }}>{item.kullanici_adi}</strong> | Model: <strong style={{ color: '#60a5fa' }}>{item.model_adi || 'Bilinmiyor'}</strong> | Süre: <strong style={{ color: '#facc15' }}>{item.sure || 0}s</strong></span>
                              <span>{item.created_at}</span>
                            </div>
                            <div><strong style={{ color: '#60a5fa' }}>Soru:</strong> {highlightText(item.prompt)}</div>
                            <div><strong style={{ color: '#f87171' }}>Cevap:</strong> {highlightText(item.response)}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

    </div>
  )
}

export default App