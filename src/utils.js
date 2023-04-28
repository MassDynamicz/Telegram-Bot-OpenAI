import {unlink} from 'fs/promises'

export async function removeFile(path) {
  try {
    await unlink(path)
  } catch (e) {
    console.log(e.message);
  }
}
export async function getTypingOptions(ctx) {
  return {
    reply_markup: {
      resize_keyboard: true,
      keyboard: []
    },
    chat_id: ctx.chat.id,
    text: ctx.message.text,
    timeout: 60 * 1000,
    parse_mode: 'HTML',
    reply_to_message_id: ctx.message.message_id
  }
}