# Imagen base con Nginx
FROM nginx:alpine

# Elimina la configuración por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia los archivos generados del build al contenedor
COPY dist/mainfrontend/ /usr/share/nginx/html

# Expone el puerto 80
EXPOSE 80

# Mantiene Nginx corriendo
CMD ["nginx", "-g", "daemon off;"]
