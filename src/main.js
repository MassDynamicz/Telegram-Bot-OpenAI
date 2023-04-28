import { Telegraf, session, Markup } from 'telegraf'
import { message } from 'telegraf/filters'
import { code } from 'telegraf/format'
import config from 'config'
import { ogg } from './ogg.js'
import { openai } from './openai.js'
import { getTypingOptions } from './utils.js'

const INITIAL_SESSION = {
  messages: []
}

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))

const mainMenuKeyboard = Markup.inlineKeyboard([
  Markup.button.callback('💬Текст или голосовое сообщение', 'text_voice_input'),
  Markup.button.callback('Распознать картинку', 'image_recognation'),
]);


bot.use(session())


bot.command('start', async (ctx) => {
  ctx.session = INITIAL_SESSION
  await ctx.reply('Приветствую, чем могу помочь?', mainMenuKeyboard);
})
bot.action('text_voice_input', async (ctx) => {
  ctx.session ??= INITIAL_SESSION
  await ctx.reply('Пожалуйста, отправьте голосовое или текстовое сообщение')
})
bot.on(message('voice'), async ctx => {
  ctx.session ??= INITIAL_SESSION
  try {
    await ctx.reply(code('Сообщение принято, ждем ответа от сервера ...🐣'))
    await ctx.replyWithChatAction('typing')
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
    const userId = String(ctx.message.from.id)
    const oggPath = await ogg.create(link.href, userId)
    const mp3Path = await ogg.toMP3(oggPath, userId)
    const text = await openai.transcription(mp3Path)
    await ctx.reply(code(`Ваш запрос: ${text}`))

    ctx.session.messages.push({ role: openai.roles.USER, content: text })

    const response = await openai.chat(ctx.session.messages)

    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content
    })

    await ctx.reply(response.content)

  } catch (e) {
    console.log('Error: voice msg', e.message);
  }
})

bot.on(message('text'), async ctx => {
  ctx.session ??= INITIAL_SESSION
  try {
    await ctx.reply(code('Сообщение принято, ждем ответа от сервера ...🐣'))
    await ctx.replyWithChatAction('typing')

    ctx.session.messages.push({ role: openai.roles.USER, content: ctx.message.text })

    const response = await openai.chat(ctx.session.messages)

    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content
    })

    await ctx.reply(`Ответ: ${response.content}`)

  } catch (e) {
    console.log('Error: text', e.message)
  }
})
bot.command('new', async (ctx) => {
  ctx.session = INITIAL_SESSION
  await ctx.reply('Жду голосового или текстового сообщения')
})



bot.action('image_recognation', async (ctx) => {
  ctx.session ??= INITIAL_SESSION
  await ctx.reply('Эта функция находится в разработке')
})

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))