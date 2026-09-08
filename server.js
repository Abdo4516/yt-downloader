const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/download', async (req, res) => {
    const videoUrl = req.query.url;
    const format = req.query.format || 'mp3';

    if (!videoUrl || !ytdl.validateURL(videoUrl)) {
        return res.status(400).send('الرابط غير صالح');
    }

    try {
        const isAudio = format === 'mp3';
        const fileExt = isAudio ? 'mp3' : 'mp4';
        const outputFilename = `file_${Date.now()}.${fileExt}`;
        const outputPath = path.join(__dirname, outputFilename);

        const stream = ytdl(videoUrl, {
            filter: isAudio ? 'audioonly' : 'videoandaudio',
            quality: 'highest'
        });

        const writeStream = fs.createWriteStream(outputPath);
        stream.pipe(writeStream);

        writeStream.on('finish', () => {
            res.download(outputPath, outputFilename, () => {
                fs.unlink(outputPath, () => {});
            });
        });

        stream.on('error', (err) => {
            console.error('Stream Error:', err);
            res.status(500).send('حدث خطأ أثناء التحميل');
        });

    } catch (err) {
        console.error('Catch Error:', err);
        res.status(500).send('فشل في معالجة الفيديو');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));