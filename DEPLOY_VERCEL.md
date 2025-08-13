# Guía de Despliegue en Vercel

## Pasos para desplegar en Vercel:

1. **Ir a https://vercel.com y crear una cuenta gratuita**

2. **Instalar Vercel CLI (opcional):**
   ```bash
   npm i -g vercel
   ```

3. **Opción A - Desde la web:**
   - Click "New Project"
   - Importar desde Git (GitHub, GitLab, Bitbucket)
   - Seleccionar tu repositorio
   - Click "Deploy"

4. **Opción B - Desde la terminal:**
   ```bash
   cd "c:\Respaldo\Proyecto NFC\RealidadAumentada"
   vercel
   ```
   - Seguir las instrucciones en pantalla

## Configuración automática:
- Vercel detecta que es un sitio estático
- Configura HTTPS automáticamente
- CDN global incluido

## URL resultante:
Tu sitio estará en: `https://[nombre-proyecto].vercel.app`
