let gameObject = {
    "timed": true, // Whether or not it is timed
    "score": 0, // Current score
    "timeItr": 0,
    "time": 0, // Time in seconds
    "wordlist": Array(), // List of words in the game
    "currentWord": {
        "normal": "", // Unscrambled version of the word
        "scramble": "", // Scrambled version of the word
        "attempts": 0, // Number of attempts on the word
        "definition": "" // Definition of the word
    }
}

// Fetch all HTML elements that we will use
const htmlObjects = {
    "gamemode": document.getElementById("gamemode"),
    "time": document.getElementById("time"),
    "timer": document.getElementById("timer"),
    "inputBoxes": document.getElementById("inputBoxes"),
    "scrambled": document.getElementById("scrambled"),
    "modal": document.getElementById("modal"),
    "gameBody": document.getElementsByClassName("game-body")[0],
    "score": document.getElementById("score"),
    "leaderboard": document.getElementsByClassName("leaderboard")[0]
}

if(!navigator.onLine) htmlObjects.leaderboard.style.display = "none";

/**
 * Scrambles a given word.
 * @param {String} word Word to scramble.
 * @returns {String} Scrambled word.
 */
function scrambleWord(word) {
    const letters = word.split('');
    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters.join('');
}

/**
 * Function to handle failure to load word list.
 */
async function failedToLoad() {
    document.body.innerHTML = `
        <div class="failedload">
            <h1>Failed to load the word list. Please try again later or email me at <code>nicolasokuly@outlook.com</code></h1>
        </div>
    `;
}

function formatWordsToJSON(data) {
    const result = {};

    data = data.split("\n");
    let newArr = [];

    data.forEach((row) => {
        let usableData = row
        .match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)
        .map(value => value.replace(/^"|"$/g, ''));

        newArr.push(usableData);
    });

    newArr.forEach((set) => {
        let word = set[0];
        let definition = set[1];
        let firstLetter = word.toLowerCase();
        if (!result[firstLetter]) {
            result[firstLetter] = []; 
        }
        result[firstLetter].push({ n: word, d: definition }); 
    });

    const finalJSON = Object.keys(result)
        .sort()
        .map(letter => ({ [letter]: result[letter] }))

    return finalJSON;
}

/**
 * Function to load the word list.
 */
async function retrieveWordList() {
    let wordlist;
    try {
        wordlist = await (await fetch("/word_list.json")).json();
    } catch (e) {
        await failedToLoad();
        throw new Error(e)
    }

    gameObject.wordlist = wordlist;
}

/**
 * Function to start a scrambled game.
 */
async function playScramble() {
    const letterCategory = gameObject.wordlist[Math.floor(Math.random() * gameObject.wordlist.length)];
    const letter = Object.keys(letterCategory)[0]
    const word = letterCategory[letter][Math.floor(Math.random() * letterCategory[letter].length)];
    const mixedWord = scrambleWord(word["n"]);

    gameObject.gamemode = 1; // Scramble
    gameObject.currentWord = { "normal": word["n"], "definition": word["d"], "scramble": mixedWord, "attempts": 0 };
}

/**
 * Handles game timing.
 * @returns {String} Only returns if the timer is off.
 */
function handleTime() {
    if(!gameObject.timed) {
        htmlObjects.timer.style.display = "none";
        return "Timer Disabled";
    }
    gameObject.time += 1;
    htmlObjects.score.innerHTML = gameObject.score
    
    // if (Math.floor(gameObject.time/30) != gameObject.timeItr) {
    //     gameObject.timeItr += 1;
    //     gameObject.score -= 1;
    //     sendAlert("You recieved a one point deduction.", "Time Penalty");
    // } 

    htmlObjects.time.innerHTML = gameObject.time;
}

/**
 * Adjust the view.
 */
async function adjustGameBox() {
    let word = gameObject.currentWord.normal;
    htmlObjects.scrambled.innerHTML = '';
    for (let i = 0; i < word.length; i++) {
        htmlObjects.scrambled.innerHTML += `
        <input class="word-list" id="word-char${i}" value="${gameObject.currentWord.scramble[i]}" disabled>`
    }
}

/**
 * Insert the input boxes to the screen.
 */
async function insertInput() {
    let word = gameObject.currentWord.normal;
    htmlObjects.inputBoxes.innerHTML = '';

    for (let i = 0; i < word.length; i++) {
        htmlObjects.inputBoxes.innerHTML += `
            <input class="word-input" id="wordIn${i}" maxlength="1" onpaste="return false" 
            type="text" onkeydown="handleBackspace(event, this, ${i})" oninput="moveNext(this, ${i})" 
            autocomplete="off" required>
        `;
    }
    htmlObjects.inputBoxes.innerHTML += `<br><br><div id="game-buttons">
    <button type="submit">Check Answer</button> 
    <button onclick="reshuffle()" type="button">Reshuffle</button>
    <button onclick="sendHint()" type="button">Definition</button>
    <button type="button" onclick="giveUp()">Give Up</button>
    </div>`;
}

function reshuffle() {
    const mixedWord = scrambleWord(gameObject.currentWord.normal);
    gameObject.currentWord.scramble = mixedWord;
    
    adjustGameBox()
}

/**
 * Give up function
 */
function giveUp() {
    gameObject.score -= gameObject.currentWord.normal.length;
    sendAlert(`${gameObject.currentWord.definition}<br><br>You lost ${gameObject.currentWord.normal.length} points.`, gameObject.currentWord.normal);
    resetGame();
}

/**
 * 
 * @param {Boolean} correct Yes or no.
 * @param {Number} firstWrong First wrong input
 */
function handleCorrectness(correct, firstWrong) {
    if(correct) {
        gameObject.score += gameObject.currentWord.normal.length - gameObject.currentWord.attempts;
        clearInterval(gameObject.interval);

        htmlObjects.modal.innerHTML = `
            <h2>${gameObject.currentWord.normal}</h2>
            <p>${gameObject.currentWord.definition}<p>
            <p>You got it in <b>${gameObject.currentWord.attempts}</b> attempts</p>
            <p>It took you <b>${gameObject.time}</b> seconds</p>
            <p>Your current score is: <b>${gameObject.score}<b></p>
            <button onclick="resetGame()">Play Again</button>
            <button onclick="finishGame()">Quit Playing</button>
        `;

        document.getElementById("notification").style.display = "none";
        htmlObjects.modal.style.display = "block";
        let elements = htmlObjects.inputBoxes.elements;
        for (var i = 0, len = elements.length; i < len; ++i) {
            elements[i].value = "";
            elements[i].readOnly = true;
            elements[i].disabled = true;
        }
    } else {
        gameObject.currentWord.attempts = gameObject.currentWord.attempts + 1;
        htmlObjects.inputBoxes.elements[firstWrong].focus();
    }
}

function sendHint() {
    sendAlert(gameObject.currentWord.definition, `Definition of Your Word`);
}

function resetGame() {
    gameObject.time = 0;
    gameObject.currentWord = {};
    gameObject.timeItr = 0;
    clearInterval(gameObject.interval)
    htmlObjects.inputBoxes.innerHTML = "";
    htmlObjects.modal.style.display = "none";
    htmlObjects.scrambled.innerHTML = "";
    main();
}

async function checkAnswer(e) {
    e.preventDefault();
    let inputs = Array();
    let correct = true;
    let firstWrong = 0;

    for (let i = 0; i < gameObject.currentWord.scramble.length; i++) {
        inputs.push(e.target[`wordIn${i}`].value);

        if(inputs[i].toLowerCase() != gameObject.currentWord.normal[i]) {
            e.target[`wordIn${i}`].value = "";
            sendAlert("", "Incorrect Answer");

            e.target[`wordIn${i}`].style.border = "1px solid red";
            e.target[`wordIn${i}`].style['box-shadow'] = "0px 0px 10px red";

            correct = false;
            firstWrong = i;
        } else {
            if (correct !== false) correct = true;
            e.target[`wordIn${i}`].style.border = "1px solid green";
            e.target[`wordIn${i}`].style['box-shadow'] = "0px 0px 10px lightgreen";
        }
    }

    handleCorrectness(correct, firstWrong);
}

/**
 * Checks the answer
 */
htmlObjects.inputBoxes.addEventListener("submit", checkAnswer);

/**
 * Main game function.
 */
async function main() {
    await retrieveWordList();
    await playScramble();
    await adjustGameBox();
    await handleTime();
    await insertInput();
    gameObject.interval = setInterval(handleTime, 1000);
}

main();
