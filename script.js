// Estado do Jogo
let currentDifficulty = 'easy';
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let answered = false;

// Elementos do DOM
const difficultyScreen = document.getElementById('difficultyScreen');
const loadingScreen = document.getElementById('loadingScreen');
const gameScreen = document.getElementById('gameScreen');
const resultScreen = document.getElementById('resultScreen');

// Iniciar o jogo
async function startGame(difficulty) {
    currentDifficulty = difficulty;
    currentQuestionIndex = 0;
    score = 0;
    answered = false;

    // Mostrar tela de carregamento
    difficultyScreen.classList.add('hidden');
    loadingScreen.classList.remove('hidden');

    try {
        // Buscar perguntas da API OpenTDB
        const response = await fetch(
            `https://opentdb.com/api.php?amount=5&difficulty=${difficulty}&type=multiple`
        );
        const data = await response.json();

        if (data.response_code !== 0) {
            throw new Error('Erro ao buscar perguntas');
        }

        // Processar e traduzir perguntas
        questions = [];
        for (const q of data.results) {
            const decodedQuestion = decodeHTML(q.question);
            const decodedCorrect = decodeHTML(q.correct_answer);
            const decodedIncorrect = q.incorrect_answers.map(a => decodeHTML(a));

            // Embaralhar respostas
            const allAnswers = [decodedCorrect, ...decodedIncorrect];
            allAnswers.sort(() => Math.random() - 0.5);

            // Traduzir
            const translatedQuestion = await translateText(decodedQuestion);
            const translatedAnswers = await Promise.all(
                allAnswers.map(a => translateText(a))
            );

            // Encontrar índice da resposta correta traduzida
            const correctIndex = allAnswers.indexOf(decodedCorrect);
            const translatedCorrect = translatedAnswers[correctIndex];

            questions.push({
                question: translatedQuestion,
                answers: translatedAnswers,
                correct: translatedCorrect
            });
        }

        // Mostrar primeira pergunta
        loadingScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        showQuestion();

    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar as perguntas. Tente novamente!');
        loadingScreen.classList.add('hidden');
        difficultyScreen.classList.remove('hidden');
    }
}

// Exibir pergunta atual
function showQuestion() {
    const question = questions[currentQuestionIndex];
    const total = questions.length;
    const progress = ((currentQuestionIndex + 1) / total) * 100;

    // Atualizar barra de progresso
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('questionCounter').textContent = 
        `Questão ${currentQuestionIndex + 1} de ${total}`;

    // Exibir pergunta
    document.getElementById('questionText').textContent = question.question;

    // Exibir opções de resposta
    const container = document.getElementById('answersContainer');
    container.innerHTML = '';

    question.answers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = answer;
        btn.onclick = () => selectAnswer(answer);
        btn.disabled = answered;
        container.appendChild(btn);
    });

    // Limpar feedback
    const feedback = document.getElementById('feedback');
    feedback.classList.remove('show', 'correct', 'incorrect');
}

// Selecionar resposta
function selectAnswer(answer) {
    if (answered) return;

    answered = true;
    const question = questions[currentQuestionIndex];
    const isCorrect = answer === question.correct;

    // Atualizar pontuação
    if (isCorrect) {
        score++;
    }

    // Mostrar feedback
    const feedback = document.getElementById('feedback');
    const buttons = document.querySelectorAll('.answer-btn');

    buttons.forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === answer) {
            btn.classList.add(isCorrect ? 'correct' : 'incorrect');
        } else if (btn.textContent === question.correct) {
            btn.classList.add('correct');
        } else {
            btn.classList.add('disabled');
        }
    });

    feedback.textContent = isCorrect ? '✓ Resposta Correta!' : '✗ Resposta Incorreta!';
    feedback.className = `feedback show ${isCorrect ? 'correct' : 'incorrect'}`;

    // Próxima pergunta após 1.5 segundos
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            answered = false;
            showQuestion();
        } else {
            showResult();
        }
    }, 1500);
}

// Exibir resultado final
function showResult() {
    gameScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');

    const total = questions.length;
    const percentage = Math.round((score / total) * 100);

    // Determinar mensagem e emoji
    let emoji = '🚀';
    let message = 'Não desista! Tente novamente!';

    if (percentage === 100) {
        emoji = '🏆';
        message = 'Perfeito! Você é um mestre em trivia!';
    } else if (percentage >= 80) {
        emoji = '⭐';
        message = 'Excelente! Você se saiu muito bem!';
    } else if (percentage >= 60) {
        emoji = '👍';
        message = 'Bom trabalho! Continue praticando!';
    } else if (percentage >= 40) {
        emoji = '💪';
        message = 'Você pode melhorar! Tente novamente!';
    }

    document.getElementById('resultEmoji').textContent = emoji;
    document.getElementById('resultMessage').textContent = message;
    document.getElementById('scoreNumber').textContent = `${score}/${total}`;
    document.getElementById('scorePercentage').textContent = `${percentage}%`;
}

// Decodificar entidades HTML
function decodeHTML(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

// Traduzir texto usando Google Translate
async function translateText(text) {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (Array.isArray(data) && data[0]) {
            const translations = data[0];
            if (Array.isArray(translations)) {
                return translations.map(item => item[0]).join('');
            }
        }
        return text;
    } catch (error) {
        console.error('Erro na tradução:', error);
        return text;
    }
}
