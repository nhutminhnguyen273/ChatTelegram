class TourService {
    constructor(tourModel) {
        this.tourModel = tourModel;
    }

    async getAllTours() {
        return await this.tourModel.find();
    }

    async getTourById(tourId) {
        return await this.tourModel.findById(tourId);
    }

    async updateTourParticipants(tourId, increment = true) {
        const tour = await this.getTourById(tourId);
        if (!tour) {
            throw new Error('Tour not found');
        }

        if (increment && tour.currentParticipants >= tour.maxParticipants) {
            throw new Error('Tour is fully booked');
        }

        tour.currentParticipants += increment ? 1 : -1;
        return await tour.save();
    }
}

module.exports = TourService; 