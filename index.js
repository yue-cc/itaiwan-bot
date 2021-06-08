import linebot from 'linebot'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()
const distance = (lat1, lon1, lat2, lon2, unit = 'K') => {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0
  } else {
    const radlat1 = (Math.PI * lat1) / 180
    const radlat2 = (Math.PI * lat2) / 180
    const theta = lon1 - lon2
    const radtheta = (Math.PI * theta) / 180
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta)
    if (dist > 1) {
      dist = 1
    }
    dist = Math.acos(dist)
    dist = (dist * 180) / Math.PI
    dist = dist * 60 * 1.1515
    if (unit === 'K') {
      dist = dist * 1.609344
    }
    if (unit === 'N') {
      dist = dist * 0.8684
    }
    return dist
  }
}

const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
})

bot.listen('/', process.env.PORT, () => {
  console.log('機器人啟動')
})

bot.on('message', async event => {
  if (event.message.type === 'text') {
    try {
      let reply = ''
      const { data } = await axios.get('https://www.gsp.gov.tw/iTaiwan/itw_tw.json')
      for (const d of data) {
        if (d.ADDR.includes(event.message.text)) {
          console.log(d)
          reply += `地點:${d.NAME} \n地址:${d.ADDR} \nhttp://www.google.com.tw/maps/place/${d.ADDR}/@${d.LATITUDE},${d.LONGITUDE},17z/ \n\n`
        }
      }
      event.reply(reply)
    } catch (error) {
      event.reply('發生錯誤')
    }
  } else if (event.message.type === 'location') {
    try {
      let reply = ''
      const { data } = await axios.get('https://www.gsp.gov.tw/iTaiwan/itw_tw.json')
      for (const d of data) {
        const km = distance(d.LATITUDE, d.LONGITUDE, event.message.latitude, event.message.longitude)
        if (km <= 0.3) {
          reply += `地點:${d.NAME} \n地址:${d.ADDR} \nhttp://www.google.com.tw/maps/place/${d.ADDR}/@${d.LATITUDE},${d.LONGITUDE},17z/ \n\n`
        }
      }
      if (reply.length === 0) reply = '附近300公尺內，無公共免費Wi-Fi \n請試試其他位置'
      console.log(reply)
      event.reply(reply)
    } catch (error) {
      event.reply('發生錯誤')
    }
    console.log(event.message.latitude)
    console.log(event.message.longitude)
  }
})
