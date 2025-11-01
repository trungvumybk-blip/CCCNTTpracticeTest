document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const dataInput = document.getElementById('data-input');
    const processBtn = document.getElementById('process-btn');
    const clearStorageBtn = document.getElementById('clear-storage-btn');
    const questionCountEl = document.getElementById('question-count');
    const startTestBtn = document.getElementById('start-test-btn');
    const testArea = document.getElementById('test-area');
    const questionContainer = document.getElementById('question-container');
    const submitTestBtn = document.getElementById('submit-test-btn');
    const resultsArea = document.getElementById('results-area');
    const scoreEl = document.getElementById('score');
    const reviewContainer = document.getElementById('review-container');
    const retakeTestBtn = document.getElementById('retake-test-btn');
    const dataManagementSection = document.getElementById('data-management');
    const testGenerationSection = document.getElementById('test-generation');
    const viewEditBtn = document.getElementById('view-edit-btn');
    const viewEditArea = document.getElementById('view-edit-area');
    const questionsListContainer = document.getElementById('questions-list-container');
    const backToMainBtn = document.getElementById('back-to-main-btn');

    // --- New elements for Import/Export ---
    const importJsonBtn = document.getElementById('import-json-btn');
    const jsonFileInput = document.getElementById('json-file-input');
    const exportJsonBtn = document.getElementById('export-json-btn');


    const STORAGE_KEY = 'mos-test-questions';
    let currentTestQuestions = [];

    // --- Data Parsing and Storage ---

    const parseQuestions = (text) => {
        const cleanedText = text
            .split('\n')
            .map(line => line.trim())
            .filter(line => {
                const isQuestion = /^\d+\.\s/.test(line);
                const isOption = line.startsWith('') || line.startsWith('');
                return isQuestion || isOption;
            })
            .join('\n');

        if (!cleanedText) return [];

        const questions = [];
        const questionBlocks = cleanedText.trim().split(/\n(?=\d+\.\s)/);
        
        for (const block of questionBlocks) {
            const lines = block.trim().split('\n');
            if (lines.length < 2) continue;

            const questionText = lines[0].replace(/^\d+\.\s*/, '').trim();
            const options = [];
            let correctAnswer = '';

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                const isCorrect = line.startsWith('');
                const optionText = line.substring(1).trim();
                options.push(optionText);
                if (isCorrect) {
                    correctAnswer = optionText;
                }
            }

            if (questionText && options.length > 0 && correctAnswer) {
                questions.push({
                    question: questionText,
                    options: options,
                    correctAnswer: correctAnswer,
                });
            }
        }
        return questions;
    };

    const loadQuestionsFromStorage = () => {
        const storedData = localStorage.getItem(STORAGE_KEY);
        return storedData ? JSON.parse(storedData) : [];
    };

    const saveQuestionsToStorage = (questions) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
        updateQuestionCount();
    };

    const updateQuestionCount = () => {
        const questions = loadQuestionsFromStorage();
        questionCountEl.textContent = questions.length;
    };

    // --- Test Generation and Display ---

    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    };

    const generateTest = () => {
        const allQuestions = loadQuestionsFromStorage();
        if (allQuestions.length === 0) {
            alert('No questions found in the bank. Please add questions first.');
            return;
        }

        shuffleArray(allQuestions);
        currentTestQuestions = allQuestions.slice(0, 60);

        questionContainer.innerHTML = '';
        currentTestQuestions.forEach((q, index) => {
            const questionBlock = document.createElement('div');
            questionBlock.className = 'question-block';
            questionBlock.innerHTML = `<p>${index + 1}. ${q.question}</p>`;

            const optionsList = document.createElement('ul');
            optionsList.className = 'options-list';
            
            const shuffledOptions = [...q.options];
            shuffleArray(shuffledOptions);

            shuffledOptions.forEach(option => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <label>
                        <input type="radio" name="question-${index}" value="${option}">
                        ${option}
                        <span class="checkmark"></span>
                    </label>
                `;
                optionsList.appendChild(li);
            });

            questionBlock.appendChild(optionsList);
            questionContainer.appendChild(questionBlock);
        });

        dataManagementSection.classList.add('hidden');
        testGenerationSection.classList.add('hidden');
        resultsArea.classList.add('hidden');
        testArea.classList.remove('hidden');
    };

    // --- Test Submission and Grading ---

    const submitTest = () => {
        let score = 0;
        reviewContainer.innerHTML = '';

        currentTestQuestions.forEach((q, index) => {
            const selectedOption = document.querySelector(`input[name="question-${index}"]:checked`);
            const userAnswer = selectedOption ? selectedOption.value : 'No answer';
            const isCorrect = userAnswer === q.correctAnswer;

            if (isCorrect) {
                score++;
            }

            const reviewBlock = document.createElement('div');
            reviewBlock.className = `review-block ${isCorrect ? 'correct' : 'incorrect'}`;
            reviewBlock.innerHTML = `
                <p><strong>Question:</strong> ${q.question}</p>
                <p><strong>Your Answer:</strong> ${userAnswer}</p>
                ${!isCorrect ? `<p><strong>Correct Answer:</strong> ${q.correctAnswer}</p>` : ''}
            `;
            reviewContainer.appendChild(reviewBlock);
        });

        const percentage = ((score / currentTestQuestions.length) * 100).toFixed(1);
        scoreEl.textContent = `${score} / ${currentTestQuestions.length} (${percentage}%)`;

        testArea.classList.add('hidden');
        resultsArea.classList.remove('hidden');
    };

    // --- View/Edit Questions Logic ---

    const renderQuestionsForEditing = () => {
        const questions = loadQuestionsFromStorage();
        questionsListContainer.innerHTML = ''; 

        if (questions.length === 0) {
            questionsListContainer.innerHTML = '<p>No questions have been saved yet.</p>';
            return;
        }

        questions.forEach((q, index) => {
            const questionCard = document.createElement('div');
            questionCard.className = 'question-edit-card';
            questionCard.dataset.index = index;

            const optionsHTML = q.options.map((option) => `
                <div class="option-edit-group">
                    <input type="radio" name="correct-option-${index}" ${option === q.correctAnswer ? 'checked' : ''}>
                    <input type="text" class="option-input" value="${option}">
                </div>
            `).join('');

            questionCard.innerHTML = `
                <div class="question-header">
                    <h4>Question ${index + 1}</h4>
                    <div>
                        <button class="save-btn">Save</button>
                        <button class="delete-btn">Delete</button>
                    </div>
                </div>
                <textarea class="question-text-input">${q.question}</textarea>
                <div class="options-edit-container">
                    <p><strong>Options:</strong> (Select the correct one)</p>
                    ${optionsHTML}
                </div>
            `;
            questionsListContainer.appendChild(questionCard);
        });
    };
    
    const handleQuestionUpdate = (index) => {
        const questions = loadQuestionsFromStorage();
        const questionCard = document.querySelector(`.question-edit-card[data-index='${index}']`);

        const newQuestionText = questionCard.querySelector('.question-text-input').value.trim();
        if (!newQuestionText) {
            alert('Question text cannot be empty.');
            return;
        }

        const newOptions = [];
        const optionInputs = questionCard.querySelectorAll('.option-input');
        optionInputs.forEach(input => {
            const value = input.value.trim();
            if (value) newOptions.push(value);
        });

        if (newOptions.length < 2) {
            alert('A question must have at least two options.');
            return;
        }
        
        const selectedCorrectRadio = questionCard.querySelector(`input[type="radio"]:checked`);
        if (!selectedCorrectRadio) {
            alert('You must select a correct answer.');
            return;
        }
        const newCorrectAnswerText = selectedCorrectRadio.parentElement.querySelector('.option-input').value.trim();

        questions[index] = {
            question: newQuestionText,
            options: newOptions,
            correctAnswer: newCorrectAnswerText
        };

        saveQuestionsToStorage(questions);
        alert(`Question ${index + 1} updated successfully.`);
    };

    const handleQuestionDelete = (index) => {
        if (confirm(`Are you sure you want to delete Question ${index + 1}?`)) {
            const questions = loadQuestionsFromStorage();
            questions.splice(index, 1);
            saveQuestionsToStorage(questions);
            renderQuestionsForEditing();
        }
    };
    
    // --- New --- Import/Export Logic ---

    /**
     * Validates the structure of imported question data.
     * @param {any} data - The parsed data from the JSON file.
     * @returns {boolean} - True if the data is a valid array of questions.
     */
    const isValidQuestionData = (data) => {
        if (!Array.isArray(data)) return false;
        
        return data.every(q => 
            typeof q === 'object' &&
            q !== null &&
            typeof q.question === 'string' &&
            Array.isArray(q.options) &&
            q.options.every(opt => typeof opt === 'string') &&
            typeof q.correctAnswer === 'string' &&
            q.options.includes(q.correctAnswer)
        );
    };

    /**
     * Handles the file import process.
     * @param {Event} event - The file input change event.
     */
    const handleFileImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedQuestions = JSON.parse(e.target.result);
                if (!isValidQuestionData(importedQuestions)) {
                    throw new Error('Invalid file structure. Ensure it is an array of question objects.');
                }
                
                const existingQuestions = loadQuestionsFromStorage();
                const existingQuestionTexts = new Set(existingQuestions.map(q => q.question));
                const uniqueNewQuestions = importedQuestions.filter(q => !existingQuestionTexts.has(q.question));

                const updatedQuestions = [...existingQuestions, ...uniqueNewQuestions];
                saveQuestionsToStorage(updatedQuestions);

                const addedCount = uniqueNewQuestions.length;
                const duplicateCount = importedQuestions.length - addedCount;

                alert(`${addedCount} new questions were imported. ${duplicateCount} duplicates were ignored.`);
                jsonFileInput.value = ''; // Reset file input

            } catch (error) {
                alert(`Error reading file: ${error.message}`);
            }
        };
        reader.readAsText(file);
    };

    /**
     * Handles exporting the current question bank to a JSON file.
     */
    const handleFileExport = () => {
        const questions = loadQuestionsFromStorage();
        if (questions.length === 0) {
            alert('There are no questions to export.');
            return;
        }
        
        const dataStr = JSON.stringify(questions, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mos-questions.json';
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };


    // --- Event Listeners ---

    processBtn.addEventListener('click', () => {
        const newQuestions = parseQuestions(dataInput.value);
        if (newQuestions.length === 0 && dataInput.value.trim() !== '') {
            alert('Could not find any valid questions to extract. Please check the format.');
            return;
        }

        const existingQuestions = loadQuestionsFromStorage();
        const existingQuestionTexts = new Set(existingQuestions.map(q => q.question));
        const uniqueNewQuestions = newQuestions.filter(q => !existingQuestionTexts.has(q.question));
        
        const updatedQuestions = [...existingQuestions, ...uniqueNewQuestions];
        saveQuestionsToStorage(updatedQuestions);

        const addedCount = uniqueNewQuestions.length;
        const duplicateCount = newQuestions.length - addedCount;

        alert(`${addedCount} new questions were added. ${duplicateCount} duplicates were ignored.`);
        dataInput.value = '';
    });

    clearStorageBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete ALL saved questions? This action cannot be undone.')) {
            localStorage.removeItem(STORAGE_KEY);
            updateQuestionCount();
            alert('All questions have been cleared.');
        }
    });

    startTestBtn.addEventListener('click', generateTest);
    submitTestBtn.addEventListener('click', submitTest);
    
    retakeTestBtn.addEventListener('click', () => {
        resultsArea.classList.add('hidden');
        dataManagementSection.classList.remove('hidden');
        testGenerationSection.classList.remove('hidden');
    });

    viewEditBtn.addEventListener('click', () => {
        dataManagementSection.classList.add('hidden');
        testGenerationSection.classList.add('hidden');
        testArea.classList.add('hidden');
        resultsArea.classList.add('hidden');

        renderQuestionsForEditing();
        viewEditArea.classList.remove('hidden');
    });

    backToMainBtn.addEventListener('click', () => {
        viewEditArea.classList.add('hidden');
        dataManagementSection.classList.remove('hidden');
        testGenerationSection.classList.remove('hidden');
    });

    questionsListContainer.addEventListener('click', (e) => {
        const target = e.target;
        const questionCard = target.closest('.question-edit-card');
        if (!questionCard) return;

        const index = parseInt(questionCard.dataset.index, 10);

        if (target.classList.contains('save-btn')) {
            handleQuestionUpdate(index);
        } else if (target.classList.contains('delete-btn')) {
            handleQuestionDelete(index);
        }
    });

    // --- New Event Listeners for Import/Export ---
    importJsonBtn.addEventListener('click', () => {
        jsonFileInput.click(); // Trigger the hidden file input
    });

    jsonFileInput.addEventListener('change', handleFileImport);
    exportJsonBtn.addEventListener('click', handleFileExport);


    // --- Initial Setup ---
    updateQuestionCount();
});