
const express = require("express");
const helmet = require("helmet");
const path = require("path");
const log = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const httpModule = require("http");
const passport = require("passport");
const session = require("express-session");
const flash = require("connect-flash");
const q = require("q");

require("module-alias/register");
require("dotenv").config();

const setting = require('./utils/setting');
const { LogProvider } = require('./shared/log_nohierarchy/log.provider');

const ManagementSocket = require('./app/management/socket.concern');
const BasicSocket = require('./app/basic/socket.concern');
const routerOffice = require('./app/office/routerProvider');
const routerManagement = require('./app/management/routerProvider');
const routerBasic = require('./app/basic/routerProvider');
const utilitiesTool = require('./app/utilities_tools/routerProvider');
const routerSetup = require('./app/setup/routerProvider');
const routerEducation = require('./app/education/routerProvider');

const { FacebookProvider } = require('./shared/passport/facebook.provider');
const { GoogleProvider } = require('./shared/passport/google.provider');
const { cronProvider } = require('./shared/job/cron/cron.provider');
var initResource = require('./shared/init').init;
const { FileConst } = require('./shared/file/file.const');
const { cronJobProvider } = require('./shared/cronjob/provider');

const { isMasterCluster } = require("./utils/util");
const { FirebaseProvider } = require("@shared/firebase/firebase.provider");

const app = express();

class Server {
    constructor() {
        this.initViewEngine();
        this.initExpressMiddleware();
        this.initResource().then(() => { this.initCronjob(); });
        this.initRouter();
        this.initStatusRouter();
        this.initJob();
        this.initFireBase();
        this.start();
    }

    start() {
        //const https = require('https');
        //const hostname = setting.hostname;
        //const options = {
        //    ca: fs.readFileSync('./SSL/devspo.com/ca_bundle.crt'),
        //    key: fs.readFileSync('./SSL/devspo.com/private.key'),
        //    cert: fs.readFileSync('./SSL/devspo.com/certificate.crt')
        //};
        //var server = https.createServer(options, app).listen(port, hostname, function () {
        //    logger.info("Server is listening port " + port);
        //});
        const http = httpModule.Server(app);
        var server = http.listen(setting.port, setting.hostname, function () {
            LogProvider.info(
                "Server is listening port " + setting.port,
                "server.start",
                "system",
                "startserver"
            );
        });
        server.setTimeout(45000);
        initResource.initIO(server);
        initResource.io.on("connection",function(socket){
            ManagementSocket(socket);
            BasicSocket(socket);
        });
        process.on('uncaughtException', err => {
            console.error('There was an uncaught error', err)
            process.exit(1) //mandatory (as per the Node.js docs)
          })
    }

    initViewEngine() {
        app.set('views', path.join(__dirname, 'views'));
        app.set('view engine', 'pug');
    }

    initJob() {
        cronProvider.closeExpireQnA();
    }

    initFireBase(){
        FirebaseProvider.initialize();
    }

    initExpressMiddleware() {

        app.set('trust proxy', 1);
        //  apply to all requests
        // const limiter = rateLimit({
        //     windowMs: setting.windowms,
        //     max: setting.maxRequestPerIp
        // });
        app.use(log('dev'));
        const corsOptions = {
            origin: ['http://localhost:3001', 'http://localhost:3005', 'https://vpdt.pnt.edu.vn', 'https://view.officeapps.live.com', 'https://vpdt-be.pnt.edu.vn'],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        };
        
        app.use(cors(corsOptions));
        app.use(
            helmet.contentSecurityPolicy({
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'self'"],
                    frameAncestors: ["'self'", "http://localhost:3001", 'http://localhost:3005', "https://vpdt.pnt.edu.vn", "https://view.officeapps.live.com", "https://vpdt-be.pnt.edu.vn", "https://vpdt.pnt.edu.vn"]
                }
            })
        );

        app.use(bodyParser.json({ limit: '10mb' }));
        app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
        app.use(session({
            secret: setting.secretSession,
            saveUninitialized: true,
            resave: true
        }));

        app.use(passport.initialize());
        app.use(flash());
        FacebookProvider.set(passport, function (accessToken, refreshToken, profile) {
   
        });


    }

    initRouter() {
        const FILES_DIR = FileConst.pathLocal;
        app.use('/files', express.static(FILES_DIR));
        app.get('/files/:filename', (req, res) => {
            const filePath = path.join(FILES_DIR, req.params.filename);
            res.sendFile(filePath);
        });
        app.use('/fileDownload', express.static(FILES_DIR));
        app.get('/fileDownload/:filename', (req, res) => {
            const filePath = path.join(FILES_DIR, req.params.filename);
            res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
            res.download(filePath);
        });
        for (var i in routerOffice) {
            app.use(routerOffice[i].path, routerOffice[i].router);
        }

        for (var i in routerManagement) {
            app.use(routerManagement[i].path, routerManagement[i].router);
        }
        for (var i in routerBasic) {
            app.use(routerBasic[i].path, routerBasic[i].router);
        }
        for (var i in utilitiesTool) {
            app.use(utilitiesTool[i].path, utilitiesTool[i].router);
        }
        for (var i in routerSetup) {
            app.use(routerSetup[i].path, routerSetup[i].router);
        }
        for (var i in routerEducation) {
            app.use(routerEducation[i].path, routerEducation[i].router);
        }
    }

    initResource() {
        // initResource.initIO();
        return q.all([
            initResource.initMongoDB(),
            initResource.initRedis(),
        ]);
    }

    initStatusRouter() {
        app.use(function (req, res, next) {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });

        if (app.get('env') === 'development') {
            app.use(function (err, req, res, next) {
                res.status(err.status || 500);
                res.render('error', {
                    message: err.message,
                    error: err
                });
            });
        }

        // production error handler
        // no stacktraces leaked to user
        app.use(function (err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: {}
            });
        });
    }

    initCronjob() {
        if (process.env.DISABLE_CRON_JOB === "true") {
            console.log("Cronjob is disabled");
            return;
        }
        if (isMasterCluster()) {
            cronJobProvider.initializeJobs();
        } else {
            console.log("Cronjob is disabled for worker");
        }
    }

}

new Server();










