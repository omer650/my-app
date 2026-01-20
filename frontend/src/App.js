import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Simple check to see if we are in "Admin Mode" based on URL
// To access admin, you will go to http://localhost:8080/manage
const IS_ADMIN = window.location.pathname === '/manage';

function App() {
  const [files, setFiles] = useState([]);
  const [categories, setCategories] = useState([]);

  // Form State
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [source, setSource] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [mediaType, setMediaType] = useState('video');
  const [newCatName, setNewCatName] = useState('');

  const fetchData = async () => {
    try {
      const [filesRes, catsRes] = await Promise.all([
        axios.get(`${API_URL}/files`),
        axios.get(`${API_URL}/categories`)
      ]);
      setFiles(filesRes.data);
      setCategories(catsRes.data);
      // Set default category for form
      if (catsRes.data.length > 0 && !selectedCat) {
        setSelectedCat(catsRes.data[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handlers ---
  const handleAddFile = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/files`, {
        title, description: desc, source_url: source,
        category_id: selectedCat, media_type: mediaType
      });
      fetchData();
      setTitle(''); setDesc(''); setSource('');
    } catch (err) { alert('Error adding file'); }
  };

  const handleDeleteFile = async (id) => {
    if (!window.confirm('Delete this file?')) return;
    await axios.delete(`${API_URL}/files/${id}`);
    fetchData();
  };

  const handleAddCategory = async () => {
    if (!newCatName) return;
    try {
      await axios.post(`${API_URL}/categories`, { name: newCatName });
      setNewCatName('');
      fetchData();
    } catch (err) { alert('Failed to add category'); }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete category? Files in it will become uncategorized.')) return;
    await axios.delete(`${API_URL}/categories/${id}`);
    fetchData();
  };

  // Helper for YouTube Embeds
  const getEmbedUrl = (url) => {
    if (!url) return '';
    try {
      if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
      if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'www.youtube.com/embed/');
    } catch (e) { return url; }
    return url;
  };

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>

      {/* Navbar */}
      <nav style={{ background: '#2c3e50', padding: '15px 30px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: '24px', letterSpacing: '1px' }}>Cloudio ☁️</h1>
        {IS_ADMIN && <span style={{ background: '#e74c3c', padding: '5px 10px', borderRadius: '4px', fontSize: '12px' }}>Admin Mode</span>}
      </nav>

      <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>

        {/* --- ADMIN PANEL (Only visible if URL is /manage) --- */}
        {IS_ADMIN && (
          <div style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
            <h2 style={{ marginTop: 0, color: '#34495e' }}>ניהול מערכת</h2>

            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
              {/* Add File Form */}
              <div style={{ flex: 2, minWidth: '300px' }}>
                <h4>העלאת תוכן חדש</h4>
                <form onSubmit={handleAddFile} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input placeholder="שם הקובץ / כותרת" value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle} />
                  <input placeholder="תיאור קצר" value={desc} onChange={e => setDesc(e.target.value)} style={inputStyle} />
                  <input placeholder="קישור (YouTube / PDF / Image)" value={source} onChange={e => setSource(e.target.value)} required style={inputStyle} />

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)} style={inputStyle}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={mediaType} onChange={e => setMediaType(e.target.value)} style={inputStyle}>
                      <option value="video">וידאו</option>
                      <option value="pdf">מסמך</option>
                      <option value="image">תמונה</option>
                    </select>
                  </div>
                  <button type="submit" style={btnStyle}>הוסף למאגר</button>
                </form>
              </div>

              {/* Manage Categories */}
              <div style={{ flex: 1, minWidth: '250px', borderRight: '1px solid #eee', paddingRight: '30px' }}>
                <h4>ניהול קטגוריות</h4>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                  <input placeholder="שם קטגוריה חדשה" value={newCatName} onChange={e => setNewCatName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={handleAddCategory} style={{ ...btnStyle, background: '#27ae60' }}>+</button>
                </div>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {categories.map(c => (
                    <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                      {c.name}
                      <button onClick={() => handleDeleteCategory(c.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>✖</button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* --- PUBLIC VIEW (Content Grid) --- */}

        {/* Category Filters (Visual only for now) */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
          <button style={chipStyle}>הכל</button>
          {categories.map(c => (
            <button key={c.id} style={{ ...chipStyle, background: 'white', color: '#333', border: '1px solid #ddd' }}>{c.name}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
          {files.map((file) => (
            <div key={file.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 3px 10px rgba(0,0,0,0.08)', transition: 'transform 0.2s' }}>

              {/* Media Preview */}
              <div style={{ height: '180px', background: '#ecf0f1', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {file.media_type === 'video' ? (
                  <iframe width="100%" height="100%" src={getEmbedUrl(file.source_url)} title={file.title} frameBorder="0" allowFullScreen></iframe>
                ) : file.media_type === 'image' ? (
                  <img src={file.source_url} alt={file.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ fontSize: '40px' }}>📄</div>
                )}
              </div>

              {/* Content Info */}
              <div style={{ padding: '15px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#7f8c8d', fontWeight: 'bold' }}>{file.category_name}</span>
                <h3 style={{ margin: '5px 0', fontSize: '16px', color: '#2c3e50' }}>{file.title}</h3>
                <p style={{ color: '#7f8c8d', fontSize: '13px', margin: '0 0 10px 0' }}>{file.description}</p>

                {file.media_type !== 'video' && (
                  <a href={file.source_url} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#3498db', fontWeight: 'bold', textDecoration: 'none' }}>
                    פתח קובץ ↗
                  </a>
                )}

                {IS_ADMIN && (
                  <button onClick={() => handleDeleteFile(file.id)} style={{ display: 'block', width: '100%', marginTop: '15px', padding: '8px', background: '#fee', color: '#e74c3c', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    מחק קובץ
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

const inputStyle = { padding: '10px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '14px' };
const btnStyle = { padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const chipStyle = { padding: '8px 16px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' };

export default App;