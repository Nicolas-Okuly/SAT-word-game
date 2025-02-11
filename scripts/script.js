let gameObject = {
    "types": ["Definition", "Scramble"], // Types of gamemodes
    "gamemode": 0, // Array index for gamemode being used
    "timed": true, // Whether or not it is timed
    "score": 0, // Current score
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
    "description": document.getElementById("description"),
    "challenge": document.getElementById("challenge"),
    "inputBoxes": document.getElementById("inputBoxes"),
    "scrambled": document.getElementById("scrambled"),
    "modal": document.getElementById("modal")
}

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

/**
 * Function to load the word list.
 */
async function retrieveWordList() {
    let wordlist;
    try {
        wordlist = await (await fetch("/word_list.json")).json();
    } catch (e) {
        await failedToLoad();
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
    htmlObjects.time.innerHTML = gameObject.time;
}

/**
 * Adjust the view.
 */
async function adjustGameBox() {
    var description = "";
    var challenge = "";
    switch (gameObject.gamemode) {
        case 0:
            description = "Use the provided definition to guess what the word is.";
            challenge = gameObject.currentWord.definition;
            break;
        case 1:
            description = "Use the provided letters to unscramble the word.";
            let word = gameObject.currentWord.normal;
            for (let i = 0; i < word.length; i++) {
                htmlObjects.scrambled.innerHTML += `
                <input class="word-list" id="word-char${i}" value="${gameObject.currentWord.scramble[i]}" disabled>`
            }
            break;
        default:
            description = "Unknown gamemode.";
            break;
    }
    
    await handleTime();

    htmlObjects.description.innerHTML = description;
    htmlObjects.gamemode.innerHTML = gameObject.types[gameObject.gamemode];
    htmlObjects.challenge.innerHTML = challenge;
}

/**
 * Insert the input boxes to the screen.
 */
async function insertInput() {
    let word = gameObject.currentWord.normal;

    for (let i = 0; i < word.length; i++) {
        htmlObjects.inputBoxes.innerHTML += `
            <input class="word-input" id="wordIn${i}" maxlength="1" onpaste="return false" 
            type="text" onkeydown="handleBackspace(event, this, ${i})" oninput="moveNext(this, ${i})" 
            autocomplete="off" required>
        `;
    }
    htmlObjects.inputBoxes.innerHTML += `<button type="submit">Check Answer</button> 
    <button onclick="sendHint()" type="button">Give me a hint</button>
    <button type="button" onclick="giveUp()">Give Up</button>`;
}

/**
 * Give up function
 */
function giveUp() {
    gameObject.score -= gameObject.currentWord.normal.length;
    sendAlert(`The word was ${gameObject.currentWord.normal}. <br>It means: ${gameObject.currentWord.definition}<br>You lost ${gameObject.currentWord.normal.length} points.`, "You Gave Up :(");
    resetGame();
}

/**
 * 
 * @param {Boolean} correct Yes or no.
 */
function handleCorrectness(correct) {
    if(correct) {
        gameObject.score += gameObject.currentWord.normal.length - gameObject.currentWord.attempts;
        clearInterval(gameObject.interval);

        htmlObjects.modal.innerHTML = `
            <h2>${gameObject.currentWord.normal}</h2>
            <p>This word means: ${gameObject.currentWord.definition}<p>
            <p>You got it in <b>${gameObject.currentWord.attempts}</b> attempts</p>
            <p>It took you <b>${gameObject.time}</b> seconds</p>
            <p>Your current score is: <code>${gameObject.score}</p>
            <button onclick="resetGame()">Play Again</button>
        `;
    } else {
        gameObject.currentWord.attempts = gameObject.currentWord.attempts + 1;

    }
}

function sendHint() {
    sendAlert(gameObject.currentWord.definition, `Definition Of Your Word`);
}

function resetGame() {
    gameObject.time = 0;
    gameObject.currentWord = {};
    clearInterval(gameObject.interval)
    htmlObjects.inputBoxes.innerHTML = "";
    htmlObjects.modal.innerHTML = "";
    htmlObjects.scrambled.innerHTML = "";
    main();
}

/**
 * Checks the answer
 */
htmlObjects.inputBoxes.addEventListener("submit", async (e) => {
    e.preventDefault();
    let inputs = Array();
    for (let i = 0; i < gameObject.currentWord.scramble.length; i++) {
        inputs.push(e.target[`wordIn${i}`].value);

        if(inputs[i].toLowerCase() !== gameObject.currentWord.normal[i]) {
            for (let j = 0; j < gameObject.currentWord.normal.length; j++) {
                e.target[`wordIn${j}`].value = "";
            }
            sendAlert("", "Incorrect Answer");
            return handleCorrectness(false);
        }
    }

    handleCorrectness(true);
});

/**
 * Main game function.
 */
async function main() {
    await retrieveWordList();
    await playScramble();
    await adjustGameBox();
    await insertInput();
    gameObject.interval = setInterval(handleTime, 1000);
}

main();