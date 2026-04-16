# FROM mcr.microsoft.com/azure-databases/data-api-builder:latest
# COPY dab-config.json /App/dab-config.json
#FROM mcr.microsoft.com/azure-databases/data-api-builder:latest
#WORKDIR /app
#COPY dab-config.json ./dab-config.json
#EXPOSE 5000
#CMD ["dab", "start", "--config", "dab-config.json", "--host-mode", "production"]

FROM dataapi/builder:1.7.93
WORKDIR /app
COPY dab-config.json ./dab-config.json
EXPOSE 5000
CMD ["dab", "start", "--config", "dab-config.json", "--host-mode", "production"]