require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const mongoose = require('mongoose');

// Import models
const User = require('./models/User');
const Tour = require('./models/Tour');
const Booking = require('./models/Booking');

// Import services
const UserService = require('./services/UserService');
const TourService = require('./services/TourService');
const BookingService = require('./services/BookingService');
const PaymentService = require('./services/PaymentService');

// Import controllers
const UserController = require('./controllers/UserController');
const TourController = require('./controllers/TourController');

// Import keyboards
const Keyboards = require('./utils/keyboards');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Initialize services
const tourService = new TourService(Tour);
const userService = new UserService(User);
const bookingService = new BookingService(Booking, tourService);
const paymentService = new PaymentService(bookingService);

// Initialize controllers
const userController = new UserController(userService, bookingService);
const tourController = new TourController(tourService, userService, bookingService, paymentService);

// Middleware
bot.use(session());

// Start command
bot.command('start', (ctx) => {
    return userController.handleStart(ctx);
});

// Handle callbacks
bot.action('main_menu', (ctx) => {
    ctx.answerCbQuery();
    return ctx.reply('Main Menu:', Keyboards.getMainMenu());
});

bot.action('view_tours', (ctx) => {
    ctx.answerCbQuery();
    return tourController.handleTours(ctx);
});

bot.action(/^tour_(.+)$/, (ctx) => {
    ctx.answerCbQuery();
    const tourId = ctx.match[1];
    return tourController.handleTourDetails(ctx, tourId);
});

bot.action(/^book_(cash|stripe)_(.+)$/, (ctx) => {
    ctx.answerCbQuery();
    const paymentMethod = ctx.match[1];
    const tourId = ctx.match[2];
    return tourController.handleBooking(ctx, tourId, paymentMethod);
});

bot.action('my_bookings', (ctx) => {
    ctx.answerCbQuery();
    return tourController.handleMyBookings(ctx);
});

bot.action(/^booking_(.+)$/, (ctx) => {
    ctx.answerCbQuery();
    const bookingId = ctx.match[1];
    return tourController.handleBookingDetails(ctx, bookingId);
});

bot.action(/^pay_(cash|stripe)_(.+)$/, (ctx) => {
    ctx.answerCbQuery();
    const paymentMethod = ctx.match[1];
    const bookingId = ctx.match[2];
    return tourController.handlePayment(ctx, bookingId, paymentMethod);
});

bot.action(/^check_payment_(.+)$/, (ctx) => {
    ctx.answerCbQuery();
    const bookingId = ctx.match[1];
    return tourController.handlePaymentStatus(ctx, bookingId);
});

bot.action('profile', (ctx) => {
    ctx.answerCbQuery();
    return userController.handleProfile(ctx);
});

bot.action('logout', (ctx) => {
    ctx.answerCbQuery();
    return userController.handleLogout(ctx);
});

// Register and login actions
bot.action('register', (ctx) => {
    ctx.answerCbQuery();
    return userController.handleRegister(ctx);
});

bot.action('login', (ctx) => {
    ctx.answerCbQuery();
    return userController.handleLogin(ctx);
});

// Add command handlers for verify and setpassword
bot.command('verify', (ctx) => {
    return userController.handleVerify(ctx);
});

bot.command('setpassword', (ctx) => {
    return userController.handleSetPassword(ctx);
});

// Add forgot password handlers
bot.command('forgot_password', (ctx) => {
    return userController.handleForgotPassword(ctx);
});

bot.command('reset_password', (ctx) => {
    return userController.handleResetPassword(ctx);
});

// Error handling
bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    return ctx.reply('An error occurred. Please try again later.', Keyboards.getMainMenu());
});

// Start the bot
bot.launch()
    .then(() => {
        console.log('Bot is running...');
        console.log('Bot username:', bot.botInfo?.username);
    })
    .catch(err => console.error('Bot launch error:', err));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM')); 