#!/usr/bin/env node
/**
 * Simple HTTP Server for Testing Chatbot Widget
 * 
 * Usage: node serve-test-page.js
 * Then open: http://localhost:8000/test-widget.html
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8000;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Remove query string
  let filePath = '.' + req.url.split('?')[0];
  
  // Default to test-widget.html
  if (filePath === './' || filePath === './index.html') {
    filePath = './test-widget.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('\n🚀 Test Server Running!');
  console.log('═══════════════════════════════════════════');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📄 Test Page: http://localhost:${PORT}/test-widget.html`);
  console.log('═══════════════════════════════════════════\n');
  console.log('Open the URL above in your browser to test the chatbot widget!');
  console.log('Press Ctrl+C to stop the server.\n');
});

