async function getResults() {
    const user_token = localStorage['token'];
    const data = {user_token};
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }
    // calling fetch as a POST
    const response = await fetch('/api_results', options);
    const json = await response.json();
    showResults(json);
}

// TODO:
// 1. Need a cleaner state transition between showing all, correct, and wrong
// 2. Fix font sizes (question size on stats page), responsive font sizes

// Limits number of entries displayed on page at a time
const page_limit = 10;
let num_loaded = page_limit;
async function showResults(json_data) {
    // Sorts entries by timestamp - newest shows at the top
    let entries = [];
    for (item of json_data) {
        entries.push(item);
    }
    entries.sort(function (a,b) {
        if (a.timestamp < b.timestamp) return 1;
        if (a.timestamp > b.timestamp) return -1;
        return 0;
    });
    let num_correct = 0;
    let num_wrong = 0;
    let id = 0;

    const correct_container = document.getElementById("correct-count");
    const wrong_container = document.getElementById('wrong-count');
    const entry_container = document.getElementById('entry-container');
    
    for (item of entries) {
        let classes = 'entry';
        const entry = document.createElement('div');
        entry.id = id.toString();
        id++;
        if (item.correct) {
            classes += ' correct';
            num_correct++;
        }
        else {
            classes += ' wrong';
            num_wrong++;
        }
        if (id > page_limit) classes += ' max-loaded';
        entry.className = classes;

        const question = document.createElement('div');
        question.className = "q";
        const user_answer = document.createElement('div');

        entry.append(question, user_answer);

        question.innerHTML = `${item.q}`;
        user_answer.textContent = `Answer: ${item.user_answer.toUpperCase()}`;
        entry_container.append(entry);
    }
    correct_container.textContent = `CORRECT: ${num_correct}`;
    wrong_container.textContent = `WRONG: ${num_wrong}`;
}

async function loadMoreButton() {
    let showing_all = true;
    const all_entries = $('#entry-container').children();
    let cap;
    if (all_entries.length >= num_loaded) cap = num_loaded
    else cap = all_entries.length
    for (let i = 0; i < cap; i++) {
        let c = $(all_entries[i]).attr("class");
        if (c.indexOf("hidden") >= 0) {
            showing_all = false;
        }
    }
    if (!showing_all) $("#load-more-container").addClass("hidden");
    else $("#load-more-container").removeClass("hidden");
}

$(function() {
    $("#correct-count").click(function () {
        const classes = $(".wrong").attr("class");
        // Already showing only correct
        if (classes.indexOf("hidden") >= 0) {
            $(".wrong").removeClass("hidden");
            $(this).removeClass("showing-correct");
        }
        // Showing all
        else {
            $(".wrong").addClass("hidden");
            $(".correct").removeClass("hidden");
            $(this).addClass("showing-correct");
            $("#wrong-count").removeClass("showing-wrong");
        }
        loadMoreButton();
    });
    $("#wrong-count").click(function () {
        const classes = $(".correct").attr("class");
        // Already showing only wrong
        if (classes.indexOf("hidden") >= 0) {
            $(".correct").removeClass("hidden");
            $(this).removeClass("showing-wrong");
        }
        // Showing all
        else {
            $(".correct").addClass("hidden");
            $(".wrong").removeClass("hidden");  
            $(this).addClass("showing-wrong"); 
            $("#correct-count").removeClass("showing-correct");
        }
        loadMoreButton();
    });
    $("#load-more-btn").click(function () {
        const all_entries = $('#entry-container').children();
        let loaded_all = true;
        let count = 0;
        for (let i = 0; i < all_entries.length; i++) {
            let c = $(all_entries[i]).attr("class");
            if (c.indexOf("max-loaded") >= 0) {
                $(all_entries[i]).removeClass("max-loaded");
                count++;
                loaded_all = false;
            }
            if (count == page_limit) {
                num_loaded += count;
                return;
            }
        }
        if (loaded_all) {
            $("#load-more-btn-text").text("ALL ANSWERS LOADED");
            $("#load-more-btn").css("cursor", "not-allowed");
        }
    });
});
getResults();

let showing_flag= false;
$(function() {
    $("#entry-container").on('click', '.entry', function () {
        if (!showing_flag) {
            showing_flag = true;
            const id = $(this).attr("id");
            let question = $(`#${id}`).children(".q").text();
            getQuestionStats(question);
            $(".count-container").addClass("hidden");
            $("#load-more-container").addClass("hidden");
            $(".back-container").removeClass("hidden");
            $(".entry").addClass("hidden");
            $(`#${id}`).removeClass("hidden");
            $("#correct-count").removeClass("showing-correct");
            $("#wrong-count").removeClass("showing-wrong");
            $("#stats-container").removeClass("hidden");
            $(".entry").css('cursor','default');
        }
    });
    $("#back").click(function () {
        showing_flag = false;
        $(".count-container").removeClass("hidden");
        $(".back-container").addClass("hidden");
        $("#stats-container").addClass("hidden");
        $("#load-more-container").removeClass("hidden");
        $(".entry").removeClass("hidden");
        $(".entry").css('cursor','pointer');
    });
});
async function getQuestionStats(q) {
    const data = {q};
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }
    // calling fetch as a POST
    const response = await fetch('/api_question_stats', options);
    const json = await response.json();
    getStats(json);
}


async function getStats(json_data) {
    let total = 0;
    let num_correct = 0;
    let num_wrong = 0;
    let percent_correct = 0;

    for (item of json_data) {
        total++;
        if (item.correct) num_correct++;
        else num_wrong++;
    }
    percent_correct = Math.round((num_correct/total)*100);
    $("#total-answers").text(`RESPONSES: ${total}`);
    $("#correct-answers").text(`CORRECT: ${num_correct}`);
    $("#wrong-answers").text(`WRONG: ${num_wrong}`);
    $("#percentage_correct").text(`% CORRECT: ${percent_correct}%`);

}