require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('connected to MongoDB');
})
.catch(err => {
    console.error(' MongoDB connection error:', err.message);
});

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}).lean();
        const formattedUsers = users.map(user => ({
            _id: user._id.toString(),
            username: user.username
        }))
        res.json(formattedUsers)
    } catch (err) {
        console.error('Error fetching users:', err.message);
        res.status(500).json({ error: 'Server error' });
    }    
});

app.post('/api/users', async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ error: 'Username is required' })
        }

        const user = new User({ username });
        await user.save();

        res.json({
            _id:user._id,
            username: user.username
        });

    } catch (err) {
        console.error(' Error creating user:', err.message);
        res.status(500).json({ error: 'Server error' });
    }    
})

app.post('/api/users/:_id/exercises', async (req, res) => {
    try {
        const userId = req.params._id;
        const { description, duration, date } = req.body;

        if (!description || !duration){
            return res.status(400).json({ error: 'Description and duration are required' });
        }

        const user = await User.findById(userId);
        if (!user){
            return res.status(404).json({ error: 'User not found' })
        }

        const exerciseDate = date ? new Date(date) : new Date();

        const exercise = {
            description,
            duration: parseInt(duration),
            date: exerciseDate
        };

        user.log.push(exercise);
        await user.save();

        res.json({
            _id: user._id,
            username: user.username,
            description: exercise.description,
            duration: exercise.duration,
            date: exercise.date.toDateString()
        });
    } catch (err) {
        console.error(' Error adding exercise:', err.message);
        res.status(500).json({ error: 'Server error'});
    }
});

app.get('/api/users/:_id/logs', async (req, res) => {
    try {
        const userId = req.params._id;
        const { from, to, limit } = req.query;

        const user = await User.findById(userId);
        if (!user){
            return res.status(404).json({ error: 'User not found' });
        }

        let log = user.log.map(exercise => ({
            description: exercise.description,
            duration: exercise.duration,
            date: exercise.date.toDateString()
        }))

        if (from) {
            const fromDate = new Date(from);
                log = log.filter(entry => new Date(entry.date) >= fromDate);
        }

        if (to) {
            const toDate = new Date(to);
            log = log.filter(entry => new Date(entry.date) <= toDate);
        }

        if (limit) {
            log = log.slice(0, parseInt(limit));
        }

        res.json({
            _id: user._id,
            username: user.username,
            count: log.length,
            log
        });

    } catch (err) {
        console.error(' Error fetching logs:', err.message);
        res.status(500).json({ error: 'Server error' })
    }    
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`)
});