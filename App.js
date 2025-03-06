// App.js
import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [qaList, setQaList] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [shuffledQA, setShuffledQA] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [errorCount, setErrorCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [testTime, setTestTime] = useState(0);

  const parseMarkdown = (text) => {
    // ... (оставьте ваш существующий парсер)
  };

  const handleFileUpload = (e) => {
    // ... (оставьте существующую логику)
  };

  const startTest = () => {
    // ... (оставьте существующую логику)
  };

  useEffect(() => {
    // ... (оставьте существующий таймер)
  }, [timeLeft, shuffledQA, showResult]);

  const handleDragStart = (e, answer) => {
    // ... (оставьте существующую логику)
  };

  const handleDragEnd = (e) => {
    // ... (оставьте существующую логику)
  };

  const handleDragOver = (e) => {
    // ... (оставьте существующую логику)
  };

  const handleDragLeave = (e) => {
    // ... (оставьте существующую логику)
  };

  const handleDrop = (e, question) => {
    // ... (оставьте существующую логику)
  };

  const checkAnswers = () => {
    // ... (оставьте существующую логику)
  };

  const getPercentage = () => {
    // ... (оставьте существующую логику)
  };

  return (
    <div className="app-container">
      <h1 className="main-title">Тренажёр вопросов</h1>
      <input 
        type="file" 
        accept=".md" 
        onChange={handleFileUpload} 
        className="file-input"
      />
      
      {qaList.length > 0 && (
        <div className="setup-section">
          <h2 className="section-title">Настройки теста:</h2>
          <div className="time-input-group">
            <label>Время теста (минуты):</label>
            <input 
              type="number" 
              min="1" 
              value={testTime} 
              onChange={(e) => setTestTime(Number(e.target.value))} 
              className="time-input"
            />
          </div>
          
          <h2 className="section-title">Выберите вопросы:</h2>
          <div className="checkbox-list">
            {qaList.map(qa => (
              <div key={qa.question} className="checkbox-item">
                <input 
                  type="checkbox"
                  checked={selectedQuestions.includes(qa.question)}
                  onChange={(e) => {
                    setSelectedQuestions(prev => 
                      e.target.checked ? [...prev, qa.question] : prev.filter(q => q !== qa.question)
                    );
                  }}
                  className="checkbox"
                />
                <span className="checkbox-label">{qa.question}</span>
              </div>
            ))}
          </div>
          <button 
            onClick={startTest} 
            disabled={selectedQuestions.length === 0 || testTime < 1}
            className="start-btn"
          >
            Начать тест
          </button>
        </div>
      )}

      {shuffledQA.length > 0 && !showResult && (
        <div className="test-container">
          <div className="timer-display">
            Осталось времени: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
          
          <div className="qa-grid">
            {shuffledQA.map(qa => (
              <div 
                key={qa.question} 
                className="question-droppable"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, qa.question)}
              >
                {qa.image && (
                  <img 
                    src={qa.image} 
                    alt="question" 
                    className="question-image"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                )}
                <h3 className="question-text">{qa.question}</h3>
                {userAnswers[qa.question] && (
                  <div className={`dropped-answer ${userAnswers[qa.question].correct ? 'correct' : ''}`}>
                    {userAnswers[qa.question].text}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="answers-panel">
            {shuffledQA.flatMap(qa => qa.answers).map((answer, index) => (
              <div 
                key={index}
                className="answer-draggable"
                draggable
                onDragStart={(e) => handleDragStart(e, answer)}
                onDragEnd={handleDragEnd}
              >
                {answer.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {showResult && (
        <div className="result-section">
          <h2 className="result-title">Результат теста:</h2>
          <p className="result-text">Правильных ответов: {shuffledQA.length - errorCount}/{shuffledQA.length}</p>
          <p className="result-text">Процент верных ответов: {getPercentage()}%</p>
          <p className={getPercentage() > 90 ? 'success-message' : 'warning-message'}>
            {getPercentage() > 90 ? 'Отлично! Материал усвоен хорошо' : 'Нужно повторить материал'}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
