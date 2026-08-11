import { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google';
import './App.css'
import arkaplan from './assets/arkaplan.png'
import { 
  FaPills, FaLandmark, FaBus, FaFutbol, FaMapMarkerAlt, FaGoogle, 
  FaRobot, FaUserCircle, FaSun, FaCloudSun, FaTree, FaMountain, 
  FaWater, FaCity, FaTram, FaUtensils, FaStore, FaMosque, FaTheaterMasks, FaLeaf, FaPizzaSlice, FaShieldAlt, FaTimes 
} from 'react-icons/fa'

const ADMIN_EMAIL = "bayrakeren228@gmail.com";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [lang, setLang] = useState('TR');
  
  const [prompt, setPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminStats, setAdminStats] = useState(null);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      console.log('Giriş Başarılı!', credentialResponse);
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
    },
    onError: () => {
      console.log('Giriş Başarısız Oldu');
    },
  });

  const handleAskAI = async (textToAsk = prompt) => {
    const finalPrompt = textToAsk || prompt;
    if (!finalPrompt.trim()) return;
    
    setLoading(true);
    setAiResponse('');
    
    try {
      const res = await fetch('http://172.16.12.253.nip.io:8000/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: finalPrompt,
          kullanici_adi: userEmail || 'Misafir'
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
    if (!isLoggedIn) {
      alert(lang === 'TR' ? "Lütfen önce Google ile giriş yapın!" : "Please sign in with Google first!");
      return;
    }
    setPrompt(soruMetni);
    handleAskAI(soruMetni);
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
        <div className="sidebar-brand">
          <span className="logo-icon"><FaMapMarkerAlt /></span> Bursa
        </div>
        
        <div className="sidebar-section-title">{lang === 'TR' ? 'ŞEHRİ KEŞFEDİN' : 'EXPLORE CITY'}</div>
        <ul className="sidebar-menu">
          <li><a href="#top" onClick={(e) => { e.preventDefault(); handlePresetClick("Bursa'da Trilye nerede ve özellikleri neler?"); }}><FaCity /> Trilye</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); handlePresetClick("Uludağ'a nasıl çıkılır ve ne yapılır?"); }}><FaMountain /> Uludağ</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); handlePresetClick("Mudanya'nın tarihi ve gezilecek yerleri nelerdir?"); }}><FaMapMarkerAlt /> Mudanya</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); handlePresetClick("Bursa teleferik hattı hakkında bilgi ver."); }}><FaTram /> {lang === 'TR' ? 'Teleferik' : 'Cable Car'}</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); handlePresetClick("Bursa Botanik Parkı nerededir?"); }}><FaTree /> Botanic Park</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); handlePresetClick("Suuçtu Şelalesi nerededir ve nasıl gidilir?"); }}><FaWater /> {lang === 'TR' ? 'Suuçtu Şelalesi' : 'Suuctu Waterfall'}</a></li>
        </ul>

        <div className="sidebar-section-title">{lang === 'TR' ? 'TARİH & KÜLTÜR' : 'HISTORY & CULTURE'}</div>
        <ul className="sidebar-menu">
          <li><a href="#top" onClick={(e) => { e.preventDefault(); handlePresetClick("Cumalıkızık köyünün tarihi nedir?"); }}><FaLandmark /> Cumalıkızık</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); handlePresetClick("Koza Han tarihi ve özellikleri nelerdir?"); }}><FaStore /> Koza Han</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); handlePresetClick("Bursa Ulu Cami hakkında bilgi verir misin?"); }}><FaMosque /> Ulu Cami</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); handlePresetClick("Karagöz Müzesi nerededir?"); }}><FaTheaterMasks /> Karagöz Müzesi</a></li>
        </ul>

        <div className="sidebar-section-title">{lang === 'TR' ? 'BURSA TATLARI' : 'BURSA TASTES'}</div>
        <ul className="sidebar-menu">
          <li><a href="#top" onClick={(e) => { e.preventDefault(); handlePresetClick("Meşhur Bursa İskender Kebabı nerede yenir?"); }}><FaUtensils /> İskender Kebap</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); handlePresetClick("İnegöl köftesinin özelliği nedir?"); }}><FaUtensils /> İnegöl Köfte</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); handlePresetClick("Bursa kestane şekeri nereden alınır?"); }}><FaUtensils /> Kestane Şekeri</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); handlePresetClick("Mustafakemalpaşa tatlısı nasıl yapılır?"); }}><FaUtensils /> Kemalpaşa Tatlısı</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); handlePresetClick("Bursa şeftalisinin özellikleri nelerdir?"); }}><FaLeaf /> Bursa Şeftalisi</a></li>
          <li><a href="#top" onClick={(e) => { e.preventDefault(); handlePresetClick("Bursa cantığı nedir ve nasıl yapılır?"); }}><FaPizzaSlice /> Cantık</a></li>
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

        {isLoggedIn && (
          <div className="user-profile" onClick={() => { setIsLoggedIn(false); setUserEmail(''); setShowAdminPanel(false); setAiResponse(''); }}>
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
        
        <div className="action-buttons" style={{ flexDirection: 'column', width: '90%', maxWidth: '1200px', alignItems: 'center' }}>
          {!isLoggedIn ? (
            <button className="btn btn-google" onClick={() => loginWithGoogle()}>
              <FaGoogle /> {lang === 'TR' ? "Google ile Giriş Yap ve Sormaya Başla" : "Sign in with Google & Start Asking"}
            </button>
          ) : (
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
          )}
        </div>
        
        {!aiResponse && !loading && (
          <div className="services-grid">
            <a href="https://www.beo.org.tr/nobetci-eczaneler" target="_blank" rel="noopener noreferrer" className="service-card">
              <span className="icon"><FaPills /></span>
              <h3>{lang === 'TR' ? 'Nöbetçi Eczaneler' : 'On-Duty Pharmacies'}</h3>
              <p>{lang === 'TR' ? 'Size en yakın nöbetçi eczaneyi anında bulun, tek tıkla yol tarifini alın.' : 'Find the nearest on-duty pharmacy instantly, get directions with one click.'}</p>
            </a>

            <div onClick={() => handlePresetClick("Bursa'nın tarihi ve turistik yerleri nelerdir?")} className="service-card" style={{ cursor: 'pointer' }}>
              <span className="icon"><FaLandmark /></span>
              <h3>{lang === 'TR' ? 'Tarihi Yerler' : 'Historical Places'}</h3>
              <p>{lang === 'TR' ? "Bursa'nın tarihi ve turistik noktalarını keşfedin, her biri hakkında AI rehberinize sorun." : "Discover Bursa's historical and touristic spots, ask your AI guide about each."}</p>
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
        )}
      </div>

      {showAdminPanel && adminStats && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: '#18181b', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px', width: '100%', maxWidth: '900px', maxHeight: '85vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', color: '#f4f4f5'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#27272a'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80' }}>
                <FaShieldAlt /> Yönetici Paneli & İstatistikler
              </h2>
              <button onClick={() => setShowAdminPanel(false)} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '18px' }}>
                <FaTimes />
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div style={{ background: '#27272a', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#a1a1aa' }}>Bugün Soru Sokan Kişi</h4>
                  <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#4ade80' }}>{adminStats.today_unique_users}</span>
                </div>
                <div style={{ background: '#27272a', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#a1a1aa' }}>Bugün Toplam Soru Sayısı</h4>
                  <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#60a5fa' }}>{adminStats.today_count}</span>
                </div>
                <div style={{ background: '#27272a', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#a1a1aa' }}>Toplam Tekil Kullanıcı</h4>
                  <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#c084fc' }}>{adminStats.total_unique_users}</span>
                </div>
                <div style={{ background: '#27272a', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#a1a1aa' }}>Toplam Soru Geçmişi</h4>
                  <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#fbbf24' }}>{adminStats.history.length}</span>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '12px', color: '#e4e4e7' }}>Kullanıcı Soru ve Cevap Geçmişi</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {adminStats.history.map((item) => (
                    <div key={item.id} style={{
                      background: '#27272a', padding: '14px 18px', borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', fontSize: '11px' }}>
                        <span>Soran: <strong style={{ color: '#4ade80' }}>{item.kullanici_adi}</strong></span>
                        <span>{item.created_at}</span>
                      </div>
                      <div><strong style={{ color: '#60a5fa' }}>Soru:</strong> {item.prompt}</div>
                      <div><strong style={{ color: '#f87171' }}>Cevap:</strong> {item.response}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App