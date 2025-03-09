require('dotenv').config();
const mongoose = require('mongoose');
const Tour = require('../models/Tour');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const sampleTours = [
    {
        name: 'Beach Paradise Tour',
        description: 'Enjoy a relaxing weekend at the most beautiful beaches',
        price: 299,
        duration: 3,
        date: new Date('2024-07-15'),
        maxParticipants: 20,
        currentParticipants: 0
    },
    {
        name: 'Mountain Adventure',
        description: 'Exciting hiking and camping in the mountains',
        price: 399,
        duration: 4,
        date: new Date('2024-08-01'),
        maxParticipants: 15,
        currentParticipants: 0
    },
    {
        name: 'Cultural City Tour',
        description: 'Explore historical landmarks and local cuisine',
        price: 199,
        duration: 2,
        date: new Date('2024-06-20'),
        maxParticipants: 25,
        currentParticipants: 0
    }
];

async function addSampleTours() {
    try {
        await Tour.deleteMany({}); // Clear existing tours
        const tours = await Tour.insertMany(sampleTours);
        console.log('Sample tours added successfully:', tours);
    } catch (error) {
        console.error('Error adding sample tours:', error);
    } finally {
        mongoose.disconnect();
    }
}

addSampleTours(); 