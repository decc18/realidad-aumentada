# Guía de Despliegue en Netlify

## Pasos para desplegar en Netlify:

1. **Ir a https://netlify.com y crear una cuenta gratuita**

2. **Opción A - Drag & Drop (más simple):**
   - En el dashboard de Netlify, busca la zona "Want to deploy a new site without connecting to Git?"
   - Arrastra la carpeta completa del proyecto a esa zona
   - ¡Listo! Tu sitio estará en línea en unos segundos

3. **Opción B - Con Git (recomendado):**
   - Sube tu proyecto a GitHub
   - En Netlify: "New site from Git" → selecciona tu repositorio
   - Build settings: deja todo en blanco (es un sitio estático)
   - Click "Deploy site"

## Configuración adicional para PWA:

Netlify detectará automáticamente que es una PWA y configurará HTTPS (requerido para AR).

## URL resultante:
Tu sitio estará disponible en: `https://[nombre-random].netlify.app`

Puedes cambiar el nombre en Site settings → Change site name
