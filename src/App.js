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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [tempAnswer, setTempAnswer] = useState([]);

  useEffect(() => {
    const savedState = localStorage.getItem('astrApp');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      setQaList(parsed.qaList || []);
      setSelectedQuestions(parsed.selectedQuestions || []);
      setShuffledQA(parsed.shuffledQA || []);
      setUserAnswers(parsed.userAnswers || {});
      setErrorCount(parsed.errorCount || 0);
      setShowResult(parsed.showResult || false);
      setTimeLeft(parsed.timeLeft || 0);
      setTestTime(parsed.testTime || 0);
      setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('astrApp', JSON.stringify({
      qaList,
      selectedQuestions,
      shuffledQA,
      userAnswers,
      errorCount,
      showResult,
      timeLeft,
      testTime,
      currentQuestionIndex
    }));
  }, [qaList, selectedQuestions, shuffledQA, userAnswers, errorCount, showResult, timeLeft, testTime, currentQuestionIndex]);

  const parseMarkdown = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const qa = [];
    let currentQuestion = [];
    let currentImage = null;
    let currentAnswers = [];
    let isItalicQuestion = false;

    lines.forEach(line => {
      if (line.startsWith('![') && line.includes('](')) {
        const match = line.match(/\!\[.*?\]\((.*?)\)/);
        if (match) {
          const urls = match[1].split(' ');
          currentImage = { imageUrl: urls[0], hyperlinkUrl: urls[1] || urls[0] };
        }
      } else if (line.endsWith('?')) {
        isItalicQuestion = line.startsWith('*') || line.startsWith('_');
        if (currentQuestion.length > 0) {
          qa.push({
            question: currentQuestion.join(' '),
            image: currentImage,
            answers: currentAnswers.map(a => ({
              text: a.replace(/\*\*(.*?)\*\*/g, '$1').trim(),
              correct: a.includes('**')
            })),
            isItalic: false
          });
          currentAnswers = [];
          currentImage = null;
        }
        currentQuestion = [line.replace(/^\*|\*$/g, '').replace(/^_|_$/g, '').trim()];
        isItalicQuestion = line.startsWith('*') || line.startsWith('_');
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
          text: a.replace(/\*\*(.*?)\*\*/g, '$1').trim(),
          correct: a.includes('**')
        })),
        isItalic: isItalicQuestion
      });
    }

    return qa;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith('.md')) {
      alert('Пожалуйста, загрузите файл в формате .md');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseMarkdown(e.target.result);
        if (parsed.length === 0) throw new Error('Файл пустой или содержит ошибки');
        setQaList(parsed);
        setSelectedQuestions([]);
        setShuffledQA([]);
        setShowResult(false);
      } catch (error) {
        alert(`Ошибка: ${error.message}`);
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
    setCurrentQuestionIndex(0);
    setTempAnswer([]);
  };

  useEffect(() => {
    let timer;
    if (timeLeft > 0 && !showResult) {
      timer = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 1) checkAnswers();
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [timeLeft, showResult]);

  const handleAnswerSelect = (answer) => {
    setTempAnswer(prev => {
      const isMulti = currentQA.answers.filter(a => a.correct).length > 1;
      if (isMulti) {
        return prev.includes(answer) 
          ? prev.filter(a => a !== answer) 
          : [...prev, answer];
      }
      return [answer];
    });
  };

  const confirmAnswer = () => {
    if (currentQA.isItalic) {
      setUserAnswers(prev => ({
        ...prev,
        [currentQA.question]: tempAnswer
      }));
    } else {
      if (!tempAnswer.length) return;
      setUserAnswers(prev => ({
        ...prev,
        [currentQA.question]: tempAnswer
      }));
    }
    
    setTempAnswer([]);
    
    if (currentQuestionIndex < shuffledQA.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      checkAnswers();
    }
  };

  const checkAnswers = () => {
    let errors = 0;
    shuffledQA.forEach(qa => {
      if (qa.isItalic) {
        const correctAnswers = qa.answers
          .filter(a => a.correct)
          .map(a => a.text.toLowerCase());
        const userAnswer = userAnswers[qa.question]?.toLowerCase() || '';
        if (!correctAnswers.includes(userAnswer)) {
          errors++;
        }
      } else {
        const correctAnswers = qa.answers.filter(a => a.correct);
        const userSelected = userAnswers[qa.question] || [];
        
        const allCorrectSelected = correctAnswers.every(ca => 
          userSelected.some(us => us.text === ca.text)
        );
        const noIncorrectSelected = userSelected.every(us => 
          correctAnswers.some(ca => ca.text === us.text)
        );
        
        if (!allCorrectSelected || !noIncorrectSelected) {
          errors++;
        }
      }
    });
    setErrorCount(errors);
    setShowResult(true);
    setTimeLeft(0);
  };

  const getPercentage = () => {
    const total = shuffledQA.length;
    if (total === 0) return 0;
    const correct = total - errorCount;
    return ((correct / total) * 100).toFixed(2);
  };

  const resetTest = () => {
    setShuffledQA([]);
    setUserAnswers({});
    setErrorCount(0);
    setShowResult(false);
    setTimeLeft(0);
    setCurrentQuestionIndex(0);
    setTempAnswer([]);
  };

  const currentQA = shuffledQA[currentQuestionIndex] || {};

  return (
    <div className="App">
      <h1>Астролябия</h1>
      
      <input type="file" onChange={handleFileUpload} accept=".md" />
      
      {qaList.length > 0 && !shuffledQA.length && (
        <div className="test-settings">
          <div>
            Время теста (минуты):
            <input 
              type="number" 
              value={testTime} 
              onChange={(e) => setTestTime(Math.max(1, Number(e.target.value)))}
            />
          </div>
          <div className="question-select">
            Выберите вопросы:
            {qaList.map(qa => (
              <div key={qa.question}>
                <input
                  type="checkbox"
                  checked={selectedQuestions.includes(qa.question)}
                  onChange={(e) => setSelectedQuestions(prev =>
                    e.target.checked ? [...prev, qa.question] : prev.filter(q => q !== qa.question)
                  )}
                />
                {qa.question}
              </div>
            ))}
          </div>
          <button onClick={startTest} disabled={selectedQuestions.length === 0}>
            Начать тест
          </button>
        </div>
      )}

      {shuffledQA.length > 0 && !showResult && (
        <div className="test-process">
          <div className="timer">
            Осталось времени: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
          
          {currentQA.question && (
            <div className="question-card">
              {currentQA.image && (
                <a href={currentQA.image.hyperlinkUrl} target="_blank" rel="noopener noreferrer">
                  <img src={currentQA.image.imageUrl} alt="question" className="question-image" />
                </a>
              )}
              <h3>{currentQA.question}</h3>
              {currentQA.isItalic ? (
                <input
                  type="text"
                  value={userAnswers[currentQA.question] || ''}
                  onChange={(e) => setUserAnswers(prev => ({
                    ...prev,
                    [currentQA.question]: e.target.value
                  }))}
                />
              ) : (
                currentQA.answers.map((answer, index) => {
                  const isMulti = currentQA.answers.filter(a => a.correct).length > 1;
                  return (
                    <div key={index}>
                      <input
                        type={isMulti ? "checkbox" : "radio"}
                        checked={tempAnswer.some(a => a.text === answer.text)}
                        onChange={() => handleAnswerSelect(answer)}
                      />
                      <label>{answer.text}</label>
                    </div>
                  );
                })
              )}
              <button onClick={confirmAnswer} disabled={currentQA.isItalic && !userAnswers[currentQA.question]}>
                Подтвердить ответ
              </button>
            </div>
          )}
        </div>
      )}

      {showResult && (
        <div className="test-result">
          <h2>Результат теста:</h2>
          <p>
            Правильных ответов: {shuffledQA.length - errorCount}/{shuffledQA.length} 
            <br />
            Процент верных ответов: {getPercentage()}% 
          </p>
          <div className={`result-status ${getPercentage() > 90 ? 'success' : 'warning'}`}>
            {getPercentage() > 90 ? 'Отлично!' : 'Нужно повторить'}
          </div>
          <button onClick={resetTest}>Начать заново</button>
          <div className="answer-review">
            {shuffledQA.map(qa => (
              <div key={qa.question} className="review-item">
                <h4>{qa.question}</h4>
                <div>
                  Ваш ответ: {qa.isItalic ? 
                    (userAnswers[qa.question] || 'Не отвечено') : 
                    (userAnswers[qa.question]?.map(a => a.text).join(', ') || 'Не отвечено')
                  }
                </div>
                <div>
                  Правильный ответ: {qa.answers
                    .filter(a => a.correct)
                    .map(a => a.text)
                    .join(', ')
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;