import fs from "fs"
import ffmpeg from 'fluent-ffmpeg'
import installer from '@ffmpeg-installer/ffmpeg'
import axios from "axios"
import {dirname, resolve} from 'path'
import {fileURLToPath} from 'url'
import {removeFile} from './utils.js'


 const __dirname = dirname(fileURLToPath(import.meta.url))
 class OggConverter {
  constructor() {
    ffmpeg.setFfmpegPath(installer.path)
  }
   toMP3(input,output) {
      try {
        const outputPath = resolve(dirname(input),`${output}.mp3`)
        return new Promise((resolve, reject) => {
          ffmpeg(input)
            .inputOption('-t 30')
            .output(outputPath)
            .on('end', () => {
              removeFile(input)
              resolve(outputPath)
            })
            .on('error', (err) => reject('mp3:',err.message))
            .run()
        })
      } catch (e) {
        console.log(e.message);
      }
   }
   async create(url, filename) {
    try {
      const oggPath = resolve(__dirname,'../tmp', `${filename}.ogg`)
      const res = await axios({
        method: 'get',
        url,
        responseType:'stream'
      })
       return new Promise((resolve, reject) => {
        const stream = fs.createWriteStream(oggPath)
        res.data.pipe(stream)
        stream.on('finish',()=> {
          this.closeWriteStream(stream)
          .then(() => {
            resolve(oggPath)
          })
          .catch(reject);
        });
        stream.on('error', (err) => {
          reject(err);
        });
      })
     } catch (e) {
      console.log('error:', e.message);
    }
  }
   async checkFileExists(filePath) { 
    return new Promise((resolve, reject) => {
      fs.access(filePath, fs.F_OK, (err) => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
   async closeWriteStream(stream) { 
    return new Promise((resolve, reject) => {
      stream.end(() => {
        resolve();
      });
    });
  }
}
 export const ogg = new OggConverter();