const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

const altsFilePath = path.join(__dirname, 'alts.json');

function getCurrentDate() {
    const date = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);

    const day = date.getDate();
    const daySuffix = (day % 10 === 1 && day !== 11) ? 'st' :
                      (day % 10 === 2 && day !== 12) ? 'nd' :
                      (day % 10 === 3 && day !== 13) ? 'rd' : 'th';

    return formattedDate.replace(day, day + daySuffix);
}

app.post('/generate-alt', (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    fs.readFile(altsFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read alts.json' });
        }

        let alts = JSON.parse(data);
        const currentDate = getCurrentDate();

        // Add the new alt with the creation date
        alts.push({ 
            username: username,
            date: currentDate
        });

        const alt = alts.shift();
        const password = alt.username + alt.username;

        fs.writeFile(altsFilePath, JSON.stringify(alts, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to update alts.json' });
            }

            res.json({ 
                username: alt.username, 
                password: password, 
                date: alt.date // Return the date the alt was created
            });
        });
    });
});
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Roblox Alt Generator</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        body {
            background-color: #000000;
            color: #ffffff;
            font-family: 'Poppins', sans-serif;
            font-size: 16px;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }

        .container {
            text-align: center;
            background-color: #1a1a1a;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
            min-width: 320px;
            display: inline-block;
            transition: transform 0.3s ease-in-out;
        }

        .container:hover {
            transform: scale(1.05);
        }

        h1 {
            font-size: 22px;
            margin-bottom: 20px;
            font-weight: 600;
            color: #ffffff;
        }

        input[type="text"] {
            background-color: #262626;
            color: #ffffff;
            border: 2px solid #333333;
            padding: 12px 20px;
            border-radius: 24px;
            width: calc(100% - 40px);
            margin-bottom: 20px;
            text-align: center;
            font-size: 16px;
            transition: border-color 0.3s;
        }

        input[type="text"]:focus {
            border-color: #555555;
            outline: none;
        }

        ::placeholder {
            color: #888888;
            font-size: 16px;
        }

        .output {
            margin-top: 20px;
            padding: 15px;
            background-color: #121212;
            border-radius: 24px;
            display: none;
            font-size: 16px;
            color: #ffffff;
            text-align: left;
            transition: opacity 0.3s;
            overflow: auto;
        }

        .output p {
            margin: 8px 0;
            white-space: nowrap;
        }

        .spinner {
            border: 4px solid #333333;
            border-top: 4px solid #ffffff;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 0.5s linear infinite;
            margin: 20px auto;
            display: none;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Roblox Alt Generator</h1>
        <input type="text" id="usernameInput" placeholder="Enter Username" onkeydown="handleKeyPress(event)" />
        <div class="spinner" id="spinner"></div>
        <div class="output" id="output"></div>
    </div>

    <script>
        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                generateAlt();
            }
        }

        async function generateAlt() {
            const username = document.getElementById('usernameInput').value.trim();
            const output = document.getElementById('output');
            const spinner = document.getElementById('spinner');

            if (!username) {
                output.textContent = 'Please enter a username';
                output.style.display = 'block';
                return;
            }

            spinner.style.display = 'block';
            output.style.display = 'none';

            try {
                const response = await fetch('/generate-alt', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username })
                });

                const data = await response.json();

                if (response.ok) {
                    setTimeout(() => {
                        spinner.style.display = 'none';

                        // Clear previous output content
                        while (output.firstChild) {
                            output.removeChild(output.firstChild);
                        }

                        // Create new elements for username, password, and date with icons
                        const usernamePara = document.createElement('p');
                        usernamePara.innerHTML = "<i class='fas fa-user'></i> " + data.username;
                        const passwordPara = document.createElement('p');
                        passwordPara.innerHTML = "<i class='fas fa-lock'></i> " + data.password;
                        const datePara = document.createElement('p');
                        datePara.innerHTML = "<i class='fas fa-calendar-alt'></i> " + data.date;

                        // Append new elements to the output div
                        output.appendChild(usernamePara);
                        output.appendChild(passwordPara);
                        output.appendChild(datePara);

                        output.style.display = 'block';
                    }, 500);
                } else {
                    spinner.style.display = 'none';
                    output.textContent = data.error;
                    output.style.display = 'block';
                }
            } catch (error) {
                spinner.style.display = 'none';
                output.textContent = 'An error occurred. Please try again later.';
                output.style.display = 'block';
            }
        }
    </script>
</body>
</html>
    `);
});



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});