const Discord = require('discord.js');
const client = new Discord.Client();
const googleIt = require('google-it');
const asyncRedis = require("async-redis");
const redisClient = asyncRedis.createClient(process.env.REDIS_URL);
const _ = require('lodash');
const dotenv = require('dotenv');
dotenv.config();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
  if (msg.content === 'hey') {
    msg.reply('hi');
  } else{
    redisClient.on("error", function (err) {
      console.log("Error " + err);
    });
    if(msg.author.bot === false){
      try {
        let firstWord = _.first( msg.content.split(" ") );
        let remStr = msg.content.split(" ");
        let newStr = remStr.shift();
        let stringAfterFirstRemoval = remStr.join(" ");
        let cachedValue = await redisClient.get("searchResults") || '[]';
        cachedValue = JSON.parse(cachedValue);
        let inputString = stringAfterFirstRemoval;
        let searchedStrings = cachedValue;
        let length = searchedStrings.length;
        let searchSubstringsPresentInCache = [];
        for(let i = 0; i<searchedStrings.length; i++){
            if (searchedStrings[i].indexOf(inputString)!=-1) {
             searchSubstringsPresentInCache.push(searchedStrings[i]);
           }
        }
        cachedValue.push(stringAfterFirstRemoval);
        if(searchSubstringsPresentInCache.length > 0 && firstWord === '!recent') {
          for(let j = 0; j < searchSubstringsPresentInCache.length; j++){
            googleIt({'query': searchSubstringsPresentInCache[j]}).then(results => {
              for(let i = 0; i < results.length && i<5; i++){
                msg.reply(results[i].link);
              }
            }).catch(e => {
              console.log('The error is---', e);
            });
          }
        } else {
          await redisClient.set("searchResults", JSON.stringify(cachedValue));
          googleIt({'query': stringAfterFirstRemoval}).then(results => {
            for(let i = 0; i < results.length && i<5; i++){
              msg.reply(results[i].link);
            }
          }).catch(e => {
            console.log('The error is---', e);
          });
        }
      } catch(err) {
        console.log('Error:', err);
      }
    }
  }
});


client.login(process.env.AUTH_TOKEN);
