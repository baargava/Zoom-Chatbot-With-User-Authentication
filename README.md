# Zoom-Chatbot-With-User-Authentication

# Zoom OAuth Integration with Giphy Bot

## Overview
This project is an **Express.js** application that integrates with **Zoom OAuth API** to authenticate users and fetch user data. Additionally, it includes a **Giphy bot** integration that fetches GIFs from Tenor and sends them as chat messages in Zoom.

## Features
- Zoom OAuth 2.0 authentication
- Access token management with auto-refresh
- Fetch user details from Zoom API
- Giphy bot that retrieves GIFs from Tenor and sends them via Zoom chat

## Tech Stack
- **Node.js**
- **Express.js**
- **Axios** for HTTP requests
- **Request** for API calls
- **dotenv** for environment variable management

## Installation
### Prerequisites
Ensure you have the following installed:
- **Node.js** (v14 or later)
- **npm** or **yarn**

### Steps
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/zoom-oauth-giphy-bot.git
   cd zoom-oauth-giphy-bot
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```ini
   ZOOM_CLIENT_ID=your_zoom_client_id
   ZOOM_CLIENT_SECRET=your_zoom_client_secret
   ZOOM_REDIRECT_URI=http://localhost:4000/callback
   ZOOM_BOT_JID=your_zoom_bot_jid
   TENOR_API_KEY=your_tenor_api_key
   ```
4. Start the server:
   ```sh
   npm start
   ```

## Usage
### 1. Zoom OAuth Authentication
- Visit: `http://localhost:4000/authorize`
- Login with Zoom and authorize the app.
- The app will fetch an access token and retrieve user info.

### 2. Giphy Bot Integration
- The bot listens for **/giphy <search_term>** in chat.
- It fetches a relevant GIF from Tenor and sends it to the Zoom chat.

## API Endpoints
| Method | Endpoint       | Description |
|--------|---------------|-------------|
| GET    | /authorize    | Redirects user to Zoom OAuth authorization |
| GET    | /callback     | Handles Zoom OAuth callback and fetches access token |
| POST   | /giphy        | Fetches a GIF from Tenor and sends it via Zoom bot |

## Access Token Management
- The app automatically refreshes the access token when it expires.
- Uses **setInterval** to check token validity and refresh if needed.

## Contributing
1. Fork the repo
2. Create a new branch (`git checkout -b feature-branch`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to your branch (`git push origin feature-branch`)
5. Create a Pull Request

## License
This project is licensed under the **MIT License**.

## Author
**Bhargava Ram Gottam** - [GitHub Profile](https://github.com/baargava)

