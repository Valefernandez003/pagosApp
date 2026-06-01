# Deploy del Bot de WhatsApp en una nueva VM

## 1. Conectarse a la VM

```bash
ssh usuario@IP_VM
```

---

## 2. Instalar Node.js

Verificar:

```bash
node -v
npm -v
```

Si no está instalado:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 3. Instalar dependencias del sistema

```bash
sudo apt update

sudo apt install -y \
git \
wget \
curl \
ca-certificates \
fonts-liberation \
libatk-bridge2.0-0 \
libatk1.0-0 \
libc6 \
libcairo2 \
libcups2 \
libdbus-1-3 \
libexpat1 \
libfontconfig1 \
libgbm1 \
libgcc1 \
libglib2.0-0 \
libgtk-3-0 \
libnspr4 \
libnss3 \
libpango-1.0-0 \
libpangocairo-1.0-0 \
libstdc++6 \
libx11-6 \
libx11-xcb1 \
libxcb1 \
libxcomposite1 \
libxcursor1 \
libxdamage1 \
libxext6 \
libxfixes3 \
libxi6 \
libxrandr2 \
libxrender1 \
libxss1 \
libxtst6 \
lsb-release \
xdg-utils
```

---

## 4. Instalar PM2

```bash
sudo npm install -g pm2
```

Verificar:

```bash
pm2 -v
```

---

## 5. Clonar el proyecto

```bash
git clone URL_DEL_REPO pagosApp

cd pagosApp
```

---

## 6. Instalar dependencias Node

```bash
npm install
```

---

## 7. Crear archivo .env

Ejemplo:

```env
SPREADSHEET_ID=ID_DE_LA_HOJA
GOOGLE_APPLICATION_CREDENTIALS=src/config/google-vision-key.json
PORT=3000
SHEET_NAME=pagos
```

---

## 8. Copiar credenciales Google

Crear:

```bash
mkdir -p src/config
```

Copiar:

```text
src/config/google-vision-key.json
```

Este archivo debe ser el JSON de la cuenta de servicio que tiene acceso a:

* Google Sheets
* Google Vision API

---

## 9. Compartir la hoja de cálculo

Abrir la hoja y compartir con:

```text
client_email
```

que aparece dentro de:

```json
{
  "client_email": "xxxxx@xxxxx.iam.gserviceaccount.com"
}
```

Permiso:

```text
Editor
```

---

## 10. Iniciar el bot

```bash
pm2 start src/app.js --name pagos-bot
```

Ver logs:

```bash
pm2 logs pagos-bot
```

---

## 11. Vincular WhatsApp

Esperar QR:

```bash
pm2 logs pagos-bot
```

Escanear desde:

```text
WhatsApp
- Dispositivos vinculados
- Vincular dispositivo
```

---

## 12. Guardar configuración PM2

```bash
pm2 save
```

---

## 13. Configurar inicio automático

Ejecutar:

```bash
pm2 startup
```

Copiar y ejecutar el comando que PM2 muestre.

Luego:

```bash
pm2 save
```

---

## 14. Comandos útiles

Ver estado:

```bash
pm2 list
```

Ver logs:

```bash
pm2 logs pagos-bot
```

Reiniciar:

```bash
pm2 restart pagos-bot
```

Reiniciar leyendo cambios de .env:

```bash
pm2 restart pagos-bot --update-env
```

Detener:

```bash
pm2 stop pagos-bot
```

Eliminar:

```bash
pm2 delete pagos-bot
```

---

## 15. Cambiar de número WhatsApp

Cerrar sesión desde el teléfono actual.

Si no aparece un QR nuevo:

```bash
rm -rf .wwebjs_auth
pm2 restart pagos-bot
```

Escanear nuevamente con el nuevo número.

---

## 16. Archivos críticos que deben respaldarse

```text
.env
src/config/google-vision-key.json
```

Sin estos archivos no funcionarán:

* Google Sheets
* Google Vision OCR
* Registro de pagos
