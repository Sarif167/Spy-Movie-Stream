# Node.js ka official lightweight image use kar rahe hain
FROM node:22-alpine

# App ke liye working directory set kar rahe hain
WORKDIR /app

# Pehle package.json aur package-lock.json copy karenge taaki dependencies install ho sakein
COPY package*.json ./

# Saari zaroori dependencies (jaise axios, express, etc.) install kar rahe hain
RUN npm install

# Baaki ka saara project code container me copy kar rahe hain
COPY . .

# App kis port par chalegi uska port expose kar rahe hain
EXPOSE 3000

# App ko start karne ki command
CMD ["node", "index.js"]
