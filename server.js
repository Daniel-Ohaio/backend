const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.txt');
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { ...CORS_HEADERS, 'Content-Type': type });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}
const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  // Предварительный запрос браузера
  if (req.method === 'OPTIONS') {
    return send(res, 204, '');
  }
  // сохранение текста в data.txt
  if (pathname === '/api/data' && req.method === 'POST') {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      let text = '';
      try {
        text = String(JSON.parse(raw).text || '').trim();
      } catch (e) {}
      if (!text) {
        return send(res, 400, { error: 'Пустое сообщение' });
      }
      fs.appendFile(DATA_FILE, text + '\n', 'utf8', (err) => {
        if (err) {
          return send(res, 500, { error: 'Не удалось сохранить данные' });
        }
        console.log('Получено и сохранено в data.txt:', text);
        send(res, 200, { status: 'ok', saved: text });
      });
    });
    return;
  }

  // возвращаем содержимое data.txt
  if (pathname === '/api/data' && req.method === 'GET') {
    fs.readFile(DATA_FILE, 'utf8', (err, content) => {
      if (err && err.code !== 'ENOENT') {
        return send(res, 500, 'Не удалось прочитать data.txt', 'text/plain; charset=utf-8');
      }
      console.log('Запрос на чтение data.txt. Содержимое отправлено');
      send(res, 200, err ? '' : content, 'text/plain; charset=utf-8');
    });
    return;
  }
  send(res, 404, { error: 'Маршрут не найден' });

});
server.listen(PORT, () => {
  console.log(`Backend v2.0 запущен: http://localhost:${PORT}`);
});