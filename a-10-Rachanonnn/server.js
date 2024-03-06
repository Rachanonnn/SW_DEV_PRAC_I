const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const {xss} = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

//Route files
const hospitals = require('./routes/hospitals');
const auth = require('./routes/auth');
const appointments = require('./routes/appointments');


//Load env vars
dotenv.config({path:'./config/config.env'});

//Connect to database 
connectDB();

const app = express();
  
//Swagger
const swaggerOptions = {
    swaggerDefinition: {
      openapi: '3.0.0', // OpenAPI version
      info: {
        title: 'Library API', // Title of your API
        version: '1.0.0', // API version
        description: 'A simple Express VacQ API', // Description of your API
      },
      servers: [
        {
          url: 'http://localhost:5000/api/v1', // Server URL
        },
      ],
    },
    apis: ['./routes/*.js'], // Paths to your API routes
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

//Body parser
app.use(express.json());

    //Prevent XSS attacks
app.use(xss());

    //Sanitize data
app.use(mongoSanitize());

    //Set security headers
app.use(helmet());

    //Cookie parser
app.use(cookieParser());

    //Rate Limiting
const limiter = rateLimit({
    windowsMs: 10*60*1000, //10 mins
    max: 100
});
app.use(limiter);

    //Prevent http param polutions
app.use(hpp());

    //Enable CORS
app.use(cors());

app.use('/api/v1/hospitals', hospitals);
app.use('/api/v1/auth', auth);
app.use('/api/v1/appointments', appointments);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, console.log('Server running in ', process.env.NODE_ENV, ' mode on port ', PORT));

//Handle unhandled promise rejections
process.on('unhandledRejection',(err,promise) => {
    console.log(`Error: ${err.message}`);
    //Close server & exit process
    server.close(()=>process.exit(1));
});