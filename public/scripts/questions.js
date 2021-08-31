// Question Api: https://opentdb.com/api_config.php

// TODO:
// 1. Add different messages if you get multiple questions right/wrong in a row
// 2. Fix font sizes, responsive font sizes, and layout (question container)
// 3. Fix stuff for different media

const true_btn = document.getElementById("true-btn");
const false_btn = document.getElementById("false-btn");
const page = document.getElementById("all");
const streak = document.getElementById("streak-count");
const best_streak = document.getElementById("best-streak-count");
// const status = document.getElementById("status-message");

// Just for testing
// const new_token = document.getElementById("new-token");
// new_token.addEventListener('click', async event => {
//     generateToken();
//     location.reload();
// });

true_btn.addEventListener('click', async event => {
    answered("True");
}); 
false_btn.addEventListener('click', async event => {
    answered("False");
});

const delay = ms => new Promise(res => setTimeout(res, ms));
let user_token;
let best_streak_count;
async function setup() {
     // Waits half a second to ensure the list of questions is retrieved and that the 
     // Getting Questions text doesn't just flash super quick
    document.getElementById("question").textContent = "Getting Questions...";
    await delay(500);

    await getToken();
    await getQuestionList();
    streak.textContent = `STREAK: ${streak_count}`;
    if (localStorage['best_streak'])
        best_streak_count = localStorage['best_streak'];
    else best_streak_count = 0;
    best_streak.textContent = `BEST STREAK: ${best_streak_count}`;

    // status.textContent = "ANSWER A QUESTION";
    getNextQuestion();
}

let question_list;
async function getQuestionList() {
    // Get questions in batches of 50
    const num_questions = 50;
    const question_api_url = `https://opentdb.com/api.php?amount=${num_questions}&type=boolean&token=${user_token}`;

    const response = await fetch(question_api_url);
    const data = await response.json();
    const code = data.response_code;
    if (code == 0)
        question_list = data.results;
    else if (code == 4) {
        forceResetToken(localStorage['token']);
        location.reload();
    }
    else
        console.log("Error fetching question list: " + code);
}

async function getToken() {
    if (localStorage['token'])
        resetToken(localStorage['token']);
    else
        generateToken();
    user_token = localStorage['token'];
}

async function generateToken() {
    const token_url = "https://opentdb.com/api_token.php?command=request";
    const response = await fetch(token_url);
    const data = await response.json();
    const code = data.response_code;
    if (code == 0) {
        localStorage['token'] = data.token;
        localStorage['token_age'] = new Date().getTime();
        console.log("Token Generated");
    }
    else
        console.log("Generate Token Error: " + code, data.response_message);
}

async function forceResetToken(token) {
    const reset_token_url = `https://opentdb.com/api_token.php?command=reset&token=${token}`;
    const response = await fetch(reset_token_url);
    const data = await response.json();
    const code = data.response_code;
    if (code == 0) {
        localStorage['token'] = data.token;
        user_token = data.token;
        console.log("Reset token");
    }
    else if (code == 3) {
        return;
    }
    else
        console.log("Reset Token Error: " + code, data.response_message);
}


async function resetToken(token) {
    const reset_time = 60*60*6000; // 6 hours according to API
    const token_age = localStorage['token_age'];
    if (((new Date().getTime()) - token_age) >= reset_time) {
        const reset_token_url = `https://opentdb.com/api_token.php?command=reset&token=${token}`;
        const response = await fetch(reset_token_url);
        const data = await response.json();
        const code = data.response_code;
        if (code == 0) {
            localStorage['token'] = data.token;
            user_token = data.token;
            console.log("Reset token");
        }
        else if (code == 3) {
            return;
        }
        else
            console.log("Reset Token Error: " + code, data.response_message);
    }
}

let bg_index = 1;
const bgs = ["rgba(255,0,0,0.65)", "rgb(216,216,216)", "rgba(0,255,0,0.65)"];
async function bg_color(correct) {
    if (correct) bg_index = 2;
    else bg_index = 0;
    all.style.backgroundColor = `${bgs[bg_index]}`;
}

let streak_count = 0;
let all_data = [];
async function answered(user_answer) {
    let correct;
    let status_msg;
    if (ready_flag) {
        ready_flag = false;
        if (user_answer == answer) {
            correct = true;
            status_msg = "CORRECT :)";
            streak_count++;
        }
        else {
            correct = false;
            status_msg = "WRONG :(";
            streak_count = 0;
        }
        bg_color(correct);

        streak.textContent = `STREAK: ${streak_count}`;
        if (streak_count > best_streak_count) {
            best_streak_count = streak_count;
            localStorage['best_streak'] = best_streak_count;
            best_streak.textContent = `BEST STREAK: ${best_streak_count}`;
        }
        // status.textContent = `${status_msg}`;

        let timestamp = Date.now();
        let data_entry = {q, user_answer, answer, correct, user_token, timestamp};
        all_data.push(data_entry);

        getNextQuestion();
    }
}

const question_api_url = "https://opentdb.com/api.php?amount=1&type=boolean";

let answer;
let q;
let ready_flag = false;
let question_index = 0;
async function getNextQuestion() {
    const data = question_list[question_index];
    question_index++;
    const { question, correct_answer } = data;
    q = question;
    answer = correct_answer;
    document.getElementById("question").innerHTML = question;
    if (question_index >= question_list.length) {
        getQuestionList();
        question_index = 0;
    }
    ready_flag = true;
}

async function sendData(all_data) {
    // POST request to update database
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(all_data)
    }
    // Don't really need to do anything with response
    const response = await fetch('/api', options);
    // const json = await response.json();
    // console.log(json);
}

setup();

// Sends all data to the server when the user leaves the page
// - minimizes the number of requests
window.onbeforeunload = () => {
    sendData(all_data);
};