const express = require('express');
const axios = require('axios');
require('dotenv').config();
const request = require('request');
const app = express();
const port = 4000;

let accessToken;
let refreshToken;
let expiresIn;
let tokenExpiryTime;

app.use(express.json());

// Function to check if the access token is expired
function isAccessTokenExpired() {
  return Date.now() >= tokenExpiryTime;
}

// Redirect the user to Zoom's OAuth authorization endpoint
app.get('/authorize', (req, res) => {
  const authorizationUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${process.env.ZOOM_CLIENT_ID}&redirect_uri=${process.env.ZOOM_REDIRECT_URI}`;
  res.redirect(authorizationUrl);
});

//to get userdata
async function getUserInfo(accessToken) {
  try {
    const response = await axios.get('https://api.zoom.us/v2/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log('User Info:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user info:', error.response?.data || error.message);
  }
}

// Zoom OAuth callback endpoint to exchange the authorization code for an access token
app.get('/callback', async (req, res) => {
  const authorizationCode = req.query.code;

  if (!authorizationCode) {
    return res.status(400).send('Authorization code not provided.');
  }

  try {
    const response = await axios.post('https://zoom.us/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: process.env.ZOOM_REDIRECT_URI,
      },
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.ZOOM_CLIENT_ID + ':' + process.env.ZOOM_CLIENT_SECRET).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    console.log(response.data);

    // Set the new access token, refresh token, and expiry time
    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
    expiresIn = response.data.expires_in;
    tokenExpiryTime = Date.now() + expiresIn * 10000;
    getUserInfo(response.data.access_token)
    res.send('Authorization successful. You can now use the app!');
  } catch (error) {
    console.error('Error exchanging authorization code:', error.response?.data || error.message);
    res.status(500).send('Authorization failed.');
  }
});

// Function to refresh the access token
async function refreshAccessToken() {
  try {
    const response = await axios.post('https://zoom.us/oauth/token', null, {
      params: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      },
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.ZOOM_CLIENT_ID + ':' + process.env.ZOOM_CLIENT_SECRET).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });


    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token; 
    expiresIn = response.data.expires_in;
    tokenExpiryTime = Date.now() + expiresIn * 10000; 

    console.log('Access token refreshed:', accessToken);
  } catch (error) {
    console.error('Error refreshing access token:', error.response?.data || error.message);
  }
}

// Set an interval to check if the token has expired and refresh it if necessary
setInterval(() => {
  if (isAccessTokenExpired()) {
    console.log('Access token expired. Refreshing...');
    refreshAccessToken();
  }
}, 60 * 10000);




// Endpoint for Zoom plugin (example integration point)
app.post('/giphy', (req, res) => {
  const query = req.body.payload.cmd; // The query parameter for the GIF search

  function getChatbotToken(callback) {
    const authHeader = Buffer.from(
      `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
    ).toString('base64');

    request(
      {
        url: 'https://api.zoom.us/oauth/token?grant_type=client_credentials',
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
        },
      },
      (error, httpResponse, body) => {
        if (error) {
          console.error('Error getting chatbot token from Zoom:', error);
          res.status(500).send('Failed to fetch chatbot token.');
        } else {
          body = JSON.parse(body);
          callback(body.access_token);
        }
      }
    );
  }

  // Function to fetch GIFs from Tenor (for Giphy integration)
  function getGif(query, chatbotToken) {
    const url = `https://g.tenor.com/v1/search?q=${query}&key=${process.env.TENOR_API_KEY}&limit=1`;

    request(
      {
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      },
      (error, response, body) => {
        if (error) {
          console.error('Error fetching GIF from Tenor:', error);
          sendChat(createErrorMessage('Error fetching GIF from Tenor.'), chatbotToken);
          return;
        }

        try {
          const data = JSON.parse(body);

          if (data.results && data.results.length > 0) {
            const gif = data.results[0];

            const chatBody = createGiphyMessage(gif);
            sendChat(chatBody, chatbotToken);
          } else {
            console.warn('No GIFs found for query:', query);
            sendChat(createErrorMessage('No GIFs found for your query.'), chatbotToken);
          }
        } catch (parseError) {
          console.error('Error parsing Tenor API response:', parseError);
          sendChat(createErrorMessage('Error processing GIF response.'), chatbotToken);
        }
      }
    );
  }

  // Function to send a chat message using Zoom API
  function sendChat(chatBody, accessToken) {
    const payload = req.body.payload;

    const chatPayload = {
      robot_jid: process.env.ZOOM_BOT_JID,
      to_jid: payload.toJid,
      account_id: payload.accountId,
      user_jid: payload.userJid,
      content: {
        head: {
          text: `/giphy ${payload.cmd}`,
        },
        body: chatBody,
      },
    };

    request(
      {
        url: 'https://api.zoom.us/v2/im/chat/messages',
        method: 'POST',
        json: true,
        body: chatPayload,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
      (error, httpResponse, body) => {
        if (error) {
          console.error('Error sending chat:', error);
        } else {
          console.log('Chat sent successfully:', body);
        }
      }
    );
  }

  // Helper function to create a GIF message
  function createGiphyMessage(giphyData) {
    const gifMedia = giphyData.media[0]?.gif || giphyData.media[0]?.tinygif;
    return [
      {
        type: 'section',
        sidebar_color: '#ff0ff0',
        sections: [
          {
            type: 'attachments',
            img_url: gifMedia?.preview,
            resource_url: gifMedia?.url,
            information: {
              title: {
                text: giphyData.title || 'GIF from Tenor',
              },
              description: {
                text: 'Click to view this GIF on Tenor.',
              },
            },
          },
          {
            type: "image",
            images: [
              {
                image_url: gifMedia?.url,
                alt_text: "img01",
                image_index: 0
              }
            ]
          },
         
        ],
      },
    ];
  }

  // Helper function to create an error message
  function createErrorMessage(message) {
    return [
      {
        type: 'section',
        sidebar_color: '#D72638',
        sections: [
          {
            type: 'message',
            text: message,
          },
        ],
      },
    ];
  }

  // Start the flow
  getChatbotToken((chatbotToken) => {
    getGif(query, chatbotToken);
  });

  res.status(200).send('Processing your request...');
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
