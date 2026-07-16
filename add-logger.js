/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const apps = ['washly-customer', 'washly-cleaner', 'washly-admin'];
const baseDir = 'c:/Users/test/Downloads/workspace-f42';

const errorLogger = `
    <script>
      window.onerror = function(msg, url, line, col, error) {
        var errDiv = document.createElement('div');
        errDiv.style.position = 'fixed';
        errDiv.style.top = '0';
        errDiv.style.left = '0';
        errDiv.style.right = '0';
        errDiv.style.background = 'red';
        errDiv.style.color = 'white';
        errDiv.style.padding = '20px';
        errDiv.style.zIndex = '999999';
        errDiv.style.wordWrap = 'break-word';
        errDiv.innerHTML = '<b>Error:</b> ' + msg + '<br><b>Line:</b> ' + line + '<br><b>URL:</b> ' + url;
        document.body.appendChild(errDiv);
        return false;
      };
      window.addEventListener('unhandledrejection', function(event) {
        var errDiv = document.createElement('div');
        errDiv.style.position = 'fixed';
        errDiv.style.bottom = '0';
        errDiv.style.left = '0';
        errDiv.style.right = '0';
        errDiv.style.background = 'orange';
        errDiv.style.color = 'black';
        errDiv.style.padding = '20px';
        errDiv.style.zIndex = '999999';
        errDiv.style.wordWrap = 'break-word';
        errDiv.innerHTML = '<b>Promise Error:</b> ' + (event.reason ? event.reason.toString() : 'Unknown');
        document.body.appendChild(errDiv);
      });
    </script>
`;

apps.forEach(app => {
  const indexPath = path.join(baseDir, app, 'index.html');
  let content = fs.readFileSync(indexPath, 'utf-8');
  if (!content.includes('window.onerror')) {
    content = content.replace('<body>', '<body>' + errorLogger);
    fs.writeFileSync(indexPath, content, 'utf-8');
    console.log('Added error logger to ' + app);
  } else {
    console.log('Error logger already exists in ' + app);
  }
});
