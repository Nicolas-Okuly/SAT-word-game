let gameObject = {
    "types": ["Definition", "Scramble"],
    "score": 0,
    "time": 30,
    "wordlist": {}
}

async function retrieveWordList() {
    let wordlist;
    try {
        wordlist = await (await fetch("/word_list.json")).json();
    } catch (e) {
        wordlist = "404";
    }

    console.log(wordlist);
}

async function main() {
    await retrieveWordList();
}