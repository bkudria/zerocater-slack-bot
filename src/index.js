'use strict';

// Include the serverless-slack bot framework
const slack = require('serverless-slack');
const ZeroCater = require('zerocater');
const zc_client = ZeroCater(process.env.ZEROCATER_TOKEN);


// The function that AWS Lambda will call
exports.handler = slack.handler.bind(slack);

// Slash Command handler
slack.on('/lunch', (msg, bot) => {
  let message = {
    text: 'Is lunch here? Is the caterer *finished* setting up?',
    attachments: [{
      fallback: 'actions',
      callback_id: "lunch_here",
      actions: [
        { type: 'button', name: 'Yes', text: "Lunch is here, and set up", value: 'yes', style: 'primary' },
        { type: 'button', name: 'No', text: "No, lunch isn't set up yet...", value: 'no', style: 'danger' },
      ]
    }]
  };

  bot.reply(message);
});


// Interactive Message handler
slack.on('lunch_here', (msg, bot) => {
  const value = msg.actions[0].value;

  if (value === 'no') {
    bot.replyPrivate({text: "Ok! Type `/lunch` again when it's ready!"});
  } else if (value === 'yes') {
    zc_client
      .getMeals({range: 'today'})
      .then(function(result) {
        const lunch = result[0];
        const lunch_url =  `https://app.zerocater.com/m/${process.env.ZEROCATER_TOKEN}/${lunch.id}`;
        let message = {
          attachments: [{
            fallback: `${lunch.name} <!here>! ${lunch_url} \n*${lunch.vendor_name}* \n_${lunch.vendor_description}_`,
            color: 'good',
            title: lunch.vendor_name,
            title_link: lunch_url,
            text: `*${lunch.name}* <!here>!\n\n_${lunch.vendor_description}_`,
            image_url: lunch.vendor_image_url.replace(/v\d+/, 'q_auto'),
            actions: [{
              type: 'button',
              text: 'View menu',
              style: 'primary',
              url: lunch_url
            }]
          }]
        };

        bot
          .reply(message)
          .catch(function(r) {bot.replyPrivate({text: 'Error - ' + JSON.stringify(r, null, 2)});});
      }).catch(function(error) {
        let message = {
          text: `Error: ${`${error}`}`
        };

        bot.replyPrivate(message);
      });
  }
});
