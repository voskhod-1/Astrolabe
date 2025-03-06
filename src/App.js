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
    let currentQuestion = [];
    let currentImage = null;
    let currentAnswers = [];

    lines.forEach(line => {
      if (line.startsWith('![') && line.includes('](')) {
        const match = line.match(/\!\[.*?\]\((.*?)\)/);
        currentImage = match ? match[1] : null;
      } else if (line.endsWith('?')) {
        if (currentQuestion.length > 0) {
          qa.push({
            question: currentQuestion.join(' '),
            image: currentImage,
            answers: currentAnswers.map(a => ({
              text: a.replace(/\*\*(.*?)\*\*/g, '$1'),
              correct: a.includes('**')
            }))
          });
          currentAnswers = [];
          currentImage = null;
        }
        currentQuestion = [line];
      } else if (line.startsWith('+')) {
        currentAnswers.push(line.replace(/^\+\s*/, ''));
      } else {
        currentQuestion.push(line);
      }
    });

    if (currentQuestion.length > 0) {
      qa.push({
        question: currentQuestion.join(' '),
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
    if (!file) return;

    if (!file.name.endsWith('.md')) {
      alert('Загрузите файл в формате .md');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseMarkdown(e.target.result);
        if (parsed.length === 0) {
          alert('Файл не содержит вопросов в корректном формате');
          return;
        }
        setQaList(parsed);
        setSelectedQuestions([]);
      } catch (error) {
        alert('Ошибка при парсинге файла');
      }
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
    let timer;
    if (timeLeft > 0 && shuffledQA.length > 0 && !showResult) {
      timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);

      if (timeLeft === 1) {
        checkAnswers();
      }
    }

    return () => clearTimeout(timer);
  }, [timeLeft, shuffledQA, showResult]);

  const handleDragStart = (e, answer) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(answer));
    e.target.style.transform = 'scale(1.05)';
    e.target.style.transition = 'transform 0.2s';
  };

  const handleDragEnd = (e) => {
    e.target.style.transform = 'scale(1)';
    e.dataTransfer.clearData();
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

    if (userAnswers.hasOwnProperty(question)) return;

    const answer = JSON.parse(e.dataTransfer.getData('text/plain'));
    setUserAnswers(prev => ({
      ...prev,
      [question]: answer
    }));
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
                role="button"
                tabIndex="0"
                aria-label={`Вариант ответа: ${answer.text}`}
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
        .app {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        
        .file-input {
          margin: 20px 0;
        }
        
        .setup {
          margin-bottom: 40px;
        }
        
        .checkbox-item {
          display: flex;
          align-items: center;
          margin: 5px 0;
        }
        
        .start-btn {
          background-color: #4CAF50;
          color: white;
          padding: 10px 20px;
          border: none;
          cursor: pointer;
          margin-top: 20px;
        }
        
        .test-container {
          border-top: 2px solid #eee;
          padding-top: 20px;
        }
        
        .timer {
          font-size: 1.2em;
          margin-bottom: 20px;
        }
        
        .qa-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        
        .question-droppable {
          border: 2px dashed #ccc;
          padding: 15px;
          border-radius: 8px;
          transition: border-color 0.3s;
        }
        
        .question-image {
          max-width: 100%;
          height: auto;
          margin-bottom: 10px;
        }
        
        .answers-panel {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
        }
        
        .answer-draggable {
          padding: 10px;
          background-color: #f0f0f0;
          border-radius: 5px;
          cursor: grab;
          user-select: none;
          transition: transform 0.2s;
        }
        
        .dropped-answer {
          margin-top: 10px;
          padding: 8px;
          border-radius: 4px;
        }
        
        .correct {
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
        }
        
        .result {
          border-top: 2px solid #eee;
          padding-top: 20px;
        }
        
        .success {
          color: #155724;
          background-color: #d4edda;
          padding: 10px;
          border-radius: 4px;
        }
        
        .warning {
          color: #856404;
          background-color: #fff3cd;
          padding: 10px;
          border-radius: 4px;
        }
        
        @media (max-width: 768px) {
          .qa-grid {
            grid-template-columns: 1fr;
          }
          
          .answers-panel {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
