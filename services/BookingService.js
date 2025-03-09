class BookingService {
    constructor(bookingModel, tourService) {
        this.bookingModel = bookingModel;
        this.tourService = tourService;
    }

    async createBooking(userId, tourId, paymentMethod = 'cash') {
        const tour = await this.tourService.getTourById(tourId);
        if (!tour) {
            throw new Error('Tour not found');
        }

        await this.tourService.updateTourParticipants(tourId, true);
        
        const booking = new this.bookingModel({
            user: userId,
            tour: tourId,
            paymentMethod: paymentMethod,
            totalAmount: tour.price
        });
        return await booking.save();
    }

    async getUserBookings(userId) {
        return await this.bookingModel.find({ user: userId }).populate('tour');
    }

    async getBookingById(bookingId) {
        return await this.bookingModel.findById(bookingId).populate('tour');
    }

    async processPayment(bookingId, paymentService) {
        const booking = await this.getBookingById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        if (booking.paymentMethod === 'cash') {
            return await paymentService.processCashPayment(bookingId);
        } else if (booking.paymentMethod === 'stripe') {
            return await paymentService.createStripePayment(bookingId);
        }
    }

    async countUserBookings(userId) {
        return await this.bookingModel.countDocuments({ user: userId });
    }
}

module.exports = BookingService; 