# Understanding `data-api-url`

## What is `data-api-url`?

The `data-api-url` attribute tells the chatbot widget **where to send API requests** (chat messages, context requests, etc.).

## How it works:

1. **Widget Script** loads from:
   ```
   http://16.16.128.91:3001/public/chatbot-widget.js
   ```
   (This is the JavaScript code for the widget)

2. **API Calls** go to:
   ```
   http://16.16.128.91:3001/api/chat/chat
   http://16.16.128.91:3001/api/chat/context
   ```
   (These use the `data-api-url` as the base URL)

## Example:

```html
<script src="http://16.16.128.91:3001/public/chatbot-widget.js"
        data-api-url="http://16.16.128.91:3001/api"
        data-config='{"theme": "light"}'></script>
```

- Widget script: `http://16.16.128.91:3001/public/chatbot-widget.js`
- API base: `http://16.16.128.91:3001/api`
- When user sends message → widget calls: `http://16.16.128.91:3001/api/chat/chat`

## Why separate?

- Widget script can be cached by CDN
- API URL can point to different server if needed
- More flexible deployment

