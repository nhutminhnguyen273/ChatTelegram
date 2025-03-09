const Keyboards = require('../utils/keyboards');

class TourController {
    constructor(tourService, userService, bookingService, paymentService) {
        this.tourService = tourService;
        this.userService = userService;
        this.bookingService = bookingService;
        this.paymentService = paymentService;
    }

    async handleTours(ctx) {
        try {
            // Kiểm tra đăng nhập trước khi hiển thị danh sách tours
            const user = await this.userService.findByTelegramId(ctx.from.id);
            if (!user || !user.isRegistered) {
                return ctx.reply(
                    '🔒 Please register or login to view and book tours.',
                    Keyboards.getAuthMenu()
                );
            }

            const tours = await this.tourService.getAllTours();
            if (tours.length === 0) {
                return ctx.reply('No tours available at the moment.', Keyboards.getBackToMenu());
            }

            let message = '🎯 Available Tours:\nClick on a tour to see details and booking options:\n\n';
            return ctx.reply(message, Keyboards.getToursList(tours));
        } catch (error) {
            console.error('View tours error:', error);
            return ctx.reply('Failed to fetch tours. Please try again later.', Keyboards.getBackToMenu());
        }
    }

    async handleTourDetails(ctx, tourId) {
        try {
            // Kiểm tra đăng nhập trước khi xem chi tiết tour
            const user = await this.userService.findByTelegramId(ctx.from.id);
            if (!user || !user.isRegistered) {
                return ctx.reply(
                    '🔒 Please register or login to view tour details.',
                    Keyboards.getAuthMenu()
                );
            }

            const tour = await this.tourService.getTourById(tourId);
            if (!tour) {
                return ctx.reply('Tour not found.', Keyboards.getBackToMenu());
            }

            const availableSpots = tour.maxParticipants - tour.currentParticipants;
            const message = `🏨 ${tour.name}\n\n` +
                `Description: ${tour.description}\n` +
                `Price: $${tour.price}\n` +
                `Duration: ${tour.duration} days\n` +
                `Date: ${tour.date.toLocaleDateString()}\n` +
                `Available spots: ${availableSpots}\n\n`;

            // Nếu hết chỗ, hiển thị thông báo và không cho đặt
            if (availableSpots <= 0) {
                return ctx.reply(
                    message + '❌ This tour is fully booked!\n' +
                    'Please check other available tours.',
                    Keyboards.getBackToTours()
                );
            }

            return ctx.reply(
                message + 'Select your payment method:',
                Keyboards.getBookingOptions(tourId)
            );
        } catch (error) {
            console.error('Tour details error:', error);
            return ctx.reply('Failed to fetch tour details.', Keyboards.getBackToMenu());
        }
    }

    async handleBooking(ctx, tourId, paymentMethod) {
        try {
            // Kiểm tra đăng nhập trước khi đặt tour
            const user = await this.userService.findByTelegramId(ctx.from.id);
            if (!user || !user.isRegistered) {
                return ctx.reply(
                    '🔒 Please register or login to book tours.',
                    Keyboards.getAuthMenu()
                );
            }

            // Kiểm tra số chỗ còn lại trước khi đặt
            const tour = await this.tourService.getTourById(tourId);
            if (!tour) {
                return ctx.reply('Tour not found.', Keyboards.getBackToMenu());
            }

            const availableSpots = tour.maxParticipants - tour.currentParticipants;
            if (availableSpots <= 0) {
                return ctx.reply(
                    '❌ Sorry, this tour is fully booked!\n\n' +
                    'Please check other available tours:',
                    Keyboards.getBackToTours()
                );
            }

            const booking = await this.bookingService.createBooking(user._id, tourId, paymentMethod);
            
            if (paymentMethod === 'cash') {
                // Xử lý thanh toán tiền mặt ngay khi tạo booking
                const result = await this.paymentService.processCashPayment(booking._id);
                
                await ctx.reply(
                    '🎉 Tour booked successfully!\n\n' +
                    '💵 Cash payment recorded!\n' +
                    `Total Amount: $${booking.totalAmount}\n\n` +
                    'Your tour booking has been confirmed.\n' +
                    `Please prepare $${booking.totalAmount} in cash.`
                );

                // Chuyển về danh sách tours
                const tours = await this.tourService.getAllTours();
                return ctx.reply(
                    '🎯 Available Tours:\nClick on a tour to see details and booking options:\n\n',
                    Keyboards.getToursList(tours)
                );
            } else {
                const stripeSession = await this.paymentService.createStripePayment(booking._id);
                return ctx.reply(
                    '🎉 Tour booked successfully!\n\n' +
                    'Payment Method: Card\n' +
                    `Total Amount: $${booking.totalAmount}\n\n` +
                    'Click the button below to proceed with card payment:',
                    Keyboards.getBookingDetails(booking)
                );
            }
        } catch (error) {
            console.error('Book tour error:', error);
            if (error.message === 'Tour is fully booked') {
                return ctx.reply(
                    '❌ Sorry, this tour is fully booked!\n\n' +
                    'Please check other available tours:',
                    Keyboards.getBackToTours()
                );
            }
            if (error.message === 'Tour not found') {
                return ctx.reply('Tour not found.', Keyboards.getBackToMenu());
            }
            if (error.message === 'Failed to create payment session') {
                return ctx.reply('Sorry, we could not process your payment request.', Keyboards.getBackToMenu());
            }
            return ctx.reply('Booking failed. Please try again later.', Keyboards.getBackToMenu());
        }
    }

    async handleMyBookings(ctx) {
        try {
            const user = await this.userService.findByTelegramId(ctx.from.id);
            if (!user) {
                return ctx.reply('Please register or login first.', Keyboards.getAuthMenu());
            }

            const bookings = await this.bookingService.getUserBookings(user._id);
            if (bookings.length === 0) {
                return ctx.reply('You have no bookings yet.', Keyboards.getBackToMenu());
            }

            return ctx.reply(
                '🎫 Your Bookings:\nClick on a booking to see details:\n',
                Keyboards.getBookingsList(bookings)
            );
        } catch (error) {
            console.error('View bookings error:', error);
            return ctx.reply('Failed to fetch bookings.', Keyboards.getBackToMenu());
        }
    }

    async handleBookingDetails(ctx, bookingId) {
        try {
            const booking = await this.bookingService.getBookingById(bookingId);
            if (!booking) {
                return ctx.reply('Booking not found.', Keyboards.getBackToMenu());
            }

            const message = `🎫 Booking Details:\n\n` +
                `Tour: ${booking.tour.name}\n` +
                `Status: ${booking.status}\n` +
                `Payment Method: ${booking.paymentMethod}\n` +
                `Payment Status: ${booking.paymentStatus}\n` +
                `Total Amount: $${booking.totalAmount}\n` +
                `Date: ${booking.tour.date.toLocaleDateString()}\n`;

            return ctx.reply(message, Keyboards.getBookingDetails(booking));
        } catch (error) {
            console.error('Booking details error:', error);
            return ctx.reply('Failed to fetch booking details.', Keyboards.getBackToMenu());
        }
    }

    async handlePayment(ctx, bookingId, paymentMethod) {
        try {
            const booking = await this.bookingService.getBookingById(bookingId);
            if (!booking) {
                return ctx.reply('Booking not found.', Keyboards.getBackToMenu());
            }

            if (paymentMethod === 'stripe') {
                const stripeSession = await this.paymentService.createStripePayment(bookingId);
                
                const paymentKeyboard = {
                    inline_keyboard: [
                        [{
                            text: '💳 Pay Now',
                            url: stripeSession.url
                        }],
                        [{
                            text: '⬅️ Back to Tours',
                            callback_data: 'view_tours'
                        }]
                    ]
                };

                return ctx.reply(
                    '💳 Payment Details:\n\n' +
                    `Tour: ${booking.tour.name}\n` +
                    `Amount: $${booking.totalAmount}\n\n` +
                    'Click the button below to proceed with payment.\n' +
                    'The payment link will expire in 30 minutes.',
                    { reply_markup: paymentKeyboard }
                );
            }

            const result = await this.paymentService.processCashPayment(bookingId);
            
            if (result.status === 'already_pending') {
                return ctx.reply(
                    '⚠️ Cash payment has already been recorded for this booking.\n\n' +
                    `Tour: ${booking.tour.name}\n` +
                    `Amount: $${booking.totalAmount}\n`,
                    Keyboards.getToursList(await this.tourService.getAllTours())
                );
            }

            if (result.status === 'already_paid') {
                return ctx.reply(
                    '✅ This booking has already been paid.\n\n' +
                    `Tour: ${booking.tour.name}\n` +
                    `Amount: $${booking.totalAmount}\n`,
                    Keyboards.getToursList(await this.tourService.getAllTours())
                );
            }

            await ctx.reply(
                '💵 Cash payment recorded!\n\n' +
                'Your tour booking has been confirmed.\n' +
                `Please prepare $${booking.totalAmount} in cash.\n`
            );

            // Sau khi hiển thị thông báo thanh toán, trở về danh sách tours
            const tours = await this.tourService.getAllTours();
            return ctx.reply(
                '🎯 Available Tours:\nClick on a tour to see details and booking options:\n\n',
                Keyboards.getToursList(tours)
            );

        } catch (error) {
            console.error('Payment error:', error);
            if (error.message.includes('already been paid')) {
                return ctx.reply('This booking has already been paid.', Keyboards.getBackToMenu());
            }
            if (error.message === 'Failed to create payment session') {
                return ctx.reply('Sorry, we could not process your payment request.', Keyboards.getBackToMenu());
            }
            return ctx.reply('Payment failed. Please try again later.', Keyboards.getBackToMenu());
        }
    }

    async handlePaymentStatus(ctx, bookingId) {
        try {
            const status = await this.paymentService.getPaymentStatus(bookingId);
            const booking = await this.bookingService.getBookingById(bookingId);

            let message = '💳 Payment Status:\n\n' +
                `Tour: ${booking.tour.name}\n` +
                `Amount: $${status.amount}\n` +
                `Status: ${status.status}\n` +
                `Payment Method: ${status.paymentMethod}\n`;

            if (status.status === 'pending' && status.paymentMethod === 'stripe') {
                const stripeSession = await this.paymentService.createStripePayment(bookingId);
                const paymentKeyboard = {
                    inline_keyboard: [
                        [{
                            text: '💳 Try Payment Again',
                            url: stripeSession.url
                        }],
                        [{
                            text: '⬅️ Back to Bookings',
                            callback_data: 'my_bookings'
                        }]
                    ]
                };
                return ctx.reply(message, { reply_markup: paymentKeyboard });
            }

            return ctx.reply(message, Keyboards.getBookingDetails(booking));
        } catch (error) {
            console.error('Payment status error:', error);
            return ctx.reply('Failed to fetch payment status.', Keyboards.getBackToMenu());
        }
    }
}

module.exports = TourController; 