const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentService {
    constructor(bookingService) {
        this.bookingService = bookingService;
        this.stripe = stripe;
        this.publicKey = process.env.STRIPE_PUBLIC_KEY;
    }

    async processCashPayment(bookingId) {
        const booking = await this.bookingService.getBookingById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        // Kiểm tra nếu đã thanh toán tiền mặt rồi thì không cho thanh toán nữa
        if (booking.paymentMethod === 'cash' && booking.paymentStatus === 'pending') {
            return {
                status: 'already_pending',
                message: 'Cash payment is already recorded for this booking.',
                booking: booking
            };
        }

        // Kiểm tra nếu đã hoàn thành thanh toán
        if (booking.paymentStatus === 'completed') {
            return {
                status: 'already_paid',
                message: 'This booking has already been paid.',
                booking: booking
            };
        }

        booking.paymentStatus = 'pending';
        booking.status = 'confirmed';
        booking.paymentMethod = 'cash';
        await booking.save();

        return {
            status: 'success',
            message: 'Cash payment recorded successfully.',
            booking: booking
        };
    }

    async createStripePayment(bookingId) {
        try {
            const booking = await this.bookingService.getBookingById(bookingId);
            if (!booking) {
                throw new Error('Booking not found');
            }

            // Kiểm tra nếu đã hoàn thành thanh toán
            if (booking.paymentStatus === 'completed') {
                throw new Error('This booking has already been paid');
            }

            if (!booking.tour || !booking.tour.name) {
                throw new Error('Invalid tour information');
            }

            // Format amount to ensure it's a valid integer in cents
            const amount = Math.round(parseFloat(booking.totalAmount) * 100);
            if (isNaN(amount) || amount <= 0) {
                throw new Error('Invalid payment amount');
            }

            // Clean bot username for URL
            const botUsername = process.env.BOT_USERNAME.replace('@', '');

            // Create new session
            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: booking.tour.name,
                                description: `Tour booking for ${booking.tour.name}`,
                                images: booking.tour.images && booking.tour.images.length > 0 ? booking.tour.images : undefined,
                            },
                            unit_amount: amount,
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `https://t.me/${botUsername}?start=success_${bookingId}`,
                cancel_url: `https://t.me/${botUsername}?start=cancel_${bookingId}`,
                metadata: {
                    bookingId: bookingId.toString(),
                    tourName: booking.tour.name,
                    userId: booking.user.toString()
                },
                expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
            });

            if (!session || !session.url) {
                throw new Error('Failed to create Stripe session');
            }

            // Update booking with session ID
            booking.paymentMethod = 'stripe';
            booking.stripeSessionId = session.id;
            await booking.save();

            return {
                sessionId: session.id,
                publicKey: this.publicKey,
                url: session.url,
                expiresAt: session.expires_at
            };
        } catch (error) {
            console.error('Stripe session creation error:', error);
            
            // Handle specific Stripe errors
            if (error.type === 'StripeInvalidRequestError') {
                if (error.param === 'amount') {
                    throw new Error('Invalid payment amount. Please check the tour price.');
                }
                throw new Error('Invalid payment request. Please check your payment details.');
            } else if (error.type === 'StripeAPIError') {
                throw new Error('Payment service is temporarily unavailable. Please try again later.');
            } else if (error.type === 'StripeConnectionError') {
                throw new Error('Could not connect to payment service. Please try again later.');
            } else if (error.message.includes('Invalid tour information')) {
                throw new Error('Tour information is incomplete. Please contact support.');
            } else if (error.message.includes('already been paid')) {
                throw new Error('This booking has already been paid.');
            } else {
                throw new Error('Failed to create payment session. Please try again later.');
            }
        }
    }

    async getPaymentStatus(bookingId) {
        try {
            const booking = await this.bookingService.getBookingById(bookingId);
            if (!booking) {
                throw new Error('Booking not found');
            }

            if (booking.paymentMethod === 'stripe' && booking.stripeSessionId) {
                try {
                    const session = await this.stripe.checkout.sessions.retrieve(booking.stripeSessionId);
                    if (session.payment_status === 'paid') {
                        booking.paymentStatus = 'completed';
                        booking.status = 'confirmed';
                        booking.stripePaymentIntentId = session.payment_intent;
                        await booking.save();
                    }
                    return {
                        status: session.payment_status,
                        amount: session.amount_total / 100,
                        currency: session.currency,
                        paymentMethod: 'stripe',
                        url: session.url // Include payment URL for retry
                    };
                } catch (error) {
                    console.error('Stripe session retrieval error:', error);
                    // If session is expired or invalid, return booking status
                    return {
                        status: booking.paymentStatus,
                        amount: booking.totalAmount,
                        currency: 'usd',
                        paymentMethod: booking.paymentMethod
                    };
                }
            }

            return {
                status: booking.paymentStatus,
                amount: booking.totalAmount,
                currency: 'usd',
                paymentMethod: booking.paymentMethod
            };
        } catch (error) {
            console.error('Get payment status error:', error);
            throw new Error('Failed to get payment status. Please try again later.');
        }
    }
}

module.exports = PaymentService; 