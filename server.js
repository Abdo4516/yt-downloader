const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.use(express.json());

// تحديد مسار الأداة حسب نظام التشغيل (Windows أو Linux فالسيرفر)
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

    let command = `"${ytdlpPath}" "${videoUrl}" -o "${outputPath}" --ffmpeg-location "${ffmpegPath}"`;

    if (isAudio) {
        command += ' -x --audio-format mp3';
    } else {
        command += ' -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"';
    }

    console.log('جاري معالجة التحميل...');

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('خطأ أثناء المعالجة:', error);
            return res.status(500).send('حدث خطأ أثناء تحميل الفيديو');
        }

        res.download(outputPath, `download.${fileExt}`, () => {
            if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});