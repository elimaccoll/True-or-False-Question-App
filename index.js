const express = require('express');
const Datastore = require('nedb');
const app = express();
app.listen(3000, () => console.log('listening at port 3000'));
app.use(express.static('public'));
app.use(express.json( {limit: '1mb'}));

const database = new Datastore('database.db');
database.loadDatabase();

// Handles GET requests
// app.get('/api_get', (request, response) => {
//     database.find({}, (err, data) => {
//         if (err) {
//             response.end();
//             console.log(err);
//             return;
//         }
//         response.json(data);
//     });
// });

app.post('/api_results', (request, response) => {
    const token = request.body.user_token;
    // console.log(token);
    database.find({user_token: `${token}`}, (err, data) => {
        if (err) {
            response.end();
            console.log(err);
            return;
        }
        response.json(data);
    })
});

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/°/g, '&deg;').replace(/'/g, '&#039;').replace(/Å/g, '&Aring;');
}

app.post('/api_question_stats', (request, response) => {
    const q = request.body.q;
    const q_encoded = htmlEntities(q);
    database.find({q: `${q_encoded}`}, (err, data) => {
        if (err) {
            response.end();
            console.log(err);
            return;
        }
        response.json(data);
    })
});

// My api for clients to send data to my server
// Handles POST requests
app.post('/api', (request, response) => {
    const data = request.body;
    database.insert(data);
    response.json("Done");
});