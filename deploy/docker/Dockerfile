FROM nginx:1.27-alpine

COPY deploy/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend /usr/share/nginx/html
COPY assets /usr/share/nginx/html/assets
COPY content /usr/share/nginx/html/content

EXPOSE 80
