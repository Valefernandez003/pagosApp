WhatsApp Payment Bot

  Aplicación en Node.js que automatiza el registro de pagos de clientes recibidos por WhatsApp y los almacena de forma ordenada en una hoja de cálculo (Google Sheets).

  El sistema detecta mensajes con palabras clave o comprobantes de pago, extrae la información relevante (monto, usuario, fecha) y genera un registro automático con confirmación.

1 Características
  Detección automática de mensajes de pago por palabras clave
  Soporte de comprobantes en imagen (OCR con Tesseract)
  Registro automático en Google Sheets
  Captura de nombre y número del cliente desde WhatsApp
  Formateo automático de fecha del mensaje
  Extracción inteligente del monto del pago
  Alerta automática: “Comprobante recibido”
  Procesamiento en tiempo real
  
3 Cómo funciona
  El bot escucha mensajes de WhatsApp
  Detecta si el mensaje contiene palabras clave de pago o una imagen de comprobante
Si es imagen:
  Aplica OCR para detectar si es un comprobante
  avisa que se detectó un comprobante para evitar errores de carga automáticos
Si es texto:
  Analiza el contenido y extrae el monto
  Guarda los datos en Google Sheets
  Envía confirmación de registro

4 Tecnologías usadas
  Node.js
  whatsapp-web.js
  Tesseract.js (OCR)
  Sharp (procesamiento de imágenes)
  Google Sheets API
  JavaScript (ES6+)