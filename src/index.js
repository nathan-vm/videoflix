import { readFile, stat } from 'fs/promises';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises'
import path from 'path';
import express from 'express';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.static(path.resolve(__dirname)))


async function run(file,res,{start,end}) {
  await pipeline(
    createReadStream(file,{start,end}),
    res
  );
  console.log('Pipeline succeeded.');
}

app.get('/', async (req, res) => {
  const html = await readFile(path.resolve(__dirname,'index.html'));
  return res.end(html)
});
app.get('/movies/:movieName', async(req, res) => {
  const { movieName } = req.params;
  const movieFile = path.resolve(__dirname,'movies',movieName)

  try {
    const {size} = await stat(movieFile)
    const { range } = req.headers;

    const start = Number((range || '').replace(/bytes=/, '').split('-')[0]);
    const end = size - 1;
    const chunkSize = (end - start) + 1;

    res.set({
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4'
    });

    res.status(206)
    
    await run(movieFile,res,{start,end})    
  } catch (error) {
    console.log(err);
    return res.status(404).end('<h1>Movie Not found</h1>');
  }
});
app.listen(3000, () => console.log('VideoFlix Server!'));