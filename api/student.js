const express = require('express');
const router = express.Router();

// moment to format date
const moment = require('moment')

// Mongodb student model
const student = require('../models/student');

// Mongodb newsletter model
const newsletter = require('../models/newsletter');

// Mongodb admin model
const admin = require('../models/admin');

// Mongodb messages model
const messages = require('../models/messages');

// Mongodb student Verification model
const studentVerification = require('../models/studentVerification');

// Mongodb reset password model
const resetPassword = require('../models/resetPassword');

// Mongodb available courses model
const aCourse = require('../models/availableCourse');

// Mongodb applied courses model
const appliedCourse = require('../models/appliedCourse');

// Mongodb activity model
const activity = require('../models/activity');

// email handler
const nodemailer = require('nodemailer');

// Multer
const multer = require('multer');

// Generates random 8-digit number
const regNum = () => {
    return Math.floor(Math.random()*100000000)
}

// unique string
const { v4: uuidv4 } = require('uuid');

// env variables
require('dotenv').config();

// Password handler
const bcrypt = require('bcryptjs');

// Path for static verified page
const path = require('path');

// Flash
const flash = require('connect-flash');

// Define storage for the images
const storage = multer.diskStorage({
    // destimation for files
    destination: function(request, file, callback){
        callback(null, './public/assets/images/uploads')
    },

    // Add back the extension
    filename: function(request, file, callback){
        callback(null, Date.now() + file.originalname)
    }
})

// Upload parameters for multer
const upload = multer({
    storage: storage,
    limits: {
        fieldSize: 1024 * 1024 * 5
    }
})

router.get('/', (req, res) => {
    res.render('index', {
        success: req.flash('success'),
        warning: req.flash('warning'),
        error: req.flash('error')
    })
})

router.get('/index', (req, res) => {
    res.render('index', {
        success: req.flash('success'),
        warning: req.flash('warning'),
        error: req.flash('error')
    })
})

router.get('/aboutus', (req, res) => {
    res.render('aboutus', {
        success: req.flash('success'),
        warning: req.flash('warning'),
        error: req.flash('error')
    })
})

router.get('/contact', (req, res) => {
    res.render('contact', {
        success: req.flash('success'),
        warning: req.flash('warning'),
        error: req.flash('error')
    })
})

router.get('/blog', (req, res) => {
    res.render('blog', {
        success: req.flash('success'),
        warning: req.flash('warning'),
        error: req.flash('error')
    })
})

router.get('/sign', (req, res) => {
    res.render('sign', {
        success: req.flash('success'),
        warning: req.flash('warning'),
        error: req.flash('error')
    })
})

router.get('/app-course', (req, res) => {
    res.render('app-course', {
        success: req.flash('success'),
        warning: req.flash('warning'),
        error: req.flash('error')
    })
})

router.get('/single-post', (req, res) => {
    res.render('single-post', {
        success: req.flash('success'),
        warning: req.flash('warning'),
        error: req.flash('error')
    })
})

router.get('/forgotpassword', (req, res) => {
    res.render('forgotpassword', {
        success: req.flash('success'),
        warning: req.flash('warning'),
        error: req.flash('error')
    })
})

// nodemailer transporter
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS
    }
})

// // Testing nodemailer success
// transporter.verify((error, success) => {
//     if (error) {
//         console.log(error);
//     } else {
//         console.log("Ready for messages");
//         console.log(success);
//     }
// })

// Allow access to our API
router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested, Content-Type, Accept, Authorization");
    next()
})

// Signup
router.post('/signup', (req, res) => {
    let { name, email, password, confirmpassword } = req.body;

    if (!/^[a-zA-Z ]{15,100}\s*$/.test(name)) {
        req.flash('warning', 'Invalid name')
        res.redirect('/sign')
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        req.flash('warning', 'Invalid email')
        res.redirect('/sign')
    } else if (password !== confirmpassword) {
        req.flash('warning', 'Passwords does not match')
        res.redirect('/sign')
    } else {
        // Checks if student already existed
        student.find({email}).then(result => {
            if(result.length) {
                // A student already exists
                req.flash('error', 'You have an account already. Please proceed to login into your account')
                res.redirect('/sign')
            } else {
                // Create new student

                // Password handling
                const saltRounds = 10;
                bcrypt.hash(password, saltRounds).then(hashedPassword => {
                    const newStudent = new student({
                        name: name,
                        email: email,
                        image: "",
                        occupation: "",
                        telephone: "",
                        address: "",
                        city: "",
                        state: "",
                        postcode: "",
                        linkedIn: "",
                        facebook: "",
                        twitter: "",
                        instagram: "",
                        password: hashedPassword,
                        verified: false
                    });

                    newStudent.save().then(result => {
                        // Handles Student verification
                        sendVerificationEmail(result, req, res);
                    })
                    .catch(err => {
                        req.flash('error', 'Something went wrong! Could not save user.')
                        res.redirect('/sign')
                    })
                })
                .catch(err => {
                    req.flash('error', 'Something went wrong!')
                    res.redirect('/sign')
                })
            }
        }).catch(err => {
            req.flash('error', 'Something went wrong!')
            res.redirect('/sign')
        })
    }
})

// Send verification email
const sendVerificationEmail = ({_id, email}, req, res) => {
    // Url to be used in the email
    const currentUrl = 'http://localhost:5000/';

    const uniqueString = uuidv4() + _id;

    // mail options
    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Email Verification",
        html: `<p>Verify your email address to complete the signup and log into your account</p><p>This link <strong>expires in 6 hours</strong>.</p><p>Click <a href=${currentUrl + "verify/" + _id + "/" + uniqueString}>here</a> to proceed</p>`,
    };

    // hash the uniqueString
    const saltRounds = 10;
    bcrypt
     .hash(uniqueString, saltRounds)
     .then((hashedUniqueString) => {
        //  create data in studentVerification collection
        const newVerification = new studentVerification({
            userId: _id,
            uniqueString: hashedUniqueString,
            createdAt: Date.now(),
            expiresAt: Date.now() + 21600000
        });

        newVerification
         .save()
         .then(() => {
             transporter
              .sendMail(mailOptions)
              .then(() => {
                //   Email sent and verification record saved
                req.flash('success', 'A verification link has been sent to your email. Please check your inbox')
                res.redirect('/sign')
              })
              .catch(() => {
                    req.flash('error', 'Something went wrong verification could not be sent')
                    res.redirect('/sign')
              })
         })
         .catch((error) => {
            console.log(error);
            req.flash('error', 'something went wrong')
            res.redirect('/sign')
         })
     })
     .catch(() => {
        req.flash('error', 'something went wrong')
        res.redirect('/sign')
     })
}

// Reset password
router.post('/forgotpassword', (req, res) => {
    let { email } = req.body;

    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        req.flash('warning', 'Invalid email')
        res.redirect('/sign')
    } else {
        // check if email exists
        student.findOne({email})
        .then(result => {
            if(!result) {
                // Email does not exist
                req.flash('error', 'You do not have an account, proceed to sign up')
                res.redirect('/sign')
            } else {
                // Handles password reset
                sendPasswordResetLink(result, req, res);
            }
        })
        .catch(err => {
            req.flash('error', 'Something went wrong!')
            res.redirect('/sign')
        })

    }
})

// Send password link
const sendPasswordResetLink = ({_id, email}, req, res) => {
    // Url to be used in the email
    const currentUrl = 'http://localhost:5000/';

    const uniqueString = uuidv4() + _id;

    // mail options
    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Reset Password",
        html: `<p>This email was sent to you in request to change your password. If this was not sent by you, please ignore.</p><p>This link <strong>expires in 5 mins</strong>.</p><p>Click <a href=${currentUrl + "resetpassword?q=" + _id + "&u=" + uniqueString + "&e=" + email}>here</a> to proceed</p>`,
    };

    // hash the uniqueString
    const saltRounds = 10;
    bcrypt
     .hash(uniqueString, saltRounds)
     .then((hashedUniqueString) => {
        //  create data in resetPassword collection
        const newPassword = new resetPassword({
            userId: _id,
            uniqueString: hashedUniqueString,
            email: email,
            createdAt: Date.now(),
            expiresAt: Date.now() + 300000
        });

        newPassword
         .save()
         .then(() => {
             transporter
              .sendMail(mailOptions)
              .then(() => {
                //   Email sent and verification record saved
                const newActivity = new activity({
                    userId: _id,
                    email: email,
                    message: "You requested for a reset password link.",
                    createdAt: Date.now()
                })

                newActivity.save().then().catch();
                req.flash('success', 'A reset password link has been sent to your email. Please check your inbox')
                res.redirect('/sign')
              })
              .catch(() => {
                    req.flash('error', 'Something went wrong, link could not be sent')
                    res.redirect('/sign')
              })
         })
         .catch((error) => {
            req.flash('error', 'something went wrong')
            res.redirect('/sign')
         })
     })
     .catch(() => {
        req.flash('error', 'something went wrong')
        res.redirect('/sign')
     })
};

// reset password
router.get('/resetpassword', (req, res) => {
    let userId = req.query.q;
    let uniqueString = req.query.u;
    let email = req.query.e;

    resetPassword.find({"userId": userId})
    .then((info) => {
        if(info.length > 0) {
            let expiresAt = info[0].expiresAt;
            let hashedUniqueString = info[0].uniqueString;

            // Checks for expired unique string
            if (expiresAt < Date.now()) {
                // password link has expired so we delete it
                resetPassword.findByIdAndDelete(userId)
                .then(() => {
                    req.flash('error', 'The reset password link has expired')
                    res.redirect('/sign')
                })
                .catch(() => {
                    req.flash('error', 'something went wrong, Click the link from your email again')
                    res.redirect('/sign')
                })
            } else {
                // valid student id exists so we validate the password unique string
                // First compare the hashed password unique string
                bcrypt.compare(uniqueString, hashedUniqueString)
                .then(result => {
                    if(result) {
                        res.render('changedpassword', {email})
                    } else {
                        req.flash('error', 'Invalid password verification link, Click the link from your email again NO RESULT')
                        res.redirect('/sign')
                    }
                })
                .catch (() => {
                    req.flash('error', 'something went wrong, Click the link from your email again HASH')
                    res.redirect('/sign')
                })
            }
        } else {
            req.flash('error', 'The reset password link has expired')
            res.redirect('/sign')
        }
    })
    .catch((err) => {
        req.flash('error', 'something went wrong, Click the link from your email again')
        res.redirect('/sign')
    })
})

router.post('/changedpasswordlink', (req, res) => {
    let { email, newpass, confpass } = req.body;

    // check email in password verification collection
    resetPassword.find({"email": email})
    .then((info) => {
        if(info.length > 0) {
            student.find({"email": email})
            .then((data) => {
                if(data.length > 0) {
                    let userId = data[0]._id;
                    bcrypt.hash(newpass, 10)
                    .then(hashedPassword => {
                        student.findByIdAndUpdate(userId, {password: hashedPassword})
                        .then(() => {
                            resetPassword.findOneAndDelete({"email": email})
                            .then(() => {
                                const newActivity = new activity({
                                    userId: userId,
                                    email: email,
                                    message: "Your password has been changed.",
                                    createdAt: Date.now()
                                })
                
                                newActivity.save().then().catch();
                                req.flash('success', 'password changed successfully. Proceed to login')
                                res.redirect('/sign')
                            })
                            .catch(() => {
                                req.flash('success', 'password changed successfully. Proceed to login NOT DELETED')
                                res.redirect('/sign')
                            })
                        })
                        .catch(err => {
                            req.flash('error', 'something went wrong')
                            res.redirect('/sign')
                        })
                    })
                    .catch(err => {
                        req.flash('error', 'something went wrong')
                        res.redirect('/sign')
                    })
                } else {
                    req.flash('error', 'something went wrong, request for a new password link')
                    res.redirect('/sign')
                }
            }) 
            .catch(err => {
                req.flash('error', 'something went wrong')
                res.redirect('/sign')
            })
        } else {
            req.flash('error', 'something went wrong, request for a new password link')
            res.redirect('/sign')
        }
    })
    .catch(err => {
        req.flash('error', 'something went wrong')
        res.redirect('/sign')
    })
})


// Verify email
router.get('/verify/:userId/:uniqueString', (req, res) => {
    let { userId, uniqueString } = req.params;

    studentVerification
     .findOne({userId})
     .then((result) => {
         if (result) {
            //  student verification record exist so we process

            const { expiresAt } = result;
            const hashedUniqueString = result.uniqueString;

            // Checks for expired unique string
            if (expiresAt < Date.now()) {
                // record has expired so we delete it
                studentVerification
                 .deleteOne({userId})
                 .then(result => {
                    student
                      .deleteOne({_id: userId})
                      .then(() => {
                        let message = "Link has expired. Please sign up again.";
                        // res.redirect("/verified");
                        res.redirect(`/verified?error=true&message=${message}`);
                      })
                      .catch((error) => {
                          console.log(error);
                          let message = "Clearing student with expired unique string failed";
                          res.redirect(`/verified?error=true&message=${message}`);
                      })
                 })
                 .catch((error) => {
                     console.log(error);
                     let message = "An error occured while clearing expired student verification record";
                     res.redirect(`/verified?error=true&message=${message}`);
                 })
            } else {
                // valid record exists so we validate the student string
                // First compare the hashed unique string

                bcrypt
                 .compare(uniqueString, hashedUniqueString)
                 .then(result => {
                     if (result) {
                        //  strings match

                        student
                         .updateOne({_id: userId}, {verified: true})
                         .then(() => {
                            studentVerification
                              .deleteOne({userId})
                              .then(() => {
                                  res.render('verified');
                              })
                              .catch((error) => {
                                  console.log(error);
                                  let message = "An error occured while while finalizing successful verification";
                                  res.redirect(`/verified?error=true&message=${message}`);
                              })
                         })
                         .catch((error) => {
                             console.log(error);
                             let message = "An error occured while while updating student record to show verified";
                             res.redirect(`/verified?error=true&message=${message}`);
                         })

                     } else {
                        //  existing record but incorrect verification details passed.
                        let message = "Invalid email verification link. Check your inbox";
                        res.redirect(`/verified?error=true&message=${message}`);
                     }
                 })
                 .catch((error) => {
                     console.log(error);
                     let message = "An error occured while comparing unique strings.";
                     res.redirect(`/verified?error=true&message=${message}`);
                 })
            }
         } else {
            //  student verification record doesn't exist
            let message = "Account record doesn't exist or has been verified already. Please sign up or log in";
            res.redirect(`/verified?error=true&message=${message}`);
         }
     })
     .catch((error) => {
         console.log(error);
        let message = "An error occured while checking for existing student verification record";
        res.redirect(`/verified?error=true&message=${message}`);
     })
});

// Verified page route
router.get('/verified', (req, res) => {
    res.render('verified');
})

// Login
router.post('/login', (req, res) => {
    if(req.body.rem) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
        
        let { email, password } = req.body;

        // Checks if student exists
        student.findOne({email})
        .then(data => {
            if (data) {
                // student exists

                // check if student is verified
                if (!data.verified) {
                    req.flash('error', 'Email has not been verified, check your email for the verification link')
                    res.redirect('/sign')
                } else {
                    const hashedPassword = data.password;
                    bcrypt.compare(password, hashedPassword).then(result => {
                        if (result) {
                            // Password matched
                            // Create a session and send userId
                            req.session.isAuth = true
                            const userId = data._id
                            res.redirect(`/dashboard/index?q=${userId}`)
                        } else {
                            req.flash('error', 'Invalid email or password')
                            res.redirect('/sign')
                        }
                    })
                    .catch(err => {
                        req.flash('error', 'Something went wrong')
                        res.redirect('/sign')
                    })
                }
            } else {
                req.flash('error', 'Invalid email or password')
                res.redirect('/sign')
            }
        })
        .catch(err => {
            req.flash('error', 'Something went wrong')
            res.redirect('/sign')
        })
    } else {
        let { email, password } = req.body;

        // Checks if student exists
        student.findOne({email})
        .then(data => {
            if (data) {
                // student exists

                // check if student is verified
                if (!data.verified) {
                    req.flash('error', 'Email has not been verified, check your email for the verification link')
                    res.redirect('/sign')
                } else {
                    const hashedPassword = data.password;
                    bcrypt.compare(password, hashedPassword).then(result => {
                        if (result) {
                            // Password matched
                            // Create a session and send userId
                            req.session.isAuth = true
                            const userId = data._id
                            res.redirect(`/dashboard/index?q=${userId}`)
                        } else {
                            req.flash('error', 'Invalid email or password')
                            res.redirect('/sign')
                        }
                    })
                    .catch(err => {
                        req.flash('error', 'Something went wrong')
                        res.redirect('/sign')
                    })
                }
            } else {
                req.flash('error', 'Invalid email or password')
                res.redirect('/sign')
            }
        })
        .catch(err => {
            req.flash('error', 'Something went wrong')
            res.redirect('/sign')
        })
    }
})

router.post('/newsletter', (req, res) => {
    let email = req.body.email;

    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        req.flash('warning', 'Invalid email')
        res.redirect('/')
    } else {
        // checks if email already existed
        newsletter.find({email}).then(result => {
            if(result.length) {
                // Email already exists
                req.flash('error', 'Email already exist!')
                res.redirect('/')
            } else {
                // save new email

                const newMail = new newsletter({
                    email: email
                });

                newMail.save().then(() => {
                    req.flash('success', 'Thank you for subscribing to our newsletter')
                    res.redirect('/')
                })
                .catch((error) => {
                    req.flash('error', 'Something went wrong')
                    res.redirect('/')
                })
            }
        }).catch(err => {
            console.log(err);
            res.redirect('/')
            req.flash('error', 'Something went wrong')
        })
    }
})

router.post('/messages', (req, res) => {
    let { name, email, message } = req.body;

    if (!/^[a-zA-Z ]{4,40}\s*$/.test(name)) {
        req.flash('warning', 'Invalid name')
        res.redirect('/contact')
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        req.flash('warning', 'Invalid email')
        res.redirect('/contact')
    } else if (!/^[a-zA-Z0-9., ]{20,20000}\s*$/.test(message)) {
        req.flash('warning', 'Message too short')
        res.redirect('/contact')
    } else {
        // save new message

        const newMessage = new messages({
            name: name,
            email: email,
            message: message,
            createdAt: Date.now()
        })

        newMessage.save().then(() => {
            const newActivity = new activity({
                userId: name,
                email: email,
                message: message,
                createdAt: Date.now()
            })

            newActivity.save().then().catch();
            req.flash('success', 'Thank you for your feedback, we will get in touch with you as soon as possible')
            res.redirect('/contact')
        })
        .catch((error) => {
            req.flash('error', 'Something went wrong')
            res.redirect('/contact')
        })
    }
})

// Checks if user is logged in
router.get('/dashboard/index', (req, res) => {
    let userId = req.query.q;
    if(req.session.isAuth) {
        student.findById((userId), async(err, students) => {
            let activities = await activity.find({"userId": userId}).sort({ createdAt: -1 }); 
            appliedCourse.find({"userId": userId}, (err, appCourses) => {
                res.render('dashboard/index', {
                    userId, 
                    students,
                    activities,
                    appCourses
                })
            })
        })
    } else {
        res.redirect('/sign')
    }
})

// Checks if user is logged in
router.get('/dashboard/user-profile', async (req, res) => {
    let userId = req.query.q;
    if(req.session.isAuth) {
        student.findById((userId), (err, students) => {
            res.render('dashboard/user-profile', { 
                students,
                success: req.flash('success'),
                warning: req.flash('warning'),
                error: req.flash('error')
            })
        })
    } else {
        res.redirect('/sign')
    }
})

router.post('/change-password', (req, res) => {
    let userId = req.query.q;
    let { oldpass, newpass, confpass } = req.body;
    if(req.session.isAuth) {
        student.findById(userId, (err, data) => {
            if(err) {
                req.flash('error', 'Something went wrong')
                res.redirect(`/dashboard/user-profile?q=${userId}`)
            } else {
                let hashedPassword = data.password;
                bcrypt.compare(oldpass, hashedPassword)
                .then(result => {
                    if(result) {
                        bcrypt.hash(newpass, 10)
                        .then(hashedPassword => {
                            student.findByIdAndUpdate(userId, { password: hashedPassword }, (err, data) => {
                                if (data) {
                                    const newActivity = new activity({
                                        userId: userId,
                                        email: data.email,
                                        message: "Your password has been updated.",
                                        createdAt: Date.now()
                                    })
                    
                                    newActivity.save().then().catch();
                                    req.flash('success', 'Password changed')
                                    res.redirect(`/dashboard/user-profile?q=${userId}`)
                                } else {
                                    req.flash('error', 'Something went wrong')
                                    res.redirect(`/dashboard/user-profile?q=${userId}`)
                                }
                            })
                        })
                        .catch(err => {
                            req.flash('error', 'Something went wrong')
                            res.redirect(`/dashboard/user-profile?q=${userId}`)
                        })
                    } else {
                        req.flash('error', 'Wrong password')
                        res.redirect(`/dashboard/user-profile?q=${userId}`)
                    }
                })
                .catch((error) => {
                    console.log(error);
                    req.flash('error', 'Something went wrong')
                    res.redirect(`/dashboard/user-profile?q=${userId}`)
                })
            }
        })
    } else {
        res.redirect('/sign')
    }
})

// Update profile
router.post('/update-profile', upload.single('image'), (req, res) => {
    let userId = req.query.q;
    let { name, email, occupation, telephone, address, city, state, postcode, linkedIn, facebook, twitter, instagram } = req.body;
    let image = req.file.filename;
    if(req.session.isAuth) {
        student.findByIdAndUpdate(userId, { name: name, email: email, image: image, occupation: occupation, telephone: telephone, address: address, city: city, state: state, postcode: postcode, linkedIn: linkedIn, facebook: facebook, twitter: twitter, instagram: instagram}, (err, data) => {
            if (data) {
                const newActivity = new activity({
                    userId: userId,
                    email: data.email,
                    message: "Your profile has been updated.",
                    createdAt: Date.now()
                })

                newActivity.save().then().catch();
                req.flash('success', 'Profile updated successfully')
                res.redirect(`/dashboard/user-profile?q=${userId}`)
            } else {
                req.flash('error', 'Something went wrong')
                res.redirect(`/dashboard/user-profile?q=${userId}`)
            }
        })
    } else {
        res.redirect('/sign')
    }
})

// Checks if user is logged in
router.get('/dashboard/mycourse', (req, res) => {
    const userId = req.query.q;
    if(req.query.c) {
        const courseId = req.query.c;
        if(req.session.isAuth) {
            student.findById((userId), (err, students) => {
                appliedCourse.find({"userId": userId}, (err, appCourses) => {
                    appliedCourse.findByIdAndDelete((courseId), (err, data) => {
                        appliedCourse.find({"userId": userId}, (err, appCourses) => {
                            const newActivity = new activity({
                                userId: userId,
                                email: students.email,
                                message: `You have cancelled ${data.courseName} course application.`,
                                createdAt: Date.now()
                            })
            
                            newActivity.save().then().catch();
                            req.flash('success', `You have cancelled ${data.courseName} course application.`)
                            res.render('dashboard/mycourse', {
                                userId, 
                                students, 
                                appCourses,
                                success: req.flash('success'),
                                warning: req.flash('warning'),
                                error: req.flash('error')
                            })
                        })
                    })
                })
            })
        } else {
            res.redirect('/sign')
        }
    } else {
        if(req.session.isAuth) {
            student.findById((userId), (err, students) => {
                appliedCourse.find({"userId": userId}, (err, appCourses) => {
                    res.render('dashboard/mycourse', {
                        userId, 
                        students, 
                        appCourses,
                        success: req.flash('success'),
                        warning: req.flash('warning'),
                        error: req.flash('error')
                    })
                })
            })
        } else {
            res.redirect('/sign')
        }
    }
})

// Checks if user is logged in
router.get('/dashboard/a-course', (req, res) => {
    const userId = req.query.q;
    if(req.query.c) {
        const courseId = req.query.c;
        if(req.session.isAuth) {
            student.findById((userId), (err, students) => {
                aCourse.find({}, (err, courses) => {
                    aCourse.findById((courseId), (err, appCourse) => {
                        appliedCourse.find({"courseId": courseId})
                        .then((info) => {
                            if(info.length > 0) {
                                req.flash('error', `You have applied for ${info[0].courseName}`)
                                res.render('dashboard/a-course', {
                                    userId, 
                                    students, 
                                    courses,
                                    appCourse,
                                    success: req.flash('success'),
                                    warning: req.flash('warning'),
                                    error: req.flash('error')
                                })
                            } else {
                                const newAppliedCourse = new appliedCourse({
                                    userId: userId,
                                    courseId: courseId,
                                    studentName: students.name,
                                    studentEmail: students.email,
                                    courseName: appCourse.name,
                                    courseRegNo: regNum(),
                                    courseImage: appCourse.image,
                                    tutorName: appCourse.tutorName,
                                    nCategories: appCourse.nCategories,
                                    lCategories: appCourse.lCategories,
                                    description: appCourse.description,
                                    whatsapp: appCourse.whatsapp,
                                    telegram: appCourse.telegram,
                                    createdAt: Date.now(),
                                    approved: false
                                })
                
                                newAppliedCourse.save().then(appliedCourses => {
                                    appliedCourse.find({"courseId": courseId}, (err, appCourses) => {
                                        const newActivity = new activity({
                                            userId: userId,
                                            email: students.email,
                                            message: `You have applied for ${appliedCourses.courseName} course application.`,
                                            createdAt: Date.now()
                                        })
                        
                                        newActivity.save().then().catch();
                                        req.flash('success', `You have applied for ${appCourses[0].courseName}`)
                                        res.render('dashboard/a-course', {
                                            userId, 
                                            students, 
                                            courses, 
                                            appliedCourses, 
                                            appCourse,
                                            appCourses,
                                            success: req.flash('success'),
                                            warning: req.flash('warning'),
                                            error: req.flash('error')
                                        })
                                    })
                                })
                                .catch((err) => {
                                    req.flash('error', 'Could not apply for course')
                                    res.render('dashboard/a-course', {userId, students, courses})
                                })
                            }
                        })
                        .catch(err => {
                            req.flash('error', 'something went wrong')
                            res.render('dashboard/a-course', {
                                userId, 
                                students, 
                                courses,                        appCourse,
                                success: req.flash('success'),
                                warning: req.flash('warning'),
                                error: req.flash('error')
                            })
                        })
                    })
                })
            })
        } else {
            res.redirect('/sign')
        }
        
    } else {
        if(req.session.isAuth) {
            student.findById((userId), (err, students) => {
                aCourse.find({}, (err, courses) => {
                    appliedCourse.find({"courseId": courses._id}, (err, appCourses) => {
                        res.render('dashboard/a-course', {
                            userId,
                            students,
                            courses,
                            appCourses,
                            success: req.flash('success'),
                            warning: req.flash('warning'),
                            error: req.flash('error')
                        })
                    })
                })
            })
        } else {
            res.redirect('/sign')
        }
    }
})

router.get('/dashboard/course-detail', (req, res) => {
    const userId = req.query.q;
    const appCourseId = req.query.c;
    if(req.session.isAuth) {
        student.findById((userId), (err, students) => {
            appliedCourse.findById((appCourseId), (err, appCourseDetail) => {
                res.render('dashboard/course-detail', {
                    userId,
                    students,
                    appCourseDetail,
                    success: req.flash('success'),
                    warning: req.flash('warning'),
                    error: req.flash('error')
                })
            })
        })
    } else {
        res.redirect('/sign')
    }
})

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/sign')
})



// ADMIN SECTION


router.get('/admin', (req, res) => {
    res.render('admin/login', {
        success: req.flash('success'),
        warning: req.flash('warning'),
        error: req.flash('error')
    })
})

router.post('/signin', (req, res) => {
    if(req.body.rem) {
        console.log(req.body.rem);
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;

        let { email, password } = req.body;

        admin.findOne({email})
        .then(data => {
            if (data) {
                const hashedPassword = data.password;
                bcrypt.compare(password, hashedPassword).then(result => {
                    if (result) {
                        // Password matched
                        // Create a session and send userId
                        req.session.isAuth = true
                        const userId = data._id
                        res.redirect(`/admin/index?q=${userId}`)
                    } else {
                        req.flash('error', 'Invalid email or password')
                        res.redirect('/admin')
                    }
                })
                .catch(err => {
                    req.flash('error', 'Something went wrong')
                    res.redirect('/admin')
                })
            } else {
                req.flash('error', 'Invalid email or password')
                res.redirect('/admin')
            }
        })
        .catch(err => {
            req.flash('error', 'Something went wrong')
            res.redirect('/admin')
        })
    } else {
        let { email, password } = req.body;

        admin.findOne({email})
        .then(data => {
            if (data) {
                const hashedPassword = data.password;
                bcrypt.compare(password, hashedPassword).then(result => {
                    if (result) {
                        // Password matched
                        // Create a session and send userId
                        req.session.isAuth = true
                        const userId = data._id
                        res.redirect(`/admin/index?q=${userId}`)
                    } else {
                        req.flash('error', 'Invalid email or password')
                        res.redirect('/admin')
                    }
                })
                .catch(err => {
                    req.flash('error', 'Something went wrong')
                    res.redirect('/admin')
                })
            } else {
                req.flash('error', 'Invalid email or password')
                res.redirect('/admin')
            }
        })
        .catch(err => {
            req.flash('error', 'Something went wrong')
            res.redirect('/admin')
        })
    }
})


router.get('/admin/index', (req, res) => {
    let adminId = req.query.q;
    if(req.session.isAuth) {
        admin.findById((adminId), async(err, admin) => {
            let activities = await activity.find({}).sort({createdAt: -1});
            appliedCourse.find({}, (err, appCourses) => {
                res.render('admin/index', {
                    adminId,
                    admin,
                    activities,
                    appCourses,
                    success: req.flash('success'),
                    warning: req.flash('warning'),
                    error: req.flash('error')
                })
            })
        })
    } else {
        res.redirect('/admin')
    }
})

router.get('/admin/addcourse', (req, res) => {
    let adminId = req.query.q;
    if(req.session.isAuth) {
        admin.findById((adminId), (err, admin) => {
            res.render('admin/addcourse', {
                adminId,
                admin,
                success: req.flash('success'),
                warning: req.flash('warning'),
                error: req.flash('error')
            })
        })
    } else {
        res.redirect('/admin')
    }
})

router.post('/addacourse', upload.single('image'), (req, res) => {
    let adminId = req.query.q;
    if(req.session.isAuth) {
        let { name, tutorName, nCategories, lCategories, description, whatsapp, telegram } = req.body;
        let image = req.file.filename;
        aCourse.find({"name": name})
        .then((info) => {
            if(info.length > 0) {
                req.flash('error', 'Course already exist')
                res.redirect(`/admin/addcourse?q=${adminId}`)
            } else {
                const newCourse = new aCourse({
                    "image": image,
                    "name": name,
                    "tutorName": tutorName,
                    "nCategories": nCategories,
                    "lCategories": lCategories,
                    "description": description,
                    "whatsapp": whatsapp,
                    "telegram": telegram
                })

                newCourse.save()
                .then(() => {
                    req.flash('success', `${name} course has been added successfully`)
                    res.redirect(`/admin/addcourse?q=${adminId}`)
                })
                .catch(err => {
                    console.log(err);
                    req.flash('error', 'Could not add course')
                    res.redirect(`/admin/addcourse?q=${adminId}`)
                })
            }
        })
        .catch((err) => {
            console.log(err);
            req.flash('error', 'something went wrong')
            res.redirect(`/admin/addcourse?q=${adminId}`)
        })
    } else {
        res.redirect('/admin')
    }
})

router.get('/admin/editcourse', (req, res) => {
    let adminId = req.query.q;
    let courseId = req.query.c;
    if(req.session.isAuth) {
        admin.findById((adminId), (err, admin) => {
            aCourse.findById((courseId), (err, course) => {
                res.render('admin/editcourse', {
                    adminId,
                    admin,
                    course,
                    success: req.flash('success'),
                    warning: req.flash('warning'),
                    error: req.flash('error')
                })
            })
        })
    } else {
        res.redirect('/admin')
    }
})


router.post('/admin/editacourse', upload.single('image'), (req, res) => {
    let adminId = req.query.q;
    let courseId = req.query.c;
    let { name, tutorName, nCategories, lCategories, description, whatsapp, telegram } = req.body;
    let image = req.file.filename;
    if(req.session.isAuth) {
        admin.findById((adminId), (err, admin) => {
            aCourse.findByIdAndUpdate(courseId, { name: name, image: image, tutorName: tutorName, nCategories: nCategories, lCategories: lCategories, description: description, whatsapp: whatsapp, telegram: telegram }, (err, data) => {
                if(data) {
                    req.flash('success', `${data.name} course updated successfully`)
                    res.redirect(`/admin/viewcourse?q=${adminId}`)
                }
                else {
                    req.flash('error', `${data.name} course update failed`)
                    res.redirect(`/admin/editcourse?q=${adminId}&c=${courseId}`)
                }
            })
        })
    } else {
        res.redirect('/admin')
    }
})


router.get('/admin/viewcourse', (req, res) => {
    let adminId = req.query.q;
    if(req.query.c) {
        let courseId = req.query.c;
        if(req.session.isAuth) {
            admin.findById((adminId), async(err, admin) => {
                aCourse.findByIdAndDelete((courseId), (err, data) => {
                    aCourse.find({}, (err, courses) => {
                        req.flash('success', `${data.name} course has been deleted`)
                        res.render('admin/viewcourse', {
                            adminId,
                            admin,
                            courses,
                            success: req.flash('success'),
                            warning: req.flash('warning'),
                            error: req.flash('error')
                        })
                    })
                })
            })
        } else {
            res.redirect('/admin')
        }
    } else {
        if(req.session.isAuth) {
            admin.findById((adminId), async(err, admin) => {
                aCourse.find({}, (err, courses) => {
                    res.render('admin/viewcourse', {
                        adminId,
                        admin,
                        courses,
                        success: req.flash('success'),
                        warning: req.flash('warning'),
                        error: req.flash('error')
                    })
                })
            })
        } else {
            res.redirect('/admin')
        }
    }
})

router.get('/admin/viewdetail', (req, res) => {
    let adminId = req.query.q;
    let courseId = req.query.c;
    if(req.session.isAuth) {
        admin.findById((adminId), (err, admin) => {
            aCourse.findById((courseId), (err, course) => {
                res.render('admin/viewdetail', {
                    adminId,
                    admin,
                    course,
                    success: req.flash('success'),
                    warning: req.flash('warning'),
                    error: req.flash('error')
                })
            })
        })
    } else {
        res.redirect('/admin')
    }
})

router.get('/admin/appliedcourse', (req, res) => {
    let adminId = req.query.q;
    if(req.query.c) {
        let courseId = req.query.c;
        if(req.session.isAuth) {
            admin.findById((adminId), (err, admin) => {
                appliedCourse.findById((courseId), (err, data) => {
                    if(data.approved == true) {
                        appliedCourse.findByIdAndUpdate(courseId, {approved: false}, (err, data) => {
                            appliedCourse.find({}, (err, courses) => {
                                req.flash('success', `You have prohibited ${data.studentName}'s access to ${data.courseName} course`)
                                res.render('admin/appliedCourse', {
                                    adminId,
                                    admin,
                                    courses,
                                    success: req.flash('success'),
                                    warning: req.flash('warning'),
                                    error: req.flash('error')
                                })
                            })
                        })
                    } else {
                        appliedCourse.findByIdAndUpdate(courseId, {approved: true}, (err, data) => {
                            appliedCourse.find({}, (err, courses) => {
                                req.flash('success', `You have approved ${data.studentName}'s access to ${data.courseName} course`)
                                res.render('admin/appliedCourse', {
                                    adminId,
                                    admin,
                                    courses,
                                    success: req.flash('success'),
                                    warning: req.flash('warning'),
                                    error: req.flash('error')
                                })
                            })
                        })
                    }
                })
            })
        } else {
            res.redirect('/admin')
        }
    } else if(req.query.d) {
        let courseId = req.query.d;
        if(req.session.isAuth) {
            admin.findById((adminId), (err, admin) => {
                appliedCourse.findByIdAndDelete((courseId), (err, data) => {
                    appliedCourse.find({}, (err, courses) => {
                        req.flash('success', `You have deleted ${data.studentName}'s application to ${data.courseName} course`)
                        res.render('admin/appliedCourse', {
                            adminId,
                            admin,
                            courses,
                            success: req.flash('success'),
                            warning: req.flash('warning'),
                            error: req.flash('error')
                        })
                    })
                })
            })
        } else {
            res.redirect('/admin')
        }
    } else {
        if(req.session.isAuth) {
            admin.findById((adminId), (err, admin) => {
                appliedCourse.find({}, (err, courses) => {
                    res.render('admin/appliedCourse', {
                        adminId,
                        admin,
                        courses,
                        success: req.flash('success'),
                        warning: req.flash('warning'),
                        error: req.flash('error')
                    })
                })
            })
        } else {
            res.redirect('/admin')
        }
    }
})

router.get('/admin/viewstudents', (req, res) => {
    let adminId = req.query.q;
    if(req.session.isAuth) {
        admin.findById((adminId), (err, admin) => {
            student.find({}, (err, students) => {
                res.render('admin/viewstudents', {
                    adminId,
                    admin,
                    students,
                    success: req.flash('success'),
                    warning: req.flash('warning'),
                    error: req.flash('error')
                })
            })
        })
    } else {
        res.redirect('/admin')
    }
})

router.get('/signout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin')
})


router.get('*', (req, res) => {
    res.render('admin/error')
})

module.exports = router;