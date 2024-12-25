// server.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 4040;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint untuk mengakses OpenAI API
app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;

    if (!process.env.GROQ_API_KEY) {
        console.error('GROQ_API_KEY tidak ditemukan di file .env');
        return res.status(500).json({ 
            error: 'GROQ_API_KEY tidak ditemukan di file .env',
            details: 'Pastikan file .env sudah dibuat dengan GROQ_API_KEY yang valid'
        });
    }

    try {
        console.log('Mengirim permintaan ke Groq API...');
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: "llama-3.3-70b-versatile",
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.data || !response.data.choices || !response.data.choices[0]) {
            throw new Error('Format respons tidak valid dari Groq API');
        }

        console.log('Berhasil mendapat respons dari Groq API');
        return res.status(200).json(response.data);

    } catch (error) {
        console.error('Error saat berkomunikasi dengan Groq API:', error);

        let errorMessage = 'Terjadi kesalahan internal server';
        let statusCode = 500;

        if (error.response) {
            statusCode = error.response.status;
            errorMessage = error.response.data?.error?.message || 'Error dari Groq API';
        } else if (error.request) {
            errorMessage = 'Tidak dapat terhubung ke Groq API';
        }

        return res.status(statusCode).json({
            error: errorMessage,
            details: error.message
        });
    }
});

// Endpoint untuk mengakses Wikipedia API
app.get('/api/wiki', async (req, res) => {
    const { query } = req.query;

    try {
        const response = await axios.get('https://id.wikipedia.org/w/api.php', {
            params: {
                action: 'query',
                format: 'json',
                list: 'search',
                srsearch: query,
                utf8: 1,
                origin: '*',
                srlimit: 1
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error communicating with Wikipedia API' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});