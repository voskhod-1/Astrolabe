import { useState, useEffect } from 'react';

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
    const lines = text.split('\n').filter(line => line.trim());
    const qa = [];
    let currentQuestion = null;
    let currentImage = null;
    let currentAnswers = [];

    lines.forEach(line => {
      if (line.startsWith('![') && line.includes('](')) {
        const match = line.match(/\!\[.*?\]\((.*?)\)/);
        currentImage = match ? match[1] : null;
      } else if (line.endsWith('?')) {
        if (currentQuestion) {
          qa.push({
            question: currentQuestion,
            image: currentImage,
            answers: currentAnswers.map(a => ({
              text: a.replace(/\*\*(.*?)\*\*/g, '$1'),
              correct: a.includes('**')
            }))
          });
          currentAnswers = [];
          currentImage = null;
        }
        currentQuestion = line;
      } else if (line.startsWith('+')) {
        currentAnswers.push(line.replace(/^\+\s*/, ''));
      }
    });

    if (currentQuestion) {
      qa.push({
        question: currentQuestion,
        image: currentImage,
        answers: currentAnswers.map(a => ({
          text: a.replace(/\*\*(.*?)\*\*/g, '$1'),
          correct: a.includes('**')
        }))
      });
    }

    return qa;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file.name.endsWith('.md')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseMarkdown(e.target.result);
      setQaList(parsed);
      setSelectedQuestions([]);
    };
    reader.readAsText(file);
  };

  const startTest = () => {
    const filtered = qaList.filter(qa => selectedQuestions.includes(qa.question));
    const shuffled = filtered.map(qa => ({
      ...qa,
      answers: [...qa.answers].sort(() => Math.random() - 0.5)
    })).sort(() => Math.random() - 0.5);
    
    setShuffledQA(shuffled);
    setUserAnswers({});
    setErrorCount(0);
    setShowResult(false);
    setTimeLeft(testTime * 60);
  };

  useEffect(() => {
    if (timeLeft > 0 && shuffledQA.length > 0 && !showResult) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      
      if (timeLeft === 1) {
        checkAnswers();
      }
      
      return () => clearTimeout(timer);
    }
  }, [timeLeft, shuffledQA, showResult]);

  const handleDragStart = (e, answer) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(answer));
    e.target.style.transform = 'scale(1.05)';
    e.target.style.transition = 'transform 0.2s';
  };

  const handleDragEnd = (e) => {
    e.target.style.transform = 'scale(1)';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.target.style.borderColor = '#8bc34a';
  };

  const handleDragLeave = (e) => {
    e.target.style.borderColor = '#ccc';
  };

  const handleDrop = (e, question) => {
    e.preventDefault();
    e.target.style.borderColor = '#ccc';
    
    const answer = JSON.parse(e.dataTransfer.getData('text/plain'));
    setUserAnswers(prev => ({
      ...prev,
      [question]: answer
    }));
    
    e.target.style.transform = 'scale(1)';
  };

  const checkAnswers = () => {
    let errors = 0;
    shuffledQA.forEach(qa => {
      const userAnswer = userAnswers[qa.question];
      if (!userAnswer || !userAnswer.correct) {
        errors++;
      }
    });
    setErrorCount(errors);
    setShowResult(true);
    setTimeLeft(0);
  };

  const getPercentage = () => {
    const total = shuffledQA.length;
    const correct = total - errorCount;
    return ((correct / total) * 100).toFixed(2);
  };

  return (
    <div className="app">
      <h1>Тренажёр вопросов</h1>
      <input 
        type="file" 
        accept=".md" 
        onChange={handleFileUpload} 
        className="file-input"
      />
      
      {qaList.length > 0 && (
        <div className="setup">
          <h2>Настройки теста:</h2>
          <div className="time-input">
            <label>Время теста (минуты):</label>
            <input 
              type="number" 
              min="1" 
              value={testTime} 
              onChange={(e) => setTestTime(Number(e.target.value))} 
            />
          </div>
          
          <h2>Выберите вопросы:</h2>
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
              />
              <span>{qa.question}</span>
            </div>
          ))}
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
          <div className="timer">
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
                <h3>{qa.question}</h3>
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
        <div className="result">
          <h2>Результат теста:</h2>
          <p>Правильных ответов: {shuffledQA.length - errorCount}/{shuffledQA.length}</p>
          <p>Процент верных ответов: {getPercentage()}%</p>
          <p className={getPercentage() > 90 ? 'success' : 'warning'}>
            {getPercentage() > 90 ? 'Отлично! Материал усвоен хорошо' : 'Нужно повторить материал'}
          </p>
        </div>
      )}

      <style jsx>{`
        /* ... (все стили из предыдущего ответа с мобильной адаптацией) */
      `}</style>
    </div>
  );
}

export default App;
