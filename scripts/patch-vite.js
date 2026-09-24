import fs from 'fs';
import path from 'path';

try {
  const clientPath = path.resolve('node_modules/vite/dist/client/client.mjs');
  if (fs.existsSync(clientPath)) {
    let content = fs.readFileSync(clientPath, 'utf-8');
    let modified = false;

    if (content.includes('ws.send(JSON.stringify(data));')) {
      content = content.replace(
        'ws.send(JSON.stringify(data));',
        'if (ws && typeof ws.send === "function") { try { ws.send(JSON.stringify(data)); } catch {} }'
      );
      modified = true;
    }

    if (content.includes('this.logger.error(err);') && !content.includes('if (err && String(err).includes("send")) return;')) {
      content = content.replace(
        'this.transport.send(payload).catch((err) => {\n      this.logger.error(err);',
        'this.transport.send(payload).catch((err) => {\n      if (err && String(err).includes("send")) return;\n      this.logger.error(err);'
      );
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(clientPath, content, 'utf-8');
      console.log('Successfully patched Vite client for iFrame development.');
    }
  }
} catch (e) {
  // Ignore patch failures
}
