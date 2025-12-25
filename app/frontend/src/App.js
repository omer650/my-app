import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    try {
      // שליחת בקשה לשרת הפייתון שלנו
      const response = await axios.post('http://localhost:8000/search', {
        text: query
      });
      setResults(response.data.results);
    } catch (error) {
      console.error("Error fetching results:", error);
      alert("שגיאה בתקשורת עם השרת");
    }
  };

  return (
    <div className="App">
      <h1>T-Search</h1>
      <div>
        <input
          type="text"
          placeholder="מה תרצה לחפש?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={handleSearch}>חפש</button>
      </div>

      <div className="results">
        <ul>
          {results.map((item, index) => (
            <li key={index}>
              <strong>{item.source}:</strong> {item.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;