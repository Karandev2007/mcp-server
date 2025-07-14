# News & Weather MCP

MCP tool server that fetches latest news from external API based on country and weather data too based on given city name.

NPM Package: [news-weather-mcp](https://www.npmjs.com/package/news-weather-mcp)

---

### Setup:

1. **Install NPM Package**

   ```bash
   npm install -g news-weather-mcp
   ```

2. **Add your API key in `index.js`**

3. **Claude MCP Config**

   ```json
   {
     "mcpServers": {
       "news-weather": {
         "command": "node",
         "args": [
           "C:\\Users\\user\\AppData\\Roaming\\npm\\node_modules\\news-weather-mcp\\index.js"
         ],
         "transport": "stdio"
       }
     }
   }
   ```
Replace `user` with your own

---

### Run Locally

Start your tool with:

```bash
npx @modelcontextprotocol/inspector node index.js
```

---

Made with ❤️ by [Karan](https://github.com/Karandev2007)