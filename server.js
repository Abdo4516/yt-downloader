const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.json());

const isWindows = process.platform === 'win32';
const ytdlpPath = isWindows ? path.join(__dirname, 'yt-dlp.exe') : 'yt-dlp';
const ffmpegPath = isWindows ? path.join(__dirname, 'ffmpeg.exe') : 'ffmpeg';

app.get('/download', (req, res) => {
    const videoUrl = req.query.url;
    const format = req.query.format || 'mp3';

    if (!videoUrl) {
        return res.status(400).send('الرابط مطلوب');
    }

    const isAudio = format === 'mp3';
    const fileExt = isAudio ? 'mp3' : 'mp4';
    const outputFilename = `file_${Date.now()}.${fileExt}`;
    const outputPath = path.join(__dirname, outputFilename);

    // إضافة خيارات تجاوز الحظر وتحديد طريقة التحميل
    let command = `${ytdlpPath} "${videoUrl}" -o "${outputPath}" --no-check-certificates --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"`;

    if (isAudio) {
        command += ` -x --audio-format mp3 --ffmpeg-location "${ffmpegPath}"`;
    } else {
        command += ` -f "b[ext=mp4]/b" --ffmpeg-location "${ffmpegPath}"`;
    }

    console.log(`Executing command: ${command}`);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Exec Error: ${error.message}`);
            console.error(`Stderr: ${stderr}`);
            return res.status(500).send(`فشل التحميل: ${stderr || error.message}`);
        }

        if (!fs.existsSync(outputPath)) {
            console.error('File not found after execution.');
            return res.status(500).send('لم يتم العثور على الملف بعد المعالجة');
        }

        res.download(outputPath, outputFilename, (err) => {
            if (err) {
                console.error(`Download Response Error: ${err.message}`);
            }
            // حذف الملف بعد تنزيله لتوفير المساحة
            fs.unlink(outputPath, (unlinkErr) => {
                if (unlinkErr) console.error(`Unlink Error: ${unlinkErr}`);
            });
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});