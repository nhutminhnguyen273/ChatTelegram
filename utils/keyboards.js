const { Markup } = require('telegraf');

class Keyboards {
    static getMainMenu() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🎯 View Tours', callback_data: 'view_tours' }],
                    [{ text: '🎫 My Bookings', callback_data: 'my_bookings' }],
                    [{ text: '👤 Profile', callback_data: 'profile' }]
                ]
            }
        };
    }

    static getAuthMenu() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📝 Register', callback_data: 'register' }],
                    [{ text: '🔑 Login', callback_data: 'login' }]
                ]
            }
        };
    }

    static getProfileMenu() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🎫 My Bookings', callback_data: 'my_bookings' }],
                    [{ text: '🎯 View Tours', callback_data: 'view_tours' }],
                    [{ text: '🚪 Logout', callback_data: 'logout' }],
                    [{ text: '⬅️ Back to Menu', callback_data: 'main_menu' }]
                ]
            }
        };
    }

    static getToursList(tours) {
        const buttons = tours.map(tour => {
            return [Markup.button.callback(
                `${tour.name} - $${tour.price}`,
                `tour_${tour._id}`
            )];
        });
        buttons.push([Markup.button.callback('⬅️ Back to Menu', 'main_menu')]);
        return Markup.inlineKeyboard(buttons);
    }

    static getBookingOptions(tourId) {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('💵 Pay with Cash', `book_cash_${tourId}`),
                Markup.button.callback('💳 Pay with Card', `book_stripe_${tourId}`)
            ],
            [Markup.button.callback('⬅️ Back to Tours', 'view_tours')]
        ]);
    }

    static getBookingsList(bookings) {
        const buttons = bookings.map(booking => {
            const status = booking.paymentStatus === 'pending' ? '⏳' : 
                          booking.paymentStatus === 'completed' ? '✅' : '❌';
            return [Markup.button.callback(
                `${status} ${booking.tour.name}`,
                `booking_${booking._id}`
            )];
        });
        buttons.push([Markup.button.callback('⬅️ Back to Menu', 'main_menu')]);
        return Markup.inlineKeyboard(buttons);
    }

    static getBookingDetails(booking) {
        const buttons = [];
        if (booking.paymentStatus === 'pending') {
            if (booking.paymentMethod === 'stripe') {
                buttons.push([Markup.button.callback('💳 Pay Now', `pay_stripe_${booking._id}`)]);
            } else {
                buttons.push([Markup.button.callback('💵 Confirm Cash Payment', `pay_cash_${booking._id}`)]);
            }
        }
        buttons.push([Markup.button.callback('⬅️ Back to Bookings', 'my_bookings')]);
        return Markup.inlineKeyboard(buttons);
    }

    static getBackToMenu() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '⬅️ Back to Menu', callback_data: 'main_menu' }]
                ]
            }
        };
    }

    static getBackToTours() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '⬅️ Back to Tours', callback_data: 'view_tours' }]
                ]
            }
        };
    }
}

module.exports = Keyboards; 