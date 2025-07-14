# Imagen base con NGINX
FROM nginx:alpine

# Elimina archivos por defecto
RUN rm -rf /usr/share/nginx/html/*

# Copia tu app Angular ya compilada
COPY dist/mainfrontend/browser/ /usr/share/nginx/html


# Copia configuración personalizada de NGINX (para SPA)
COPY nginx.conf /etc/nginx/nginx.conf

# Puerto que Cloud Run necesita
EXPOSE 8080

# Mantiene NGINX corriendo
CMD ["nginx", "-g", "daemon off;"]
